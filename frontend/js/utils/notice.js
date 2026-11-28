function getNoticeRegion() {
    let region = document.getElementById("app-notice-region");

    if (!region) {
        region = document.createElement("div");
        region.id = "app-notice-region";
        region.className = "app-notice-region";
        region.setAttribute("role", "region");
        region.setAttribute("aria-label", "Notifications");
        document.body.appendChild(region);
    }

    return region;
}

export function showNotice(message, type = "error") {
    const notice = document.createElement("div");
    const messageElement = document.createElement("p");
    const closeButton = document.createElement("button");
    const normalizedType = ["error", "success", "warning"].includes(type)
        ? type
        : "error";

    notice.className = `app-notice app-notice--${normalizedType}`;
    notice.setAttribute("role", normalizedType === "error" ? "alert" : "status");
    notice.setAttribute("aria-live", normalizedType === "error" ? "assertive" : "polite");

    messageElement.textContent = String(message || "Something went wrong.");

    closeButton.type = "button";
    closeButton.className = "app-notice-dismiss";
    closeButton.setAttribute("aria-label", "Dismiss message");
    closeButton.textContent = "×";
    closeButton.addEventListener("click", () => dismissNotice(notice));

    notice.append(messageElement, closeButton);
    getNoticeRegion().appendChild(notice);

    startNoticeTimeout(notice);

    return notice;
}

function dismissNotice(notice) {
    if (!notice.isConnected || notice.classList.contains("app-notice--leaving")) return;

    notice.classList.add("app-notice--leaving");
    notice.addEventListener("animationend", () => notice.remove(), { once: true });
}

function startNoticeTimeout(notice) {
    let timeoutId = null;
    let remainingTime = 7000;
    let startedAt = 0;
    let isHovered = false;
    let hasFocus = false;

    const resume = () => {
        if (isHovered || hasFocus || timeoutId !== null) return;
        startedAt = Date.now();
        timeoutId = window.setTimeout(() => dismissNotice(notice), remainingTime);
    };

    const pause = () => {
        if (timeoutId === null) return;
        window.clearTimeout(timeoutId);
        timeoutId = null;
        remainingTime = Math.max(0, remainingTime - (Date.now() - startedAt));
    };

    notice.addEventListener("mouseenter", () => {
        isHovered = true;
        pause();
    });
    notice.addEventListener("mouseleave", () => {
        isHovered = false;
        resume();
    });
    notice.addEventListener("focusin", () => {
        hasFocus = true;
        pause();
    });
    notice.addEventListener("focusout", event => {
        if (notice.contains(event.relatedTarget)) return;
        hasFocus = false;
        resume();
    });
    resume();
}
