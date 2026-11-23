const pool = require("../config/database");

async function findUserByEmail(connection, email) {
    const [rows] = await connection.execute(
        `SELECT
            user_id,
            email,
            password_hash,
            role,
            account_status
         FROM User
         WHERE email = ?`,
        [email]
    );

    return rows[0] || null;
}

async function createUser(connection, email, passwordHash) {
    const [result] = await connection.execute(
        `INSERT INTO User (email, password_hash, role)
         VALUES (?, ?, 'Resident')`,
        [email, passwordHash]
    );

    return result.insertId;
}

async function updateUserPassword(connection, userId, passwordHash) {
    const [result] = await connection.execute(
        `UPDATE User
         SET password_hash = ?
         WHERE user_id = ?`,
        [passwordHash, userId]
    );

    return result.affectedRows;
}

async function updateProfileImage(userId, imagePath) {
    const [result] = await pool.execute(
        `UPDATE User
        SET profile_image_path = ?
        WHERE user_id = ?`,
        [imagePath, userId]
    );

    return result.affectedRows;
}

module.exports = {
    findUserByEmail,
    createUser,
    updateUserPassword,
    updateProfileImage
};