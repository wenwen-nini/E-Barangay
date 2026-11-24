import {
    getResidentInfo,
    getRequestsWithDocuments,
    getStaffRequestDetails,
    markRequestUnderReview,
    returnRequest,
    approveRequest,
    rejectRequest,
    verifyUploadedRequirement
} from "../../services/getServiceForStaff.js";
import { requestStatusConfig } from "../../config/requestStatusConfig.js";

let currentStatus = "All";
let searchQuery = "";
const [requestData, residentData] = await Promise.all([
    getRequestsWithDocuments(),
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
const saveReviewButton = document.querySelector("#save-request-review");
const pageSize = 6;
const allViewRowCount = Math.min(requestData.length, pageSize);
let currentPage = 1;
let currentDocument = "";
let currentDateRange = "";
let selectedRequest = null;
const statusTransitions = {
    Pending: ["Under Review"],
    "Under Review": ["Returned"],
    Returned: [],
    Approved: [],
    Rejected: [],
    Released: [],
    Cancelled: []
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

function formatRequestId(requestId) {
    return `REQ-${String(requestId).padStart(3, "0")}`;
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
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

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
    return (request.requirements || []).map(requirement => ({
        requirement,
        upload: requirement.uploaded_requirement_id
            ? {
                ...requirement,
                request_id: request.request_id,
                uploaded_requirement_id:
                    requirement.uploaded_requirement_id
            }
            : null
    }));
}

function renderRequirementCards(request) {
    const requestRequirements = getRequestRequirements(request);

    if (!requestRequirements.length) {
        return `<p class="review-empty-requirements">No requirements are configured for this document.</p>`;
    }

    return requestRequirements.map(({ requirement, upload }) => {
        const isMissing = Boolean(requirement.is_mandatory) && !upload;

        const verificationStatus = upload?.verification_status || "Pending";

        const statusText = isMissing
            ? "Missing"
            : upload
                ? verificationStatus
                : "Optional";

        const statusClass = isMissing
            ? "missing"
            : upload
                ? verificationStatus.toLowerCase().replace(" ", "-")
                : "optional";

        const fileExtension = upload?.original_filename
            ?.split(".")
            .pop()
            .toUpperCase() || "FILE";

        return `
            <article class="review-requirement-card ${isMissing ? "is-missing" : ""}">
                <div class="review-requirement-heading">
                    <strong>${requirement.requirement_name}</strong>
                    <span class="review-requirement-status ${statusClass}">
                        ${statusText}
                    </span>
                </div>

                ${upload
                    ? `
                        <div class="review-uploaded-file">
                            <span class="review-file-type">${fileExtension}</span>
                            <span class="review-file-details">
                                <strong>${upload.original_filename}</strong>
                                <small>
                                    ${formatUploadedDate(upload.uploaded_at)}
                                    · ${formatFileSize(upload.file_size)}
                                </small>
                            </span>
                        </div>

                        <button
                            type="button"
                            class="review-preview-button"
                            data-upload-id="${upload.uploaded_requirement_id}"
                        >
                            View requirement
                        </button>

                        <div class="review-verification-controls">
                            <label>
                                Staff remarks
                                <textarea
                                    class="requirement-staff-remarks"
                                    data-upload-id="${upload.uploaded_requirement_id}"
                                    placeholder="Explain what needs correction, if any."
                                    rows="2"
                                >${upload.staff_remarks || ""}</textarea>
                            </label>

                            <div class="review-verification-actions">
                                <button
                                    type="button"
                                    class="verify-requirement-button"
                                    data-upload-id="${upload.uploaded_requirement_id}"
                                    data-verification-status="Accepted"
                                >
                                    Accept
                                </button>

                                <button
                                    type="button"
                                    class="verify-requirement-button"
                                    data-upload-id="${upload.uploaded_requirement_id}"
                                    data-verification-status="Needs Correction"
                                >
                                    Needs Correction
                                </button>
                            </div>
                        </div>
                    `
                    : `<p class="review-missing-file">Missing · No file attached</p>`
                }
            </article>
        `;
    }).join("");
}

async function showFilePreview(upload, requestId) {
    filePreviewTitle.textContent = upload.original_filename;

    filePreviewContent.textContent = "Loading file preview...";
    openOriginalFileLink.hidden = true;
    filePreviewModal.showModal();

    if (
        !requestId ||
        !upload.uploaded_requirement_id
    ) {
        filePreviewContent.textContent =
            "Preview unavailable: uploaded file information is incomplete.";
        return;
    }

    const fileUrl =
        `http://127.0.0.1:3000/api/requests/staff/${requestId}/requirements/${upload.uploaded_requirement_id}/preview`;

    try {
        const response = await fetch(fileUrl, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(
                "The uploaded file could not be retrieved."
            );
        }

        const fileBlob = await response.blob();
        const previewUrl = URL.createObjectURL(fileBlob);

        openOriginalFileLink.href = previewUrl;
        openOriginalFileLink.target = "_blank";
        openOriginalFileLink.hidden = false;

        filePreviewContent.replaceChildren();

        if (upload.mime_type?.startsWith("image/")) {
            const image = document.createElement("img");
            image.src = previewUrl;
            image.alt = `Preview of ${upload.original_filename}`;

            filePreviewContent.append(image);

        } else if (upload.mime_type === "application/pdf") {
            const pdf = document.createElement("iframe");
            pdf.src = previewUrl;
            pdf.title = `Preview of ${upload.original_filename}`;

            filePreviewContent.append(pdf);

        } else {
            filePreviewContent.textContent =
                "This file type cannot be previewed in the browser. Open the original file instead.";
        }

    } catch (error) {
        console.error("File preview error:", error);

        filePreviewContent.textContent =
            `Preview unavailable: ${error.message}`;
    }
}


function hasMissingRequiredFiles(request) {
    return getRequestRequirements(request).some(({ requirement, upload }) =>
        requirement.is_mandatory && !upload
    );
}

function hasUnverifiedUploadedRequirements(request) {
    return (request.requirements || []).some(requirement =>
        requirement.uploaded_requirement_id &&
        requirement.verification_status !== "Accepted"
    );
}

function checkReviewChanges() {
    if (!selectedRequest) return;

    const statusChanged =
        newStatusSelect.value !== selectedRequest.status;

    const remarksChanged =
        staffRemarksInput.value.trim() !==
        (selectedRequest.remarks || "").trim();

    const hasChanges = statusChanged || remarksChanged;

    saveReviewButton.disabled = !hasChanges;
}


async function openReviewModal(requestId) {
    try {
        const requestFromList = requestData.find(
            request => request.request_id === requestId
        );

        if (!requestFromList) {
            throw new Error(`Request ${requestId} could not be found.`);
        }

        const requestDetails = await getStaffRequestDetails(requestId);

        console.log(
            "Requirements JSON:",
            JSON.stringify(requestDetails.requirements, null, 2)
        );

        console.log(
            "Uploaded Requirements JSON:",
            JSON.stringify(requestDetails.uploaded_requirements, null, 2)
        );

        selectedRequest = {
            ...requestFromList,
            ...requestDetails
        };

        if (!selectedRequest) {
            throw new Error(`Request ${requestId} could not be found.`);
        }

        const resident = selectedRequest;
        const residentName = getResidentName(resident);
        const requiredFilesMissing = hasMissingRequiredFiles(selectedRequest);
        const isFinalStatus = ["Approved", "Rejected", "Released", "Cancelled"].includes(selectedRequest.status);

        reviewSummary.innerHTML = `
            <div>
                <strong>${formatRequestId(selectedRequest.request_id)} · ${selectedRequest.document_name}</strong>
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

        const availableStatuses =
            statusTransitions[selectedRequest.status] || [];

        newStatusSelect.innerHTML = availableStatuses
            .map(status => `
                <option value="${status}">
                    ${requestStatusConfig[status]?.label || status}
                </option>
            `)
            .join("");

        newStatusSelect.disabled = availableStatuses.length === 0;

        if (availableStatuses.length > 0) {
            newStatusSelect.value = availableStatuses[0];
        }

        staffRemarksInput.value = selectedRequest.remarks || "";
        followUpNoteInput.value = selectedRequest.internal_follow_up_note || "";

        const isUnderReview = selectedRequest.status === "Under Review";
        const canUpdateStatus = availableStatuses.length > 0;

        saveReviewButton.hidden = !canUpdateStatus;
        approveButton.hidden = !isUnderReview;
        rejectButton.hidden = !isUnderReview;

        saveReviewButton.disabled = true;
        checkReviewChanges();

        approvalNotice.textContent =
            selectedRequest.status === "Pending"
                ? "Move this request to Under Review to begin processing."
                : isUnderReview
                    ? "You can return, approve, or reject this request."
                    : selectedRequest.status === "Returned"
                        ? "Waiting for the resident to submit corrected requirements."
                        : "This request is no longer available for review.";

        const hasUnverifiedRequirements =
            hasUnverifiedUploadedRequirements(selectedRequest);

        approveButton.disabled =
            requiredFilesMissing ||
            hasUnverifiedRequirements ||
            isFinalStatus;
        rejectButton.disabled = ["Approved", "Rejected", "Released", "Cancelled"].includes(selectedRequest.status);
        reviewModal.showModal();
    } catch (error) {
        console.error("Open request review error:", error);
        alert(error.message || "Unable to load request details.");
    }
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
            <td>${formatRequestId(item.request_id)}</td>
            <td><strong>${item.first_name} ${item.middle_name ? `${item.middle_name.charAt(0)}.` : ""} ${item.last_name} ${item.name_extension || ""}</strong></td>
            <td>
                <div>${item.document_name}</div>
                <small style="color: #667085;">${item.remarks || ""}</small>
            </td>
            <td>${formatRequestDate(item.request_date)}</td>
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

async function saveReview(status) {
    if (!selectedRequest || !reviewForm.reportValidity()) return;

    const requestId = selectedRequest.request_id;
    const remarks = staffRemarksInput.value.trim();

    if (
        (status === "Returned" || status === "Rejected") &&
        !remarks
    ) {
        alert(
            status === "Returned"
                ? "Please provide remarks explaining what needs to be corrected."
                : "Please provide remarks explaining why this request is rejected."
        );

        staffRemarksInput.focus();
        return;
    }

    try {
        saveReviewButton.disabled = true;
        approveButton.disabled = true;
        rejectButton.disabled = true;

        if (status === "Under Review") {
            await markRequestUnderReview(requestId, remarks);
        } else if (status === "Returned") {
            await returnRequest(requestId, remarks);
        } else if (status === "Approved") {
            await approveRequest(requestId, remarks);
        } else if (status === "Rejected") {
            await rejectRequest(requestId, remarks);
        } else {
            throw new Error("Invalid request status.");
        }

        const updatedRequest = await getStaffRequestDetails(requestId);

        selectedRequest = {
            ...selectedRequest,
            ...updatedRequest
        };

        const requestIndex = requestData.findIndex(
            request => request.request_id === requestId
        );

        if (requestIndex !== -1) {
            requestData[requestIndex] = {
                ...requestData[requestIndex],
                ...updatedRequest
            };
        }

        reviewModal.close();
        renderTable();

    } catch (error) {
        console.error("Save request review error:", error);
        alert(error.message || "Unable to save request update.");

    } finally {
        const isUnderReview = selectedRequest?.status === "Under Review";
        const requiredFilesMissing = selectedRequest
            ? hasMissingRequiredFiles(selectedRequest)
            : true;

        saveReviewButton.disabled = false;

        const hasUnverifiedRequirements = selectedRequest
            ? hasUnverifiedUploadedRequirements(selectedRequest)
            : true;

        approveButton.disabled =
            !isUnderReview ||
            requiredFilesMissing ||
            hasUnverifiedRequirements;
        rejectButton.disabled = !isUnderReview;
    }
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
    // Handle individual requirement verification
    const verifyButton = event.target.closest(
        ".verify-requirement-button"
    );

    if (verifyButton) {
        if (!selectedRequest) return;

        const uploadId = Number(verifyButton.dataset.uploadId);
        const verificationStatus = verifyButton.dataset.verificationStatus;

        const remarksInput = reviewRequirementsList.querySelector(
            `.requirement-staff-remarks[data-upload-id="${uploadId}"]`
        );

        const remarks = remarksInput.value.trim();

        if (verificationStatus === "Needs Correction" && !remarks) {
            alert("Please explain what needs correction.");
            remarksInput.focus();
            return;
        }

        try {
            // Prevent repeated clicks while saving
            const actionButtons = reviewRequirementsList.querySelectorAll(
                `.verify-requirement-button[data-upload-id="${uploadId}"]`
            );

            actionButtons.forEach(button => {
                button.disabled = true;
            });

            await verifyUploadedRequirement(
                selectedRequest.request_id,
                uploadId,
                verificationStatus,
                remarks
            );

            // Update the requirement in the current request
            const requirement = selectedRequest.requirements.find(
                item => item.uploaded_requirement_id === uploadId
            );

            if (requirement) {
                requirement.verification_status = verificationStatus;
                requirement.staff_remarks = remarks || null;
            }

            // Keep the uploaded_requirements array synchronized
            const uploadedRequirement = selectedRequest.uploaded_requirements?.find(
                item => item.uploaded_requirement_id === uploadId
            );

            if (uploadedRequirement) {
                uploadedRequirement.verification_status = verificationStatus;
                uploadedRequirement.staff_remarks = remarks || null;
            }

            // Refresh the requirement cards
            reviewRequirementsList.innerHTML =
                renderRequirementCards(selectedRequest);

            const requiredFilesMissing =
                hasMissingRequiredFiles(selectedRequest);

            const hasUnverifiedRequirements =
                hasUnverifiedUploadedRequirements(selectedRequest);

            approveButton.disabled =
                requiredFilesMissing || hasUnverifiedRequirements;

            alert(
                verificationStatus === "Accepted"
                    ? "Requirement marked as Accepted."
                    : "Requirement marked as Needs Correction."
            );

        } catch (error) {
            console.error("Requirement verification error:", error);
            alert(error.message || "Unable to update requirement verification.");
            
            // Re-enable buttons if the operation failed
            const actionButtons = reviewRequirementsList.querySelectorAll(
                `.verify-requirement-button[data-upload-id="${uploadId}"]`
            );

            actionButtons.forEach(button => {
                button.disabled = false;
            });
        }

        return;
    }

    // Handle file preview
    const previewButton = event.target.closest(".review-preview-button");

    if (!previewButton) return;

    const uploadId = Number(previewButton.dataset.uploadId);

    const upload = selectedRequest.requirements.find(
        requirement =>
            requirement.uploaded_requirement_id === uploadId
    );

    if (!upload) {
        alert("Uploaded requirement not found.");
        return;
    }

    await showFilePreview(upload, selectedRequest.request_id);
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

newStatusSelect.addEventListener("change", checkReviewChanges);

staffRemarksInput.addEventListener("input", checkReviewChanges);

renderTable();

