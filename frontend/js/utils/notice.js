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
    closeButton.addEventListener("click", () => notice.remove());

    notice.append(messageElement, closeButton);
    getNoticeRegion().appendChild(notice);

    return notice;
}
