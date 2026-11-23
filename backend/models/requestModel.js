const pool = require("../config/database.js");

// Retrieve summary of a specific resident
async function getRequestSummary(residentId) {
    const [rows] = await pool.execute(
        `SELECT
            COUNT (*) AS total_requests,
            COALESCE(SUM(status IN ('Pending', 'Under Review')), 0) AS pending,
            COALESCE(SUM(status = 'Approved'), 0) as approved,
            COALESCE(SUM(status = 'Rejected'), 0) as rejected,
            COALESCE(SUM(status = 'Released'), 0) as released,
            COALESCE(SUM(status = 'Returned'), 0) as returned,
            COALESCE(SUM(status = 'Cancelled'), 0) as cancelled
        FROM \`Request\`
        WHERE resident_id = ?`,
        [residentId]        
    );

    return rows[0];
}

// Retrieves the 2 most recent request of a resident
async function getRecentRequests(residentId) {
    const [rows] = await pool.execute(
        `SELECT
            r.request_id,
            r.document_id,
            d.document_name,
            r.number_of_copies,
            r.purpose,
            r.request_date,
            r.status
        FROM \`Request\` r
        INNER JOIN Document d
            ON r.document_id = d.document_id
        WHERE r.resident_id = ?
        ORDER BY r.request_date DESC
        LIMIT 2`,
        [residentId]
    );
}

// Retrieves all requests belonging to certain resident, with optional status filtering
async function getResidentRequests(residentId, status = null) {
    let query = `
        SELECT
            r.request_id,
            r.document_id,
            d.document_name,
            r.number_of_copies,
            r.purpose,
            r.request_date,
            r.status
        FROM \`Request\` r
        INNER JOIN Document d
            ON r.document_id = d.document_id
        WHERE r.resident_id = ?
    `;

    const params = [residentId];

    if (status) {
        query += " AND r.status = ?";
        params.push(status);
    }

    query += " ORDER BY r.request_date DESC";

    const [rows] = await pool.execute(query, params);

    return rows;
}

async function getResidentRequestDetails(requestId, residentId) {
    const [requestRows] = await pool.execute(
        `SELECT
            r.request_id,
            r.resident_id,
            r.document_id,
            d.document_name,
            d.description AS document_description,
            d.fee_per_copy,
            d.document_preview_path,
            r.number_of_copies,
            r.purpose,
            r.request_date,
            r.status,
            r.approval_date,
            r.release_date,
            r.valid_id_presented,
            r.identity_matched,
            r.document_and_copies_verified,
            r.collection_confirmed
        FROM \`Request\` r
        INNER JOIN Document d
            ON r.document_id = d.document_id
        WHERE r.request_id = ?
            AND r.resident_id = ?`,
        [requestId, residentId]
    );

    if (requestRows.length === 0) {
        return null;
    }

    const [uploadedRequirements] = await pool.execute(
        `SELECT
            ur.uploaded_requirement_id,
            ur.requirement_id,
            req.requirement_name,
            req.is_mandatory,
            ur.original_filename,
            ur.storage_path,
            ur.mime_type,
            ur.file_size,
            ur.uploaded_at
        FROM Uploaded_Requirements ur
        INNER JOIN Requirement req
            ON ur.requirement_id = req.requirement_id
        WHERE ur.request_id = ?
        ORDER BY ur.uploaded_at ASC`,
        [requestId]
    );

    const [statusHistory] = await pool.execute(
        `SELECT
            history_id,
            status,
            remarks,
            changed_at
        FROM Request_Status_History
        WHERE request_id = ?
        ORDER BY changed_at ASC`,
        [requestId]
    );

    return {
        ...requestRows[0],
        uploaded_requirements: uploadedRequirements,
        status_history: statusHistory
    };
}

// Create a request

async function createRequest(
    residentId,
    userId,
    documentId,
    numberOfCopies,
    purpose,
    uploadedFiles = []
) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [documents] = await connection.execute(
            `SELECT document_id, availability
            FROM Document
            WHERE document_id = ?
            FOR UPDATE`,
            [documentId]
        );

        if (documents.length === 0) {
            const error = new Error("Document not found");
            error.code = "DOCUMENT_NOT_FOUND";
            throw error;
        }

        if (documents[0].availability !== "Available") {
            const error = new Error(
                "This document is currently unavailable"
            );
            error.code = "DOCUMENT_UNAVAILABLE";
            throw error;
        }

        const [requirements] = await connection.execute(
            `SELECT requirement_id, requirement_name, is_mandatory
            FROM Requirement
            WHERE document_id = ?`,
            [documentId]
        );

        const validRequirementIds = requirements.map(
            requirement => Number(requirement.requirement_id)
        );

        const uploadedRequirementIds = uploadedFiles.map(file =>
            Number(file.requirement_id)
        );

        const invalidFiles = uploadedRequirementIds.filter(
            id => !validRequirementIds.includes(id)
        );

        if (invalidFiles.length > 0) {
            const error = new Error(
                "One or more uploaded files do not match the selected document requirements."
            );
            error.code = "INVALID_REQUIREMENT";
            throw error;
        }

        const uniqueRequirementIds = new Set(uploadedRequirementIds);

        if (uniqueRequirementIds.size !== uploadedRequirementIds.length) {
            const error = new Error(
                "Only one file can be uploaded for each requirement."
            );
            error.code = "DUPLICATE_REQUIREMENT";
            throw error;
        }

        const mandatoryRequirements = requirements.filter(
            requirement => Number(requirement.is_mandatory) === 1
        );

        const missingRequirements = mandatoryRequirements.filter(
            requirement =>
                !uploadedRequirementIds.includes(
                    Number(requirement.requirement_id)
                )
        );

        if (missingRequirements.length > 0) {
            const error = new Error(
                "Please upload all mandatory requirements."
            );
            error.code = "MISSING_REQUIREMENTS";
            error.missingRequirements = missingRequirements.map(
                requirement => requirement.requirement_name
            );
            throw error;
        }

        const [requestResult] = await connection.execute(
            `INSERT INTO \`Request\`
                (resident_id, document_id, number_of_copies, purpose)
            VALUES (?, ?, ?, ?)`,
            [residentId, documentId, numberOfCopies, purpose]
        );

        const requestId = requestResult.insertId;

        for (const file of uploadedFiles) {
            await connection.execute(
                `INSERT INTO Uploaded_Requirements (
                    request_id,
                    requirement_id,
                    original_filename,
                    stored_filename,
                    storage_path,
                    mime_type,
                    file_size
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    requestId,
                    Number(file.requirement_id),
                    file.originalname,
                    file.filename,
                    file.path,
                    file.mimetype,
                    file.size
                ]
            );
        }

        await connection.execute(
            `INSERT INTO Request_Status_History
                (request_id, changed_by_user_id, status, remarks)
            VALUES (?, ?, 'Pending', ?)`,
            [
                requestId,
                userId,
                "Request submitted successfully."
            ]
        );

        await connection.commit();

        return requestId;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

// Reupload Request requirements
async function reuploadRequestRequirements(
    requestId,
    residentId,
    userId,
    uploadedFiles = []
) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        if (uploadedFiles.length === 0) {
            const error = new Error("Please upload at least one corrected requirement.");
            error.code = "NO_FILES";
            throw error;
        }

        const [requestRows] = await connection.execute(
            `SELECT request_id, document_id, status
            FROM \`Request\`
            WHERE request_id = ? AND resident_id = ?
            FOR UPDATE`,
            [requestId, residentId]
        );

        if (requestRows.length === 0) {
            const error = new Error("Request not found.");
            error.code = "REQUEST_NOT_FOUND";
            throw error;
        }

        const request = requestRows[0];

        if (request.status !== "Returned") {
            const error = new Error(
                "Only returned requests can have their requirements re-uploaded."
            );
            error.code = "INVALID_REQUEST_STATUS";
            throw error;
        }

        const [requirements] = await connection.execute(
            `SELECT requirement_id, requirement_name, is_mandatory
            FROM Requirement
            WHERE document_id = ?`,
            [request.document_id]
        );

        const validRequirementIds = requirements.map(
            requirement => Number(requirement.requirement_id)
        );

        const uploadedRequirementIds = uploadedFiles.map(file =>
            Number(file.requirement_id)
        );

        if (
            uploadedRequirementIds.some(
                id => !validRequirementIds.includes(id)
            )
        ) {
            const error = new Error("Invalid requirement ID.");
            error.code = "INVALID_REQUIREMENT";
            throw error;
        }

        if (
            new Set(uploadedRequirementIds).size !==
            uploadedRequirementIds.length
        ) {
            const error = new Error(
                "Only one file can be uploaded for each requirement."
            );
            error.code = "DUPLICATE_REQUIREMENT";
            throw error;
        }

        const [existingUploads] = await connection.execute(
            `SELECT requirement_id
            FROM Uploaded_Requirements
            WHERE request_id = ?`,
            [requestId]
        );

        const completedRequirementIds = new Set([
            ...existingUploads.map(row => Number(row.requirement_id)),
            ...uploadedRequirementIds
        ]);

        const missingRequirements = requirements.filter(
            requirement =>
                Number(requirement.is_mandatory) === 1 &&
                !completedRequirementIds.has(
                    Number(requirement.requirement_id)
                )
        );

        if (missingRequirements.length > 0) {
            const error = new Error(
                "Please upload all mandatory requirements."
            );
            error.code = "MISSING_REQUIREMENTS";
            error.missingRequirements = missingRequirements.map(
                requirement => requirement.requirement_name
            );
            throw error;
        }

        const oldFilePaths = [];

        for (const file of uploadedFiles) {
            const requirementId = Number(file.requirement_id);

            const [existingRows] = await connection.execute(
                `SELECT uploaded_requirement_id, storage_path
                FROM Uploaded_Requirements
                WHERE request_id = ? AND requirement_id = ?`,
                [requestId, requirementId]
            );

            if (existingRows.length > 0) {
                oldFilePaths.push(existingRows[0].storage_path);

                await connection.execute(
                    `UPDATE Uploaded_Requirements
                    SET original_filename = ?,
                        stored_filename = ?,
                        storage_path = ?,
                        mime_type = ?,
                        file_size = ?,
                        uploaded_at = CURRENT_TIMESTAMP
                    WHERE uploaded_requirement_id = ?`,
                    [
                        file.originalname,
                        file.filename,
                        file.path,
                        file.mimetype,
                        file.size,
                        existingRows[0].uploaded_requirement_id
                    ]
                );
            } else {
                await connection.execute(
                    `INSERT INTO Uploaded_Requirements (
                        request_id,
                        requirement_id,
                        original_filename,
                        stored_filename,
                        storage_path,
                        mime_type,
                        file_size
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        requestId,
                        requirementId,
                        file.originalname,
                        file.filename,
                        file.path,
                        file.mimetype,
                        file.size
                    ]
                );
            }
        }

        await connection.execute(
            `UPDATE \`Request\`
            SET status = 'Pending'
            WHERE request_id = ? AND resident_id = ?`,
            [requestId, residentId]
        );

        await connection.execute(
            `INSERT INTO Request_Status_History
                (request_id, changed_by_user_id, status, remarks)
            VALUES (?, ?, 'Pending', ?)`,
            [
                requestId,
                userId,
                "Resident submitted corrected requirements."
            ]
        );

        await connection.commit();

        return oldFilePaths;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}



// Upload files for requirements
async function getDocumentRequirements(documentId) {
    const [rows] = await pool.execute(
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

async function getRequestStatusHistory(requestId, residentId) {
    const query = `
        SELECT
            h.history_id,
            h.request_id,
            h.status,
            h.remarks,
            h.changed_at
        FROM Request_Status_History h
        INNER JOIN \`Request\` r
            ON h.request_id = r.request_id
        WHERE h.request_id = ?
        AND r.resident_id = ?
        ORDER BY h.changed_at ASC
    `;

    const [rows] = await pool.execute(query, [
        requestId,
        residentId
    ]);

    return rows;
}

module.exports = {
    getRequestSummary,
    getRecentRequests,
    getResidentRequests,
    getResidentRequestDetails,
    createRequest,
    getDocumentRequirements,
    reuploadRequestRequirements,
    getRequestStatusHistory
};