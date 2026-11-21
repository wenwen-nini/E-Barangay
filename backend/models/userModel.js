async function findUserByEmail(connection, email) {
    const [rows] = await connection.execute(
        "SELECT user_id, email FROM User WHERE email = ?",
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

module.exports = {
    findUserByEmail,
    createUser
};