const express = require("express");
const router = express.Router();

const requestController = require("../controllers/requestController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const uploadRequirementsFiles = require("../middleware/requirementUploadMiddleware");

// Resident Summary Status Cards
router.get(
    "/summary",
    requireAuth,
    requireRole("Resident"),
    requestController.getRequestSummary
);

// Retrieve recent request in overview of Resident Portal
router.get(
    "/recent",
    requireAuth,
    requireRole("Resident"),
    requestController.getRecentRequests
);

// Retrieve certain resident's requests
router.get(
    "/my-requests",
    requireAuth,
    requireRole("Resident"),
    requestController.getResidentRequests
);

// Upload requirement files
router.post(
    "/",
    requireAuth,
    requireRole("Resident"),
    uploadRequirementsFiles.array("requirements", 10),
    requestController.submitDocumentRequest
);

// Retrieve all requests
router.get(
    "/staff/all",
    requireAuth,
    requireRole("Staff"),
    requestController.getAllRequestsForStaff
);

// Retrieve the summary of all request
router.get(
    "/staff/summary",
    requireAuth,
    requireRole("Staff"),
    requestController.getStaffRequestSummary
);

// Retrieve the first 10 approved or released requests.
router.get(
    "/staff/document-release",
    requireAuth,
    requireRole("Staff"),
    requestController.getDocumentReleaseRequests
);

// Retrieve the recent 5 release logs
router.get(
    "/staff/document-release/recent-log",
    requireAuth,
    requireRole("Staff"),
    requestController.getRecentReleaseLog
);


// Viewing the uploaded requirements for preview route
router.get(
    "/staff/:requestId/requirements/:uploadedRequirementId/preview",
    requireAuth,
    requireRole("Staff"),
    requestController.previewUploadedRequirement
);

// Selects a certain approved request
router.get(
    "/staff/document-release/:id",
    requireAuth,
    requireRole("Staff"),
    requestController.getDocumentReleaseDetails
);

// Saves checklist in identity verification
router.patch(
    "/staff/document-release/:id/verification",
    requireAuth,
    requireRole("Staff"),
    requestController.updateReleaseVerification
);

// Updates request status into release
router.patch(
    "/staff/document-release/:id/release",
    requireAuth,
    requireRole("Staff"),
    requestController.releaseRequest
);

// Retrieve the request details
router.get(
    "/staff/:id",
    requireAuth,
    requireRole("Staff"),
    requestController.getStaffRequestDetails
);

// Verifies Requirements
router.patch(
    "/staff/:requestId/requirements/:uploadedRequirementId/verify",
    requireAuth,
    requireRole("Staff"),
    requestController.verifyRequirement
);

// Assign a staff on particular request
router.put(
    "/staff/:id/assign",
    requireAuth,
    requireRole("Staff"),
    requestController.assignRequestToStaff
);

// Mark a request as Under Review
router.put(
    "/staff/:id/under-review",
    requireAuth,
    requireRole("Staff"),
    requestController.markRequestUnderReview
);

// Approve a request
router.put(
    "/staff/:id/approve",
    requireAuth,
    requireRole("Staff"),
    requestController.approveRequest
);

// Reject a request
router.put(
    "/staff/:id/reject",
    requireAuth,
    requireRole("Staff"),
    requestController.rejectRequest
);

// Return a request for correction
router.put(
    "/staff/:id/return",
    requireAuth,
    requireRole("Staff"),
    requestController.returnRequest
);

// Upload for missing requirements
router.put(
    "/:id/requirements",
    requireAuth,
    requireRole("Resident"),
    uploadRequirementsFiles.array("requirements", 10),
    requestController.reuploadRequestRequirements
);

// Retrieve document requirements
router.get(
    "/:documentId/requirements",
    requireAuth,
    requireRole("Resident"),
    requestController.getDocumentRequirements
);

// Submit a follow-up
router.post(
    "/:id/follow-up",
    requireAuth,
    requireRole("Resident"),
    requestController.submitRequestFollowUp
);

// Cancel a request
router.put(
    "/:id/cancel",
    requireAuth,
    requireRole("Resident"),
    requestController.cancelResidentRequest
);

// Retrieve request more details
router.get(
    "/:id",
    requireAuth,
    requireRole("Resident"),
    requestController.getResidentRequestDetails
);

// Retrieve the status history of a request
router.get(
    "/:id/history",
    requireAuth,
    requireRole("Resident"),
    requestController.getRequestStatusHistory
);

module.exports = router;