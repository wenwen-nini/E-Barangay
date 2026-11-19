import {
    getAnnouncement,
    getRequestsWithDocuments,
    getResidentInfo
} from "../../services/getServiceForStaff.js";

const iconDirectory = "../../assets/icons/Staff Portal/Dashboard Page/";

function formatDate(value) {
    if (!value) return "Date unavailable";

    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function getResidentName(request, residents) {
    const resident = residents.find(item => item.resident_id === request.resident_id);
    if (!resident) return "Unknown resident";

    const middleInitial = resident.middle_name
        ? ` ${resident.middle_name.charAt(0)}.`
        : "";
    return `${resident.first_name}${middleInitial} ${resident.last_name}`;
}

function getStatusClass(status) {
    return status.toLowerCase().replace(/\s+/g, "-");
}

function renderStatusCards(requests) {
    const container = document.querySelector(".status-cards");
    if (!container) return;

    const cards = [
        {
            label: "Total Requests",
            count: requests.length,
            detail: "All submitted requests",
            icon: "Total Requests Icon (Status Cards).png",
            className: "total"
        },
        {
            label: "Pending",
            count: requests.filter(request => request.status === "Pending").length,
            detail: "Awaiting staff review",
            icon: "Pending Icon (Status Cards).png",
            className: "pending"
        },
        {
            label: "Under Review",
            count: requests.filter(request => request.status === "Under Review").length,
            detail: "Being reviewed by staff",
            icon: "Under Review Icon (Status Cards).png",
            className: "under-review"
        },
        {
            label: "Approved",
            count: requests.filter(request => request.status === "Approved").length,
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

function renderRecentRequests(requests, residents) {
    const container = document.querySelector(".recent-request-table");
    if (!container) return;

    const recentRequests = [...requests]
        .sort((first, second) => second.request_date.localeCompare(first.request_date))
        .slice(0, 3);

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
                        <td class="request-id">#${request.request_id}</td>
                        <td>${request.document_name}</td>
                        <td>${getResidentName(request, residents)}</td>
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

    const pendingCount = requests.filter(request => request.status === "Pending").length;
    const reviewCount = requests.filter(request => request.status === "Under Review").length;
    const details = [];
    if (pendingCount) {
        details.push(`${pendingCount} pending ${pendingCount === 1 ? "request" : "requests"}`);
    }
    if (reviewCount) {
        details.push(`${reviewCount} ${reviewCount === 1 ? "request" : "requests"} under review`);
    }
    container.textContent = details.length
        ? `${details.join(" and ")}.`
        : "No requests need staff attention.";
}

function renderAnnouncement(announcements) {
    const container = document.querySelector(".announcement-card");
    const summary = document.querySelector("#announcement-detail");
    if (!container || !summary) return;

    const published = announcements
        .filter(item => item.status === "Published")
        .sort((first, second) => second.published_at.localeCompare(first.published_at));
    const announcement = published[0];
    const draftCount = announcements.filter(item => item.status === "Draft").length;

    if (!announcement) {
        container.innerHTML = "<p class=\"empty-announcement\">No announcements have been published.</p>";
    } else {
        container.innerHTML = `
            <div class="announcement-heading">
                <h2>Barangay Announcements</h2>
                <p>Published · ${formatDate(announcement.published_at)} · All residents</p>
            </div>
            <h3>${announcement.title}</h3>
            <p class="announcement-content">${announcement.content}</p>
        `;
    }

    const publishedCount = announcements.filter(item => item.status === "Published").length;
    summary.textContent = `${publishedCount} published ${publishedCount === 1 ? "announcement" : "announcements"} and ${draftCount} ${draftCount === 1 ? "draft are" : "drafts are"} currently available for staff review.`;
}

async function renderDashboard() {
    const [requests, announcements, residents] = await Promise.all([
        getRequestsWithDocuments(),
        getAnnouncement(),
        getResidentInfo()
    ]);

    renderStatusCards(requests);
    renderRecentRequests(requests, residents);
    renderNotification(requests);
    renderAnnouncement(announcements);

    document.querySelector("#open-request-managament-btn")?.addEventListener("click", () => {
        window.location.href = "request_management.html";
    });

    document.querySelector("#view-announcement-btn")?.addEventListener("click", () => {
        window.location.href = "announcement.html";
    });
}

renderDashboard();