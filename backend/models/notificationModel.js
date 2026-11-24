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

async function createRequestStatusNotification(
    connection,
    userId,
    requestId,
    status,
    remarks = null
) {
    const messages = {
        "Under Review": {
            title: "Request Under Review",
            message: "Your document request is now under review."
        },
        Approved: {
            title: "Request Approved",
            message: "Your document request has been approved."
        },
        Rejected: {
            title: "Request Rejected",
            message: "Your document request has been rejected."
        },
        Returned: {
            title: "Request Returned",
            message: "Your document request requires corrections."
        },
        Released: {
            title: "Document Released",
            message: "Your requested document has been released."
        }
    };

    const notification = messages[status];

    if (!notification) {
        return false;
    }

    const [preferences] = await connection.execute(
        `SELECT notify_request_updates
        FROM User
        WHERE user_id = ?`,
        [userId]
    );

    if (
        preferences.length === 0 ||
        Number(preferences[0].notify_request_updates) !== 1
    ) {
        return false;
    }

    let message = notification.message;

    if (remarks && ["Rejected", "Returned"].includes(status)) {
        message += ` Staff remarks: ${remarks}`;
    }

    await connection.execute(
        `INSERT INTO Notification (
            user_id,
            request_id,
            title,
            message
        )
        VALUES (?, ?, ?, ?)`,
        [userId, requestId, notification.title, message]
    );

    return true;
}


async function createPickupReminderNotification(
    connection,
    userId,
    requestId
) {
    const [preferences] = await connection.execute(
        `SELECT notify_pickup_reminders
        FROM User
        WHERE user_id = ?`,
        [userId]
    );

    if (
        preferences.length === 0 ||
        Number(preferences[0].notify_pickup_reminders) !== 1
    ) {
        return false;
    }

    await connection.execute(
        `INSERT INTO Notification (
            user_id,
            request_id,
            title,
            message
        )
        VALUES (?, ?, ?, ?)`,
        [
            userId,
            requestId,
            "Document Ready for Pickup",
            "Your document request has been approved. Please visit the barangay hall to settle the required fee and collect your document."
        ]
    );

    return true;
}


module.exports = {
    getUserNotification,
    markNotificationAsRead,
    createRequestStatusNotification,
    createPickupReminderNotification
};