// Retrieve Profile Information
async function findProfileByUserId(connection, userId) {
    const [rows] = await connection.execute(
        `SELECT
            u.user_id,
            u.email,
            u.role,
            u.profile_image_path,
            u.account_status,
            u.created_at,
            u.profile_image_path,
            u.notify_request_updates,
            u.notify_pickup_reminders,
            u.notify_announcements,

            r.resident_id,
            r.first_name AS resident_first_name,
            r.middle_name AS resident_middle_name,
            r.last_name AS resident_last_name,
            r.name_extension AS resident_name_extension,
            r.birth_date,
            r.complete_address,
            r.contact_number,

            s.staff_id,
            s.first_name AS staff_first_name,
            s.middle_name AS staff_middle_name,
            s.last_name AS staff_last_name,
            s.name_extension AS staff_name_extension,
            s.position

        FROM User u

        LEFT JOIN Resident r
            ON u.user_id = r.user_id

        LEFT JOIN Staff s
            ON u.user_id = s.user_id

        WHERE u.user_id = ?`,
        [userId]
    );

    return rows[0] || null;
}

// Update Resident Profile
async function updateResidentProfile(connection, userId, profileData) {
    const {
        first_name,
        middle_name,
        last_name,
        name_extension,
        birth_date,
        complete_address,
        contact_number
    } = profileData;

    const [result] = await connection.execute(
        `UPDATE Resident
         SET
            first_name = ?,
            middle_name = ?,
            last_name = ?,
            name_extension = ?,
            birth_date = ?,
            complete_address = ?,
            contact_number = ?
         WHERE user_id = ?`,
        [
            first_name,
            middle_name || null,
            last_name,
            name_extension || null,
            birth_date,
            complete_address,
            contact_number,
            userId
        ]
    );

    return result.affectedRows;
}

// Update Staff Profile
async function updateStaffProfile(connection, userId, profileData) {
    const {
        first_name,
        middle_name,
        last_name,
        name_extension
    } = profileData;

    const [result] = await connection.execute(
        `UPDATE Staff
         SET
            first_name = ?,
            middle_name = ?,
            last_name = ?,
            name_extension = ?
         WHERE user_id = ?`,
        [
            first_name,
            middle_name || null,
            last_name,
            name_extension || null,
            userId
        ]
    );

    return result.affectedRows;
}

async function updateNotificationPreferences(connection, userId, preferences) {
    const {
        notify_request_updates,
        notify_pickup_reminders,
        notify_announcements
    } = preferences;

    const [result] = await connection.execute(
        `UPDATE User
         SET
            notify_request_updates = ?,
            notify_pickup_reminders = ?,
            notify_announcements = ?
         WHERE user_id = ?`,
        [
            notify_request_updates,
            notify_pickup_reminders,
            notify_announcements,
            userId
        ]
    );

    return result.affectedRows;
}

module.exports = {
    findProfileByUserId,
    updateStaffProfile,
    updateResidentProfile,
    updateNotificationPreferences
};