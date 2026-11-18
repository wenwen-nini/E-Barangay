import {
    getResidentInfo,
    recentRequestInfo
} from "../../services/getServiceForStaff.js";
import { staff } from "../../mock-data/staff.js";

const [requestRows, residentRows] = await Promise.all([
    recentRequestInfo(),
    getResidentInfo()
]);
const requestData = requestRows.map(request => {
    const resident = residentRows.find(row => row.resident_id === request.resident_id);
    return {
        ...request,
        complete_address: resident?.complete_address ?? "Address unavailable",
        contact_number: resident?.contact_number ?? "Contact unavailable"
    };
});
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

let selectedRequestId = null;
let currentPage = 1;

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function toLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseLocalDate(value) {
    if (typeof value !== "string" || !value) return null;
    const [year, month, day] = value.split("-").map(Number);
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
    const middleInitial = request.middle_name ? ` ${request.middle_name.charAt(0)}.` : "";
    return `${request.first_name}${middleInitial} ${request.last_name}${request.name_extension ? ` ${request.name_extension}` : ""}`;
}

function getReadyRequests() {
    return requestData.filter(request =>
        request.status === "Approved"
        && request.collection_confirmed !== true
        && !request.release_date
    );
}

function isWithinSelectedDateRange(value) {
    if (!value) return false;
    const from = approvedFromDate.value;
    const to = approvedToDate.value;
    return (!from || value >= from) && (!to || value <= to);
}

function getFilteredQueue() {
    const searchTerm = queueSearchInput.value.trim().toLowerCase();
    const selectedDocument = documentFilter.value;

    return getReadyRequests().filter(request => {
        const searchableText = [
            request.request_id,
            residentName(request),
            request.document_name
        ].join(" ").toLowerCase();
        const matchesSearch = !searchTerm || searchableText.includes(searchTerm);
        const matchesDocument = !selectedDocument || request.document_name === selectedDocument;
        const matchesApprovalDate = isWithinSelectedDateRange(request.approval_date);
        return matchesSearch && matchesDocument && matchesApprovalDate;
    });
}

function populateDocumentFilter() {
    const selectedValue = documentFilter.value;
    const documentNames = [...new Set(
        getReadyRequests().map(request => request.document_name).filter(Boolean)
    )].sort((first, second) => first.localeCompare(second));

    documentFilter.replaceChildren(new Option("All documents", ""));
    documentNames.forEach(name => documentFilter.add(new Option(name, name)));
    if (documentNames.includes(selectedValue)) {
        documentFilter.value = selectedValue;
    }
}

function updateSummaryCards() {
    const releasedInRange = requestData.filter(request =>
        request.status === "Released" && isWithinSelectedDateRange(request.release_date)
    ).length;

    readyCount.textContent = getReadyRequests().length;
    releasedCount.textContent = releasedInRange;
}

function renderQueue() {
    const filteredRequests = getFilteredQueue();
    const pageSize = Number(pageSizeSelect.value);
    const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredRequests.length);
    const pageRequests = filteredRequests.slice(startIndex, endIndex);

    if (!pageRequests.some(request => request.request_id === selectedRequestId)) {
        selectedRequestId = pageRequests[0]?.request_id ?? null;
    }

    readyQueueBody.innerHTML = pageRequests.map(request => `
        <tr class="${request.request_id === selectedRequestId ? "is-selected" : ""}">
            <td>#${escapeHtml(request.request_id)}</td>
            <td class="resident-document-cell">
                <strong>${escapeHtml(residentName(request))}</strong>
                <span>${escapeHtml(request.document_name)} · ${escapeHtml(request.number_of_copies)} ${Number(request.number_of_copies) === 1 ? "copy" : "copies"}</span>
                <small>Approved ${escapeHtml(formatDate(request.approval_date))} · ${escapeHtml(request.purpose)}</small>
            </td>
            <td><span class="status-pill">Approved</span></td>
            <td>
                <button
                    type="button"
                    class="queue-select-button ${request.request_id === selectedRequestId ? "is-current" : ""}"
                    data-select-request="${escapeHtml(request.request_id)}"
                    aria-pressed="${request.request_id === selectedRequestId}"
                >${request.request_id === selectedRequestId ? "Selected" : "Select"}</button>
            </td>
        </tr>
    `).join("") || `<tr><td class="empty-queue" colspan="4">No approved, uncollected requests match these filters.</td></tr>`;

    const rangeText = filteredRequests.length
        ? `${startIndex + 1}${endIndex > startIndex + 1 ? `–${endIndex}` : ""} of ${filteredRequests.length}`
        : "0 of 0";
    entryCount.textContent = `${rangeText} ready-for-pickup ${filteredRequests.length === 1 ? "request" : "requests"}`;
    previousButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage >= totalPages;
    renderSelectedRequest();
}

function renderSelectedRequest() {
    const selectedRequest = getReadyRequests().find(request =>
        request.request_id === selectedRequestId
    );

    if (!selectedRequest) {
        selectedRequestLabel.textContent = "Select an approved request to begin verification.";
        selectedRequestDetails.innerHTML = `<p>No approved request selected.</p>`;
        releaseChecklist.disabled = true;
        checklistInputs.forEach(input => {
            input.checked = false;
        });
        releaseRemarks.value = "";
        releaseRemarks.disabled = true;
        markReleasedButton.disabled = true;
        return;
    }

    selectedRequestLabel.textContent = `Selected request: #${selectedRequest.request_id} · ${residentName(selectedRequest)} · ${selectedRequest.document_name}`;
    selectedRequestDetails.innerHTML = `
        <span class="status-pill">Approved</span>
        <p class="selected-document-name">${escapeHtml(selectedRequest.document_name)}</p>
        <p>${escapeHtml(residentName(selectedRequest))}<br>${escapeHtml(selectedRequest.complete_address)}<br>${escapeHtml(selectedRequest.contact_number)}</p>
        <p>Requested ${escapeHtml(formatDate(selectedRequest.request_date))} · ${escapeHtml(selectedRequest.number_of_copies)} ${Number(selectedRequest.number_of_copies) === 1 ? "copy" : "copies"}<br>Purpose: ${escapeHtml(selectedRequest.purpose)}</p>
    `;

    releaseChecklist.disabled = false;
    checklistInputs.forEach(input => {
        input.checked = selectedRequest[input.dataset.check] === true;
    });
    releaseRemarks.disabled = false;
    releaseRemarks.value = selectedRequest.release_remarks ?? "";
    updateReleaseButton(selectedRequest);
}

function updateReleaseButton(selectedRequest = getReadyRequests().find(request =>
    request.request_id === selectedRequestId
)) {
    markReleasedButton.disabled = !selectedRequest
        || checklistInputs.some(input => !input.checked);
}

function getStaffName(staffId) {
    const staffMember = staff.find(member => member.staff_id === staffId);
    if (!staffMember) return "Staff member unavailable";
    return [staffMember.first_name, staffMember.middle_name, staffMember.last_name]
        .filter(Boolean)
        .join(" ");
}

function renderReleaseLog() {
    const releasedRequests = requestData
        .filter(request => request.status === "Released" && request.release_date)
        .sort((first, second) => second.release_date.localeCompare(first.release_date));

    releaseLogBody.innerHTML = releasedRequests.map(request => `
        <tr>
            <td>#${escapeHtml(request.request_id)}</td>
            <td class="recent-record-cell">
                <span>${escapeHtml(residentName(request))} · ${escapeHtml(request.document_name)}</span>
                <small>${escapeHtml(request.number_of_copies)} ${Number(request.number_of_copies) === 1 ? "copy" : "copies"} · ${escapeHtml(request.purpose)}</small>
                <small>${escapeHtml(formatDate(request.release_date))} · ${escapeHtml(getStaffName(request.staff_id))}</small>
            </td>
            <td><span class="status-pill">Released</span></td>
        </tr>
    `).join("") || `<tr><td class="empty-queue" colspan="3">No released documents in the record yet.</td></tr>`;
}

function renderPage() {
    updateSummaryCards();
    renderQueue();
    renderReleaseLog();
}

function selectRequest(requestId) {
    selectedRequestId = requestId;
    releaseFeedback.textContent = "";
    renderQueue();
}

function markSelectedAsReleased() {
    const selectedRequest = getReadyRequests().find(request =>
        request.request_id === selectedRequestId
    );
    if (!selectedRequest || checklistInputs.some(input => !input.checked)) return;

    checklistInputs.forEach(input => {
        selectedRequest[input.dataset.check] = input.checked;
    });
    selectedRequest.status = "Released";
    selectedRequest.collection_confirmed = true;
    selectedRequest.release_date = toLocalDateString(new Date());
    selectedRequest.release_remarks = releaseRemarks.value.trim() || null;

    releaseFeedback.textContent = `Request #${selectedRequest.request_id} marked as released.`;
    selectedRequestId = null;
    currentPage = 1;
    populateDocumentFilter();
    renderPage();
}

const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(today.getDate() - 30);
approvedFromDate.value = toLocalDateString(thirtyDaysAgo);
approvedToDate.value = toLocalDateString(today);

populateDocumentFilter();
selectedRequestId = getReadyRequests()[0]?.request_id ?? null;
renderPage();

queueSearchInput.addEventListener("input", () => {
    currentPage = 1;
    renderPage();
});

documentFilter.addEventListener("change", () => {
    currentPage = 1;
    renderPage();
});

approvedFromDate.addEventListener("change", () => {
    currentPage = 1;
    renderPage();
});

approvedToDate.addEventListener("change", () => {
    currentPage = 1;
    renderPage();
});

pageSizeSelect.addEventListener("change", () => {
    currentPage = 1;
    renderQueue();
});

previousButton.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderQueue();
    }
});

nextButton.addEventListener("click", () => {
    currentPage++;
    renderQueue();
});

readyQueueBody.addEventListener("click", event => {
    const button = event.target.closest("[data-select-request]");
    if (button) selectRequest(Number(button.dataset.selectRequest));
});

checklistInputs.forEach(input => {
    input.addEventListener("change", () => {
        const selectedRequest = getReadyRequests().find(request =>
            request.request_id === selectedRequestId
        );
        if (selectedRequest) {
            selectedRequest[input.dataset.check] = input.checked;
        }
        updateReleaseButton(selectedRequest);
    });
});

markReleasedButton.addEventListener("click", markSelectedAsReleased);
