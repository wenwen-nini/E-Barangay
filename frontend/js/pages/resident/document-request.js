import { getAvailableDocuments } from "../../services/requestServices.js";
import { getCurrentUser } from "../../core/session.js";
import { getCurrentUserProfile } from "../../services/profileServices.js";

const documentSelect = document.getElementById("document-type");
const purposeInput = document.getElementById("purpose");
const copiesSelect = document.getElementById("number-of-copies");

const fullNameDisplay = document.getElementById("resident-full-name");
const addressDisplay = document.getElementById("resident-address");
const contactDisplay = document.getElementById("resident-contact");

const reviewButton = document.getElementById("review-request-btn");
const requestForm = document.getElementById("request-details-form");

const currentUser = getCurrentUser();

let documents = [];
let currentResident = null;

const urlParams = new URLSearchParams(window.location.search);
const selectedDocumentId = urlParams.get("document_id");

async function getResidentInformation() {
    const profileData = await getCurrentUserProfile();

    if (!profileData.success || !profileData.profile) {
        throw new Error("Unable to retrieve resident information.");
    }

    currentResident = profileData.profile;

    const fullName = [
        currentResident.resident_first_name,
        currentResident.resident_middle_name
            ? currentResident.resident_middle_name.charAt(0) + "."
            : "",
        currentResident.resident_last_name,
        currentResident.resident_name_extension
    ].filter(Boolean).join(" ");

    fullNameDisplay.textContent = fullName;

    addressDisplay.textContent =
        currentResident.complete_address || "No address available.";

    contactDisplay.textContent =
        currentResident.contact_number || "No contact number available.";
}

function populateDocumentDropdown() {
    documentSelect.innerHTML = `
        <option value="">Select a document</option>
    `;

    const availableDocuments = documents.filter(
        document => document.availability === "Available"
    );

    availableDocuments.forEach(documentInfo => {
        const option = document.createElement("option");

        option.value = String(documentInfo.document_id);
        option.textContent = documentInfo.document_name;

        documentSelect.appendChild(option);
    });

    if (selectedDocumentId) {
        const selectedDocument = availableDocuments.find(
            document =>
                String(document.document_id) === String(selectedDocumentId)
        );

        if (selectedDocument) {
            documentSelect.value = selectedDocument.document_id;
        } else {
            alert("The selected document is currently unavailable.");
        }
    }

    const savedDraftText = sessionStorage.getItem("requestDraft");
    if (!savedDraftText) {
        return;
    }

    try {
        const savedDraft = JSON.parse(savedDraftText);
        const matchesSelectedDocument = !selectedDocumentId
            || String(savedDraft.document_id) === String(selectedDocumentId);
        const savedDocumentIsAvailable = availableDocuments.some(
            documentInfo =>
                String(documentInfo.document_id) === String(savedDraft.document_id)
        );

        if (matchesSelectedDocument && savedDocumentIsAvailable) {
            documentSelect.value = String(savedDraft.document_id);
            purposeInput.value = savedDraft.purpose || "";
            copiesSelect.value = String(savedDraft.number_of_copies || 1);
        }
    } catch (error) {
        console.error("Unable to restore request details:", error);
    }
}

async function initializeRequestPage() {
    try {
        if (!currentUser || currentUser.role !== "Resident") {
            throw new Error("Please log in using a resident account.");
        }

        await getResidentInformation();

        const retrievedDocuments = await getAvailableDocuments();

        documents = Array.isArray(retrievedDocuments)
            ? retrievedDocuments
            : [];

        populateDocumentDropdown();

    } catch (error) {
        console.error("Error initializing request page:", error);

        documentSelect.innerHTML = `
            <option value="">Unable to load documents</option>
        `;
        documentSelect.disabled = true;
        reviewButton.disabled = true;
    }
}

function reviewRequest(event) {
    event.preventDefault();

    const documentId = documentSelect.value;
    const purpose = purposeInput.value.trim();
    const numberOfCopies = Number(copiesSelect.value);

    if (!documentId) {
        alert("Please select a document.");
        documentSelect.focus();
        return;
    }

    const selectedDocument = documents.find(
        document =>
            String(document.document_id) === String(documentId)
    );

    if (!selectedDocument) {
        alert("Selected document could not be found.");
        return;
    }

    if (selectedDocument.availability !== "Available") {
        alert("This document is currently unavailable.");
        return;
    }

    if (!Number.isInteger(numberOfCopies) || numberOfCopies < 1) {
        alert("Please select a valid number of copies.");
        return;
    }

    const requestDraft = {
        document_id: selectedDocument.document_id,
        document_name: selectedDocument.document_name,
        purpose: purpose || null,
        number_of_copies: numberOfCopies
    };

    sessionStorage.setItem(
        "requestDraft",
        JSON.stringify(requestDraft)
    );

    window.location.href =
        `document_request_review.html?document_id=${selectedDocument.document_id}`;
}

function cancelRequest() {
    window.location.href = "document_catalog.html";
}

requestForm.addEventListener("submit", reviewRequest);

const cancelButton = document.getElementById("cancel-request-btn");

if (cancelButton) {
    cancelButton.addEventListener("click", cancelRequest);
}

initializeRequestPage().finally(() => window.finishPageSkeleton?.());
