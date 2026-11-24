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
            COALESCE(latest.status, r.status) AS status,
            COALESCE(latest.changed_at, r.request_date) AS activity_date,
            latest.remarks
        FROM \`Request\` r
        INNER JOIN Document d
            ON r.document_id = d.document_id
        LEFT JOIN (
            SELECT
                h1.request_id,
                h1.status,
                h1.changed_at,
                h1.remarks
            FROM Request_Status_History h1
            INNER JOIN (
                SELECT
                    request_id,
                    MAX(history_id) AS latest_history_id
                FROM Request_Status_History
                GROUP BY request_id
            ) h2
                ON h1.history_id = h2.latest_history_id
        ) latest
            ON r.request_id = latest.request_id
        WHERE r.resident_id = ?
        ORDER BY COALESCE(latest.changed_at, r.request_date) DESC
        LIMIT 2`,
        [residentId]
    );

    return rows;
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

async function getAllRequestsForStaff() {
    const [rows] = await pool.execute(
        `SELECT
            r.request_id,
            r.resident_id,
            r.document_id,
            d.document_name,
            r.number_of_copies,
            r.purpose,
            r.request_date,
            r.status,
            res.first_name,
            res.middle_name,
            res.last_name,
            res.name_extension,
            res.complete_address,
            res.contact_number
        FROM \`Request\` r
        INNER JOIN Document d
            ON r.document_id = d.document_id
        INNER JOIN Resident res
            ON r.resident_id = res.resident_id
        ORDER BY r.request_date DESC`
    );

    return rows;
}

async function getStaffRequestSummary() {
    const [rows] = await pool.execute(
        `SELECT
            COUNT(*) AS total_requests,
            COALESCE(SUM(status = 'Pending'), 0) AS pending,
            COALESCE(SUM(status = 'Under Review'), 0) AS under_review,
            COALESCE(SUM(status = 'Approved'), 0) AS approved
        FROM \`Request\``
    );

    return rows[0];
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
            ur.uploaded_at,
            ur.verification_status,
            ur.staff_remarks,
            ur.verified_at
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

async function getStaffRequestDetails(requestId) {
    const [requestRows] = await pool.execute(
        `SELECT
            r.request_id,
            r.resident_id,
            r.assigned_staff_id,
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
            r.collection_confirmed,
            res.first_name,
            res.middle_name,
            res.last_name,
            res.name_extension,
            res.complete_address,
            res.contact_number
        FROM \`Request\` r
        INNER JOIN Document d
            ON r.document_id = d.document_id
        INNER JOIN Resident res
            ON r.resident_id = res.resident_id
        WHERE r.request_id = ?`,
        [requestId]
    );

    if (requestRows.length === 0) {
        return null;
    }

    const [requirements] = await pool.execute(
        `SELECT
            req.requirement_id,
            req.requirement_name,
            req.description,
            req.is_mandatory,
            ur.uploaded_requirement_id,
            ur.original_filename,
            ur.stored_filename,
            ur.storage_path,
            ur.mime_type,
            ur.file_size,
            ur.uploaded_at,
            ur.verification_status,
            ur.staff_remarks,
            ur.verified_by_staff_id,
            ur.verified_at
        FROM Requirement req
        LEFT JOIN Uploaded_Requirements ur
            ON req.requirement_id = ur.requirement_id
            AND ur.request_id = ?
        WHERE req.document_id = ?
        ORDER BY req.requirement_id ASC`,
        [requestId, requestRows[0].document_id]
    );

    const [uploadedRequirements] = await pool.execute(
        `SELECT
            ur.uploaded_requirement_id,
            ur.requirement_id,
            req.requirement_name,
            req.is_mandatory,
            ur.original_filename,
            ur.stored_filename,
            ur.storage_path,
            ur.mime_type,
            ur.file_size,
            ur.uploaded_at,
            ur.verification_status,
            ur.staff_remarks,
            ur.verified_by_staff_id,
            ur.verified_at
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
        requirements,
        uploaded_requirements: uploadedRequirements,
        status_history: statusHistory
    };
}


async function verifyUploadedRequirement(
    uploadedRequirementId,
    requestId,
    userId,
    verificationStatus,
    remarks = null
) {
    const allowedStatuses = ["Accepted", "Needs Correction"];

    if (!allowedStatuses.includes(verificationStatus)) {
        const error = new Error("Invalid requirement verification status.");
        error.code = "INVALID_VERIFICATION_STATUS";
        throw error;
    }

    const cleanRemarks = remarks?.trim() || null;

    if (verificationStatus === "Needs Correction" && !cleanRemarks) {
        const error = new Error(
            "Please provide remarks explaining what needs correction."
        );
        error.code = "REQUIREMENT_REMARKS_REQUIRED";
        throw error;
    }

    // Find the staff account
    const [staffRows] = await pool.execute(
        `SELECT staff_id
        FROM Staff
        WHERE user_id = ?`,
        [userId]
    );

    if (staffRows.length === 0) {
        const error = new Error("Staff account not found.");
        error.code = "STAFF_NOT_FOUND";
        throw error;
    }

    // Confirm that the uploaded requirement belongs to this request
    const [uploadedRows] = await pool.execute(
        `SELECT uploaded_requirement_id
        FROM Uploaded_Requirements
        WHERE uploaded_requirement_id = ?
            AND request_id = ?`,
        [uploadedRequirementId, requestId]
    );

    if (uploadedRows.length === 0) {
        const error = new Error("Uploaded requirement not found.");
        error.code = "UPLOADED_REQUIREMENT_NOT_FOUND";
        throw error;
    }

    // Save the individual verification result
    await pool.execute(
        `UPDATE Uploaded_Requirements
        SET
            verification_status = ?,
            staff_remarks = ?,
            verified_by_staff_id = ?,
            verified_at = CURRENT_TIMESTAMP
        WHERE uploaded_requirement_id = ?
            AND request_id = ?`,
        [
            verificationStatus,
            cleanRemarks,
            staffRows[0].staff_id,
            uploadedRequirementId,
            requestId
        ]
    );

    return {
        success: true,
        uploaded_requirement_id: uploadedRequirementId,
        verification_status: verificationStatus,
        staff_remarks: cleanRemarks
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
                    `uploads/request-requirements/${file.filename}`,
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
                `SELECT
                    uploaded_requirement_id,
                    storage_path,
                    verification_status
                FROM Uploaded_Requirements
                WHERE request_id = ? AND requirement_id = ?`,
                [requestId, requirementId]
            );

            if (
                existingRows.length > 0 &&
                existingRows[0].verification_status !== "Needs Correction"
            ) {
                const error = new Error(
                    "You can only replace requirements marked as Needs Correction."
                );
                error.code = "REQUIREMENT_NOT_CORRECTABLE";
                throw error;
            }

            if (existingRows.length > 0) {
                oldFilePaths.push(existingRows[0].storage_path);

                await connection.execute(
                    `UPDATE Uploaded_Requirements
                    SET original_filename = ?,
                        stored_filename = ?,
                        storage_path = ?,
                        mime_type = ?,
                        file_size = ?,
                        verification_status = 'Pending',
                        staff_remarks = NULL,
                        verified_by_staff_id = NULL,
                        verified_at = NULL,
                        uploaded_at = CURRENT_TIMESTAMP
                    WHERE uploaded_requirement_id = ?`,
                    [
                        file.originalname,
                        file.filename,
                        `uploads/request-requirements/${file.filename}`,
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
                        `uploads/request-requirements/${file.filename}`,
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

async function submitRequestFollowUp(
    requestId,
    residentId,
    userId,
    message
) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [requests] = await connection.execute(
            `SELECT request_id, status
            FROM \`Request\`
            WHERE request_id = ?
            AND resident_id = ?
            FOR UPDATE`,
            [requestId, residentId]
        );

        if (requests.length === 0) {
            throw new Error("REQUEST_NOT_FOUND");
        }

        const currentStatus = requests[0].status;

        if (currentStatus !== "Pending") {
            throw new Error("INVALID_REQUEST_STATUS");
        }

        await connection.execute(
            `INSERT INTO Request_Status_History
            (
                request_id,
                status,
                remarks,
                changed_by_user_id
            )
            VALUES (?, ?, ?, ?)`,
            [
                requestId,
                currentStatus,
                `Resident follow-up: ${message}`,
                userId
            ]
        );

        await connection.commit();

        return true;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

async function cancelResidentRequest(
    requestId,
    residentId,
    userId,
    reason = ""
) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [requests] = await connection.execute(
            `SELECT request_id, status
            FROM \`Request\`
            WHERE request_id = ?
            AND resident_id = ?
            FOR UPDATE`,
            [requestId, residentId]
        );

        if (requests.length === 0) {
            throw new Error("REQUEST_NOT_FOUND");
        }

        if (requests[0].status !== "Pending") {
            throw new Error("INVALID_REQUEST_STATUS");
        }

        await connection.execute(
            `UPDATE \`Request\`
            SET status = 'Cancelled'
            WHERE request_id = ?`,
            [requestId]
        );

        await connection.execute(
            `INSERT INTO Request_Status_History
            (
                request_id,
                status,
                remarks,
                changed_by_user_id
            )
            VALUES (?, 'Cancelled', ?, ?)`,
            [
                requestId,
                reason
                    ? `Resident cancelled request. Reason: ${reason}`
                    : "Resident cancelled request.",
                userId
            ]
        );

        await connection.commit();

        return true;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

// Assign Request to staff
async function assignRequestToStaff(requestId, userId) {
    const [result] = await pool.execute(
        `UPDATE \`Request\` r
        INNER JOIN Staff s
            ON s.user_id = ?
        SET r.assigned_staff_id = s.staff_id
        WHERE r.request_id = ?`,
        [userId, requestId]
    );

    return result.affectedRows > 0;
}

// Request Tasks Methods

// Mark a request as Under Review
async function markRequestUnderReview(requestId, userId, remarks = null) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [requests] = await connection.execute(
            `SELECT request_id, status
            FROM \`Request\`
            WHERE request_id = ?
            FOR UPDATE`,
            [requestId]
        );

        if (requests.length === 0) {
            const error = new Error("Request not found.");
            error.code = "REQUEST_NOT_FOUND";
            throw error;
        }

        if (requests[0].status !== "Pending") {
            const error = new Error(
                "Only pending requests can be moved under review."
            );
            error.code = "INVALID_REQUEST_STATUS";
            throw error;
        }

        await connection.execute(
            `UPDATE \`Request\`
            SET status = 'Under Review',
                assigned_staff_id = (
                    SELECT staff_id
                    FROM Staff
                    WHERE user_id = ?
                )
            WHERE request_id = ?`,
            [userId, requestId]
        );

        await connection.execute(
            `INSERT INTO Request_Status_History
                (request_id, changed_by_user_id, status, remarks)
            VALUES (?, ?, 'Under Review', ?)`,
            [
                requestId,
                userId,
                remarks || "Staff started reviewing the request."
            ]
        );

        await connection.commit();
        return true;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

// Approve a request
async function approveRequest(requestId, userId, remarks = null) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [requests] = await connection.execute(
            `SELECT request_id, status
            FROM \`Request\`
            WHERE request_id = ?
            FOR UPDATE`,
            [requestId]
        );

        if (requests.length === 0) {
            const error = new Error("Request not found.");
            error.code = "REQUEST_NOT_FOUND";
            throw error;
        }

        if (requests[0].status !== "Under Review") {
            const error = new Error(
                "Only requests under review can be approved."
            );
            error.code = "INVALID_REQUEST_STATUS";
            throw error;
        }

        await connection.execute(
            `UPDATE \`Request\`
            SET status = 'Approved',
                approval_date = CURRENT_TIMESTAMP
            WHERE request_id = ?`,
            [requestId]
        );

        await connection.execute(
            `INSERT INTO Request_Status_History
                (request_id, changed_by_user_id, status, remarks)
            VALUES (?, ?, 'Approved', ?)`,
            [requestId, userId, remarks]
        );

        await connection.commit();
        return true;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

// Reject a request
async function rejectRequest(requestId, userId, remarks) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [requests] = await connection.execute(
            `SELECT request_id, status
            FROM \`Request\`
            WHERE request_id = ?
            FOR UPDATE`,
            [requestId]
        );

        if (requests.length === 0) {
            const error = new Error("Request not found.");
            error.code = "REQUEST_NOT_FOUND";
            throw error;
        }

        if (requests[0].status !== "Under Review") {
            const error = new Error(
                "Only requests under review can be rejected."
            );
            error.code = "INVALID_REQUEST_STATUS";
            throw error;
        }

        await connection.execute(
            `UPDATE \`Request\`
            SET status = 'Rejected'
            WHERE request_id = ?`,
            [requestId]
        );

        await connection.execute(
            `INSERT INTO Request_Status_History
                (request_id, changed_by_user_id, status, remarks)
            VALUES (?, ?, 'Rejected', ?)`,
            [requestId, userId, remarks]
        );

        await connection.commit();
        return true;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

// Return a request for correction
async function returnRequest(requestId, userId, remarks) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [requests] = await connection.execute(
            `SELECT request_id, status
            FROM \`Request\`
            WHERE request_id = ?
            FOR UPDATE`,
            [requestId]
        );

        if (requests.length === 0) {
            const error = new Error("Request not found.");
            error.code = "REQUEST_NOT_FOUND";
            throw error;
        }

        if (requests[0].status !== "Under Review") {
            const error = new Error(
                "Only requests under review can be returned."
            );
            error.code = "INVALID_REQUEST_STATUS";
            throw error;
        }

        await connection.execute(
            `UPDATE \`Request\`
            SET status = 'Returned'
            WHERE request_id = ?`,
            [requestId]
        );

        await connection.execute(
            `INSERT INTO Request_Status_History
                (request_id, changed_by_user_id, status, remarks)
            VALUES (?, ?, 'Returned', ?)`,
            [requestId, userId, remarks]
        );

        await connection.commit();
        return true;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

// Retrieves the selected uploaded Requirement file
async function getUploadedRequirementFile(
    requestId,
    uploadedRequirementId
) {
    const [rows] = await pool.execute(
        `SELECT
            uploaded_requirement_id,
            request_id,
            original_filename,
            stored_filename,
            storage_path,
            mime_type
        FROM Uploaded_Requirements
        WHERE request_id = ?
            AND uploaded_requirement_id = ?`,
        [requestId, uploadedRequirementId]
    );

    return rows[0] || null;
}



async function getDocumentReleaseRequests(page = 1, filters = {}) {
    const limit = 10;
    const currentPage = Math.max(1, Number(page) || 1);
    const offset = (currentPage - 1) * limit;

    const {
        search = "",
        documentId = "",
        dateFrom = "",
        dateTo = ""
    } = filters;

    // Build conditions for the Approved Request queue
    let conditions = [`r.status = 'Approved'`];
    let queryParams = [];

    // Search by request ID or resident name
    if (search) {
        conditions.push(`(
            CONCAT('REQ-', LPAD(r.request_id, 3, '0')) LIKE ?
            OR CONCAT_WS(' ',
                res.first_name,
                res.middle_name,
                res.last_name,
                res.name_extension
            ) LIKE ?
        )`);

        queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Filter by document
    if (documentId) {
        conditions.push(`r.document_id = ?`);
        queryParams.push(documentId);
    }

    // Filter by approval date
    if (dateFrom) {
        conditions.push(`r.approval_date >= ?`);
        queryParams.push(dateFrom);
    }

    if (dateTo) {
        conditions.push(`r.approval_date < DATE_ADD(?, INTERVAL 1 DAY)`);
        queryParams.push(dateTo);
    }

    const whereClause = conditions.join(" AND ");

    // Get filtered Approved request count
    const [countRows] = await pool.execute(
        `SELECT COUNT(*) AS total_records
        FROM \`Request\` r
        INNER JOIN Resident res
            ON res.resident_id = r.resident_id
        WHERE ${whereClause}`,
        queryParams
    );

    const totalRecords = Number(countRows[0].total_records);
    const totalPages = Math.ceil(totalRecords / limit);

    // Get global summary counts, independent of filters
    const [summaryRows] = await pool.execute(
        `SELECT
            COUNT(*) AS total_records,
            COALESCE(SUM(status = 'Approved'), 0) AS approved_count,
            COALESCE(SUM(status = 'Released'), 0) AS released_count
        FROM \`Request\`
        WHERE status IN ('Approved', 'Released')`
    );

    const summary = {
        approvedCount: Number(summaryRows[0].approved_count),
        releasedCount: Number(summaryRows[0].released_count)
    };

    // Retrieve filtered Approved requests for the current page
    const [rows] = await pool.execute(
        `SELECT
            r.request_id,
            r.resident_id,
            r.document_id,
            r.assigned_staff_id,
            r.number_of_copies,
            r.purpose,
            r.request_date,
            r.status,
            r.approval_date,
            r.release_date,

            CONCAT_WS(' ',
                res.first_name,
                res.middle_name,
                res.last_name,
                res.name_extension
            ) AS resident_name,

            d.document_name

        FROM \`Request\` r

        INNER JOIN Resident res
            ON res.resident_id = r.resident_id

        INNER JOIN Document d
            ON d.document_id = r.document_id

        WHERE ${whereClause}

        ORDER BY
            r.approval_date DESC,
            r.request_id DESC

        LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
    );

    return {
        requests: rows,
        summary,
        pagination: {
            currentPage,
            recordsPerPage: limit,
            totalRecords,
            totalPages,
            hasNextPage: currentPage < totalPages,
            hasPreviousPage: currentPage > 1
        }
    };
}



async function getDocumentReleaseDetails(requestId) {
    const [rows] = await pool.execute(
        `SELECT
            r.request_id,
            r.resident_id,
            r.document_id,
            r.assigned_staff_id,
            r.number_of_copies,
            r.purpose,
            r.request_date,
            r.status,
            r.approval_date,
            r.release_date,

            r.valid_id_presented,
            r.identity_matched,
            r.document_and_copies_verified,
            r.collection_confirmed,

            res.first_name,
            res.middle_name,
            res.last_name,
            res.name_extension,
            res.contact_number,
            res.complete_address,

            CONCAT_WS(' ',
                res.first_name,
                res.middle_name,
                res.last_name,
                res.name_extension
            ) AS resident_name,

            d.document_name,
            d.fee_per_copy

        FROM \`Request\` r

        INNER JOIN Resident res
            ON res.resident_id = r.resident_id

        INNER JOIN Document d
            ON d.document_id = r.document_id

        WHERE r.request_id = ?
            AND r.status IN ('Approved', 'Released')`,
        [requestId]
    );

    return rows[0] || null;
}

async function updateReleaseVerification(requestId, field, value) {
    const allowedFields = [
        "valid_id_presented",
        "identity_matched",
        "document_and_copies_verified",
        "collection_confirmed"
    ];

    if (!allowedFields.includes(field)) {
        throw new Error("INVALID_VERIFICATION_FIELD");
    }

    if (value !== 0 && value !== 1) {
        throw new Error("INVALID_VERIFICATION_VALUE");
    }

    const [result] = await pool.execute(
        `UPDATE \`Request\`
        SET ${field} = ?
        WHERE request_id = ?
            AND status = 'Approved'`,
        [value, requestId]
    );

    if (result.affectedRows > 0) {
        return true;
    }

    // Check whether the request exists and is still Approved
    const [rows] = await pool.execute(
        `SELECT request_id
        FROM \`Request\`
        WHERE request_id = ?
            AND status = 'Approved'`,
        [requestId]
    );

    return rows.length > 0;
}

async function releaseRequest(requestId, userId) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [rows] = await connection.execute(
            `SELECT
                request_id,
                status,
                valid_id_presented,
                identity_matched,
                document_and_copies_verified,
                collection_confirmed
            FROM \`Request\`
            WHERE request_id = ?
            FOR UPDATE`,
            [requestId]
        );

        if (rows.length === 0) {
            throw new Error("REQUEST_NOT_FOUND");
        }

        const request = rows[0];

        if (request.status !== "Approved") {
            throw new Error("INVALID_REQUEST_STATUS");
        }

        const allVerified =
            Number(request.valid_id_presented) === 1 &&
            Number(request.identity_matched) === 1 &&
            Number(request.document_and_copies_verified) === 1 &&
            Number(request.collection_confirmed) === 1;

        if (!allVerified) {
            throw new Error("VERIFICATION_INCOMPLETE");
        }

        const [staffRows] = await connection.execute(
            `SELECT staff_id
            FROM Staff
            WHERE user_id = ?`,
            [userId]
        );

        if (staffRows.length === 0) {
            throw new Error("STAFF_NOT_FOUND");
        }

        await connection.execute(
            `UPDATE \`Request\`
            SET
                status = 'Released',
                release_date = CURRENT_TIMESTAMP
            WHERE request_id = ?`,
            [requestId]
        );

        await connection.execute(
            `INSERT INTO Request_Status_History
            (request_id, changed_by_user_id, status, remarks)
            VALUES (?, ?, 'Released', ?)`,
            [
                requestId,
                userId,
                "Document successfully released to resident."
            ]
        );

        await connection.commit();

        return true;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

async function getRecentReleaseLog() {
    const [rows] = await pool.execute(
        `SELECT
            r.request_id,
            r.resident_id,
            r.document_id,
            r.number_of_copies,
            r.approval_date,
            r.release_date,

            CONCAT_WS(' ',
                res.first_name,
                res.middle_name,
                res.last_name,
                res.name_extension
            ) AS resident_name,

            CONCAT_WS(' ',
                s.first_name,
                s.middle_name,
                s.last_name
            ) AS staff_name,

            d.document_name

        FROM \`Request\` r

        INNER JOIN Resident res
            ON res.resident_id = r.resident_id

        INNER JOIN Document d
            ON d.document_id = r.document_id

        INNER JOIN Staff s
            ON s.staff_id = r.assigned_staff_id

        WHERE r.status = 'Released'
            AND r.release_date >= NOW() - INTERVAL 7 DAY
            AND r.release_date <= NOW()

        ORDER BY r.release_date DESC

        LIMIT 5`
    );

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
    getRequestStatusHistory,
    submitRequestFollowUp,
    cancelResidentRequest,
    getAllRequestsForStaff,
    getStaffRequestSummary,
    getStaffRequestDetails,
    assignRequestToStaff,
    markRequestUnderReview,
    approveRequest,
    rejectRequest,
    returnRequest,
    verifyUploadedRequirement,
    getUploadedRequirementFile,
    getDocumentReleaseRequests,
    getDocumentReleaseDetails,
    updateReleaseVerification,
    releaseRequest,
    getRecentReleaseLog
};