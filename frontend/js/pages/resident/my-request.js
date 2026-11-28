import { 
    getRequestsWithDocuments, 
    getRequestStatusHistory, 
    getResidentRequestDetails,
    getDocumentRequirements,
    reuploadRequestRequirements,
    submitRequestFollowUp,
    cancelResidentRequest
} from "../../services/requestServices.js";
import { requestStatusConfig } from "../../config/requestStatusConfig.js";
import { modalConfig } from "../../config/modalConfig.js";
import { shortFormatDateTime } from "../../utils/dateFormatter.js";
import { formatId } from "../../utils/idFormatter.js";

let residentRequest = [];
let activeFilter = "all";
let activeRequestId = null;
let activeModalAction = null;
let timelineRequestVersion = 0;

async function generateRequestCards() {
    try {
        const requests = await getRequestsWithDocuments();

        console.log("Retrieved requests:", requests);

        residentRequest = Array.isArray(requests)
            ? requests
            : [];

        await renderRequestCards();

    } catch (error) {
        console.error("Error loading requests:", error);
        cardsContainer.innerHTML = `
            <div class="request-empty-state">
                <p>Unable to load requests.</p>
            </div>
        `;
        hideRequestTimeline();
    }
}

function renderRequestCards() {
    const container = document.getElementById("request-cards-container");
    if (residentRequest.length === 0) {
        container.innerHTML = `
            <div class="request-empty-state">
                <img src="../../assets/icons/General Icons/No request match filters.png" alt="">
                <h3>No document requests yet</h3>
                <p>New requests you submit will appear here.</p>
            </div>
        `;
        hideRequestTimeline();
        return;
    }

    container.innerHTML = residentRequest.map(request => {
        const config = requestStatusConfig[request.status];

        if (!config) return "";

        const actionButtons = config.actions.map(action => {
            return `
                <button
                    class="request-action"
                    data-action="${action}"
                    data-id="${request.request_id}">
                    ${action}
                </button>
            `;
        }).join("");

        const label = (n) => `${n} ${n === 1 ? 'copy' : 'copies'}`;

        return `
            <div class="request-card" data-request-id="${request.request_id}" data-status="${request.status.toLowerCase()}">
                <div class="name-status-line">
                    <h3>${request.document_name}</h3>
                    <span class="status-badge status-${config.cssClass}">
                        ${config.label}
                    </span>
                </div>

                <p id="id-date-copy-line">${formatId(request.request_id, "REQ", 3)} ● ${shortFormatDateTime(request.request_date)} - ${label(request.number_of_copies)}</p>
                <p>Purpose: ${request.purpose}</p>

                <div class="request-actions">
                    ${actionButtons}
                </div>
            </div>
        `;
    }).join("");

    let timelineLoad = Promise.resolve();
    const selectedRequest = residentRequest.find(
        request => String(request.request_id) === activeRequestId
    );

    if (!selectedRequest) {
        const latestRequest = residentRequest.reduce((latest, request) =>
            new Date(request.request_date) > new Date(latest.request_date)
                ? request
                : latest
        );
        activeRequestId = String(latestRequest.request_id);
        timelineLoad = generateRequestTimeline(activeRequestId);
    }

    cardsContainer.querySelectorAll(".request-card").forEach(card => {
        card.classList.toggle(
            "active",
            card.dataset.requestId === activeRequestId
        );
    });

    applyRequestFilter();
    return timelineLoad;
}

function applyRequestFilter() {
    const filter = activeFilter.toLowerCase();
    const cards = Array.from(
        cardsContainer.querySelectorAll(".request-card")
    );
    let visibleCards = [];

    cards.forEach(card => {
        const status = card.dataset.status;
        const matchesFilter = filter === "all"
            || (filter === "processing"
                ? status === "under review" || status === "processing"
                : status === filter);

        card.hidden = !matchesFilter;
        if (matchesFilter) visibleCards.push(card);
    });

    cardsContainer.querySelector(".request-empty-state")?.remove();

    if (visibleCards.length === 0) {
        cardsContainer.insertAdjacentHTML("beforeend", `
            <div class="request-empty-state">
                <img src="../../assets/icons/General Icons/No request match filters.png" alt="">
                <h3>No requests found</h3>
                <p>There are no ${activeFilter === "all" ? "" : activeFilter} requests to display.</p>
            </div>
        `);
        hideRequestTimeline();
        return;
    }

    const activeCardIsVisible = visibleCards.some(
        card => card.dataset.requestId === activeRequestId
    );
    const selectedCard = activeCardIsVisible
        ? visibleCards.find(card => card.dataset.requestId === activeRequestId)
        : visibleCards[0];

    activeRequestId = selectedCard.dataset.requestId;
    cards.forEach(card => {
        card.classList.toggle(
            "active",
            card.dataset.requestId === activeRequestId
        );
    });

    showRequestTimeline();
    generateRequestTimeline(activeRequestId);
}

function showRequestTimeline() {
    const layout = document.querySelector(".request-list-layout");
    const timeline = document.querySelector(".request-timeline");
    layout?.classList.remove("no-results");
    if (timeline) timeline.hidden = false;
}

function hideRequestTimeline() {
    const layout = document.querySelector(".request-list-layout");
    const timeline = document.querySelector(".request-timeline");
    timelineRequestVersion++;
    layout?.classList.add("no-results");
    if (timeline) timeline.hidden = true;
}

async function generateRequestTimeline(requestId) {
    const container = document.querySelector(".timeline-list");
    const requestVersion = ++timelineRequestVersion;

    try {
        const request = residentRequest.find(
            item => String(item.request_id) === String(requestId)
        );

        if (!request) {
            container.innerHTML = "<p>No timeline available.</p>";
            return;
        }

        if (String(activeRequestId) !== String(requestId)
            || requestVersion !== timelineRequestVersion) {
            return;
        }

        document.querySelector("#timeline-request-number").textContent =
            `${formatId(request.request_id, "REQ", 3)}`;

        document.querySelector("#timeline-document-name").textContent =
            request.document_name;

        const history = await getRequestStatusHistory(request.request_id);

        if (String(activeRequestId) !== String(requestId)
            || requestVersion !== timelineRequestVersion) {
            return;
        }

        container.innerHTML = history.map((record, index) => {

            const isLast = index === history.length - 1;

            const formattedDate = new Date(
                record.changed_at.replace(" ", "T")
            ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric"
            });

            return `
                <div class="timeline-item">
                    <div class="timeline-indicator">
                        <span class="timeline-dot"></span>

                        ${!isLast ? `
                            <span class="timeline-line"></span>
                        ` : ""}
                    </div>

                    <div class="timeline-content">
                        <p class="timeline-status">
                            ${record.status === "Under Review"
                                ? "Processing"
                                : record.status}
                        </p>

                        <span class="timeline-date">
                            ${formattedDate}
                        </span>
                        ${record.remarks ? `
                            <p class="timeline-remarks">${record.remarks}</p>
                        ` : ""}
                    </div>
                </div>
            `;
        }).join("");

        if (history.length === 0) {
            container.innerHTML = "<p>No timeline available.</p>";
        }

    } catch (error) {
        console.error("Error loading timeline:", error);
        if (String(activeRequestId) !== String(requestId)
            || requestVersion !== timelineRequestVersion) {
            return;
        }
        container.innerHTML = "<p>Unable to load timeline.</p>";
    }
}

const cardsContainer = document.getElementById("request-cards-container");

cardsContainer.addEventListener("click", event => {
    const card = event.target.closest(".request-card");

    if (!card || !cardsContainer.contains(card)) return;

    activeRequestId = card.dataset.requestId;
    cardsContainer.querySelectorAll(".request-card").forEach(item => {
        item.classList.toggle(
            "active",
            item.dataset.requestId === activeRequestId
        );
    });

    generateRequestTimeline(activeRequestId);
});

document.querySelector(".filter-rows").addEventListener("click", event => {
    const button = event.target.closest(".filter-btns");

    if (!button) return;

    activeFilter = button.id;
    document.querySelectorAll(".filter-btns").forEach(filterButton => {
        const isActive = filterButton === button;
        filterButton.classList.toggle("active", isActive);
        filterButton.setAttribute("aria-pressed", String(isActive));
    });
    applyRequestFilter();
});

document.addEventListener("DOMContentLoaded", async () => {
    await generateRequestCards();

    document.querySelectorAll(".filter-btns").forEach(button => {
        const isActive = button.id === activeFilter;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });

    window.finishPageSkeleton?.();
});

function generateModalRequestInfo(request) {

    const config = requestStatusConfig[request.status];

    return `
        <div class="modal-request-card">

            <div class="modal-request-heading">
                <strong>
                    #${formatId(request.request_id, "REQ", 3)} - ${request.document_name}
                </strong>

                <span class="status-badge status-${config?.cssClass ?? ""}">
                    ${config?.label ?? request.status}
                </span>
            </div>

            <p>
                ${request.request_date} -
                ${request.number_of_copies}
                ${request.number_of_copies === 1 ? "copy" : "copies"}
            </p>

            <p>Purpose: ${request.purpose}</p>

        </div>
    `;
}

const modal = document.getElementById("request-modal");
const modalForm = document.getElementById("modal-form");
const modalNotice = document.getElementById("modal-notice");
const modalContent = document.getElementById("modal-content");


async function loadMissingRequirements(requestId) {
    const container = document.getElementById(
        "missing-requirements-container"
    );

    container.innerHTML = "<p>Loading requirements...</p>";

    try {
        const request = await getResidentRequestDetails(requestId);

        const uploadedRequirements = request.uploaded_requirements || [];

        const uploadedMap = new Map(
            uploadedRequirements.map(item => [
                Number(item.requirement_id),
                item
            ])
        );

        const documentRequirements = await getDocumentRequirements(
            request.document_id
        );

        container.innerHTML = "";

        documentRequirements.forEach(requirement => {
            const uploaded = uploadedMap.get(
                Number(requirement.requirement_id)
            );

            const isMissing = !uploaded;
            const verificationStatus =
                uploaded?.verification_status || null;

            const needsCorrection =
                verificationStatus === "Needs Correction";

            const canUpload = isMissing || needsCorrection;

            const requirementGroup = document.createElement("div");
            requirementGroup.classList.add("missing-requirement-group");

            const label = document.createElement("label");
            label.classList.add("modal-label");

            label.textContent = requirement.requirement_name;

            const status = document.createElement("p");
            status.classList.add("requirement-upload-status");

            if (isMissing) {
                status.textContent = "Missing requirement";
                status.classList.add("missing");
            } else if (needsCorrection) {
                status.textContent = "Needs Correction";
                status.classList.add("needs-correction");
            } else if (verificationStatus === "Accepted") {
                status.textContent = "Accepted";
                status.classList.add("accepted");
            } else {
                status.textContent = "Awaiting staff verification";
                status.classList.add("pending");
            }

            requirementGroup.append(label, status);

            if (needsCorrection && uploaded.staff_remarks) {
                const remarks = document.createElement("p");
                remarks.classList.add("requirement-correction-remarks");
                remarks.textContent =
                    `Staff remarks: ${uploaded.staff_remarks}`;

                requirementGroup.appendChild(remarks);
            }

            if (canUpload) {
                const input = document.createElement("input");

                input.type = "file";
                input.name = "requirements";
                input.accept = ".jpg,.jpeg,.png,.pdf";
                input.dataset.requirementId = requirement.requirement_id;

                if (Number(requirement.is_mandatory) === 1) {
                    input.required = true;
                }

                requirementGroup.appendChild(input);
            }

            container.appendChild(requirementGroup);
        });

    } catch (error) {
        console.error("Load missing requirements error:", error);

        container.innerHTML =
            "<p>Unable to load document requirements.</p>";
    }
}

function openRequestModal(action, requestId) {

    const request = residentRequest.find(
        item => String(item.request_id) === String(requestId)
    );

    const modalAction = {
        "Cancel-Request": "Cancel Request",
        "Submit missing documents": "Submit Missing Documents"
    }[action] ?? action;
    const config = modalConfig[modalAction];

    if (!request) {
        console.error(`Request ${requestId} was not found.`);
        return;
    }

    if (!config) {
        console.error(`No modal configuration found for action "${action}".`);
        return;
    }

    activeModalAction = modalAction;
    activeRequestId = requestId;

    document.getElementById("modal-title").textContent =
        config.title;

    document.getElementById("modal-description").textContent =
        config.description;

    document.getElementById("modal-request-info").innerHTML =
        generateModalRequestInfo(request);

    modalContent.innerHTML =
        config.content;

    document.getElementById("modal-submit").textContent =
        config.submitLabel;

    const notice = modalAction === "Submit Missing Documents"
        ? `Staff remarks: ${request.remarks ?? "Please review the missing requirements."}`
        : modalAction === "Cancel Request"
            ? "Cancellation is only available for pending requests."
            : "";
    modalNotice.textContent = notice;
    modalNotice.classList.toggle("modal-warning", Boolean(notice));

    if (modalAction === "Submit Missing Documents") {
        loadMissingRequirements(requestId);
    }

    modal.showModal();
}

cardsContainer.addEventListener("click", event => {

    const button = event.target.closest(".request-action");

    if (!button) return;

    const action = button.dataset.action;
    const requestId = button.dataset.id;

    openRequestModal(action, requestId);
});

document.getElementById("close-modal").addEventListener("click", () => {
    modal.close();
});

document.getElementById("cancel-modal").addEventListener("click", () => {
    modal.close();
});

modal.addEventListener("click", event => {
    if (event.target === modal) {
        modal.close();
    }
});

modal.addEventListener("close", () => {
    modalForm.reset();
    modalContent.replaceChildren();
    modalNotice.textContent = "";
    modalNotice.classList.remove("modal-warning");
});

modalForm.addEventListener("submit", async event => {
    event.preventDefault();

    const submitButton = document.getElementById("modal-submit");

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    try {
        if (activeModalAction === "Follow-up") {
            const message = document
                .getElementById("follow-up-message")
                .value.trim();

            if (!message) {
                throw new Error("Please enter your follow-up message.");
            }

            const result = await submitRequestFollowUp(
                activeRequestId,
                message
            );

            modalNotice.textContent = result.message;
            modalNotice.classList.remove("modal-warning");

            modal.close();

            await generateRequestCards();

            return;
        }

        if (activeModalAction === "Submit Missing Documents") {
            const requirementInputs = document.querySelectorAll(
                "#missing-requirements-container input[type='file']"
            );

            const formData = new FormData();
            const requirementIds = [];

            requirementInputs.forEach(input => {
                const file = input.files[0];

                if (file) {
                    formData.append("requirements", file);
                    requirementIds.push(input.dataset.requirementId);
                }
            });

            if (requirementIds.length === 0) {
                throw new Error(
                    "Please select at least one corrected requirement."
                );
            }

            formData.append(
                "requirement_ids",
                JSON.stringify(requirementIds)
            );

            const result = await reuploadRequestRequirements(
                activeRequestId,
                formData
            );

            modalNotice.textContent = result.message;
            modalNotice.classList.remove("modal-warning");

            modal.close();

            await generateRequestCards();

            return;
        }

        if (activeModalAction === "Cancel Request") {
            const reason = document
                .getElementById("cancellation-reason")
                .value.trim();

            const result = await cancelResidentRequest(
                activeRequestId,
                reason
            );

            modalNotice.textContent = result.message;
            modalNotice.classList.remove("modal-warning");

            modal.close();

            await generateRequestCards();

            return;
        }

        throw new Error("This action is not connected to a service yet.");

    } catch (error) {
        console.error("Request action error:", error);

        modalNotice.textContent =
            error.message || "Unable to submit your request.";

        modalNotice.classList.add("modal-warning");

    } finally {
        submitButton.disabled = false;
        submitButton.textContent =
            modalConfig[activeModalAction]?.submitLabel || "Submit";
    }
});

const newRequestBtn = document.getElementById("new-request");

newRequestBtn.addEventListener("click", () => {
    window.location.href = "../resident/document_request.html";
});