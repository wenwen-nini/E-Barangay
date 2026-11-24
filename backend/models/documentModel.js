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
    const [rows] = await connection.query(
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

// Add a document
async function addDocument(connection, documentData) {
    const [result] = await connection.query(
        `INSERT INTO Document (
            document_name,
            description,
            fee_per_copy,
            availability,
            document_preview_path
        )
        VALUES (?, ?, ?, ?, ?)`,
        [
            documentData.document_name,
            documentData.description,
            documentData.fee_per_copy,
            documentData.availability,
            documentData.document_preview_path
        ]
    );

    return result.insertId;
}

// Update a document
async function updateDocument(connection, documentId, documentData) {
    const [result] = await connection.query(
        `UPDATE Document
         SET
            document_name = ?,
            description = ?,
            fee_per_copy = ?,
            availability = ?,
            document_preview_path = ?
         WHERE document_id = ?`,
         [
          documentData.document_name,
          documentData.description,
          documentData.fee_per_copy,
          documentData.availability,
          documentData.document_preview_path,
          documentId
         ]
    );

    return result.affectedRows;
}

// Check whether a document has existing requests
async function hasDocumentRequests(connection = pool, documentId) {
    const [rows] = await connection.query(
        `SELECT COUNT(*) AS total
         FROM Request
         WHERE document_id = ?`,
        [documentId]
    );

    return Number(rows[0].total) > 0;
}

// Permanently Deletes document
async function deleteDocument(documentId) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(
            `DELETE From Requirement
             WHERE document_id = ?`,
            [documentId]
        );

        const [result] = await connection.query(
            `DELETE From Document
             WHERE document_id = ?`,
            [documentId]
        );

        await connection.commit();

        return result.affectedRows;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    getAllDocuments,
    getDocumentById,
    addDocument,
    updateDocument,
    hasDocumentRequests,
    deleteDocument
};