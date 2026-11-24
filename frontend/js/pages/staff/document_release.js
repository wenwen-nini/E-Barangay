import {
    getDocumentReleaseRequests,
    getDocumentReleaseDetails,
    updateReleaseVerification,
    releaseRequest,
    getRecentReleaseLog
} from "../../services/getServiceForDocumentRelease.js";
import { formatId } from "../../utils/idFormatter.js";

let requestData = [];
let releaseLogData = [];

let currentPage = 1;
let totalPages = 0;
let totalRecords = 0;
let selectedRequestId = null;
let selectedRequestDetailsData = null;
const readyQueueBody = document.querySelector("#ready-queue-body");
const releaseLogBody = document.querySelector("#release-log-body");
const queueSearchInput = document.querySelector("#queue-search");
const documentFilter = document.querySelector("#queue-document-filter");
const approvedFromDate = document.querySelector("#approved-from-date");
const approvedToDate = document.querySelector("#approved-to-date");
const pageSizeSelect = document.querySelector("#queue-page-size");
const previousButton = document.querySelector("#queue-previous");
const nextButton = document.querySelector("#queue-next");
const entryCount = document.querySelector("#queue-entry-count");
const readyCount = document.querySelector("#ready-count");
const releasedCount = document.querySelector("#released-count");
const selectedRequestLabel = document.querySelector("#selected-request-label");
const selectedRequestDetails = document.querySelector("#selected-request-details");
const releaseChecklist = document.querySelector("#release-checklist");
const checklistInputs = [...releaseChecklist.querySelectorAll("input[data-check]")];
const releaseRemarks = document.querySelector("#release-remarks");
const markReleasedButton = document.querySelector("#mark-released");
const releaseFeedback = document.querySelector("#release-feedback");

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

async function loadDocumentReleaseRequests(page = 1) {
    try {
        const result = await getDocumentReleaseRequests(page, {
            search: queueSearchInput.value.trim(),
            documentId: documentFilter.value,
            dateFrom: approvedFromDate.value,
            dateTo: approvedToDate.value
        });

        requestData = result.requests;

        readyCount.textContent = result.summary.approvedCount;
        releasedCount.textContent = result.summary.releasedCount;

        populateDocumentFilter();

        currentPage = result.pagination.currentPage;
        totalPages = result.pagination.totalPages;
        totalRecords = result.pagination.totalRecords;

        renderPage();

    } catch (error) {
        console.error("Unable to load Document Release requests:", error);
        releaseFeedback.textContent = error.message;
    }
}

async function loadRecentReleaseLog() {
    try {
        const result = await getRecentReleaseLog();

        releaseLogData = result.releases;

        renderReleaseLog();

    } catch (error) {
        console.error("Unable to load Recent Release Log:", error);
    }
}

function parseLocalDate(value) {
    if (typeof value !== "string" || !value) return null;

    const datePart = value.split("T")[0].split(" ")[0];
    const [year, month, day] = datePart.split("-").map(Number);

    if (!year || !month || !day) return null;

    const date = new Date(year, month - 1, day);

    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
    const date = parseLocalDate(value);
    return date
        ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "Date unavailable";
}

function residentName(request) {
    return request.resident_name || "Resident name unavailable";
}

function getReadyRequests() {
    return requestData.filter(request =>
        request.status === "Approved"
    );
}

function isWithinSelectedDateRange(value) {
    if (!value) return false;

    const requestDate = String(value).split("T")[0].split(" ")[0];

    const from = approvedFromDate.value;
    const to = approvedToDate.value;

    return (
        (!from || requestDate >= from) &&
        (!to || requestDate <= to)
    );
}

function getFilteredQueue() {
    return requestData;
}

function populateDocumentFilter() {
    const selectedValue = documentFilter.value;

    const documents = [
        ...new Map(
            requestData.map(request => [
                String(request.document_id),
                request.document_name
            ])
        )
    ];

    documentFilter.replaceChildren(
        new Option("All documents", "")
    );

    documents.forEach(([documentId, documentName]) => {
        documentFilter.add(
            new Option(documentName, documentId)
        );
    });

    if (
        selectedValue &&
        !documents.some(([documentId]) => documentId === selectedValue)
    ) {
        const previousOption = documentFilter.querySelector(
            `option[value="${CSS.escape(selectedValue)}"]`
        );

        if (previousOption) {
            documentFilter.add(previousOption);
        }
    }

    documentFilter.value = selectedValue;
}

function renderQueue() {
    const filteredRequests = getFilteredQueue();

    // The backend already returns the records for the current page.
    const pageRequests = filteredRequests;

    if (!pageRequests.some(request =>
        request.request_id === selectedRequestId
    )) {
        const firstApprovedRequest = pageRequests.find(
            request => request.status === "Approved"
        );

        selectedRequestId = firstApprovedRequest?.request_id ?? null;
        selectedRequestDetailsData = null;
    }

    readyQueueBody.innerHTML = pageRequests.map(request => `
        <tr class="${request.request_id === selectedRequestId ? "is-selected" : ""}">
            <td>${escapeHtml(formatId(request.request_id, "REQ", 3))}</td>
            <td class="resident-document-cell">
                <strong>${escapeHtml(residentName(request))}</strong>
                <span>
                    ${escapeHtml(request.document_name)} ·
                    ${escapeHtml(request.number_of_copies)}
                    ${Number(request.number_of_copies) === 1 ? "copy" : "copies"}
                </span>
                <small>
                    ${escapeHtml(request.status === "Approved" ? "Approved" : "Released")}
                    ${escapeHtml(formatDate(
                        request.status === "Approved"
                            ? request.approval_date
                            : request.release_date
                    ))}
                    · ${escapeHtml(request.purpose)}
                </small>
            </td>
            <td><span class="status-pill">Approved</span></td>
            <td>
                <button
                    type="button"
                    class="queue-select-button ${request.request_id === selectedRequestId ? "is-current" : ""}"
                    data-select-request="${escapeHtml(request.request_id)}"
                    aria-pressed="${request.request_id === selectedRequestId}"
                >
                    ${request.request_id === selectedRequestId ? "Selected" : "Select"}
                </button>
            </td>
        </tr>
    `).join("") || `
        <tr>
            <td class="empty-queue" colspan="4">
                No approved requests match these filters.
            </td>
        </tr>
    `;

    const startIndex = totalRecords === 0
        ? 0
        : (currentPage - 1) * 10 + 1;

    const endIndex = Math.min(currentPage * 10, totalRecords);

    entryCount.textContent =
        `${startIndex}–${endIndex} of ${totalRecords} requests`;

    previousButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= totalPages;

    renderSelectedRequest();
}

async function refreshQueueFromFirstPage() {
    currentPage = 1;
    selectedRequestId = null;
    selectedRequestDetailsData = null;

    await loadDocumentReleaseRequests(1);
}

async function renderSelectedRequest() {
    const selectedRequest = getReadyRequests().find(request =>
        request.request_id === selectedRequestId
    );

    if (!selectedRequest) {
        selectedRequestDetailsData = null;

        selectedRequestLabel.textContent =
            "Select an approved request to begin verification.";

        selectedRequestDetails.innerHTML =
            "<p>No request selected.</p>";

        releaseChecklist.disabled = true;
        checklistInputs.forEach(input => {
            input.checked = false;
        });

        releaseRemarks.value = "";
        releaseRemarks.disabled = true;
        markReleasedButton.disabled = true;
        return;
    }

    const requestId = selectedRequest.request_id;

    selectedRequestLabel.textContent =
        `Selected request: ${formatId(requestId, "REQ", 3)} · ${residentName(selectedRequest)} · ${selectedRequest.document_name}`;

    selectedRequestDetails.innerHTML =
        "<p>Loading request details...</p>";

    releaseChecklist.disabled = true;
    releaseRemarks.disabled = true;
    markReleasedButton.disabled = true;

    try {
        const result = await getDocumentReleaseDetails(requestId);

        // Ignore an older response if another request was selected.
        if (selectedRequestId !== requestId) return;

        const details = result.request;
        selectedRequestDetailsData = details;

        selectedRequestDetails.innerHTML = `
            <span class="status-pill">${escapeHtml(details.status)}</span>
            <p class="selected-document-name">
                ${escapeHtml(details.document_name)}
            </p>
            <p>
                ${escapeHtml(details.resident_name)}<br>
                ${escapeHtml(details.complete_address)}<br>
                ${escapeHtml(details.contact_number)}
            </p>
            <p>
                Requested ${escapeHtml(formatDate(details.request_date))}<br>
                ${escapeHtml(details.number_of_copies)}
                ${Number(details.number_of_copies) === 1 ? "copy" : "copies"}<br>
                Purpose: ${escapeHtml(details.purpose)}
            </p>
            <p>
                Approved: ${escapeHtml(formatDate(details.approval_date))}<br>
                Released: ${escapeHtml(
                    details.release_date
                        ? formatDate(details.release_date)
                        : "Not yet released"
                )}
            </p>
        `;

        checklistInputs.forEach(input => {
            details[input.dataset.check] =
                Number(details[input.dataset.check]) === 1;

            input.checked = details[input.dataset.check];
        });

        const isApproved = details.status === "Approved";

        releaseChecklist.disabled = !isApproved;
        releaseRemarks.disabled = !isApproved;

        updateReleaseButton(details);

    } catch (error) {
        console.error("Unable to load selected request:", error);

        if (selectedRequestId === requestId) {
            selectedRequestDetails.innerHTML =
                `<p>Unable to load request details: ${escapeHtml(error.message)}</p>`;
        }
    }
}

function updateReleaseButton(selectedRequest = selectedRequestDetailsData) {
    markReleasedButton.disabled =
        !selectedRequest ||
        selectedRequest.status !== "Approved" ||
        checklistInputs.some(input => !input.checked);
}

function getStaffName(request) {
    return request.staff_name || "Staff member unavailable";
}

function renderReleaseLog() {
    const releasedRequests = releaseLogData.filter(
        request => request.release_date
    );

    releaseLogBody.innerHTML = releasedRequests.map(request => `
        <tr>
            <td>${escapeHtml(formatId(request.request_id, "REQ", 3))}</td>
            <td class="recent-record-cell">
                <span>
                    ${escapeHtml(residentName(request))} ·
                    ${escapeHtml(request.document_name)}
                </span>
                <small>
                    ${escapeHtml(request.number_of_copies)}
                    ${Number(request.number_of_copies) === 1 ? "copy" : "copies"}
                    · ${escapeHtml(request.purpose)}
                </small>
                <small>
                    ${escapeHtml(formatDate(request.release_date))}
                    · ${escapeHtml(getStaffName(request))}
                </small>
            </td>
            <td><span class="status-pill">Released</span></td>
        </tr>
    `).join("") || `
        <tr>
            <td class="empty-queue" colspan="3">
                No released documents in the last 7 days.
            </td>
        </tr>
    `;
}


function renderPage() {
    renderQueue();
    renderReleaseLog();
}

function selectRequest(requestId) {
    selectedRequestId = requestId;
    selectedRequestDetailsData = null;
    releaseFeedback.textContent = "";

    renderQueue();
}


async function markSelectedAsReleased() {
    const details = selectedRequestDetailsData;

    if (
        !details ||
        details.status !== "Approved" ||
        checklistInputs.some(input => !input.checked)
    ) {
        return;
    }

    const requestId = selectedRequestId;

    markReleasedButton.disabled = true;
    releaseFeedback.textContent = "Processing document release...";

    try {
        await releaseRequest(requestId);

        releaseFeedback.textContent =
            `Request #${requestId} successfully marked as Released.`;

        selectedRequestId = null;
        selectedRequestDetailsData = null;

        // Refresh the request table and Recent Release Log.
        await Promise.all([
            loadDocumentReleaseRequests(currentPage),
            loadRecentReleaseLog()
        ]);

    } catch (error) {
        console.error("Unable to release document:", error);

        releaseFeedback.textContent =
            `Unable to release document: ${error.message}`;

        updateReleaseButton(details);
    }
}

approvedFromDate.value = "";
approvedToDate.value = "";

async function initializeDocumentReleasePage() {
    await Promise.all([
        loadDocumentReleaseRequests(1),
        loadRecentReleaseLog()
    ]);
}

initializeDocumentReleasePage();

queueSearchInput.addEventListener("input", () => {
    refreshQueueFromFirstPage();
});

documentFilter.addEventListener("change", () => {
    refreshQueueFromFirstPage();
});

approvedFromDate.addEventListener("change", () => {
    refreshQueueFromFirstPage();
});

approvedToDate.addEventListener("change", () => {
    refreshQueueFromFirstPage();
});

pageSizeSelect.addEventListener("change", () => {
    currentPage = 1;
    renderQueue();
});

previousButton.addEventListener("click", async () => {
    if (currentPage > 1) {
        await loadDocumentReleaseRequests(currentPage - 1);
    }
});

nextButton.addEventListener("click", async () => {
    if (currentPage < totalPages) {
        await loadDocumentReleaseRequests(currentPage + 1);
    }
});

readyQueueBody.addEventListener("click", event => {
    const button = event.target.closest("[data-select-request]");
    if (button) selectRequest(Number(button.dataset.selectRequest));
});


checklistInputs.forEach(input => {
    input.addEventListener("change", async () => {
        const details = selectedRequestDetailsData;

        if (!details || details.status !== "Approved") {
            input.checked = false;
            return;
        }

        const requestId = selectedRequestId;
        const field = input.dataset.check;
        const newValue = input.checked;

        // Prevent additional changes while saving.
        checklistInputs.forEach(item => {
            item.disabled = true;
        });

        markReleasedButton.disabled = true;
        releaseFeedback.textContent = "Saving verification...";

        try {
            await updateReleaseVerification(
                requestId,
                field,
                newValue
            );

            // Update local data after successful saving.
            details[field] = newValue;

            const listRequest = requestData.find(request =>
                request.request_id === requestId
            );

            if (listRequest) {
                listRequest[field] = newValue;
            }

            releaseFeedback.textContent =
                "Verification successfully saved.";

        } catch (error) {
            console.error("Unable to save verification:", error);

            // Restore the previous checkbox value.
            input.checked = Boolean(details[field]);

            releaseFeedback.textContent =
                `Unable to save verification: ${error.message}`;

        } finally {
            checklistInputs.forEach(item => {
                item.disabled = details.status !== "Approved";
            });

            updateReleaseButton(details);
        }
    });
});


markReleasedButton.addEventListener("click", markSelectedAsReleased);
