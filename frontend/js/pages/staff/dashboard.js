import {
    getAnnouncement,
    getRequestsWithDocuments,
    getStaffRequestSummary
} from "../../services/getServiceForStaff.js";
import { formatId } from "../../utils/idFormatter.js";

const iconDirectory = "../../assets/icons/Staff Portal/Dashboard Page/";

function formatDate(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC"
    });
}

function getResidentName(request) {
    if (!request.first_name || !request.last_name) {
        return "Unknown resident";
    }

    const middleInitial = request.middle_name
        ? ` ${request.middle_name.charAt(0)}.`
        : "";

    const nameExtension = request.name_extension
        ? ` ${request.name_extension}`
        : "";

    return `${request.first_name}${middleInitial} ${request.last_name}${nameExtension}`;
}

function getStatusClass(status) {
    return status.toLowerCase().replace(/\s+/g, "-");
}

function renderStatusCards(summary) {
    const container = document.querySelector(".status-cards");
    if (!container) return;

    const cards = [
        {
            label: "Total Requests",
            count: summary.total_requests,
            detail: "All submitted requests",
            icon: "Total Requests Icon (Status Cards).png",
            className: "total"
        },
        {
            label: "Pending",
            count: summary.pending,
            detail: "Awaiting staff review",
            icon: "Pending Icon (Status Cards).png",
            className: "pending"
        },
        {
            label: "Under Review",
            count: summary.under_review,
            detail: "Being reviewed by staff",
            icon: "Under Review Icon (Status Cards).png",
            className: "under-review"
        },
        {
            label: "Approved",
            count: summary.approved,
            detail: "Ready for processing",
            icon: "Approved Icon (Status Cards).png",
            className: "approved"
        }
    ];

    container.innerHTML = cards.map(card => `
        <article class="status-card ${card.className}">
            <img src="${iconDirectory}${card.icon}" alt="">
            <div class="status-card-content">
                <h2>${card.label}</h2>
                <p class="status-count">${card.count}</p>
                <p class="status-detail">${card.detail}</p>
            </div>
        </article>
    `).join("");
}

function renderRecentRequests(requests) {
    const container = document.querySelector(".recent-request-table");
    if (!container) return;

    const recentRequests = [...requests]
        .sort((first, second) => second.request_date.localeCompare(first.request_date))
        .slice(0, 6);

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th scope="col">Request ID</th>
                    <th scope="col">Document Type</th>
                    <th scope="col">Resident Name</th>
                    <th scope="col">Submitted</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${recentRequests.map(request => `
                    <tr>
                        <td class="request-id">${formatId(request.request_id, "REQ", 3)}</td>
                        <td>${request.document_name}</td>
                        <td>${getResidentName(request)}</td>
                        <td>${formatDate(request.request_date)}</td>
                        <td><span class="request-status ${getStatusClass(request.status)}">${request.status}</span></td>
                        <td><button class="review-request-button" type="button" data-request-id="${request.request_id}">Review</button></td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
        <p class="request-table-footnote">Showing ${recentRequests.length} of ${requests.length} sample requests · Open Request Management to view all.</p>
    `;

    container.querySelectorAll(".review-request-button").forEach(button => {
        button.addEventListener("click", () => {
            window.location.href = "request_management.html";
        });
    });
}

function renderNotification(requests) {
    const container = document.querySelector("#notif-detail");
    if (!container) return;

    const pendingCount = requests.filter(
        request => request.status === "Pending"
    ).length;

    const reviewCount = requests.filter(
        request => request.status === "Under Review"
    ).length;

    const details = [];

    if (pendingCount > 0) {
        details.push(
            `${pendingCount} pending ${pendingCount === 1 ? "request" : "requests"}`
        );
    }

    if (reviewCount > 0) {
        details.push(
            `${reviewCount} ${reviewCount === 1 ? "request" : "requests"} under review`
        );
    }

    if (details.length === 0) {
        container.textContent = "No requests need staff attention.";
        return;
    }

    container.textContent =
        `${details.join(" and ")} need staff attention.`;
}

function renderAnnouncement(announcements) {
    const container = document.querySelector(".announcement-card");
    const summary = document.querySelector("#announcement-detail");

    if (!container || !summary) return;

    const latestAnnouncement = announcements
        .filter(item =>
            item.status === "Published" && item.published_at
        )
        .sort((first, second) =>
            new Date(second.published_at) - new Date(first.published_at)
        )[0];

    const publishedCount = announcements.filter(
        item => item.status === "Published"
    ).length;

    if (!latestAnnouncement) {
        container.innerHTML = `
            <p class="empty-announcement">
                No published announcements available.
            </p>
        `;

        summary.textContent = "No published announcements yet.";
        return;
    }

    container.innerHTML = `
        <div class="announcement-heading">
            <h2>Barangay Announcement</h2>
            <p>
                Status: ${latestAnnouncement.status}
                · Published: ${formatDate(latestAnnouncement.published_at)}
            </p>
        </div>

        <h3>${latestAnnouncement.title}</h3>

        <p class="announcement-content">
            ${latestAnnouncement.content}
        </p>
    `;

    summary.textContent =
        `${publishedCount} recent published ${publishedCount === 1 ? "announcement" : "announcements"}.`;
}

async function renderDashboard() {
    const [requests, announcements, summary] = await Promise.all([
        getRequestsWithDocuments(),
        getAnnouncement(),
        getStaffRequestSummary()
    ]);

    renderStatusCards(summary);
    renderRecentRequests(requests);
    renderNotification(requests);
    renderAnnouncement(announcements);

    document.querySelector("#open-request-managament-btn")?.addEventListener("click", () => {
        window.location.href = "request_management.html";
    });

    document.querySelector("#view-announcement-btn")?.addEventListener("click", () => {
        window.location.href = "announcement.html";
    });
}

renderDashboard().finally(() => window.finishPageSkeleton?.());