const pool = require("../config/database.js");

// Retrieve All Documents
async function getAllDocuments(connection = pool) {
    const [rows] = await connection.query(
        `SELECT
            document_id,
            document_name,
            description,
            fee_per_copy,
            availability,
            document_preview_path
        FROM Document
        ORDER BY document_name ASC`
    );

    return rows;
}

// Retrieve Available Documents
async function getDocumentById(connection = pool, documentId) {
    const [rows] = await connectin.query(
        `SELECT
            document_id,
            document_name,
            description,
            fee_per_copy,
            availability,
            document_preview_path

        FROM Document

        WHERE document_id = ?`,
        [documentId]
    );

    return rows[0] || null;
}

module.exports = {
    getAllDocuments,
    getDocumentById
};