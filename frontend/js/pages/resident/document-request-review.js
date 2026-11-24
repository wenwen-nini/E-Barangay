import { getCurrentUser } from "../../core/session.js";
import { getCurrentUserProfile } from "../../services/profileServices.js";
import { 
    submitDocumentRequest,
    getDocumentDetails,
    getDocumentRequirements 
} from "../../services/requestServices.js";

const requirementsList = document.getElementById("requirements-list");
const requirementsIntro = document.getElementById("requirements-intro");
const requirementsError = document.getElementById("requirements-error");
const attachmentCount = document.getElementById("attachment-count");
const submitRequestButton = document.getElementById("submit-request-btn");
const submissionNotice = document.getElementById("submission-notice");
const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];
const maxFileSize = 5 * 1024 * 1024;
let requirements = [];
let requirementsLoaded = false;

async function getResident() {
    const currentUser = getCurrentUser();

    if (!currentUser || currentUser.role !== "Resident") {
        throw new Error("Please log in using a resident account.");
    }

    const profileData = await getCurrentUserProfile();

    if (
        !profileData.success ||
        !profileData.profile ||
        profileData.profile.role !== "Resident"
    ) {
        throw new Error("Resident information could not be retrieved.");
    }

    return profileData.profile;
}

function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
}

function isRequirementMandatory(requirement) {
    return Number(requirement.is_mandatory) === 1;
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
        resident.resident_first_name,
        resident.resident_middle_name
            ? `${resident.resident_middle_name.charAt(0)}.`
            : "",
        resident.resident_last_name,
        resident.resident_name_extension
    ].filter(Boolean).join(" ");

    document.getElementById("summary-document").textContent =
        selectedDocument.document_name;

    document.getElementById("summary-purpose").textContent =
        draft.purpose || "Not provided";

    document.getElementById("summary-copies").textContent =
        String(draft.number_of_copies);

    document.getElementById("summary-resident-name").textContent =
        residentName;

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
            isRequirementMandatory(requirement) ? "Required" : "Optional"
        )
    );

    const inputId = `requirement-${requirement.requirement_id}`;
    const input = document.createElement("input");
    input.id = inputId;
    input.name = inputId;
    input.type = "file";
    input.dataset.requirementId = requirement.requirement_id;
    input.accept = ".jpg,.jpeg,.png,.pdf";
    input.required = isRequirementMandatory(requirement);
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
    const fileInputs = [...requirementsList.querySelectorAll(
        'input[type="file"]'
    )];
    const attachedCount = fileInputs.filter(
        input => input.files && input.files.length > 0
    ).length;
    attachmentCount.textContent =
        `${attachedCount} of ${requirements.length} attached`;

    submitRequestButton.disabled = !requirementsLoaded || !requirements.every(
        requirement => {
            if (!isRequirementMandatory(requirement)) return true;

            const input = requirementsList.querySelector(
                `input[data-requirement-id="${requirement.requirement_id}"]`
            );

            return Boolean(input && input.files && input.files.length > 0);
        }
    );
}

function createRequestFormData(draft) {
    const formData = new FormData();

    formData.append("document_id", draft.document_id);
    formData.append("number_of_copies", draft.number_of_copies);
    formData.append("purpose", draft.purpose || "");

    const fileInputs = requirementsList.querySelectorAll(
        'input[type="file"][data-requirement-id]'
    );

    const requirementIds = [];

    fileInputs.forEach(input => {
        const file = input.files && input.files[0];

        if (file) {
            formData.append("requirements", file);

            requirementIds.push(
                Number(input.dataset.requirementId)
            );
        }
    });

    formData.append(
        "requirement_ids",
        JSON.stringify(requirementIds)
    );

    return formData;
}

function showPageError(error) {
    console.error("Error initializing request review:", error);
    requirementsLoaded = false;
    submitRequestButton.disabled = true;
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
        const resident = await getResident();

        const selectedDocument = await getDocumentDetails(
            draft.document_id
        );

        if (!selectedDocument || selectedDocument.availability !== "Available") {
            throw new Error(
                "The selected document is unavailable. Return to the catalog and choose another."
            );
        }

        requirements = await getDocumentRequirements(
            draft.document_id
        );
        requirementsLoaded = true;

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
                requirementsList.appendChild(
                    renderRequirement(requirement, index)
                );
            });
        }

        updateAttachmentCount();

        submissionNotice.textContent =
            "Check your request details and attach all required files before submitting.";

    } catch (error) {
        showPageError(error);
    }
}

async function submitRequest() {
    try {
        const draft = getRequestDraft();

        for (const requirement of requirements) {
            const input = requirementsList.querySelector(
                `input[data-requirement-id="${requirement.requirement_id}"]`
            );

            if (
                isRequirementMandatory(requirement) &&
                (!input || !input.files.length)
            ) {
                throw new Error(
                    `Please upload ${requirement.requirement_name}.`
                );
            }
        }

        const formData = createRequestFormData(draft);

        submitRequestButton.disabled = true;
        submitRequestButton.textContent = "Submitting...";

        submissionNotice.textContent =
            "Submitting your document request...";

        const result = await submitDocumentRequest(formData);

        console.log("Document request submitted:", result);

        submissionNotice.textContent =
            "Your document request was submitted successfully.";

        submitRequestButton.textContent = "Submitted";
        submitRequestButton.disabled = true;

    } catch (error) {
        console.error("Submit document request error:", error);

        submissionNotice.textContent =
            error.message || "Unable to submit your document request.";

        updateAttachmentCount();
        submitRequestButton.textContent = "Submit Request";
    }
}

function returnToRequestDetails() {
    const documentId = new URLSearchParams(window.location.search).get("document_id");
    const destination = documentId
        ? `document_request.html?document_id=${encodeURIComponent(documentId)}`
        : "document_request.html";
    window.location.href = destination;
}

submitRequestButton.addEventListener(
    "click",
    submitRequest
);

document.getElementById("back-to-details").addEventListener(
    "click",
    returnToRequestDetails
);
document.getElementById("back-button").addEventListener(
    "click",
    returnToRequestDetails
);

initializeReviewPage().finally(() => window.finishPageSkeleton?.());
