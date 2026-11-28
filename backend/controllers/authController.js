const bcrypt = require("bcrypt");
const pool = require("../config/database");

const userModel = require("../models/userModel");
const residentModel = require("../models/residentModel");
const { isValidNonFutureDate } = require("../utils/dateValidation");

const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const loginAttempts = new Map();

function getLoginLockout(key) {
    const attempt = loginAttempts.get(key);
    if (!attempt) return null;

    const now = Date.now();
    if (attempt.lockedUntil > now) {
        return Math.ceil((attempt.lockedUntil - now) / 1000);
    }

    if (now - attempt.windowStartedAt >= LOGIN_ATTEMPT_WINDOW_MS) {
        loginAttempts.delete(key);
    }

    return null;
}

function recordFailedLogin(key) {
    const now = Date.now();

    if (loginAttempts.size > 1000) {
        for (const [attemptKey, attempt] of loginAttempts) {
            if (now - attempt.windowStartedAt >= LOGIN_ATTEMPT_WINDOW_MS) {
                loginAttempts.delete(attemptKey);
            }
        }
    }

    let attempt = loginAttempts.get(key);

    if (!attempt || now - attempt.windowStartedAt >= LOGIN_ATTEMPT_WINDOW_MS) {
        attempt = { count: 0, windowStartedAt: now, lockedUntil: 0 };
    }

    attempt.count++;
    if (attempt.count >= LOGIN_ATTEMPT_LIMIT) {
        attempt.lockedUntil = now + LOGIN_ATTEMPT_WINDOW_MS;
    }

    loginAttempts.set(key, attempt);
    return Math.max(0, LOGIN_ATTEMPT_LIMIT - attempt.count);
}

// Resident Registration

async function registerResident(req, res, next) {
    let connection;

    try {
        const {
            email,
            password,
            first_name,
            middle_name,
            last_name,
            name_extension,
            birth_date,
            complete_address,
            contact_number
        } = req.body;

        const missingField = [
            [email, "email", "Enter your email address."],
            [password, "password", "Enter a password."],
            [first_name, "first_name", "Enter your first name."],
            [last_name, "last_name", "Enter your last name."],
            [birth_date, "birth_date", "Enter your birthday."],
            [complete_address, "complete_address", "Enter your complete address."],
            [contact_number, "contact_number", "Enter your contact number."]
        ].find(([value]) => !value?.trim());

        if (missingField) {
            return res.status(400).json({
                success: false,
                message: missingField[2],
                field: missingField[1]
            });
        }

        if (!isValidNonFutureDate(birth_date)) {
            return res.status(400).json({
                success: false,
                message: "Birthday must be a valid date that is not in the future.",
                field: "birth_date"
            });
        }
        
        // normalizing email
        const normalizedEmail = email.trim().toLowerCase();

        // checks email patterns
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address.",
                field: "email"
            });
        }

        if (password.length < 8 || !/\d/.test(password)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters and include at least one number.",
                field: "password"
            });
        }

        // checks if email is already registered
        const existingUser = await userModel.findUserByEmail(
            pool,
            normalizedEmail
        );

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email is already registered.",
                field: "email"
            });
        }

        // encrypts password into hashed password
        const passwordHash = await bcrypt.hash(password, 12);

        // creates the user account
        connection = await pool.getConnection();

        await connection.beginTransaction();

        const userId = await userModel.createUser(
            connection,
            normalizedEmail,
            passwordHash
        );

        const residentId = await residentModel.createResident(
            connection,
            userId,
            {
                first_name: first_name.trim(),
                middle_name: middle_name.trim() || null,
                last_name: last_name.trim(),
                name_extension: name_extension.trim() || null,
                birth_date,
                complete_address: complete_address.trim(),
                contact_number: contact_number.trim()
            }
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "Resident account registered successfully.",
            data: {
                user_id: userId,
                resident_id: residentId,
                email: normalizedEmail
            }
        });
        
    } catch (error) { // rollbacks transaction if error occurs
        if (connection) {
            await connection.rollback();
        }

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
                success: false,
                message: "Email is already registered.",
                field: "email"
            });
        }

        next(error);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        if (!email?.trim() || !password?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter your email and password."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const attemptKey = normalizedEmail;
        const retryAfterSeconds = getLoginLockout(attemptKey);

        if (retryAfterSeconds) {
            res.set("Retry-After", String(retryAfterSeconds));
            return res.status(429).json({
                success: false,
                message: `Too many failed attempts. Try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.`,
                retryAfterSeconds
            });
        }

        const user = await userModel.findUserByEmail(
            pool,
            normalizedEmail
        );

        if (!user) {
            const attemptsRemaining = recordFailedLogin(attemptKey);
            const isLocked = attemptsRemaining === 0;
            const retryAfter = isLocked
                ? LOGIN_ATTEMPT_WINDOW_MS / 1000
                : undefined;
            if (isLocked) res.set("Retry-After", String(retryAfter));

            return res.status(isLocked ? 429 : 401).json({
                success: false,
                message: isLocked
                    ? "Too many failed attempts. Try again in 15 minutes."
                    : "Invalid email or password",
                attemptsRemaining,
                ...(isLocked && { retryAfterSeconds: retryAfter })
            });
        }

        if (user.account_status !== "Active") {
            return res.status(400).json({
                success: false,
                message: "Your account is not active."
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            const attemptsRemaining = recordFailedLogin(attemptKey);
            const isLocked = attemptsRemaining === 0;
            const retryAfter = isLocked
                ? LOGIN_ATTEMPT_WINDOW_MS / 1000
                : undefined;
            if (isLocked) res.set("Retry-After", String(retryAfter));

            return res.status(isLocked ? 429 : 401).json({
                success: false,
                message: isLocked
                    ? "Too many failed attempts. Try again in 15 minutes."
                    : "Invalid email or password",
                attemptsRemaining,
                ...(isLocked && { retryAfterSeconds: retryAfter })
            });
        }

        loginAttempts.delete(attemptKey);

        let residentId = null;

        if (user.role === "Resident") {
            const [residentRows] = await pool.execute(
                "SELECT resident_id FROM Resident WHERE user_id = ?",
                [user.user_id]
            );

            if (residentRows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "Resident profile not found."
                });
            }

            residentId = residentRows[0].resident_id;

        }

        req.session.regenerate((err) => {
            if (err) {
                console.error("Session regeneration error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Unable to create session."
                });
            }

            req.session.user = {
                user_id: user.user_id,
                role: user.role,
                ...(user.role === "Resident" && { resident_id: residentId })
            };

            req.session.save((err) => {
                if (err) {
                    console.error("Session save error:", err);

                    return res.status(500).json({
                        success: false,
                        message: "Unable to save session."
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Login successful.",
                    user: {
                        user_id: user.user_id,
                        email: user.email,
                        role: user.role,
                        ...(user.role === "Resident" && {
                            resident_id: residentId
                        })
                    }
                });
            });
        });

    } catch (error) {
        console.error("login error:", error);

        return res.status(500).json({
            success: false,
            message: "An unexpected error occured during login."
        });
    }
}

async function getCurrentUser(req, res) {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "You are not logged in."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Session is valid.",
            user: req.session.user
        });
    } catch (error) {
        console.error("Session verification error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to verify session."
        });
    }
}

function logout(req, res) {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);

            return res.status(500).json({
            success: false,
            message: "Unable to log out."
            });
        }

        res.clearCookie("connect.sid");

        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });
    });
}

module.exports = {
    registerResident,
    loginUser,
    getCurrentUser,
    logout
};