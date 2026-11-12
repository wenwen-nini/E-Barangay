import { getRequestsWithDocuments, getRequestStatusHistory } from "../../services/requestService.js";
import { getCurrentUser } from "../../core/session.js";
import { requestStatusConfig } from "../../config/requestStatusConfig.js";
import { modalConfig } from "../../config/modalConfig.js";

const currentUser = getCurrentUser();
let residentRequest = [];
let activeFilter = "all";
let activeRequestId = null;

async function generateRequestCards() {
    const container = document.getElementById("request-cards-container");

    try {
        if (!currentUser || !currentUser.resident_id) {
            container.innerHTML = "<p>Unable to load resident information.</p>";
            return;
        }

        const requests = await getRequestsWithDocuments();

        residentRequest = requests.filter(
            request => request.resident_id === currentUser.resident_id
        );

        renderRequestCards();
    } catch (error) {
        console.error("Error loading requests: ", error);
        container.innerHTML = "<p>Unable to load requests.</p>"
    }
}

function renderRequestCards() {
    const container = document.getElementById("request-cards-container");
    if (residentRequest.length === 0) {
        container.innerHTML = "<p>You have no document requests yet.</p>";
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

                <p id="id-date-copy-line">#${request.request_id} ${request.request_date} - ${label(request.number_of_copies)}</p>
                <p>Purpose: ${request.purpose}</p>

                <div class="request-actions">
                    ${actionButtons}
                </div>
            </div>
        `;
    }).join("");

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
        generateRequestTimeline(activeRequestId);
    }

    cardsContainer.querySelectorAll(".request-card").forEach(card => {
        card.classList.toggle(
            "active",
            card.dataset.requestId === activeRequestId
        );
    });

    applyRequestFilter();
}

function applyRequestFilter() {
    const filter = activeFilter.toLowerCase();

    cardsContainer.querySelectorAll(".request-card").forEach(card => {
        const status = card.dataset.status;
        const matchesFilter = filter === "all"
            || (filter === "processing"
                ? status === "under review" || status === "processing"
                : status === filter);

        card.hidden = !matchesFilter;
    });
}

async function generateRequestTimeline(requestId) {
    const container = document.querySelector(".timeline-list");

    try {
        const request = residentRequest.find(
            item => String(item.request_id) === String(requestId)
        );

        if (!request) {
            container.innerHTML = "<p>No timeline available.</p>";
            return;
        }

        document.querySelector("#timeline-request-number").textContent =
            `Request #${request.request_id}`;

        document.querySelector("#timeline-document-name").textContent =
            request.document_name;

        const history = await getRequestStatusHistory(request.request_id);

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
});

function generateModalRequestInfo(request) {

    const config = requestStatusConfig[request.status];

    return `
        <div class="modal-request-card">

            <div class="modal-request-heading">
                <strong>
                    #${request.request_id} - ${request.document_name}
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

modalForm.addEventListener("submit", event => {
    event.preventDefault();
    modalNotice.textContent = "This action cannot be submitted yet because request actions are not connected to a service.";
    modalNotice.classList.add("modal-warning");
});

const newRequestBtn = document.getElementById("new-request");

newRequestBtn.addEventListener("click", () => {
    window.location.href = "../resident/document_request.html";
});