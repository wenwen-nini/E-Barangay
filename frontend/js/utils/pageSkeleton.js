(() => {
    const mainContent = document.querySelector("main");

    if (mainContent) {
        const skeleton = document.createElement("div");
        skeleton.className = "portal-page-skeleton";
        skeleton.setAttribute("role", "status");
        skeleton.setAttribute("aria-label", "Loading page content");
        skeleton.innerHTML = `
            <div class="portal-skeleton-header">
                <div class="portal-skeleton-heading">
                    <span class="portal-skeleton-block portal-skeleton-eyebrow"></span>
                    <span class="portal-skeleton-block portal-skeleton-title"></span>
                    <span class="portal-skeleton-block portal-skeleton-subtitle"></span>
                </div>
                <span class="portal-skeleton-block portal-skeleton-action"></span>
            </div>
            <div class="portal-skeleton-summary">
                <span class="portal-skeleton-block"></span>
                <span class="portal-skeleton-block"></span>
                <span class="portal-skeleton-block"></span>
                <span class="portal-skeleton-block"></span>
            </div>
            <div class="portal-skeleton-content">
                <section class="portal-skeleton-panel">
                    <span class="portal-skeleton-block portal-skeleton-panel-title"></span>
                    <span class="portal-skeleton-block portal-skeleton-row"></span>
                    <span class="portal-skeleton-block portal-skeleton-row"></span>
                    <span class="portal-skeleton-block portal-skeleton-row"></span>
                    <span class="portal-skeleton-block portal-skeleton-row"></span>
                </section>
                <section class="portal-skeleton-panel">
                    <span class="portal-skeleton-block portal-skeleton-panel-title"></span>
                    <span class="portal-skeleton-block portal-skeleton-paragraph"></span>
                    <span class="portal-skeleton-block portal-skeleton-paragraph short"></span>
                    <span class="portal-skeleton-block portal-skeleton-paragraph"></span>
                </section>
            </div>
        `;

        mainContent.classList.add("portal-main-loading");
        mainContent.setAttribute("aria-busy", "true");
        mainContent.prepend(skeleton);

        window.finishPageSkeleton = () => {
            skeleton.remove();
            mainContent.classList.remove("portal-main-loading");
            mainContent.removeAttribute("aria-busy");
        };
    }
})();
