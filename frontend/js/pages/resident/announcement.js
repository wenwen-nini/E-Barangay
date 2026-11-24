import { getAnnouncements } from "../../services/announcementServices.js";
import { getNotifications } from "../../services/notificationServices.js";

const announcementList = document.getElementById("announcement-list");
const searchInput = document.getElementById("announcement-search-input");
const loadOlderButton = document.getElementById("load-older-announcements");
const unreadCount = document.getElementById("unread-announcement-count");
const announcementsPerPage = 3;

let publishedAnnouncements = [];
let visibleCount = announcementsPerPage;

function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
}

function formatAnnouncementDate(value) {
    const dateString = String(value);

    const date = new Date(
        dateString.includes("T")
            ? dateString
            : dateString.replace(" ", "T")
    );

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    }).format(date);
}

function createAnnouncementCard(announcement, isLatest) {
    const card = document.createElement("article");
    card.className = `announcement-card${isLatest ? " latest" : ""}`;

    const cardHeader = document.createElement("div");
    cardHeader.className = "announcement-card-header";

    const heading = document.createElement("div");
    heading.className = "announcement-heading";
    if (isLatest) {
        heading.appendChild(createTextElement("span", "latest-badge", "Latest"));
    }
    heading.appendChild(createTextElement("h2", "", announcement.title));

    const date = document.createElement("time");
    date.className = "announcement-date";
    date.dateTime = announcement.published_at;
    date.textContent = formatAnnouncementDate(announcement.published_at);

    cardHeader.append(heading, date);
    card.appendChild(cardHeader);

    const content = createTextElement(
        "p",
        "announcement-copy",
        announcement.content
    );
    card.appendChild(content);

    const readMoreButton = document.createElement("button");
    readMoreButton.type = "button";
    readMoreButton.className = "read-more-button";
    readMoreButton.textContent = "Read more →";
    readMoreButton.setAttribute("aria-expanded", "false");
    readMoreButton.addEventListener("click", () => {
        const expanded = card.classList.toggle("expanded");
        readMoreButton.textContent = expanded ? "Read less ↑" : "Read more →";
        readMoreButton.setAttribute("aria-expanded", String(expanded));
    });
    card.appendChild(readMoreButton);

    return card;
}

function renderAnnouncements() {
    const query = searchInput.value.trim().toLowerCase();
    const filtered = publishedAnnouncements.filter(announcement =>
        `${announcement.title} ${announcement.content}`.toLowerCase().includes(query)
    );
    const visible = filtered.slice(0, visibleCount);

    if (visible.length === 0) {
        announcementList.replaceChildren(
            createTextElement(
                "p",
                "announcement-empty",
                query
                    ? "No announcements match your search."
                    : "No announcements are available."
            )
        );
    } else {
        const fragment = document.createDocumentFragment();
        visible.forEach(announcement => {
            fragment.appendChild(
                createAnnouncementCard(
                    announcement,
                    announcement === publishedAnnouncements[0]
                )
            );
        });
        announcementList.replaceChildren(fragment);
    }

    loadOlderButton.disabled = visible.length >= filtered.length;
    loadOlderButton.hidden = filtered.length === 0;
}

async function initializeAnnouncements() {
    try {
        const [announcements, notifications] = await Promise.all([
            getAnnouncements(),
            getNotifications()
        ]);

        unreadCount.textContent = String(
            notifications.filter(
                notification => !Number(notification.is_read)
            ).length
        );

        publishedAnnouncements = announcements
            .filter(announcement => announcement.published_at)
            .sort(
                (first, second) =>
                    new Date(second.published_at) -
                    new Date(first.published_at)
            );

        renderAnnouncements();

    } catch (error) {
        console.error("Error loading announcements:", error);

        announcementList.replaceChildren(
            createTextElement(
                "p",
                "announcement-error",
                error.message || "Unable to load announcements."
            )
        );

        loadOlderButton.disabled = true;
    }
}

searchInput.addEventListener("input", () => {
    visibleCount = announcementsPerPage;
    renderAnnouncements();
});

loadOlderButton.addEventListener("click", () => {
    visibleCount += announcementsPerPage;
    renderAnnouncements();
});

initializeAnnouncements();
