const pool = require("../config/database.js");
const fs = require("fs");
const path = require("path");

const documentModel = require("../models/documentModel.js");
const requirementModel = require("../models/requirementModel.js");

// Retrieve All documents
async function getAllDocuments(req, res) {
    try {
        const documents = await documentModel.getAllDocuments(pool);
        const documentsWithRequirements = await Promise.all(
            documents.map(async document => ({
                ...document,
                requirements: await requirementModel.getRequirementsByDocumentId(
                    pool,
                    document.document_id
                )
            }))
        );

        res.status(200).json({
            success: true,
            documents: documentsWithRequirements
        });
    } catch (error) {
        console.error("Get documents error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve documents"
        });
    }
}

async function getAvailableDocuments(req, res) {
    try {
        const [documents] = await pool.query(
            `SELECT
                document_id,
                document_name,
                description,
                fee_per_copy,
                availability,
                document_preview_path
            FROM Document
            WHERE availability = 'Available'
            ORDER BY document_name ASC`,
        );

        res.status(200).json({
            success: true,
            documents
        });
    } catch (error) {
        console.error("Get available documents error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve available documents"
        });
    }
}

// Retrieve documents details and associated requirements
async function getDocumentDetails(req, res) {
    try {
        const documentId = Number(req.params.id);

        if (!Number.isInteger(documentId) || documentId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID"
            });
        }

        const document = await documentModel.getDocumentById(
            pool,
            documentId
        );

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found."
            });
        }

        const requirements =
            await requirementModel.getRequirementsByDocumentId(
                pool,
                documentId
            );

        res.status(200).json({
            success: true,
            document,
            requirements
        });
    } catch (error) {
        console.error("Get document details error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve document details"
        });
    }
}

function validateRequirementData(data) {
    const {
        requirement_name,
        description,
        is_mandatory
    } = data || {};

    if (
        typeof requirement_name !== "string" ||
        !requirement_name.trim()
    ) {
        return "Requirement name is required.";
    }

    if (requirement_name.trim().length > 150) {
        return "Requirement name cannot exceed 150 characters.";
    }

    if (
        description !== undefined &&
        description !== null &&
        typeof description !== "string"
    ) {
        return "Requirement description must be valid text.";
    }

    if (
        typeof is_mandatory !== "boolean" &&
        ![0, 1].includes(is_mandatory)
    ) {
        return "Invalid requirement type.";
    }

    return null;
}

// Add a requirement to a document
async function addRequirement(req, res) {
    try {
        const documentId = Number(req.params.id);
        const { requirement_name, description, is_mandatory } = req.body || {};

        const validationError = validateRequirementData(req.body);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        if (!Number.isInteger(documentId) || documentId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID."
            });
        }

        if (typeof requirement_name !== "string" || !requirement_name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Requirement name is required."
            });
        }

        if (is_mandatory !== 0 && is_mandatory !== 1 &&
            is_mandatory !== true && is_mandatory !== false) {
            return res.status(400).json({
                success: false,
                message: "Invalid mandatory setting."
            });
        }

        const document = await documentModel.getDocumentById(pool, documentId);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found."
            });
        }

        const requirementId = await requirementModel.addRequirement(
            pool,
            documentId,
            {
                requirement_name: requirement_name.trim(),
                description: description?.trim() || null,
                is_mandatory: Number(is_mandatory)
            }
        );

        return res.status(201).json({
            success: true,
            message: "Requirement added successfully.",
            requirement_id: requirementId
        });

    } catch (error) {
        console.error("Add requirement error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add requirement."
        });
    }
}


// Update an existing requirement
async function updateRequirement(req, res) {
    try {
        const documentId = Number(req.params.id);
        const requirementId = Number(req.params.requirementId);
        const { requirement_name, description, is_mandatory } = req.body || {};

        const validationError = validateRequirementData(req.body);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        if (
            !Number.isInteger(documentId) || documentId <= 0 ||
            !Number.isInteger(requirementId) || requirementId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid document or requirement ID."
            });
        }

        if (typeof requirement_name !== "string" || !requirement_name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Requirement name is required."
            });
        }

        if (is_mandatory !== 0 && is_mandatory !== 1 &&
            is_mandatory !== true && is_mandatory !== false) {
            return res.status(400).json({
                success: false,
                message: "Invalid mandatory setting."
            });
        }

        const affectedRows = await requirementModel.updateRequirement(
            pool,
            documentId,
            requirementId,
            {
                requirement_name: requirement_name.trim(),
                description: description?.trim() || null,
                is_mandatory: Number(is_mandatory)
            }
        );

        if (!affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Requirement not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Requirement updated successfully."
        });

    } catch (error) {
        console.error("Update requirement error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update requirement."
        });
    }
}


// Delete a requirement
async function deleteRequirement(req, res) {
    try {
        const documentId = Number(req.params.id);
        const requirementId = Number(req.params.requirementId);

        if (
            !Number.isInteger(documentId) || documentId <= 0 ||
            !Number.isInteger(requirementId) || requirementId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid document or requirement ID."
            });
        }

        const affectedRows = await requirementModel.deleteRequirement(
            pool,
            documentId,
            requirementId
        );

        if (!affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Requirement not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Requirement deleted successfully."
        });

    } catch (error) {
        console.error("Delete requirement error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete requirement."
        });
    }
}

// Add documents
async function addDocument(req, res) {
    const connection = await pool.getConnection();
    let documentSaved = false;

    try {
        const {
            document_name,
            description,
            fee_per_copy,
            availability
        } = req.body;

        let requirements = [];

        try {
            requirements = JSON.parse(req.body.requirements || "[]");

            if (!Array.isArray(requirements)) {
                return res.status(400).json({
                    success: false,
                    message: "Requirements must be provided as a list"
                });
            }
        } catch {
            return res.status(400).json({
                success: false,
                message: "Invalid requirements data."
            });
        }

        if (
            !document_name ||
            fee_per_copy === undefined ||
            !availability
        ) {
            return res.status(400).json({
                success: false,
                message: "Document name, fee, and availability are required."
            });
        }

        const feeText = String(fee_per_copy ?? "").trim();
        const fee = Number(feeText);

        if (
            feeText === "" ||
            !/^\d+(\.\d{1,2})?$/.test(feeText) ||
            !Number.isFinite(fee) ||
            fee < 0 ||
            fee > 99999999.99
        ) {
            return res.status(400).json({
                success: false,
                message: "Document fee must be a non-negative number with up to two decimal places."
            });
        }
        
        if (
            typeof document_name !== "string" ||
            !document_name.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Document name is required."
            });
        }

        if (document_name.trim().length > 150) {
            return res.status(400).json({
                success: false,
                message: "Document name cannot exceed 150 characters."
            });
        }

        if (
            description !== undefined &&
            description !== null &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Document description must be valid text"
            });
        }

        if (!["Available", "Unavailable"].includes(availability)) {
            return res.status(400).json({
                success: false,
                message: "Invalid document availability"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "A document preview image is required."
            });
        }

        for (const requirement of requirements) {
            if (
                typeof requirement.requirement_name !== "string" ||
                !requirement.requirement_name.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Every requirement must have a valid name"
                });
            }

            if (requirement.requirement_name.trim().length > 150) {
                return res.status(400).json({
                    success: false,
                    message: "Requirement names cannot be exceeded 150 characters"
                });
            }
            
            if (
                requirement.description !== undefined &&
                requirement.description !== null &&
                typeof requirement.description !== "string"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Requirement descriptions must be valid text"
                });
            }

            if (
                !requirement ||
                typeof requirement !== "object" ||
                Array.isArray(requirement)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Each requirement must contain valid requirement data"
                });
            }

            if (
                typeof requirement.is_mandatory !== "boolean" && ![0, 1].includes(requirement.is_mandatory)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid requirement type"
                });
            }
        }

        await connection.beginTransaction();

        const documentId = await documentModel.addDocument(connection, {
            document_name: document_name.trim(),
            description: description?.trim() || null,
            fee_per_copy: fee,
            availability,
            document_preview_path: `/uploads/document-previews/${req.file.filename}`
        });

        for (const requirement of requirements) {
            await requirementModel.addRequirement(
                connection,
                documentId,
                {
                    requirement_name: requirement.requirement_name.trim(),
                    description: requirement.description?.trim() || null,
                    is_mandatory: requirement.is_mandatory
                }
            );
        }

        await connection.commit();

        documentSaved = true;

        return res.status(201).json({
            success: true,
            message: "Document and requirements added successfully",
            document_id: documentId
        });
    } catch (error) {
        console.error("Add document error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "A document with this name already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to add documents"
        });
    } finally {
        if (!documentSaved && req.file) {
            deleteDocumentPreview(
                `/uploads/document-preview/${req.file.filename}`
            );
        }

        connection.release();
    }
}

// Update document
async function updateDocument(req, res) {
    let documentUpdated = false;

    try {
        const documentId = Number(req.params.id);

        const {
            document_name,
            description,
            fee_per_copy,
            availability
        } = req.body;

        if (!Number.isInteger(documentId) || documentId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID"
            });
        }

        if (
            typeof document_name !== "string" ||
            !document_name.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Document name is required."
            });
        }

        if (document_name.trim().length > 150) {
            return res.status(400).json({
                success: false,
                message: "Document name cannot exceed 150 characters."
            });
        }

        if (
            description !== undefined &&
            description !== null &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Document description must be valid text"
            });
        }

        const feeText = String(fee_per_copy ?? "").trim();
        const fee = Number(feeText);

        if (
            feeText === "" ||
            !/^\d+(\.\d{1,2})?$/.test(feeText) ||
            !Number.isFinite(fee) ||
            fee < 0 ||
            fee > 99999999.99
        ) {
            return res.status(400).json({
                success: false,
                message: "Document fee must be a non-negative number with up to two decimal places."
            });
        }

        if (!["Available", "Unavailable"].includes(availability)) {
            return res.status(400).json({
                success: false,
                message: "Invalid document availability"
            });
        }

        const existingDocument = await documentModel.getDocumentById(
            pool,
            documentId
        );

        if (!existingDocument) {
            return res.status(404).json({
                success: false,
                message: "Document not found."
            });
        }

        const documentPreviewPath = req.file
            ? `/uploads/document-previews/${req.file.filename}`
            : existingDocument.document_preview_path;

        await documentModel.updateDocument(pool, documentId, {
            document_name: document_name.trim(),
            description: description?.trim() || null,
            fee_per_copy: fee,
            availability,
            document_preview_path: documentPreviewPath
        });

        documentUpdated = true;

        if (req.file && existingDocument.document_preview_path) {
            deleteDocumentPreview(existingDocument.document_preview_path);
        }

        return res.status(200).json({
            success: true,
            message: "Document updated successfully."
        })
    } catch (error) {
        console.error("Update document error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "A document with this name is already exists."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update document"
        });
    } finally {
        if (!documentUpdated && req.file) {
            deleteDocumentPreview(
                `/uploads/document-previews/${req.file.filename}`
            );
        }
    }
}


async function deleteDocument(req, res) {
    try {
        const documentId = Number(req.params.id);

        if (!Number.isInteger(documentId) || documentId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID"
            });
        }

        const existingDocument = await documentModel.getDocumentById(
            pool,
            documentId
        );

        if (!existingDocument) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        const hasRequests = await documentModel.hasDocumentRequests(
            pool,
            documentId
        );

        if (hasRequests) {
            return res.status(409).json({
                success: false,
                message: "This document cannot be deleted because it has existing requests. Set its availability to Unavailable instead."
            });
        }

        const deletedRows = await documentModel.deleteDocument(documentId);

        if (deletedRows > 0) {
            deleteDocumentPreview(existingDocument.document_preview_path);
        }

        return res.status(200).json({
            success: true,
            message: "Document deleted successfully"
        });
    } catch (error) {
        console.error("Documend delete error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete document"
        });
    }
}

function deleteDocumentPreview(imagePath) {
    if (!imagePath) return;

    const filePath = path.join(
        __dirname,
        "../uploads",
        imagePath.replace(/^\/uploads\//, "")
    );

    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, error => {
            if (error) {
                console.error("Unable to delete old document preview:", error);
            }
        });
    }
}

module.exports = {
    getAllDocuments,
    getAvailableDocuments,
    getDocumentDetails,
    addDocument,
    updateDocument,
    addRequirement,
    updateRequirement,
    deleteRequirement,
    deleteDocument
};