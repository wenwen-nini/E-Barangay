
import { getDocumentsWithRequirements } from "../../services/getService.js";

const requirementIconPath = new URL(
    "../../../assets/icons/Resident Portal/Document catalog Page/Requirement Icon.png",
    import.meta.url
).href;

const defaultDocumentPreviewPath = new URL(
    "../../../assets/images/default.png",
    import.meta.url
).href;

let documents = [];
let selectedDocumentId = null;

// DOM elements
const container = document.getElementById("documents-container");
const form = document.querySelector(".filter-group form");
const searchInput = document.getElementById("search");
const availabilityFilter = document.getElementById("availability");
const feeFilter = document.getElementById("fee");
const resetButton = document.getElementById("reset-filter");

const modal = document.getElementById("document-modal");
const closeButton = document.getElementById("close-document-modal");
const closeFooterButton = document.getElementById("close-document-footer");
const requestButton = document.getElementById("request-document-btn");

const modalDocumentName = document.getElementById("modal-document-name");
const modalDocumentImage = document.getElementById("modal-document-image");
const modalDocumentDescription = document.getElementById("modal-document-description");
const modalDocumentAvailability = document.getElementById("modal-document-availability");
const modalDocumentFee = document.getElementById("modal-document-fee");
const modalDocumentRequirements = document.getElementById("modal-document-requirements");
const modalDocumentNote = document.getElementById("modal-document-note");
const modalDocumentInstructions = document.getElementById("modal-document-instructions");

// Populate filter dropdowns
function populateFilter(select, values, formatValue = value => value) {
    select.replaceChildren(new Option("All", ""));

    values.forEach(value => {
        select.add(new Option(formatValue(value), String(value)));
    });
}

// Generate document cards
function renderDocuments() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedAvailability = availabilityFilter.value.toLowerCase();
    const selectedFee = feeFilter.value;

    const filteredDocuments = documents.filter(document => {

        const requirements = document.requirements ?? [];

        const requirementNames = requirements
            .map(requirement => requirement.requirement_name)
            .join(" ");

        const searchableText = [
            document.document_name,
            document.description,
            requirementNames
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        const matchesSearch =
            !searchTerm || searchableText.includes(searchTerm);

        const matchesAvailability =
            !selectedAvailability ||
            document.availability?.toLowerCase() === selectedAvailability;

        const documentFee = document.fee_per_copy == null
            ? NaN
            : Number(document.fee_per_copy);

        const matchesFee =
            !selectedFee || documentFee === Number(selectedFee);

        return matchesSearch && matchesAvailability && matchesFee;
    });

    if (filteredDocuments.length === 0) {
        container.innerHTML = documents.length
            ? "<p>No documents match your filters.</p>"
            : "<p>No documents available.</p>";

        return;
    }

    container.innerHTML = filteredDocuments.map(document => {

        const requirements = document.requirements ?? [];

        const requirementList = requirements.length > 0
            ? requirements
                .map(requirement => requirement.requirement_name)
                .join(", ")
            : "No requirements available.";

        const availabilityClass =
            document.availability?.toLowerCase() ?? "unknown";

        return `
            <div class="document-cards"
                data-document-id="${document.document_id}">

                <div class="document-cards-title">
                    <h3>${document.document_name}</h3>

                    <span class="status-badge status-${availabilityClass}">
                        ${document.availability}
                    </span>
                </div>

                <p>
                    ${document.description ?? "No description available."}
                </p>

                <div class="document-card-bottom">

                    <div class="requirement-line">
                        <img src="${requirementIconPath}" alt="">
                        <strong>Requirements: ${requirementList}</strong>
                    </div>

                    <button type="button" class="view-details-btn">
                        View Details →
                    </button>

                </div>
            </div>
        `;
    }).join("");
}

// Load documents and initialize filters
async function generateDocumentCard() {
    try {
        const retrievedDocuments = await getDocumentsWithRequirements();

        documents = Array.isArray(retrievedDocuments)
            ? retrievedDocuments
            : [];

        const availabilities = [...new Set(
            documents
                .map(document => document.availability)
                .filter(value => typeof value === "string" && value.trim())
        )].sort((a, b) => a.localeCompare(b));

        const fees = [...new Set(
            documents
                .map(document => document.fee_per_copy == null
                    ? NaN
                    : Number(document.fee_per_copy))
                .filter(Number.isFinite)
        )].sort((a, b) => a - b);

        populateFilter(availabilityFilter, availabilities);

        populateFilter(
            feeFilter,
            fees,
            fee => fee === 0 ? "Free" : `₱${fee.toFixed(2)}`
        );

        renderDocuments();

    } catch (error) {
        console.error("Error loading documents:", error);
        container.innerHTML = "<p>Unable to load documents.</p>";
    }
}

// Search and filters
form.addEventListener("submit", event => {
    event.preventDefault();
});

searchInput.addEventListener("input", renderDocuments);
availabilityFilter.addEventListener("change", renderDocuments);
feeFilter.addEventListener("change", renderDocuments);

resetButton.addEventListener("click", event => {
    event.preventDefault();

    searchInput.value = "";
    availabilityFilter.value = "";
    feeFilter.value = "";

    renderDocuments();
});

// Open document details modal
function openDocumentModal(documentId) {

    const documentInfo = documents.find(
        doc => String(doc.document_id) === String(documentId)
    );

    if (!documentInfo) {
        console.error("Document not found:", documentId);
        return;
    }

    selectedDocumentId = documentInfo.document_id;

    modalDocumentName.textContent = documentInfo.document_name;

    modalDocumentDescription.textContent =
        documentInfo.description || "No description available.";

    const isAvailable = documentInfo.availability === "Available";

    modalDocumentAvailability.textContent = documentInfo.availability;

    modalDocumentAvailability.classList.toggle(
        "unavailable",
        !isAvailable
    );

    const fee = Number(documentInfo.fee_per_copy);

    modalDocumentFee.textContent = Number.isFinite(fee)
        ? fee === 0
            ? "FREE"
            : `₱${fee.toFixed(2)}`
        : "Confirm with barangay";

    modalDocumentImage.src = defaultDocumentPreviewPath;
    modalDocumentImage.alt = `${documentInfo.document_name} sample`;

    // Display requirements
    const requirements = documentInfo.requirements ?? [];

    if (requirements.length === 0) {

        modalDocumentRequirements.innerHTML =
            "<li>No requirements listed.</li>";

    } else {

        modalDocumentRequirements.innerHTML =
            requirements.map(requirement => `
                <li>
                    <strong>${requirement.requirement_name}</strong>

                    <span class="requirement-type">
                        ${requirement.is_mandatory
                            ? "Required"
                            : "Optional"}
                    </span>

                    <p>${requirement.description || ""}</p>
                </li>
            `).join("");
    }

    modalDocumentNote.textContent =
        documentInfo.processing_note ||
        "Processing time and pickup arrangements are to be confirmed by the barangay.";

    modalDocumentInstructions.textContent =
        documentInfo.collection_instructions ||
        "No delivery or issued PDF soft copy. Requirements are uploaded separately on page 2 of the request form.";

    requestButton.disabled = !isAvailable;

    requestButton.textContent = isAvailable
        ? "Request Document"
        : "Currently Unavailable";

    modal.showModal();
}

// Close modal
function closeDocumentModal() {
    modal.close();
    selectedDocumentId = null;
}

closeButton.addEventListener("click", closeDocumentModal);
closeFooterButton.addEventListener("click", closeDocumentModal);

modal.addEventListener("click", event => {
    if (event.target === modal) {
        closeDocumentModal();
    }
});

// Handle View Details buttons
document.addEventListener("click", event => {

    if (!(event.target instanceof Element)) return;

    const button = event.target.closest(".view-details-btn");

    if (!button) return;

    const card = button.closest(".document-cards");
    const documentId = card?.dataset.documentId;

    if (documentId) {
        openDocumentModal(documentId);
    }
});

// Proceed to Document Request page
requestButton.addEventListener("click", () => {

    if (selectedDocumentId === null) return;

    const selectedDocument = documents.find(
        doc => String(doc.document_id) === String(selectedDocumentId)
    );

    if (!selectedDocument ||
        selectedDocument.availability !== "Available") {
        return;
    }

    const params = new URLSearchParams({
        document_id: String(selectedDocument.document_id)
    });

    window.location.href =
        `document_request.html?${params.toString()}`;
});

// Initialize
generateDocumentCard();
