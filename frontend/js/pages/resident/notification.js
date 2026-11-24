import { getNotifications, markNotificationAsRead } from "../../services/notificationServices.js";
import { getRequestsWithDocuments } from "../../services/requestServices.js";

const listContainer = document.getElementById("notification-list-container");
const filterButtons = document.querySelectorAll(".notification-filter");
const allCount = document.getElementById("all-count");
const unreadCount = document.getElementById("unread-count");
const summaryUnread = document.getElementById("summary-unread");
const summaryTotal = document.getElementById("summary-total");

let residentNotifications = [];
let residentRequests = [];
let activeFilter = "all";

function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
}

function parseNotificationDate(value) {
    const normalizedValue = value.includes(" ")
        ? value.replace(" ", "T")
        : `${value}T00:00:00`;
    const date = new Date(normalizedValue);
    return Number.isNaN(date.getTime()) ? null : date;
}

function getGroupName(value) {
    const date = parseNotificationDate(value);
    if (!date) {
        return "Earlier";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const notificationDay = new Date(date);
    notificationDay.setHours(0, 0, 0, 0);
    const dayDifference = Math.floor(
        (today.getTime() - notificationDay.getTime()) / 86400000
    );

    if (dayDifference <= 0) {
        return "Today";
    }
    if (dayDifference === 1) {
        return "Yesterday";
    }
    return "Earlier";
}

function formatNotificationDate(value) {
    const date = parseNotificationDate(value);
    if (!date) {
        return "Date unavailable";
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric"
    }).format(date);
}

function getStatusIcon(notification) {
    const content = `${notification.title || ""} ${notification.message || ""}`.toLowerCase();
    let asset = "Notification.png";

    if (/reject|missing|action required/.test(content)) {
        asset = "Status Card Rejected.png";
    } else if (/approv|ready for pickup|ready for collection/.test(content)) {
        asset = "Status Card Approved.png";
    } else if (/review|process|pending/.test(content)) {
        asset = "Status Card Pending.png";
    }

    return new URL(
        `../../../assets/icons/Resident Portal/Overview Page/${asset}`,
        import.meta.url
    ).href;
}

function createNotificationCard(notification, index) {
    const card = document.createElement("article");
    const isRead = Number(notification.is_read) === 1;
    card.className = `notification-card ${isRead ? "read" : "unread"}${index === 0 ? " latest" : ""}`;

    const icon = document.createElement("img");
    icon.className = "notification-status-icon";
    icon.src = getStatusIcon(notification);
    icon.alt = "";

    const content = document.createElement("div");
    content.className = "notification-card-content";
    content.appendChild(
        createTextElement(
            "p",
            "notification-message",
            notification.message || notification.title || "You have a new notification."
        )
    );
    content.appendChild(
        createTextElement(
            "p",
            "notification-date",
            formatNotificationDate(notification.created_at)
        )
    );

    const request = residentRequests.find(
        item => String(item.request_id) === String(notification.request_id)
    );
    const link = document.createElement("a");
    link.className = "notification-action";
    link.href = request
        ? "../resident/my_request.html"
        : "../resident/announcement.html";
    link.textContent = request
        ? request.status === "Returned"
            ? "Submit a request →"
            : "View request →"
        : "View announcement →";
    content.appendChild(link);

    const unreadIndicator = document.createElement("span");
    unreadIndicator.className = "unread-indicator";
    unreadIndicator.setAttribute("aria-label", isRead ? "Read" : "Unread");

    card.append(icon, content, unreadIndicator);

    card.addEventListener("click", async (event) => {
        if (Number(notification.is_read) === 1) {
            return;
        }

        const clickedLink = event.target.closest("a");
        const destination = clickedLink ? clickedLink.href : null;

        if (destination) {
            event.preventDefault();
        }

        try {
            await markNotificationAsRead(notification.notification_id);

            notification.is_read = 1;

            updateCounts();

            if (destination) {
                window.location.href = destination;
                return;
            }

            renderNotifications();

        } catch (error) {
            console.error("Unable to mark notification as read:", error);
        }
    });

    return card;
}

function updateCounts() {
    const unreadTotal = residentNotifications.filter(
        notification => Number(notification.is_read) === 0
    ).length;

    allCount.textContent = String(residentNotifications.length);
    unreadCount.textContent = String(unreadTotal);
    summaryUnread.textContent = String(unreadTotal);
    summaryTotal.textContent = String(residentNotifications.length);
}

function renderNotifications() {
    const filteredNotifications = residentNotifications.filter(
        notification => activeFilter === "all" || Number(notification.is_read) === 0
    );

    if (filteredNotifications.length === 0) {
        listContainer.replaceChildren(
            createTextElement(
                "p",
                "notification-empty",
                activeFilter === "unread"
                    ? "You have no unread notifications."
                    : "You have no notifications yet."
            )
        );
        return;
    }

    const groups = new Map();
    filteredNotifications.forEach(notification => {
        const groupName = getGroupName(notification.created_at);
        if (!groups.has(groupName)) {
            groups.set(groupName, []);
        }
        groups.get(groupName).push(notification);
    });

    const fragment = document.createDocumentFragment();
    let index = 0;
    ["Today", "Yesterday", "Earlier"].forEach(groupName => {
        const notifications = groups.get(groupName);
        if (!notifications || notifications.length === 0) {
            return;
        }

        const group = document.createElement("section");
        group.className = "notification-group";
        group.appendChild(createTextElement("h2", "", groupName));

        const groupList = document.createElement("div");
        groupList.className = "notification-group-list";
        notifications.forEach(notification => {
            groupList.appendChild(createNotificationCard(notification, index));
            index += 1;
        });

        group.appendChild(groupList);
        fragment.appendChild(group);
    });

    listContainer.replaceChildren(fragment);
}

function setActiveFilter(filter) {
    activeFilter = filter;
    filterButtons.forEach(button => {
        const isActive = button.dataset.filter === filter;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
    renderNotifications();
}

async function initializeNotifications() {
    try {
        const [notifications, requests] = await Promise.all([
            getNotifications(),
            getRequestsWithDocuments()
        ]);

        residentRequests = requests;

        residentNotifications = notifications.sort((first, second) => {
            const firstDate = parseNotificationDate(first.created_at);
            const secondDate = parseNotificationDate(second.created_at);

            return (secondDate?.getTime() ?? 0) -
                (firstDate?.getTime() ?? 0);
        });

        updateCounts();
        renderNotifications();

    } catch (error) {
        console.error("Error loading notifications:", error);

        listContainer.replaceChildren(
            createTextElement(
                "p",
                "notification-error",
                error.message || "Unable to load notifications."
            )
        );
    }
}

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        setActiveFilter(button.dataset.filter);
    });
});

initializeNotifications();
