import { getRequests, getRequestsWithDocuments, getNotificationOne, getAnnouncementOne, getResidentInfo } from "../../services/requestService.js";
import { getCurrentUser } from "../../core/session.js";

const currentUser = getCurrentUser();

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

        if (!currentUser || !currentUser.resident_id) {
            container.innerHTML = "<p>Unable to load resident information.</p>";
            return;
        }

        const request = await getRequests();

        const residentRequests = request.filter(
            request => request.resident_id === currentUser.resident_id
        );

        const statusCounts = residentRequests.reduce((counts, request) => {

            if (counts[request.status] != undefined) {
                counts[request.status]++;
            }

            return counts;
            
        }, {
            Pending: 0,
            Approved: 0,
            Rejected: 0,
            Released: 0
        });

        container.innerHTML = statusCard.map(card => {
            const iconPath = new URL(
                `../../../assets/icons/Resident Portal/Overview Page/${card.icon}`,
                import.meta.url
            ).href;

            return `
                <div class="status-card">
                    <div class="status-info">
                        <img src="${iconPath}" alt="${card.title}">
                        <h3>${statusCounts[card.status]}</h3>
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
        
        if (!currentUser || !currentUser.resident_id) {
            container.innerHTML = "<p>Unable to load resident information.</p>";
            return;
        }

        const requests = await getRequestsWithDocuments();

        const residentRequests = requests.filter(
            request => request.resident_id === currentUser.resident_id
        )
        .sort((a, b) =>
            new Date(b.request_date) - new Date(a.request_date)
        )
        .slice(0,2);

        container.innerHTML = residentRequests.map(request => {

        const statusClass = `status-${request.status.trim().toLowerCase().replace(/\s+/g, "-")}`;

            return `
                <div class="request-card">
                    <div class="name-status-line">
                        <h1>${request.document_name}</h1>
                        <span class="status badge ${statusClass}">${request.status}</span>
                    </div>
                    <div class="id-date-line">
                        <p>DOC-00${request.document_id}</p>
                        <span> • </span>
                        <p>${request.request_date}</p>
                    </div>
                    <p class="description">${request.description}</p>
                </div>
        `
        }).join("");
    } catch (error) {
        console.error("Error loading requests", error);
    }
}

async function generateNotification() {
    const container = document.querySelector(".notifications");

    try {
        if (!currentUser || !currentUser.resident_id) {
            container.innerHTML = "<p>Unable to load resident information.</p>";
            return;
        }

        const request = await getNotificationOne();

        const residentNotification = request
        .filter(notification => 
            notification.user_id === currentUser.user_id
        )
        .sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        )
        .slice(0,1);

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

            return `
                <div class="notification-card">
                    <div class="notif-title">
                        <img src=${iconPath} alt="${notif.title}">
                        <h4>${notif.title}</h4>
                    </div>
                    <p>${notif.message}</p>
                    <p class="notif-status">${notif.created_at} ${notif.is_read ? "Read" : "Unread"}</p>
            `
        }).join("");
    } catch (error) {
        console.error("Error generating notification", error);
    }
}

async function generateAnnouncement() {
    const container = document.querySelector(".announcements");

    try {
        if (!currentUser || !currentUser.resident_id) {
            container.innerHTML = "<p>Unable to load resident information.</p>";
            return;
        }

        const request = await getAnnouncementOne();

        const residentAnnouncement = request
        .sort((a, b) => 
            new Date(b.published_at) - new Date(a.published_at)
        )
        .slice(0, 1);

        if (residentAnnouncement.length === 0) {
            container.innerHTML = "<p>No announcements available.</p>";
            return;
        }

        container.innerHTML = residentAnnouncement.map(announcement => {

            const iconPath = new URL(
                `../../../assets/icons/General Icons/announcement (blue).png`,
                import.meta.url
            ).href;

            return `
                <div class="announcement-card">
                    <div class="announcement-title">
                        <img src=${iconPath}>
                        <h3>${announcement.title}</h3>
                    </div>
                    <span>Published ${announcement.published_at}<span>
                    <p>${announcement.content}</p>
                </div>
            `
        }).join("");
    } catch (error) {
        console.error("Error generating announement", error);
    }
}

async function generateResidentName() {
    const container = document.querySelector(".introduction");

    try {
        if (!currentUser || !currentUser.resident_id) {
            return null;
        }

        const residents = await getResidentInfo();

        const residentInfo = residents.find(
            resident => resident.resident_id === currentUser.resident_id
        );

        const residentName = residentInfo.first_name;

        console.log(residentInfo);

        container.innerHTML =
                `
                <p>Resident Portal / Overview</p>
                <h1>Good day, <span>${residentName}!</span></h1>
                <p>Welcome back, Here's an overview of your document requests.</p>
            `;
    } catch (error) {
        console.error("Error retrieving resident name:", error);
        return null;
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


