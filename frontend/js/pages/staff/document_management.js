import {
    getDocuments,
    addDocument,
    getDocumentDetails,
    updateDocument,
    addRequirement,
    updateRequirement,
    deleteRequirement,
    deleteDocument
} from "../../services/documentServices.js";
import { formatId } from "../../utils/idFormatter.js";
import { showNotice } from "../../utils/notice.js";
import { API_BASE_URL } from "../../config/apiConfig.js";

const defaultDocumentPreviewPath = new URL(
    "../../../assets/images/default.png",
    import.meta.url
).href;

let documents = [];
let documentsLoadError = false;

try {
    documents = await getDocuments();
} catch (error) {
    console.error("Error loading documents:", error);
    documentsLoadError = true;
}
let editingDocumentId = null;
let deletingDocumentId = null;
let selectedPreviewData = null;
let currentPage = 1;
let searchQuery = "";
let statusFilter = "All";

const tableBody = document.querySelector("#table-body");
const searchInput = document.querySelector("#search-input");
const documentSelect = document.querySelector("#document");
const statusSelect = document.querySelector("#status-filter");
const resetButton = document.querySelector("#reset-filter");
const showEntries = document.querySelector("#show-entries");
const previousButton = document.querySelector("#previous-btn");
const currentPageButton = document.querySelector("#current-page");
const nextButton = document.querySelector("#next-btn");
const totalDocsEl = document.querySelector("#total-docs");
const totalAvailableEl = document.querySelector("#total-available");
const totalUnavailableEl = document.querySelector("#total-unavailable");
const addDocumentButton = document.querySelector(".add-document-btn");
const pageSize = 6;

const editorModal = document.querySelector("#document-editor-modal");
const documentForm = document.querySelector("#document-form");
const formTitle = document.querySelector("#document-form-title");
const formDescription = document.querySelector("#document-form-description");
const nameInput = document.querySelector("#document-name-input");
const descriptionInput = document.querySelector("#document-description-input");
const feeInput = document.querySelector("#document-fee-input");
const availabilityInput = document.querySelector("#document-availability-input");
const requirementsInputs = document.querySelector("#document-requirements-inputs");
const addRequirementButton = document.querySelector("#add-requirement-btn");
const previewInput = document.querySelector("#document-preview-input");
const previewImage = document.querySelector("#document-preview-image");
const previewUploadLabel = document.querySelector("#preview-upload-label");
const previewError = document.querySelector("#preview-error");
const saveDocumentButton = document.querySelector("#save-document-btn");

const deleteModal = document.querySelector("#delete-document-modal");
const deletePreviewImage = document.querySelector("#delete-preview-image");
const deleteDocumentName = document.querySelector("#delete-document-name");
const deleteDocumentFee = document.querySelector("#delete-document-fee");
const deleteDocumentAvailability = document.querySelector("#delete-document-availability");
const deleteError = document.querySelector("#delete-error");
const confirmDeleteButton = document.querySelector("#confirm-delete-document");

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function getBackendImageUrl(path) {
    if (!path) return defaultDocumentPreviewPath;

    return `${new URL(API_BASE_URL).origin}${path}`;
}

function getPreviewUrl(path) {
    if (typeof path !== "string" || !path) return defaultDocumentPreviewPath;
    if (/^(data:image\/|https?:\/\/|blob:|file:\/\/)/i.test(path)) return path;
    return new URL(`../../../${path.replace(/^\/+/, "")}`, import.meta.url).href;
}

function setPreviewImage(image, path) {
    if (!path) {
        image.src = defaultDocumentPreviewPath;
        return;
    }

    image.onerror = () => {
        image.onerror = null;
        image.src = defaultDocumentPreviewPath;
    };

    image.src = path.startsWith("/uploads")
        ? getBackendImageUrl(path)
        : getPreviewUrl(path);
}

function updateMetrics() {
    totalDocsEl.textContent = documents.length;
    totalAvailableEl.textContent = documents.filter(doc => doc.availability === "Available").length;
    totalUnavailableEl.textContent = documents.filter(doc => doc.availability === "Unavailable").length;
}

function populateDocumentFilter() {
    const selectedDocument = documentSelect.value;
    const documentNames = [...new Set(documents.map(doc => doc.document_name))]
        .sort((first, second) => first.localeCompare(second));

    documentSelect.replaceChildren(new Option("All document types", ""));
    documentNames.forEach(name => {
        documentSelect.add(new Option(name, name));
    });

    if (documentNames.includes(selectedDocument)) {
        documentSelect.value = selectedDocument;
    }
}

function renderTable() {

    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.document_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDocument = !documentSelect.value || doc.document_name === documentSelect.value;
        const matchesAvailability = statusFilter === "All" || doc.availability === statusFilter;
        return matchesSearch && matchesDocument && matchesAvailability;
    });

    const totalEntries = filteredDocs.length;
    const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalEntries);
    const pageDocs = filteredDocs.slice(startIndex, endIndex);
    const htmlRows = pageDocs.map(doc => {
        const requirements = (doc.requirements ?? [])
            .map(requirement => requirement.requirement_name)
            .filter(Boolean)
            .join(", ") || "None listed";
        const fee = Number(doc.fee_per_copy) === 0
            ? "Free"
            : escapeHtml(Number(doc.fee_per_copy).toFixed(2));
        const availability = escapeHtml(doc.availability);

        return `
            <tr>
                <td>
                    <img
                        src="${escapeHtml(
                            doc.document_preview_path
                                ? getBackendImageUrl(doc.document_preview_path)
                                : defaultDocumentPreviewPath
                        )}"
                        alt="Document sample"
                        onerror="this.onerror=null; this.src='${defaultDocumentPreviewPath}'"
                    >
                </td>
                <td style="font-weight: bold; color: var(--primary-color);">${escapeHtml(doc.document_name)}</td>
                <td>${fee}</td>
                <td>${escapeHtml(requirements)}</td>
                <td>
                    <span class="badge badge-${availability.toLowerCase()}">${availability}</span>
                </td>
                <td>
                    <div class="action-btns">
                        <button type="button" class="edit-btn" data-action="edit" data-document-id="${escapeHtml(doc.document_id)}">Edit</button>
                        <button type="button" class="delete-btn" data-action="delete" data-document-id="${escapeHtml(doc.document_id)}">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    const emptyMessage = documentsLoadError
        ? "Unable to load documents. Refresh the page to try again."
        : documents.length === 0
            ? "No documents have been added yet."
            : "No documents match your filter.";
    tableBody.innerHTML = htmlRows || `<tr><td colspan="6" style="text-align: center; color: var(--primary-color);">${emptyMessage}</td></tr>`;
    showEntries.textContent = `Showing ${totalEntries ? startIndex + 1 : 0}-${endIndex} of ${totalEntries} entries`;
    previousButton.disabled = currentPage === 1;
    currentPageButton.textContent = currentPage;
    currentPageButton.disabled = true;
    currentPageButton.setAttribute("aria-current", "page");
    nextButton.disabled = currentPage >= totalPages;
    updateMetrics();
}

function renderRequirementInputs(requirements) {
    const entries = requirements.length ? requirements : [{}];
    requirementsInputs.replaceChildren();

    entries.forEach((requirement, index) => {
        const row = document.createElement("div");
        row.className = "requirement-input-row";
        row.dataset.requirementId = requirement.requirement_id ?? "";

        const titleLabel = document.createElement("label");
        titleLabel.className = "requirement-field";
        titleLabel.innerHTML = "<span>Title <b>*</b></span>";
        const titleInput = document.createElement("input");
        titleInput.type = "text";
        titleInput.maxLength = 150;
        titleInput.required = true;
        titleInput.value = requirement.requirement_name ?? "";
        titleInput.placeholder = "Enter requirement title";
        titleInput.setAttribute("aria-label", `Requirement ${index + 1} title`);
        titleLabel.append(titleInput);

        const descriptionLabel = document.createElement("label");
        descriptionLabel.className = "requirement-field";
        descriptionLabel.innerHTML = "<span>Description</span>";
        const descriptionInput = document.createElement("textarea");
        descriptionInput.rows = 2;
        descriptionInput.maxLength = 500;
        descriptionInput.value = requirement.description ?? "";
        descriptionInput.placeholder = "Explain what the resident must provide";
        descriptionInput.setAttribute("aria-label", `Requirement ${index + 1} description`);
        descriptionLabel.append(descriptionInput);

        const typeLabel = document.createElement("label");
        typeLabel.className = "requirement-field requirement-type-field";
        typeLabel.innerHTML = "<span>Type <b>*</b></span>";
        const typeSelect = document.createElement("select");
        typeSelect.required = true;
        typeSelect.setAttribute("aria-label", `Requirement ${index + 1} type`);
        typeSelect.add(new Option("Mandatory", "mandatory"));
        typeSelect.add(new Option("Optional", "optional"));
        typeSelect.value = requirement.is_mandatory === false ? "optional" : "mandatory";
        typeLabel.append(typeSelect);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-requirement-btn";
        removeButton.textContent = "×";
        removeButton.setAttribute("aria-label", `Remove requirement ${index + 1}`);
        removeButton.addEventListener("click", () => {
            row.remove();
            updateRequirementRemoveButtons();
        });

        row.append(titleLabel, descriptionLabel, typeLabel, removeButton);
        requirementsInputs.append(row);
    });
}

function updateRequirementRemoveButtons() {
    const rows = [...requirementsInputs.querySelectorAll(".requirement-input-row")];
    rows.forEach((row, index) => {
        const removeButton = row.querySelector(".remove-requirement-btn");
        removeButton.setAttribute("aria-label", `Remove requirement ${index + 1}`);
        row.querySelector("input").setAttribute("aria-label", `Requirement ${index + 1} title`);
        row.querySelector("textarea").setAttribute("aria-label", `Requirement ${index + 1} description`);
        row.querySelector("select").setAttribute("aria-label", `Requirement ${index + 1} type`);
    });
}

function openEditor(doc = null) {
    editingDocumentId = doc?.document_id ?? null;
    selectedPreviewData = null;
    documentForm.reset();
    previewInput.value = "";
    previewError.textContent = "";

    const isEditing = Boolean(doc);
    formTitle.textContent = isEditing ? `Edit ${doc.document_name}` : "Add document";
    formDescription.textContent = isEditing
        ? "Update catalog details, requirements, availability and preview."
        : "Create a catalog entry with separate requirements and a document image.";
    nameInput.value = doc?.document_name ?? "";
    descriptionInput.value = doc?.description ?? "";
    feeInput.value = Number(doc?.fee_per_copy ?? 0).toFixed(2);
    availabilityInput.value = doc?.availability === "Available" ? "Available" : "Unavailable";
    setPreviewImage(previewImage, doc?.document_preview_path);
    previewImage.alt = doc ? `${doc.document_name} preview` : "Document preview";
    previewInput.required = !isEditing;
    previewUploadLabel.textContent = isEditing ? "Replace preview image" : "Upload preview image";
    saveDocumentButton.textContent = isEditing ? "Save Changes" : "Save Document";
    renderRequirementInputs(doc?.requirements ?? []);
    editorModal.showModal();
}

function closeEditor() {
    if (editorModal.open) editorModal.close();
}

function openDeleteConfirmation(doc) {
    deletingDocumentId = doc.document_id;
    deleteError.textContent = "";
    deleteDocumentName.textContent = doc.document_name;
    deleteDocumentFee.textContent = `${formatId(doc.document_id, "DOC")} · Sample fee ₱${Number(doc.fee_per_copy ?? 0).toFixed(2)}`;
    deleteDocumentAvailability.textContent = doc.availability;
    deleteDocumentAvailability.className = `badge badge-${doc.availability.toLowerCase()}`;
    setPreviewImage(deletePreviewImage, doc.document_preview_path);
    deleteModal.showModal();
}

function readImageFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            if (typeof reader.result === "string") {
                resolve(reader.result);
            } else {
                reject(new Error("The selected image could not be read."));
            }
        });
        reader.addEventListener("error", () => {
            reject(reader.error ?? new Error("The selected image could not be read."));
        });
        reader.readAsDataURL(file);
    });
}

function getNextRequirementId() {
    const requirementIds = documents.flatMap(doc => doc.requirements ?? [])
        .map(requirement => Number(requirement.requirement_id))
        .filter(Number.isFinite);
    return Math.max(0, ...requirementIds) + 1;
}

function buildRequirements(documentId, existingRequirements) {
    return [...requirementsInputs.querySelectorAll(".requirement-input-row")]
        .map(row => {
            const requirementName = row.querySelector("input").value.trim();
            const requirementDescription = row.querySelector("textarea").value.trim();
            const isMandatory = row.querySelector("select").value === "mandatory";

            const oldId = Number(row.dataset.requirementId);

            const existing = existingRequirements.find(requirement =>
                Number(requirement.requirement_id) === oldId
            );

            if (!requirementName) return null;

            return {
                ...(existing ? { requirement_id: existing.requirement_id } : {}),
                document_id: documentId,
                requirement_name: requirementName,
                description: requirementDescription,
                is_mandatory: isMandatory
            };
        })
        .filter(Boolean);
}

async function saveDocument(event) {
    event.preventDefault();
    previewError.textContent = "";

    const previewFile = previewInput.files[0];

    if (previewFile && !selectedPreviewData) {
        previewError.textContent = "Wait for the selected image preview to finish loading.";
        return;
    }

    if (!editingDocumentId && !previewFile) {
        previewError.textContent = "Upload a JPG or PNG preview image to add this document.";
        return;
    }

    const existingDocument = documents.find(
        doc => doc.document_id === editingDocumentId
    );

    const documentId = existingDocument?.document_id
        ?? Math.max(0, ...documents.map(doc => Number(doc.document_id)).filter(Number.isFinite)) + 1;

    const documentRequirements = buildRequirements(
        documentId,
        existingDocument?.requirements ?? []
    );

    const documentData = {
        document_name: nameInput.value.trim(),
        description: descriptionInput.value.trim(),
        fee_per_copy: Number(feeInput.value),
        availability: availabilityInput.value,
        requirements: documentRequirements.map(requirement => ({
            requirement_name: requirement.requirement_name,
            description: requirement.description,
            is_mandatory: requirement.is_mandatory
        }))
    };

    if (existingDocument) {
        try {
            await updateDocument(documentId, {
                ...documentData,
                document_preview: previewFile || null
            });

            const existingRequirements = existingDocument.requirements ?? [];

            for (const requirement of documentRequirements) {
                const requirementData = {
                    requirement_name: requirement.requirement_name,
                    description: requirement.description,
                    is_mandatory: requirement.is_mandatory
                };

                if (requirement.requirement_id) {
                    await updateRequirement(
                        documentId,
                        requirement.requirement_id,
                        requirementData
                    );
                } else {
                    await addRequirement(documentId, requirementData);
                }
            }

            const currentRequirementIds = documentRequirements.filter(requirement => requirement.requirement_id).map(requirement => Number(requirement.requirement_id));

            for (const requirement of existingRequirements) {
                if (!currentRequirementIds.includes(Number(requirement.requirement_id))) {
                    await deleteRequirement(
                        documentId,
                        requirement.requirement_id
                    );
                }
            }

            const updatedDocument = await getDocumentDetails(documentId);

            documents = documents.map(doc =>
                doc.document_id === documentId
                    ? updatedDocument
                    : doc
            );

            closeEditor();
            populateDocumentFilter();
            renderTable();

        } catch (error) {
            console.error("Error updating document:", error);
            previewError.textContent = error.message;
        }

        return;
    }

    try {
        const result = await addDocument({
            ...documentData,
            document_preview: previewFile
        });

        const savedDocument = await getDocumentDetails(
            result.document_id
        );

        documents = [...documents, savedDocument];

        closeEditor();
        populateDocumentFilter();
        renderTable();

    } catch (error) {
        console.error("Error saving document:", error);
        previewError.textContent = error.message;
    }
}

async function handleDeleteDocument(documentId) {
    try {
        await deleteDocument(documentId);

        documents = documents.filter(
            doc => Number(doc.documentId) !== Number(documentId)
        );

        deleteModal.close();
        populateDocumentFilter();
        renderTable();

        deletingDocumentId = null;
        
    } catch (error) {
        console.error("Error deleting document:", error);
        showNotice(error.message || "Unable to delete document.");
    }
}

addDocumentButton.addEventListener("click", () => openEditor());

tableBody.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const documentId = Number(button.dataset.documentId);
    const action = button.dataset.action;

    if (action === "edit") {
        const document = await getDocumentDetails(documentId);
        openEditor(document);
    }
    
    if (action === "delete") {
        const document = documents.find(
            doc => Number(doc.document_id) === documentId
        );

        if (document) {
            openDeleteConfirmation(document);
        }
    }
});

document.querySelectorAll("[data-close-editor]").forEach(button => {
    button.addEventListener("click", closeEditor);
});

document.querySelectorAll("[data-close-delete]").forEach(button => {
    button.addEventListener("click", () => {
        if (deleteModal.open) deleteModal.close();
    });
});

editorModal.addEventListener("close", () => {
    editingDocumentId = null;
    selectedPreviewData = null;
    documentForm.reset();
    previewInput.required = false;
});

deleteModal.addEventListener("close", () => {
    deletingDocumentId = null;
});

addRequirementButton.addEventListener("click", () => {
    const requirements = [...requirementsInputs.querySelectorAll(".requirement-input-row")]
        .map(row => ({
            requirement_name: row.querySelector("input").value,
            requirement_id: row.dataset.requirementId,
            description: row.querySelector("textarea").value,
            is_mandatory: row.querySelector("select").value === "mandatory"
        }));
    requirements.push({});
    renderRequirementInputs(requirements);
    const newInput = requirementsInputs.lastElementChild.querySelector("input");
    newInput.focus();
});

previewInput.addEventListener("change", async () => {
    const file = previewInput.files[0];
    selectedPreviewData = null;
    previewError.textContent = "";
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
        previewError.textContent = "Choose a JPG or PNG image.";
        previewInput.value = "";
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        previewError.textContent = "The preview image must be 5 MB or smaller.";
        previewInput.value = "";
        return;
    }

    try {
        selectedPreviewData = await readImageFile(file);
        setPreviewImage(previewImage, selectedPreviewData);
    } catch (error) {
        console.error("Could not read the selected document preview.", error);
        previewError.textContent = "Unable to read this image. Please choose another file.";
        previewInput.value = "";
    }
});

documentForm.addEventListener("submit", saveDocument);

confirmDeleteButton.addEventListener("click", async () => {
    const exists = documents.some(
        doc => Number(doc.document_id) === Number(deletingDocumentId)
    );

    if (!exists) {
        deleteError.textContent =
            "This document is no longer in the catalog. Close this dialog and refresh the list."
        return;
    }

    confirmDeleteButton.disabled = true;

    try {
        await handleDeleteDocument(deletingDocumentId);
    } finally {
        confirmDeleteButton.disabled = false;
    }
});

searchInput.addEventListener("input", event => {
    searchQuery = event.target.value.trim();
    currentPage = 1;
    renderTable();
});

documentSelect.addEventListener("change", () => {
    currentPage = 1;
    renderTable();
});

statusSelect.addEventListener("change", event => {
    statusFilter = event.target.value;
    currentPage = 1;
    renderTable();
});

previousButton.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
});

nextButton.addEventListener("click", () => {
    currentPage++;
    renderTable();
});

resetButton.addEventListener("click", () => {
    searchInput.value = "";
    documentSelect.value = "";
    statusSelect.value = "All";
    searchQuery = "";
    statusFilter = "All";
    currentPage = 1;
    renderTable();
});

populateDocumentFilter();
renderTable();
window.finishPageSkeleton?.();
