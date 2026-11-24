const express = require("express");
const router = express.Router();

const documentController = require("../controllers/documentController.js");
const uploadDocumentPreview = require("../middleware/uploadMiddleware");

const {
    requireAuth,
    requireRole
} = require("../middleware/authMiddleware.js");

// Add document route
router.post(
    "/",
    requireAuth,
    requireRole("Staff"),
    uploadDocumentPreview.single("document_preview"),
    documentController.addDocument
);

// Add requirement route
router.post(
    "/:id/requirements",
    requireAuth,
    requireRole("Staff"),
    documentController.addRequirement
);

// Update document route
router.put(
    "/:id",
    requireAuth,
    requireRole("Staff"),
    uploadDocumentPreview.single("document_preview"),
    documentController.updateDocument
);

// Update requirement route
router.put(
    "/:id/requirements/:requirementId",
    requireAuth,
    requireRole("Staff"),
    documentController.updateRequirement
);

// Delete requirement
router.delete(
    "/:id/requirements/:requirementId",
    requireAuth,
    requireRole("Staff"),
    documentController.deleteRequirement
);

// Delete a document
router.delete(
    "/:id",
    requireAuth,
    requireRole("Staff"),
    documentController.deleteDocument
);

// Get all documents route
router.get(
    "/",
    requireAuth,
    documentController.getAllDocuments
);

// Get all available documents route
router.get(
    "/available",
    requireAuth,
    documentController.getAvailableDocuments
);

// Retrieve Document details and requirements
router.get(
    "/:id",
    requireAuth,
    documentController.getDocumentDetails
);

module.exports = router;