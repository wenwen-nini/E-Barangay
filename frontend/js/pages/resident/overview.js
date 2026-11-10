import { requests } from "../../mock-data/request.js";
import { announcements } from "../../mock-data/announcement.js";
import { notifications } from "../../mock-data/notification.js";

document.addEventListener("DOMContentLoaded", () => {
    const statusListElement = document.getElementById("status-list");
    const requestListElement = document.getElementById("request-list");
    const announcementListElement = document.getElementById("announcement");
    const notificationListElement = document.getElementById("notifications");

    if (statusListElement) {
        statusListElement.data = requests;
    }

    if (requestListElement) {
        requestListElement.data = requests;
    }

    if (announcementListElement) {
        announcementListElement.data = announcements;
    }

    if (notificationListElement) {
        notificationListElement.data = notifications;
    }
});

const quickBtn = document.getElementById("quick-action");

quickBtn.addEventListener("click", () => {
    window.location.href = "../resident/document_catalog.html";
});