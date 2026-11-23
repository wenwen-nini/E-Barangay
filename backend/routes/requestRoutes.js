const express = require("express");
const router = express.Router();

const requestController = require("../controllers/requestController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const uploadRequirementsFiles = require("../middleware/requirementUploadMiddleware");

// Resident Overview
router.get(
    "/summary",
    requireAuth,
    requireRole("Resident"),
    requestController.getRequestSummary
);

router.get(
    "/recent",
    requireAuth,
    requireRole("Resident"),
    requestController.getRecentRequests
);

router.get(
    "/my-requests",
    requireAuth,
    requireRole("Resident"),
    requestController.getResidentRequests
);

router.post(
    "/",
    requireAuth,
    requireRole("Resident"),
    uploadRequirementsFiles.array("requirements", 10),
    requestController.submitDocumentRequest
);

router.put(
    "/:id/requirements",
    requireAuth,
    requireRole("Resident"),
    uploadRequirementsFiles.array("requirements", 10),
    requestController.reuploadRequestRequirements
);

router.get(
    "/:documentId/requirements",
    requireAuth,
    requireRole("Resident"),
    requestController.getDocumentRequirements
);

router.get(
    "/:id",
    requireAuth,
    requireRole("Resident"),
    requestController.getResidentRequestDetails
);

router.get(
    "/:id/history",
    requireAuth,
    requireRole("Resident"),
    requestController.getRequestStatusHistory
);

module.exports = router;