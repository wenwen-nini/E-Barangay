const pool = require("../config/database.js");

// Retrieve Requirements By Document
async function getRequirementsByDocumentId(connection = pool, documentId) {
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

// Update a requirement
async function updateRequirement(connection, documentId, requirementId, requirementData) {
    const [result] = await connection.query(
        `UPDATE Requirement
         SET
            requirement_name = ?,
            description = ?,
            is_mandatory = ?
        WHERE requirement_id = ?
        AND document_id = ?`,
        [
            requirementData.requirement_name,
            requirementData.description,
            requirementData.is_mandatory,
            requirementId,
            documentId
        ]
    );

    return result.affectedRows;
}

// Delete a requirement
async function deleteRequirement(connection, documentId, requirementId) {
    const [result] = await connection.query(
        `DELETE FROM Requirement
        WHERE requirement_id = ?
        AND document_id = ?`,
        [requirementId, documentId]
    );

    return result.affectedRows;
}

module.exports = {
    getRequirementsByDocumentId,
    addRequirement,
    updateRequirement,
    deleteRequirement
}