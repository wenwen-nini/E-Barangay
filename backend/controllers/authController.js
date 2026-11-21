const bcrypt = require("bcrypt");
const pool = require("../config/database");

const userModel = require("../models/userModel");
const residentModel = require("../models/residentModel");

// Resident Registration

async function registerResident(req, res, next) {
    console.log("Received registration data:", req.body);
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

        // Checks for missing values on required fields
        if (
            !email?.trim() ||
            !password?.trim() ||
            !first_name?.trim() ||
            !last_name?.trim() ||
            !birth_date?.trim() ||
            !complete_address?.trim() ||
            !contact_number?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please complete all required fields."
            });
        }
        
        // normalizing email
        const normalizedEmail = email.trim().toLowerCase();

        // checks email patterns
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address"
            });
        }

        // checks if password at least 8 characters; 
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters."
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
                message: "Email is already registered."
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

        return res.status(400).json({
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
                message: "Email is already registered."
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

        const user = await userModel.findUserByEmail(
            pool,
            normalizedEmail
        );

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password"
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
            return res.status(400).json({
                success: false,
                message: "Invalid email or password"
            });
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
                role: user.role
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
                        role: user.role
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