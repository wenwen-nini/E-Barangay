const pool = require("../config/database");

async function getUserNotification(userId) {
    const [notifications] = await pool.execute(
        `SELECT
            notification_id,
            request_id,
            announcement_id,
            title,
            message,
            is_read,
            created_at
        FROM Notification
        WHERE user_id = ?
        ORDER BY created_at DESC`,
        [userId]
    );

    return notifications;
}

async function markNotificationAsRead(notificationId, userId) {
    const [result] = await pool.execute(
        `UPDATE Notification
         SET is_read = 1
         WHERE notification_id = ?
            AND user_id = ?`,
        [notificationId, userId]
    );

    return result.affectedRows;
}

module.exports = {
    getUserNotification,
    markNotificationAsRead
};