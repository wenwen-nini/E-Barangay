const notificationModel = require("../models/notificationModel");

async function getUserNotifications(req, res) {
    try {
        const userId = req.session.user.user_id;

        if (!userId) {
            return res.status(403).json({
                success: false,
                message: "User account required."
            });
        }

        const notifications = await notificationModel.getUserNotification(userId);

        return res.status(200).json({
            success: true,
            notifications
        });
    } catch (error) {
        console.error("Get notifications error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve notifications"
        });
    }
}

async function markNotificationAsRead(req, res) {
    try {
        const userId = req.session.user.user_id;
        const notificationId = Number(req.params.id);

        if (
            !Number.isInteger(notificationId) ||
            notificationId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID"
            });
        }

        const affectedRows = await notificationModel.markNotificationAsRead(notificationId, userId);

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification marked as read"
        });
    } catch (error) {
        console.error("Mark notification as read error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update notification"
        });
    }
}

module.exports = {
    getUserNotifications,
    markNotificationAsRead
};