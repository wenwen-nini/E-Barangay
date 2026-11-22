const pool = require("../config/database.js");

// Retrieve Requirements By Document
async function getRequirementsByDocumentId(connnection = pool, documentId) {
    const [rows] = await connection.query(
        `SELECT
            requirement_id,
            document_id,
            requirement_name,
            description,
            is_mandatory
        FROM Requirement
        WHERE document_id = ?
        ORDER BY requirement_id ASC`,
        [documentId]
    );

    return rows;
}

// Add a requirement
async function addRequirement(connection, documentId, requirementData) {
    const [result] = await connection.query(
        `INSERT INTO Requirement (
            document_id,
            requirement_name,
            description,
            is_mandatory
        ) VALUES (?, ?, ?, ?)`,
        [
            documentId,
            requirementData.requirement_name,
            requirementData.description,
            requirementData.is_mandatory
        ]
    );

    return result.insertId
}