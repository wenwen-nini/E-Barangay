async function createResident(connection, userId, residentData) {
    const {
        first_name,
        middle_name,
        last_name,
        name_extension,
        birth_date,
        complete_address,
        contact_number
    } = residentData;

    const [result] = await connection.execute(
        `INSERT INTO Resident (
            user_id,
            first_name,
            middle_name,
            last_name,
            name_extension,
            birth_date,
            complete_address,
            contact_number
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            userId,
            first_name,
            middle_name || null,
            last_name,
            name_extension || null,
            birth_date,
            complete_address,
            contact_number
        ]
    );

    return result.insertId;
}

module.exports = {
    createResident
};