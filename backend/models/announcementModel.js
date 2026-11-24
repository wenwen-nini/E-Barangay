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
            staff_id
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

module.exports = {
    getPublishedAnnouncements,
    getAllAnnouncementsForStaff
};