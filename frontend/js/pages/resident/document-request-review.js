import { getDocumentsWithRequirements } from "../../services/getService.js";
import { getCurrentUser } from "../../core/session.js";
import { residents } from "../../mock-data/resident.js";

const requirementsList = document.getElementById("requirements-list");
const requirementsIntro = document.getElementById("requirements-intro");
const requirementsError = document.getElementById("requirements-error");
const attachmentCount = document.getElementById("attachment-count");
const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];
const maxFileSize = 5 * 1024 * 1024;
let requirements = [];

function getResident() {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== "Resident" || !currentUser.resident_id) {
        throw new Error("Please log in using a resident account.");
    }

    const resident = residents.find(
        item => String(item.resident_id) === String(currentUser.resident_id)
    );
    if (!resident) {
        throw new Error("Resident information could not be found.");
    }

    return resident;
}

function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
}

function getRequestDraft() {
    const draftText = sessionStorage.getItem("requestDraft");
    if (!draftText) {
        throw new Error("Request details were not found. Return to page 1 and try again.");
    }

    const draft = JSON.parse(draftText);
    const urlDocumentId = new URLSearchParams(window.location.search).get("document_id");
    if (
        !draft
        || !draft.document_id
        || String(draft.document_id) !== String(urlDocumentId)
        || !Number.isInteger(Number(draft.number_of_copies))
        || Number(draft.number_of_copies) < 1
        || Number(draft.number_of_copies) > 5
    ) {
        throw new Error("The saved request details are invalid. Return to page 1 and try again.");
    }

    return draft;
}

function renderRequestSummary(draft, selectedDocument, resident) {
    const residentName = [
        resident.first_name,
        resident.middle_name ? `${resident.middle_name.charAt(0)}.` : "",
        resident.last_name,
        resident.name_extension
    ].filter(Boolean).join(" ");

    document.getElementById("summary-document").textContent =
        selectedDocument.document_name;
    document.getElementById("summary-purpose").textContent =
        draft.purpose || "Not provided";
    document.getElementById("summary-copies").textContent =
        String(draft.number_of_copies);
    document.getElementById("summary-resident-name").textContent = residentName;
    document.getElementById("summary-resident-address").textContent =
        resident.complete_address || "No address available.";
    document.getElementById("summary-resident-contact").textContent =
        resident.contact_number || "No contact number available.";
}

function renderRequirement(requirement, index) {
    const card = document.createElement("article");
    card.className = "requirement-card";

    const heading = document.createElement("div");
    heading.className = "requirement-card-heading";
    heading.appendChild(
        createTextElement("span", "requirement-number", String(index + 1))
    );

    const title = document.createElement("h3");
    title.textContent = requirement.requirement_name;
    heading.appendChild(title);
    heading.appendChild(
        createTextElement(
            "span",
            "requirement-status",
            requirement.is_mandatory ? "Required" : "Optional"
        )
    );

    const inputId = `requirement-${requirement.requirement_id}`;
    const input = document.createElement("input");
    input.id = inputId;
    input.name = inputId;
    input.type = "file";
    input.accept = ".jpg,.jpeg,.png,.pdf";
    input.required = requirement.is_mandatory === true;
    input.setAttribute("aria-label", `Upload ${requirement.requirement_name}`);
    input.addEventListener("change", () => validateSelectedFile(input));

    const fileHint = createTextElement(
        "p",
        "file-hint",
        "JPG, PNG or PDF · Up to 5 MB per file"
    );

    card.append(heading);
    if (requirement.description) {
        card.appendChild(
            createTextElement("p", "requirement-detail", requirement.description)
        );
    }
    card.append(input, fileHint);
    return card;
}

function validateSelectedFile(input) {
    const file = input.files && input.files[0];
    requirementsError.hidden = true;
    requirementsError.textContent = "";

    if (file) {
        const fileExtension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
            input.value = "";
            showFileError("Choose a JPG, PNG, or PDF file.");
        } else if (file.size > maxFileSize) {
            input.value = "";
            showFileError("Each requirement file must be 5 MB or smaller.");
        }
    }

    updateAttachmentCount();
}

function showFileError(message) {
    requirementsError.textContent = message;
    requirementsError.hidden = false;
}

function updateAttachmentCount() {
    const attachedCount = [...requirementsList.querySelectorAll(
        'input[type="file"]'
    )].filter(input => input.files && input.files.length > 0).length;
    attachmentCount.textContent =
        `${attachedCount} of ${requirements.length} attached`;
}

function showPageError(error) {
    console.error("Error initializing request review:", error);
    requirementsIntro.textContent =
        error.message || "Unable to load request details.";
    requirementsList.replaceChildren();
    attachmentCount.textContent = "0 attached";
    document.querySelector(".upload-guidance").hidden = true;
    document.getElementById("summary-document").textContent = "Unavailable";
    document.getElementById("summary-purpose").textContent = "Not available";
    document.getElementById("summary-copies").textContent = "—";
    document.getElementById("summary-resident-name").textContent = "Not available";
    document.getElementById("summary-resident-address").textContent = "";
    document.getElementById("summary-resident-contact").textContent = "";
    document.getElementById("submission-notice").textContent =
        "Return to page 1 to correct or restart your request.";
}

async function initializeReviewPage() {
    try {
        const draft = getRequestDraft();
        const resident = getResident();
        const documents = await getDocumentsWithRequirements();
        const selectedDocument = documents.find(
            item => String(item.document_id) === String(draft.document_id)
        );

        if (!selectedDocument || selectedDocument.availability !== "Available") {
            throw new Error("The selected document is unavailable. Return to the catalog and choose another.");
        }

        requirements = Array.isArray(selectedDocument.requirements)
            ? selectedDocument.requirements
            : [];
        requirementsIntro.textContent =
            `These requirements correspond to ${selectedDocument.document_name}, the document you selected on page 1.`;
        renderRequestSummary(draft, selectedDocument, resident);

        if (requirements.length === 0) {
            requirementsList.appendChild(
                createTextElement(
                    "p",
                    "no-requirements",
                    "There are no file requirements for this document."
                )
            );
        } else {
            requirements.forEach((requirement, index) => {
                requirementsList.appendChild(renderRequirement(requirement, index));
            });
        }

        updateAttachmentCount();
    } catch (error) {
        showPageError(error);
    }
}

function returnToRequestDetails() {
    const documentId = new URLSearchParams(window.location.search).get("document_id");
    const destination = documentId
        ? `document_request.html?document_id=${encodeURIComponent(documentId)}`
        : "document_request.html";
    window.location.href = destination;
}

document.getElementById("back-to-details").addEventListener(
    "click",
    returnToRequestDetails
);
document.getElementById("back-button").addEventListener(
    "click",
    returnToRequestDetails
);

initializeReviewPage();
