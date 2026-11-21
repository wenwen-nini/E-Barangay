const pool = require("../config/database.js");
const profileModel = require("../models/profileModel.js");
const userModel = require("../models/userModel.js");
const bcrypt = require("bcrypt");

async function getProfile(req, res) {
    try {
        const userId = req.session.user.user_id;

        const profile = await profileModel.findProfileByUserId(
            pool,
            userId
        );

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Profile not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile retrieved successfully.",
            profile
        });

    } catch (error) {
        console.error("Get profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve profile."
        });
    }
}

async function updateProfile(req, res) {
    try {
        const userId = req.session.user.user_id;
        const role = req.session.user.role;

        const {
            first_name,
            middle_name,
            last_name,
            name_extension
        } = req.body;

        // Validate required name fields
        if (!first_name?.trim() || !last_name?.trim()) {
            return res.status(400).json({
                success: false,
                message: "First name and last name are required."
            });
        }

        let affectedRows;

        if (role === "Resident") {
            const {
                birth_date,
                complete_address,
                contact_number
            } = req.body;

            if (!birth_date || !complete_address?.trim() || !contact_number?.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Birth date, complete address, and contact number are required."
                });
            }

            const normalizedContact = contact_number.replace(/-/g, "");

            if (!/^09\d{9}$/.test(normalizedContact)) {
                return res.status(400).json({
                    success: false,
                    message: "Please enter a valid contact number."
                });
            }

            affectedRows = await profileModel.updateResidentProfile(
                pool,
                userId,
                {
                    first_name: first_name.trim(),
                    middle_name: middle_name?.trim(),
                    last_name: last_name.trim(),
                    name_extension: name_extension?.trim(),
                    birth_date,
                    complete_address: complete_address.trim(),
                    contact_number: normalizedContact
                }
            );

        } else if (role === "Staff") {
            affectedRows = await profileModel.updateStaffProfile(
                pool,
                userId,
                {
                    first_name: first_name.trim(),
                    middle_name: middle_name?.trim(),
                    last_name: last_name.trim(),
                    name_extension: name_extension?.trim()
                }
            );

        } else {
            return res.status(403).json({
                success: false,
                message: "Invalid account role."
            });
        }

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Profile not found or no changes were made."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully."
        });

    } catch (error) {
        console.error("Update profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update profile."
        });
    }
}

async function updateNotificationPreferences(req, res) {
    try {
        const userId = req.session.user.user_id;

        const {
            notify_request_updates,
            notify_pickup_reminders,
            notify_announcements
        } = req.body;

        // Validate that all preferences are boolean values
        const preferences = [
            notify_request_updates,
            notify_pickup_reminders,
            notify_announcements
        ];

        if (!preferences.every(value => typeof value === "boolean")) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification preferences."
            });
        }

        const affectedRows = await profileModel.updateNotificationPreferences(
            pool,
            userId,
            {
                notify_request_updates,
                notify_pickup_reminders,
                notify_announcements
            }
        );

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "User account not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification preferences saved successfully."
        });

    } catch (error) {
        console.error("Update notification preferences error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to save notification preferences."
        });
    }
}

async function changePassword(req, res) {
    try {
        const userId = req.session.user.user_id;

        const {
            current_password,
            new_password,
            confirm_password
        } = req.body;

        // 1. Check required fields
        if (!current_password || !new_password || !confirm_password) {
            return res.status(400).json({
                success: false,
                message: "All password fields are required."
            });
        }

        // 2. Check new password length
        if (new_password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "New password must contain at least 8 characters."
            });
        }

        // 3. Check password confirmation
        if (new_password !== confirm_password) {
            return res.status(400).json({
                success: false,
                message: "New password and confirmation do not match."
            });
        }

        // 4. Retrieve the user's current password hash
        const [rows] = await pool.execute(
            `SELECT password_hash
             FROM User
             WHERE user_id = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User account not found."
            });
        }

        // 5. Verify current password
        const isPasswordValid = await bcrypt.compare(
            current_password,
            rows[0].password_hash
        );

        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect."
            });
        }

        // 6. Hash the new password
        const newPasswordHash = await bcrypt.hash(new_password, 12);

        // 7. Update password in database
        await userModel.updateUserPassword(
            pool,
            userId,
            newPasswordHash
        );

        return res.status(200).json({
            success: true,
            message: "Password changed successfully."
        });

    } catch (error) {
        console.error("Change password error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to change password."
        });
    }
}

module.exports = {
    getProfile,
    updateProfile,
    updateNotificationPreferences,
    changePassword
};