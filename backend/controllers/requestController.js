const requestModel = require("../models/requestModel");
const fs = require("fs");
const path = require("path");

// Get resident request summary
async function getRequestSummary(req, res) {
    try {
        const residentId = req.session.user.resident_id;

        if (!residentId) {
            return res.status(403).json({
                success: false,
                message: "Resident account required."
            });
        }

        const summary = await requestModel.getRequestSummary(residentId);

        return res.status(200).json({
            success: true,
            summary
        });
    } catch (error) {
        console.error("Get request summary:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve request summary"
        });
    }
}

// Get resident's two most recent requests
async function getRecentRequests(req, res) {
    try {
        const residentId = req.session.user.resident_id;

        if (!residentId) {
            return res.status(403).json({
                success: false,
                message: "Resident account required."
            });
        }

        const summary = await requestModel.getRecentRequests(residentId);

        return res.status(200).json({
            success: true,
            summary
        });
    } catch (error) {
        console.error("Get recent requests:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve recent requests"
        });
    }
}

// Get All Residents requests with optional status filtering
async function getResidentRequests(req, res) {
    try {
        const residentId = req.session.user.resident_id;
        const status = req.query.status;

        if (!residentId) {
            return res.status(403).json({
                success: false,
                message: "Resident account required."
            });
        }

        const allowedStatuses = [
            "Pending",
            "Under Review",
            "Approved",
            "Rejected",
            "Released",
            "Returned",
            "Cancelled"
        ];

        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid request status"
            });
        }

        const requests = await requestModel.getResidentRequests(
            residentId,
            status || null
        );

        return res.status(200).json({
            success: true,
            requests
        });
    } catch (error) {
        console.error("Get Resident Request error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve resident requests."
        });
    }
}

// Get all resident request details
async function getResidentRequestDetails(req, res) {
    try {
        const residentId = req.session.user.resident_id;
        const requestId = Number(req.params.id);

        if (!residentId) {
            return res.status(403).json({
                success: false,
                message: "Resident account required."
            });
        }

        if (!Number.isInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid request ID"
            });
        }

        const request = await requestModel.getResidentRequestDetails(
            requestId,
            residentId
        );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found."
            });
        }

        return res.status(200).json({
            success: true,
            request
        });
    } catch (error) {
        console.error("Get Resident Request Details error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve resident requets details"
        });
    }
}

// Create a request
async function submitDocumentRequest(req, res) {
    const uploadedFiles = req.files || [];
    let filesSaved = false;

    try {
        const residentId = req.session.user.resident_id;
        const userId = req.session.user.user_id;

        const {
            document_id,
            number_of_copies,
            purpose,
            requirement_ids
        } = req.body || {};

        if (!residentId) {
            return res.status(403).json({
                success: false,
                message: "Resident account required."
            });
        }

        const documentId = Number(document_id);

        if (
            document_id === undefined ||
            document_id === null ||
            String(document_id).trim() === "" ||
            !Number.isInteger(documentId) ||
            documentId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID."
            });
        }

        const copies = Number(number_of_copies);

        if (
            number_of_copies === undefined ||
            number_of_copies === null ||
            String(number_of_copies).trim() === "" ||
            !Number.isInteger(copies) ||
            copies < 1 ||
            copies > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Number of copies must be between 1 and 100."
            });
        }

        if (
            typeof purpose !== "string" ||
            !purpose.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Purpose is required."
            });
        }

        if (purpose.trim().length > 500) {
            return res.status(400).json({
                success: false,
                message: "Purpose cannot exceed 500 characters."
            });
        }

        let requirementIds;

        try {
            requirementIds = JSON.parse(requirement_ids);
        } catch {
            return res.status(400).json({
                success: false,
                message: "Invalid requirement IDs."
            });
        }

        if (
            !Array.isArray(requirementIds) ||
            requirementIds.length !== uploadedFiles.length ||
            !requirementIds.every(id =>
                Number.isInteger(Number(id)) &&
                Number(id) > 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Uploaded files and requirement IDs do not match."
            });
        }

        const mappedFiles = uploadedFiles.map((file, index) => ({
            ...file,
            requirement_id: Number(requirementIds[index])
        }));

        const requestId = await requestModel.createRequest(
            residentId,
            userId,
            documentId,
            copies,
            purpose.trim(),
            mappedFiles
        );

        filesSaved = true;

        return res.status(201).json({
            success: true,
            message: "Document request submitted successfully.",
            request_id: requestId
        });

    } catch (error) {
        console.error("Submit document request error:", error);

        if (
            error.code === "DOCUMENT_NOT_FOUND" ||
            error.code === "DOCUMENT_UNAVAILABLE" ||
            error.code === "MISSING_REQUIREMENTS" ||
            error.code === "INVALID_REQUIREMENT" ||
            error.code === "DUPLICATE_REQUIREMENT"
        ) {
            return res.status(
                error.code === "DOCUMENT_NOT_FOUND" ? 404 :
                error.code === "DOCUMENT_UNAVAILABLE" ? 409 : 400
            ).json({
                success: false,
                message: error.message,
                missing_requirements: error.missingRequirements || []
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to submit document request."
        });

    } finally {
        if (!filesSaved) {
            await cleanupFiles();
        }
    }
}

// Reupload Request Requirement

async function reuploadRequestRequirements(req, res) {
    const uploadedFiles = req.files || [];
    let filesSaved = false;

    try {
        const residentId = req.session.user.resident_id;
        const userId = req.session.user.user_id;
        const requestId = Number(req.params.id);

        if (!residentId) {
            return res.status(403).json({
                success: false,
                message: "Resident account required."
            });
        }

        if (!Number.isInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid request ID."
            });
        }

        if (uploadedFiles.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please upload at least one corrected requirement."
            });
        }

        let requirementIds;

        try {
            requirementIds = JSON.parse(req.body.requirement_ids);
        } catch {
            return res.status(400).json({
                success: false,
                message: "Invalid requirement IDs."
            });
        }

        if (
            !Array.isArray(requirementIds) ||
            requirementIds.length !== uploadedFiles.length ||
            !requirementIds.every(id =>
                Number.isInteger(Number(id)) && Number(id) > 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Uploaded files and requirement IDs do not match."
            });
        }

        const mappedFiles = uploadedFiles.map((file, index) => ({
            ...file,
            requirement_id: Number(requirementIds[index])
        }));

        const oldFilePaths =
            await requestModel.reuploadRequestRequirements(
                requestId,
                residentId,
                userId,
                mappedFiles
            );

        filesSaved = true;

        await Promise.all(
            oldFilePaths.map(filePath =>
                fs.promises.unlink(filePath).catch(error => {
                    console.error("Old file cleanup error:", error);
                })
            )
        );

        return res.status(200).json({
            success: true,
            message: "Corrected requirements uploaded successfully.",
            request_id: requestId
        });

    } catch (error) {
        console.error("Re-upload requirements error:", error);

        const errorStatuses = {
            REQUEST_NOT_FOUND: 404,
            INVALID_REQUEST_STATUS: 409,
            INVALID_REQUIREMENT: 400,
            DUPLICATE_REQUIREMENT: 400,
            REQUIREMENT_NOT_CORRECTABLE: 400,
            MISSING_REQUIREMENTS: 400,
            NO_FILES: 400
        };

        if (errorStatuses[error.code]) {
            return res.status(errorStatuses[error.code]).json({
                success: false,
                message: error.message,
                missing_requirements: error.missingRequirements || []
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to upload corrected requirements."
        });

    } finally {
        if (!filesSaved) {
            await cleanupFiles();
        }
    }
}

// Retrieve the uploaded requirement file for preview controller
async function previewUploadedRequirement(req, res) {
    try {
        const requestId = Number(req.params.requestId);
        const uploadedRequirementId = Number(
            req.params.uploadedRequirementId
        );

        if (
            !Number.isInteger(requestId) ||
            requestId <= 0 ||
            !Number.isInteger(uploadedRequirementId) ||
            uploadedRequirementId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid request or uploaded requirement ID."
            });
        }

        const uploadedFile =
            await requestModel.getUploadedRequirementFile(
                requestId,
                uploadedRequirementId
            );

        if (!uploadedFile) {
            return res.status(404).json({
                success: false,
                message: "Uploaded requirement not found."
            });
        }

        const uploadDirectory = path.resolve(
            __dirname,
            "..",
            "uploads",
            "request-requirements"
        );

        const filePath = path.resolve(
            __dirname,
            "..",
            uploadedFile.storage_path
        );

        if (!filePath.startsWith(uploadDirectory + path.sep)) {
            return res.status(400).json({
                success: false,
                message: "Invalid file path."
            });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: "Uploaded file does not exist."
            });
        }

        res.setHeader(
            "Content-Type",
            uploadedFile.mime_type || "application/octet-stream"
        );

        res.setHeader(
            "Content-Disposition",
            `inline; filename="${path.basename(uploadedFile.original_filename)}"`
        );

        return res.sendFile(filePath);

    } catch (error) {
        console.error("Preview uploaded requirement error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to preview uploaded requirement."
        });
    }
}



// Get Document Requirement
async function getDocumentRequirements(req, res) {
    try {
        const documentId = Number(req.params.documentId);

        if (
            !Number.isInteger(documentId) ||
            documentId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID"
            });
        }

        const requirements = await requestModel.getDocumentRequirements(documentId);

        return res.status(200).json({
            success: true,
            requirements
        });
    } catch (error) {
        console.error("Get document requirements error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve document requirements"
        });
    }
}

// Get the Request Status History
async function getRequestStatusHistory(req, res) {
    try {
        const residentId = req.session.user.resident_id;
        const requestId = req.params.id;

        if (!residentId) {
            return res.status(403).json({
                success: false,
                message: "Resident account required."
            });
        }

        const history = await requestModel.getRequestStatusHistory(
            requestId,
            residentId
        );

        return res.status(200).json({
            success: true,
            history
        });

    } catch (error) {
        console.error("Get Request Status History error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve request status history."
        });
    }
}

// Create Follow-up
async function submitRequestFollowUp(req, res) {
    try {
        const residentId = req.session.user.resident_id;
        const userId = req.session.user.user_id;
        const requestId = Number(req.params.id);
        const message = req.body.message?.trim();

        if (!residentId) {
            return res.status(403).json({
                success: false,
                message: "Resident account required."
            });
        }

        if (!Number.isInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid Request ID"
            });
        }

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Please enter your follow-up message."
            });
        }

        if (message.length > 2000) {
            return res.status(400).json({
                success: false,
                message: "Follow-up message cannot exceed 2000 characters."
            });
        }

        await requestModel.submitRequestFollowUp(
            requestId,
            residentId,
            userId,
            message
        );

        return res.status(201).json({
            success: true,
            message: "Your follow-up message has been submittted"
        });
    } catch (error) {
        console.error("Submit request follow-up message error:", error);
        
        if (error.message === "REQUEST_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        if (error.message === "INVALID_REQUEST_STATUS") {
            return res.status(409).json({
                success: false,
                message: "Follow-up is only available for pending requests."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to submit your follow-up message."    
        });
    }
}

// Cancel a request on pending status
async function cancelResidentRequest(req, res) {
    try {
        const residentId = req.session.user.resident_id;
        const userId = req.session.user.user_id;
        const requestId = Number(req.params.id);
        const reason = req.body.reason?.trim() || "";

        if (!residentId) {
            return res.status(403).json({
                success: false,
                message: "Resident account required."
            });
        }

        if (!Number.isInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid Request ID"
            });
        }

        if (reason.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "Cancellation reason message cannot exceed 1000 characters."
            });
        }

        await requestModel.cancelResidentRequest(
            requestId,
            residentId,
            userId,
            reason
        );

        return res.status(200).json({
            success: true,
            message: "Your request has been cancelled successfully"
        });
        
    } catch (error) {
        console.error("Cancel resident request error:", error);

        if (error.message === "REQUEST_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        if (error.message === "INVALID_REQUEST_FOUND") {
            return res.status(409).json({
                success: false,
                message: "Only pending requests can be cancelled."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to cancel your request."
        });
    }
}

// Retrieves all requests for Staff Dashboard
async function getAllRequestsForStaff(req, res) {
    try {
        const requests = await requestModel.getAllRequestsForStaff();

        return res.status(200).json({
            success: true,
            requests
        });
    } catch (error) {
        console.error("Get all staff requests error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve requests."
        });
    }
}

// Retrieve request summary for Staff Dashboard
async function getStaffRequestSummary(req, res) {
    try {
        const summary = await requestModel.getStaffRequestSummary();

        return res.status(200).json({
            success: true,
            summary
        });
    } catch (error) {
        console.error("Get staff request summary error:", error);
        
        return res.status(500).json({
            success: false,
            message: "Unable to retrieve request summary"
        });
    }
}

async function getStaffRequestDetails(req, res) {
    try {
        const requestId = Number(req.params.id);

        if (!Number.isInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid request ID."
            });
        }

        const request = await requestModel.getStaffRequestDetails(requestId);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found."
            });
        }

        return res.status(200).json({
            success: true,
            request
        });

    } catch (error) {
        console.error("Get staff request details error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve request details."
        });
    }
}

// Assign request to the logged-in staff member
async function assignRequestToStaff(req, res) {
    try {
        const requestId = Number(req.params.id);
        const userId = req.session.user.user_id;

        if (!Number.isInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid request ID."
            });
        }

        const assigned = await requestModel.assignRequestToStaff(
            requestId,
            userId
        );

        if (!assigned) {
            return res.status(404).json({
                success: false,
                message: "Request not found or assignment was unsuccessful."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Request assigned successfully."
        });

    } catch (error) {
        console.error("Assign request error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to assign request."
        });
    }
}

// Request Task Methods Controller

// Mark a request as Under Review
async function markRequestUnderReview(req, res) {
    try {
        const requestId = Number(req.params.id);
        const userId = req.session.user.user_id;
        const { remarks } = req.body;

        if (!Number.isInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid request ID."
            });
        }

        await requestModel.markRequestUnderReview(
            requestId,
            userId,
            remarks?.trim() || null
        );

        return res.status(200).json({
            success: true,
            message: "Request is now under review."
        });

    } catch (error) {
        console.error("Mark request under review error:", error);

        if (error.code === "REQUEST_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.code === "INVALID_REQUEST_STATUS") {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update request status."
        });
    }
}

// Approve a request
async function approveRequest(req, res) {
    try {
        const requestId = Number(req.params.id);
        const userId = req.session.user.user_id;
        const { remarks } = req.body;

        if (!Number.isInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid request ID."
            });
        }

        await requestModel.approveRequest(
            requestId,
            userId,
            remarks?.trim() || null
        );

        return res.status(200).json({
            success: true,
            message: "Request approved successfully."
        });

    } catch (error) {
        console.error("Approve request error:", error);

        if (error.code === "REQUEST_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.code === "INVALID_REQUEST_STATUS") {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to approve request."
        });
    }
}

// Reject a request
async function rejectRequest(req, res) {
    try {
        const requestId = Number(req.params.id);
        const userId = req.session.user.user_id;
        const { remarks } = req.body;

        if (!Number.isInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid request ID."
            });
        }

        if (!remarks || !remarks.trim()) {
            return res.status(400).json({
                success: false,
                message: "Rejection remarks are required."
            });
        }

        await requestModel.rejectRequest(
            requestId,
            userId,
            remarks.trim()
        );

        return res.status(200).json({
            success: true,
            message: "Request rejected successfully."
        });

    } catch (error) {
        console.error("Reject request error:", error);

        if (error.code === "REQUEST_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.code === "INVALID_REQUEST_STATUS") {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to reject request."
        });
    }
}

// Return a request for correction
async function returnRequest(req, res) {
    try {
        const requestId = Number(req.params.id);
        const userId = req.session.user.user_id;
        const { remarks } = req.body;

        if (!Number.isInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid request ID."
            });
        }

        if (!remarks || !remarks.trim()) {
            return res.status(400).json({
                success: false,
                message: "Return remarks are required."
            });
        }

        await requestModel.returnRequest(
            requestId,
            userId,
            remarks.trim()
        );

        return res.status(200).json({
            success: true,
            message: "Request returned successfully."
        });

    } catch (error) {
        console.error("Return request error:", error);

        if (error.code === "REQUEST_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.code === "INVALID_REQUEST_STATUS") {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to return request."
        });
    }
}


async function verifyRequirement(req, res) {
    try {
        const { requestId, uploadedRequirementId } = req.params;
        const { verification_status, remarks } = req.body;

        if (!verification_status) {
            return res.status(400).json({
                success: false,
                message: "Verification status is required."
            });
        }

        const result = await requestModel.verifyUploadedRequirement(
            uploadedRequirementId,
            requestId,
            req.session.user.user_id,
            verification_status,
            remarks
        );

        return res.status(200).json({
            success: true,
            message: "Requirement verification updated successfully.",
            data: result
        });

    } catch (error) {
        console.error("Verify requirement error:", error);

        const errorResponses = {
            INVALID_VERIFICATION_STATUS: 400,
            REQUIREMENT_REMARKS_REQUIRED: 400,
            STAFF_NOT_FOUND: 403,
            UPLOADED_REQUIREMENT_NOT_FOUND: 404
        };

        return res.status(errorResponses[error.code] || 500).json({
            success: false,
            message: error.message || "Unable to verify requirement."
        });
    }
}

async function getDocumentReleaseRequests(req, res) {
    try {
        const page = Number(req.query.page) || 1;
        const search = (req.query.search || "").trim();
        const documentId = req.query.document_id || "";
        const dateFrom = req.query.date_from || "";
        const dateTo = req.query.date_to || "";

        if (!Number.isInteger(page) || page < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid page number."
            });
        }

        const result = await requestModel.getDocumentReleaseRequests(
            page,
            {
                search,
                documentId,
                dateFrom,
                dateTo
            }
        );

        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error("Get document release requests error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve document release requests."
        });
    }
}

async function getDocumentReleaseDetails(req, res) {
    try {
        const requestId = Number(req.params.id);

        if (!Number.isInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid request ID."
            });
        }

        const request = await requestModel.getDocumentReleaseDetails(
            requestId
        );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Approved or released request not found."
            });
        }

        return res.status(200).json({
            success: true,
            request
        });

    } catch (error) {
        console.error("Get document release details error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve document release details."
        });
    }
}

async function updateReleaseVerification(req, res) {
    try {
        const requestId = Number(req.params.id);
        const { field, value } = req.body;

        if (!Number.isInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid request ID."
            });
        }

        const allowedFields = [
            "valid_id_presented",
            "identity_matched",
            "document_and_copies_verified",
            "collection_confirmed"
        ];

        if (!allowedFields.includes(field)) {
            return res.status(400).json({
                success: false,
                message: "Invalid verification field."
            });
        }

        if (value !== 0 && value !== 1) {
            return res.status(400).json({
                success: false,
                message: "Verification value must be 0 or 1."
            });
        }

        const updated = await requestModel.updateReleaseVerification(
            requestId,
            field,
            value
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Approved request not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Verification checklist updated successfully."
        });

    } catch (error) {
        console.error("Update release verification error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update verification checklist."
        });
    }
}

async function releaseRequest(req, res) {
    try {
        const requestId = Number(req.params.id);
        const userId = req.session.user.user_id;

        if (!Number.isInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid request ID."
            });
        }

        await requestModel.releaseRequest(requestId, userId);

        return res.status(200).json({
            success: true,
            message: "Document successfully released."
        });

    } catch (error) {
        console.error("Release request error:", error);

        if (error.message === "REQUEST_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Request not found."
            });
        }

        if (error.message === "INVALID_REQUEST_STATUS") {
            return res.status(409).json({
                success: false,
                message: "Only approved requests can be released."
            });
        }

        if (error.message === "VERIFICATION_INCOMPLETE") {
            return res.status(409).json({
                success: false,
                message: "Complete all verification checklist items before releasing the document."
            });
        }

        if (error.message === "STAFF_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Staff account not found."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to release document."
        });
    }
}

async function getRecentReleaseLog(req, res) {
    try {
        const releases = await requestModel.getRecentReleaseLog();

        return res.status(200).json({
            success: true,
            releases
        });

    } catch (error) {
        console.error("Get recent release log error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve recent release log."
        });
    }
}


module.exports = {
    getRequestSummary,
    getRecentRequests,
    getResidentRequests,
    getResidentRequestDetails,
    submitDocumentRequest,
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
    verifyRequirement,
    previewUploadedRequirement,
    getDocumentReleaseRequests,
    getDocumentReleaseDetails,
    updateReleaseVerification,
    releaseRequest,
    getRecentReleaseLog
};