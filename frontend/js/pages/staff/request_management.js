import {
    getResidentInfo,
    recentRequestInfo
} from "../../services/getServiceForStaff.js";
import { requirements } from "../../mock-data/requirements.js";
import { uploadedRequirements } from "../../mock-data/uploadedRequirements.js";
import { requestStatusConfig } from "../../config/requestStatusConfig.js";

let currentStatus = "All";
let searchQuery = "";
const [requestData, residentData] = await Promise.all([
    recentRequestInfo(),
    getResidentInfo()
]);

const tableBody = document.getElementById("table-body");
const searchInput = document.querySelector("#search-input");
const documentSelect = document.querySelector("#document");
const statusSelect = document.querySelector("#status");
const dateRangeSelect = document.querySelector("#date-range");
const resetButton = document.querySelector("#reset-filter");
const tabButtons = document.querySelectorAll(".tab-btn");
const showEntries = document.querySelector("#show-entries");
const previousButton = document.querySelector("#previous-btn");
const currentPageButton = document.querySelector("#current-page");
const nextButton = document.querySelector("#next-btn");
const reviewModal = document.querySelector("#request-review-modal");
const reviewForm = document.querySelector("#request-review-form");
const reviewSummary = document.querySelector("#request-review-summary");
const reviewRequirementsList = document.querySelector("#review-requirements-list");
const reviewResidentIdentity = document.querySelector("#review-resident-identity");
const currentStatusInput = document.querySelector("#review-current-status");
const newStatusSelect = document.querySelector("#review-new-status");
const staffRemarksInput = document.querySelector("#review-staff-remarks");
const followUpNoteInput = document.querySelector("#review-follow-up-note");
const approvalNotice = document.querySelector("#review-approval-notice");
const approveButton = document.querySelector("#approve-request");
const rejectButton = document.querySelector("#reject-request");
const filePreviewModal = document.querySelector("#request-file-preview");
const filePreviewTitle = document.querySelector("#request-file-preview-title");
const filePreviewContent = document.querySelector("#request-file-preview-content");
const openOriginalFileLink = document.querySelector("#open-original-file");
const pageSize = 6;
const allViewRowCount = Math.min(requestData.length, pageSize);
let currentPage = 1;
let currentDocument = "";
let currentDateRange = "";
let selectedRequest = null;
const statusTransitions = {
    Pending: ["Pending", "Under Review"],
    "Under Review": ["Under Review", "Returned"],
    Returned: ["Returned", "Under Review"],
    Approved: ["Approved"],
    Rejected: ["Rejected"],
    Released: ["Released"],
    Cancelled: ["Cancelled"]
};

const documentNames = [...new Set(requestData.map(item => item.document_name))].sort();
documentNames.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    documentSelect.append(option);
});

const statuses = [...new Set(requestData.map(item => item.status))].sort();
statuses.forEach(status => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    statusSelect.append(option);
});

function getLocalDate(date) {
    if (typeof date !== "string") return new Date(Number.NaN);
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function matchesDateRange(requestDate) {
    if (!currentDateRange) return true;

    const date = getLocalDate(requestDate);
    if (Number.isNaN(date.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (currentDateRange === "this-month") {
        return date >= new Date(today.getFullYear(), today.getMonth(), 1) && date <= today;
    }

    const days = Number(currentDateRange);
    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - days + 1);
    return date >= firstDay && date <= today;
}

function renderStatusCounts() {
    tabButtons.forEach(button => {
        const status = button.getAttribute("data-status");
        const statusCount = status === "All"
            ? requestData.length
            : requestData.filter(item => item.status === status).length;
        button.querySelector(".status-count").textContent = statusCount;
    });
}

function formatRequestDate(value) {
    const date = getLocalDate(value);
    if (Number.isNaN(date.getTime())) return value || "Date unavailable";
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function formatUploadedDate(value) {
    if (!value) return "Upload date unavailable";
    const [date, time] = value.split(" ");
    const formattedDate = formatRequestDate(date);
    return `Uploaded ${formattedDate}${time ? ` · ${time.slice(0, 5)}` : ""}`;
}

function formatFileSize(fileSize) {
    if (!Number.isFinite(fileSize)) return "File size unavailable";
    return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
}

function getResidentName(resident) {
    return [
        resident?.first_name,
        resident?.middle_name,
        resident?.last_name,
        resident?.name_extension
    ].filter(Boolean).join(" ") || "Unknown resident";
}

function getRequestRequirements(request) {
    return requirements
        .filter(requirement => requirement.document_id === request.document_id)
        .map(requirement => ({
            requirement,
            upload: uploadedRequirements.find(upload =>
                upload.request_id === request.request_id
                && upload.requirement_id === requirement.requirement_id
            )
        }));
}

function renderRequirementCards(request) {
    const requestRequirements = getRequestRequirements(request);
    if (!requestRequirements.length) {
        return `<p class="review-empty-requirements">No requirements are configured for this document.</p>`;
    }

    return requestRequirements.map(({ requirement, upload }) => {
        const isMissing = requirement.is_mandatory && !upload;
        const isUnverifiedId = upload
            && requirement.requirement_name.toLowerCase().includes("id")
            && !request.valid_id_presented;
        const statusText = isMissing
            ? "Missing"
            : isUnverifiedId
                ? "Unverified"
                : upload
                    ? "Uploaded"
                    : "Optional";
        const statusClass = isMissing
            ? "missing"
            : isUnverifiedId
                ? "unverified"
                : upload
                    ? "uploaded"
                    : "optional";
        const fileExtension = upload?.original_filename.split(".").pop().toUpperCase() || "FILE";

        return `
            <article class="review-requirement-card ${isMissing ? "is-missing" : ""}">
                <div class="review-requirement-heading">
                    <strong>${requirement.requirement_name}</strong>
                    <span class="review-requirement-status ${statusClass}">${statusText}</span>
                </div>
                ${upload
                    ? `<div class="review-uploaded-file">
                        <span class="review-file-type">${fileExtension}</span>
                        <span class="review-file-details">
                            <strong>${upload.original_filename}</strong>
                            <small>${formatUploadedDate(upload.uploaded_at)} · ${formatFileSize(upload.file_size)}</small>
                        </span>
                    </div>`
                    : `<p class="review-missing-file">Missing · No file attached</p>`
                }
                ${upload
                    ? `<button type="button" class="review-preview-button" data-upload-id="${upload.uploaded_requirement_id}">View requirement</button>`
                    : ""
                }
            </article>
        `;
    }).join("");
}

async function showFilePreview(upload) {
    filePreviewTitle.textContent = upload.original_filename;
    filePreviewContent.textContent = "Loading file preview...";
    openOriginalFileLink.hidden = true;
    filePreviewModal.showModal();

    if (!upload.storage_path?.startsWith("uploads/requirements/")) {
        filePreviewContent.textContent = "Preview unavailable: the uploaded file path is missing.";
        return;
    }

    const encodedPath = upload.storage_path
        .split("/")
        .map(segment => encodeURIComponent(segment))
        .join("/");
    const fileUrl = new URL(`../../${encodedPath}`, window.location.href);

    try {
        const response = await fetch(fileUrl, { method: "HEAD" });
        if (!response.ok) {
            throw new Error("The uploaded file is not available in the file store.");
        }

        openOriginalFileLink.href = fileUrl.href;
        openOriginalFileLink.hidden = false;
        filePreviewContent.replaceChildren();

        if (upload.mime_type.startsWith("image/")) {
            const image = document.createElement("img");
            image.src = fileUrl.href;
            image.alt = `Preview of ${upload.original_filename}`;
            image.addEventListener("error", () => {
                filePreviewContent.textContent = "The uploaded image could not be displayed.";
            }, { once: true });
            filePreviewContent.append(image);
        } else if (upload.mime_type === "application/pdf") {
            const pdf = document.createElement("iframe");
            pdf.src = fileUrl.href;
            pdf.title = `Preview of ${upload.original_filename}`;
            filePreviewContent.append(pdf);
        } else {
            filePreviewContent.textContent = "This file type cannot be previewed in the browser. Open the original file instead.";
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        filePreviewContent.textContent = `Preview unavailable: ${message}`;
    }
}

function hasMissingRequiredFiles(request) {
    return getRequestRequirements(request).some(({ requirement, upload }) =>
        requirement.is_mandatory && !upload
    );
}

function openReviewModal(requestId) {
    selectedRequest = requestData.find(request => request.request_id === requestId);
    if (!selectedRequest) {
        throw new Error(`Request ${requestId} could not be found.`);
    }

    const resident = residentData.find(item => item.resident_id === selectedRequest.resident_id);
    const residentName = getResidentName(resident);
    const requiredFilesMissing = hasMissingRequiredFiles(selectedRequest);
    const verificationComplete = selectedRequest.valid_id_presented
        && selectedRequest.identity_matched
        && selectedRequest.document_and_copies_verified;
    const isFinalStatus = ["Approved", "Rejected", "Released", "Cancelled"].includes(selectedRequest.status);

    reviewSummary.innerHTML = `
        <div>
            <strong>#${selectedRequest.request_id} · ${selectedRequest.document_name}</strong>
            <span class="review-current-status-badge">${selectedRequest.status}</span>
        </div>
        <p>${residentName} · ${formatRequestDate(selectedRequest.request_date)} · ${selectedRequest.number_of_copies} ${selectedRequest.number_of_copies === 1 ? "copy" : "copies"}</p>
        <small>Purpose: ${selectedRequest.purpose || "Not provided"}</small>
    `;

    reviewRequirementsList.innerHTML = renderRequirementCards(selectedRequest);
    reviewResidentIdentity.innerHTML = `
        <p>Resident identity is read-only:</p>
        <span>${residentName}</span>
        <span>${resident?.complete_address || "Address unavailable"}</span>
        <span>${resident?.contact_number || "Contact number unavailable"}</span>
    `;

    currentStatusInput.value = selectedRequest.status;
    const availableStatuses = statusTransitions[selectedRequest.status] || [selectedRequest.status];
    newStatusSelect.innerHTML = availableStatuses
        .map(status => `<option value="${status}">${requestStatusConfig[status]?.label || status}</option>`)
        .join("");
    newStatusSelect.value = selectedRequest.status;
    newStatusSelect.disabled = false;
    staffRemarksInput.value = selectedRequest.remarks || "";
    followUpNoteInput.value = selectedRequest.internal_follow_up_note || "";

    if (requiredFilesMissing) {
        approvalNotice.textContent = "Approval is unavailable while a required file is missing.";
    } else if (!verificationComplete) {
        approvalNotice.textContent = "Approval is unavailable until the ID, identity, and document details are verified.";
    } else if (isFinalStatus) {
        approvalNotice.textContent = "This request is already in a final status. Select a new status to update it.";
    } else {
        approvalNotice.textContent = "Required files and verification are complete. Approve to finalize this request.";
    }

    approveButton.disabled = requiredFilesMissing || !verificationComplete || isFinalStatus;
    rejectButton.disabled = ["Approved", "Rejected", "Released", "Cancelled"].includes(selectedRequest.status);
    reviewModal.showModal();
}

function renderTable() {
    renderStatusCounts();

    const filteredData = requestData.filter(item => {
        const residentName = [
            item.first_name,
            item.middle_name,
            item.last_name,
            item.name_extension
        ].filter(Boolean).join(" ");
        const trimmedSearch = searchQuery.trim().toLowerCase();
        const requestIdSearch = trimmedSearch.startsWith("#");
        const normalizedSearch = trimmedSearch.replace(/^#/, "");

        const matchedStatus = (currentStatus === "All") || (item.status === currentStatus);
        const matchesSearch = !normalizedSearch
            || String(item.request_id).toLowerCase().includes(normalizedSearch)
            || (!requestIdSearch && residentName.toLowerCase().includes(normalizedSearch));
        const matchesDocument = !currentDocument || item.document_name === currentDocument;
        return matchedStatus && matchesSearch && matchesDocument && matchesDateRange(item.request_date);
    });

    const totalEntries = filteredData.length;
    const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalEntries);
    const pageData = filteredData.slice(startIndex, endIndex);
    const htmlRows = pageData.map(item => {
        const statusClass = item.status.toLowerCase().replace(/ /g, "-");
        return `
        <tr>
            <td>#${item.request_id}</td>
            <td><strong>${item.first_name} ${item.middle_name ? `${item.middle_name.charAt(0)}.` : ""} ${item.last_name} ${item.name_extension || ""}</strong></td>
            <td>
                <div>${item.document_name}</div>
                <small style="color: #667085;">${item.remarks || ""}</small>
            </td>
            <td>${item.request_date}</td>
            <td><span class="badge badge-${statusClass}">${item.status}</span></td>
            <td><button type="button" class="action-btn" data-request-id="${item.request_id}">Review</button>
        </tr>
        `;
    }).join("");

    const emptyResultRow = `<tr><td colspan="6" style="text-align:center; color:var(--primary-color);">No requests found.</td></tr>`;
    const renderedRowCount = Math.max(pageData.length, 1);
    const placeholderRows = Array.from(
        { length: Math.max(0, allViewRowCount - renderedRowCount) },
        () => `<tr class="layout-placeholder" aria-hidden="true"><td colspan="6"></td></tr>`
    ).join("");
    tableBody.innerHTML = `${htmlRows || emptyResultRow}${placeholderRows}`;
    showEntries.textContent = `Showing ${totalEntries ? startIndex + 1 : 0}-${endIndex} of ${totalEntries} entries`;
    previousButton.disabled = currentPage === 1;
    currentPageButton.textContent = currentPage;
    currentPageButton.disabled = true;
    currentPageButton.setAttribute("aria-current", "page");
    nextButton.disabled = currentPage >= totalPages;
}

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function saveReview(status) {
    if (!selectedRequest || !reviewForm.reportValidity()) return;
    if (status === "Approved" && status !== selectedRequest.status && approveButton.disabled) return;
    if (status === "Rejected" && status !== selectedRequest.status && rejectButton.disabled) return;

    const previousStatus = selectedRequest.status;
    selectedRequest.status = status;
    selectedRequest.remarks = staffRemarksInput.value.trim();
    selectedRequest.internal_follow_up_note = followUpNoteInput.value.trim();

    if (status === "Approved" && previousStatus !== "Approved") {
        selectedRequest.approval_date = getTodayDate();
    } else if (previousStatus === "Approved") {
        selectedRequest.approval_date = null;
    }
    if (status === "Released" && previousStatus !== "Released") {
        selectedRequest.release_date = getTodayDate();
    } else if (previousStatus === "Released") {
        selectedRequest.release_date = null;
    }

    reviewModal.close();
    renderTable();
}

tableBody.addEventListener("click", event => {
    const reviewButton = event.target.closest(".action-btn[data-request-id]");
    if (reviewButton) openReviewModal(Number(reviewButton.dataset.requestId));
});

document.querySelector("#close-request-review").addEventListener("click", () => {
    reviewModal.close();
});

document.querySelector("#cancel-request-review").addEventListener("click", () => {
    reviewModal.close();
});

reviewForm.addEventListener("submit", event => {
    event.preventDefault();
});

reviewModal.addEventListener("click", event => {
    if (event.target === reviewModal) reviewModal.close();
});

reviewRequirementsList.addEventListener("click", async event => {
    const previewButton = event.target.closest(".review-preview-button");
    if (!previewButton) return;

    const upload = uploadedRequirements.find(
        item => item.uploaded_requirement_id === Number(previewButton.dataset.uploadId)
    );
    if (!upload) {
        throw new Error("The selected requirement upload could not be found.");
    }
    await showFilePreview(upload);
});

document.querySelector("#close-file-preview").addEventListener("click", () => {
    filePreviewModal.close();
});

document.querySelector("#close-file-preview-button").addEventListener("click", () => {
    filePreviewModal.close();
});

filePreviewModal.addEventListener("click", event => {
    if (event.target === filePreviewModal) filePreviewModal.close();
});

document.querySelector("#save-request-review").addEventListener("click", () => {
    saveReview(newStatusSelect.value);
});

approveButton.addEventListener("click", () => {
    saveReview("Approved");
});

rejectButton.addEventListener("click", () => {
    saveReview("Rejected");
});

tabButtons.forEach(button => {
    button.addEventListener("click", (e) => {
        tabButtons.forEach(btn => btn.classList.remove("active"));
        e.currentTarget.classList.add("active");

        currentStatus = e.currentTarget.getAttribute("data-status");
        statusSelect.value = currentStatus === "All" ? "" : currentStatus;
        currentPage = 1;
        renderTable();
    });
});

searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    currentPage = 1;
    renderTable();
});

documentSelect.addEventListener("change", (e) => {
    currentDocument = e.target.value;
    currentPage = 1;
    renderTable();
});

statusSelect.addEventListener("change", (e) => {
    currentStatus = e.target.value || "All";
    tabButtons.forEach(button => {
        button.classList.toggle("active", button.getAttribute("data-status") === currentStatus);
    });
    currentPage = 1;
    renderTable();
});

dateRangeSelect.addEventListener("change", (e) => {
    currentDateRange = e.target.value;
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
    searchQuery = "";
    documentSelect.value = "";
    statusSelect.value = "";
    dateRangeSelect.value = "";
    currentStatus = "All";
    currentDocument = "";
    currentDateRange = "";
    currentPage = 1;
    tabButtons.forEach(button => {
        button.classList.toggle("active", button.getAttribute("data-status") === "All");
    });
    renderTable();
});

renderTable();

