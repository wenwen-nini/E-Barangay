import { 
    getRequestSummary,
    getRecentRequests,
 } from "../../services/requestServices.js";
import { getAnnouncements } from "../../services/announcementServices.js";
import { getNotifications } from "../../services/notificationServices.js";
import { getCurrentUserProfile } from "../../services/profileServices.js";
import { formatId } from "../../utils/idFormatter.js";

const statusCard = [
    {
        title: "Pending",
        status: "Pending",
        icon: "Status Card Pending.png"
    },
    {
        title: "Approved",
        status: "Approved",
        icon: "Status Card Approved.png"
    },
    {
        title: "Rejected",
        status: "Rejected",
        icon: "Status Card Rejected.png"
    },
    {
        title: "Released",
        status: "Released",
        icon: "Status Card Box.png"
    }
];

async function generateStatusCards() {
    const container = document.querySelector(".status-card-container");

    try {
        const data = await getRequestSummary();

        if (!data.success || !data.summary) {
            throw new Error("Unable to retrieve request summary.");
        }

        const summary = data.summary;

        const statusCounts = {
            Pending: Number(summary.pending),
            Approved: Number(summary.approved),
            Rejected: Number(summary.rejected),
            Released: Number(summary.released)
        };

        container.innerHTML = statusCard.map(card => {
            const iconPath = new URL(
                `../../../assets/icons/Resident Portal/Overview Page/${card.icon}`,
                import.meta.url
            ).href;

            return `
                <div class="status-card">
                    <div class="status-info">
                        <img src="${iconPath}" alt="${card.title}">
                        <h3>${statusCounts[card.status] ?? 0}</h3>
                        <p>${card.title}</p>
                    </div>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error("Error loading status:", error);
        container.innerHTML = "<p>Unable to load request summary.</p>";
    }
}

async function generateRecentRequests() {
    const container = document.querySelector(".request-list");

    try {
        const requests = await getRecentRequests();

        if (!requests || requests.length === 0) {
            container.innerHTML = "<p>No recent requests found.</p>";
            return;
        }

        container.innerHTML = requests.map(request => {
            const statusClass = `status-${request.status
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "-")}`;

            const activityDate = request.activity_date
                ? new Date(
                    String(request.activity_date).replace(" ", "T")
                ).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                })
                : "No date available";

            return `
                <div class="request-card">
                    <div class="name-status-line">
                        <h1>${request.document_name}</h1>
                        <span class="status badge ${statusClass}">
                            ${request.status}
                        </span>
                    </div>

                    <div class="id-date-line">
                        <p>${formatId(request.document_id, "DOC", 3)}</p>
                        <span> • </span>
                        <p>${activityDate}</p>
                    </div>

                    <p class="description">
                        ${request.remarks || "No remarks available."}
                    </p>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error("Generate recent requests error:", error);
        container.innerHTML = "<p>Unable to load recent requests.</p>";
    }
}

async function generateNotification() {
    const container = document.querySelector(".notifications");

    try {
        const notifications = await getNotifications();

        const residentNotification = notifications
            .sort((a, b) =>
                new Date(b.created_at) - new Date(a.created_at)
            )
            .slice(0, 1);

        console.log(residentNotification);

        if (residentNotification.length === 0) {
            container.innerHTML = "<p>No notifications yet.</p>";
            return;
        }

        container.innerHTML = residentNotification.map(notif => {

            const iconPath = new URL(
                `../../../assets/icons/Resident Portal/Overview Page/Notification.png`,
                import.meta.url
            ).href;

            const notificationDate = notif.created_at
                ? new Date(
                    String(notif.created_at).replace(" ", "T")
                ).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                })
                : "Date unavailable";

            return `
                <div class="notification-card">
                    <div class="notif-title">
                        <img src="${iconPath}" alt="${notif.title}">
                        <h4>${notif.title}</h4>
                    </div>
                    <p>${notif.message}</p>
                    <p class="notif-status">
                        ${notificationDate} ${Number(notif.is_read) ? "Read" : "Unread"}
                    </p>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error("Error generating notification:", error);
        container.innerHTML = "<p>Unable to load notifications.</p>";
    }
}

async function generateAnnouncement() {
    const container = document.querySelector(".announcements");

    try {
        const announcements = await getAnnouncements();

        if (!announcements || announcements.length === 0) {
            container.innerHTML = `
                <p class="empty-message">
                    No announcements available at the moment.
                </p>
            `;
            return;
        }

        const latestAnnouncement = announcements.sort(
            (a, b) => new Date(b.published_at) - new Date(a.published_at)
        )[0];

        const publishedDate = latestAnnouncement.published_at
            ? new Date(
                String(latestAnnouncement.published_at).replace(" ", "T")
            ).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
            })
            : "Date unavailable";

        container.innerHTML = `
            <div class="announcement-card">
                <h3>${latestAnnouncement.title}</h3>
                <p>${latestAnnouncement.content}</p>
                <span>${publishedDate}</span>
            </div>
        `;

    } catch (error) {
        console.error("Generate announcement error:", error);

        container.innerHTML = `
            <p class="empty-message">
                Unable to load announcements.
            </p>
        `;
    }
}

async function generateResidentName() {
    const nameDisplay = document.getElementById("resident-greeting");

    try {
        const profileData = await getCurrentUserProfile();

        if (
            !profileData.success ||
            !profileData.profile ||
            profileData.profile.role !== "Resident"
        ) {
            nameDisplay.textContent = "Good day, Resident!";
            return;
        }

        const resident = profileData.profile;

        const firstName = resident.resident_first_name || "Resident";

        nameDisplay.textContent = `Good day, ${firstName}!`;

    } catch (error) {
        console.error("Generate resident name error:", error);
        nameDisplay.textContent = "Good day, Resident!";
    }
}

const quickBtn = document.getElementById("quick-action");

quickBtn.addEventListener("click", () => {
    window.location.href = "../resident/document_catalog.html";
});

document.addEventListener("DOMContentLoaded", () => {
    generateNotification();
    generateStatusCards();
    generateRecentRequests();
    generateAnnouncement();
    generateResidentName();
});


