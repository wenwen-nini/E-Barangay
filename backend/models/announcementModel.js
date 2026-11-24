const pool = require("../config/database");

async function getPublishedAnnouncements() {
    const [announcements] = await pool.execute(
        `SELECT
            announcement_id,
            title,
            content,
            published_at,
            expires_at
        FROM Announcement
        WHERE status = 'Published'
            AND published_at IS NOT NULL
            AND published_at <= NOW()
            AND (
                expires_at IS NULL
                OR expires_at >= NOW()
            )
        ORDER BY published_at DESC`
    );

    return announcements;
}

async function getAllAnnouncementsForStaff() {
    const [announcements] = await pool.execute(
        `SELECT
            announcement_id,
            staff_id,
            title,
            content,
            created_at,
            published_at,
            expires_at,
            status
        FROM Announcement
        ORDER BY created_at DESC`
    );

    return announcements;
}


async function createAnnouncement(userId, announcementData) {
    const { title, content, expires_at, status } = announcementData;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Find the staff member
        const [staffRows] = await connection.execute(
            `SELECT staff_id
            FROM Staff
            WHERE user_id = ?`,
            [userId]
        );

        if (staffRows.length === 0) {
            throw new Error("STAFF_NOT_FOUND");
        }

        const staffId = staffRows[0].staff_id;

        // Create announcement
        const [result] = await connection.execute(
            `INSERT INTO Announcement (
                staff_id,
                title,
                content,
                published_at,
                expires_at,
                status
            )
            VALUES (
                ?, ?, ?,
                CASE WHEN ? = 'Published' THEN NOW() ELSE NULL END,
                ?,
                ?
            )`,
            [
                staffId,
                title,
                content,
                status,
                expires_at || null,
                status
            ]
        );

        const announcementId = result.insertId;

        // Notify residents if the announcement is immediately published
        if (status === "Published") {
            await connection.execute(
                `INSERT INTO Notification (
                    user_id,
                    announcement_id,
                    title,
                    message
                )
                SELECT
                    user_id,
                    ?,
                    ?,
                    ?
                FROM \`User\`
                WHERE role = 'Resident'
                    AND notify_announcements = 1`,
                [
                    announcementId,
                    title,
                    content
                ]
            );
        }

        await connection.commit();

        return announcementId;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

async function updateAnnouncement(announcementId, announcementData) {
    const { title, content, expires_at } = announcementData;

    const [result] = await pool.execute(
        `UPDATE Announcement
        SET
            title = ?,
            content = ?,
            expires_at = ?
        WHERE announcement_id = ?`,
        [
            title,
            content,
            expires_at || null,
            announcementId
        ]
    );

    return result.affectedRows > 0;
}


async function updateAnnouncementStatus(announcementId, status) {
    const allowedStatuses = ["Draft", "Published", "Archived"];

    if (!allowedStatuses.includes(status)) {
        throw new Error("INVALID_ANNOUNCEMENT_STATUS");
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Retrieve and lock the announcement
        const [announcements] = await connection.execute(
            `SELECT announcement_id, title, content, status
            FROM Announcement
            WHERE announcement_id = ?
            FOR UPDATE`,
            [announcementId]
        );

        if (announcements.length === 0) {
            await connection.rollback();
            return false;
        }

        const announcement = announcements[0];

        // Update announcement status
        if (status === "Published") {
            await connection.execute(
                `UPDATE Announcement
                SET
                    status = 'Published',
                    published_at = COALESCE(published_at, NOW())
                WHERE announcement_id = ?`,
                [announcementId]
            );

            // Notify residents only when newly published
            if (announcement.status !== "Published") {
                await connection.execute(
                    `INSERT INTO Notification
                        (user_id, announcement_id, title, message)
                    SELECT
                        user_id,
                        ?,
                        ?,
                        ?
                    FROM \`User\`
                    WHERE role = 'Resident'
                        AND notify_announcements = 1`,
                    [
                        announcementId,
                        announcement.title,
                        announcement.content
                    ]
                );
            }

        } else {
            await connection.execute(
                `UPDATE Announcement
                SET status = ?
                WHERE announcement_id = ?`,
                [status, announcementId]
            );
        }

        await connection.commit();
        return true;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}


async function archiveExpiredAnnouncements() {
    const [result] = await pool.execute(
        `UPDATE Announcement
        SET status = 'Archived'
        WHERE status = 'Published'
            AND expires_at IS NOT NULL
            AND expires_at < NOW()`
    );

    return result.affectedRows;
}

async function deleteAnnouncement(announcementId) {
    const [result] = await pool.execute(
        `DELETE FROM Announcement
        WHERE announcement_id = ?`,
        [announcementId]
    );

    return result.affectedRows > 0;
}

module.exports = {
    getPublishedAnnouncements,
    getAllAnnouncementsForStaff,
    createAnnouncement,
    updateAnnouncement,
    updateAnnouncementStatus,
    archiveExpiredAnnouncements,
    deleteAnnouncement
};