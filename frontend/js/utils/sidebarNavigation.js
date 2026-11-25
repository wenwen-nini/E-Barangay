const MOBILE_BREAKPOINT = "(max-width: 900px)";

function createIconLink({ href, icon, label }) {
    const link = document.createElement("a");
    const image = document.createElement("img");

    link.href = href;
    link.setAttribute("aria-label", label);
    image.src = icon;
    image.alt = "";

    link.appendChild(image);
    return link;
}

export function setupSidebarNavigation(
    component,
    { id, portalLabel, actions }
) {
    document.body.classList.add("portal-layout");

    const sidebar = component.querySelector("aside");
    const logo = sidebar.querySelector(".logo");
    const pageTitle = document.querySelector("main h1")?.textContent.trim()
        || "Portal";

    sidebar.id = id;
    sidebar.setAttribute("aria-label", `${portalLabel} navigation`);

    const toolbar = document.createElement("div");
    toolbar.className = "mobile-sidebar-toolbar";

    const menuButton = document.createElement("button");
    menuButton.type = "button";
    menuButton.className = "sidebar-menu-toggle";
    menuButton.setAttribute("aria-label", "Open navigation");
    menuButton.setAttribute("aria-controls", id);
    menuButton.setAttribute("aria-expanded", "false");

    const menuIcon = document.createElement("span");
    menuIcon.className = "sidebar-menu-icon";
    menuIcon.setAttribute("aria-hidden", "true");
    for (let index = 0; index < 3; index += 1) {
        menuIcon.appendChild(document.createElement("span"));
    }
    menuButton.appendChild(menuIcon);

    const toolbarTitle = document.createElement("div");
    toolbarTitle.className = "mobile-sidebar-title";
    const toolbarLabel = document.createElement("span");
    toolbarLabel.textContent = portalLabel;
    const toolbarPageTitle = document.createElement("strong");
    toolbarPageTitle.textContent = pageTitle;
    toolbarTitle.append(toolbarLabel, toolbarPageTitle);
    toolbar.append(menuButton, toolbarTitle);

    const backdrop = document.createElement("div");
    backdrop.className = "sidebar-backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    backdrop.hidden = true;

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "sidebar-close-button";
    closeButton.setAttribute("aria-label", "Close navigation");
    const closeIcon = document.createElement("span");
    closeIcon.setAttribute("aria-hidden", "true");
    closeIcon.textContent = "×";
    const closeLabel = document.createElement("small");
    closeLabel.textContent = "Close";
    closeButton.append(closeIcon, closeLabel);
    logo.appendChild(closeButton);

    const context = document.createElement("div");
    context.className = "mobile-sidebar-context";

    const contextTitle = document.createElement("div");
    contextTitle.className = "mobile-sidebar-context-title";
    const contextLabel = document.createElement("span");
    contextLabel.textContent = portalLabel;
    const contextPageTitle = document.createElement("strong");
    contextPageTitle.textContent = pageTitle;
    contextTitle.append(contextLabel, contextPageTitle);

    const contextActions = document.createElement("div");
    contextActions.className = "mobile-sidebar-context-actions";
    actions.forEach(action => {
        contextActions.appendChild(createIconLink(action));
    });

    context.append(contextTitle, contextActions);
    logo.after(context);
    component.prepend(toolbar, backdrop);

    const main = document.querySelector("main");
    const isMobile = () => window.matchMedia(MOBILE_BREAKPOINT).matches;

    function setOpen(open, restoreFocus = false) {
        const mobile = isMobile();
        const isOpen = mobile && open;

        component.classList.toggle("sidebar-open", isOpen);
        menuButton.setAttribute("aria-expanded", String(isOpen));
        menuButton.setAttribute(
            "aria-label",
            isOpen ? "Navigation open" : "Open navigation"
        );
        backdrop.hidden = !isOpen;
        sidebar.inert = mobile && !isOpen;
        sidebar.setAttribute("aria-hidden", String(mobile && !isOpen));
        toolbar.inert = isOpen;

        if (main) {
            main.inert = isOpen;
        }

        document.body.classList.toggle("sidebar-scroll-locked", isOpen);

        if (isOpen) {
            closeButton.focus();
        } else if (restoreFocus && mobile) {
            menuButton.focus();
        }
    }

    menuButton.addEventListener("click", () => {
        setOpen(!component.classList.contains("sidebar-open"));
    });
    closeButton.addEventListener("click", () => setOpen(false, true));
    backdrop.addEventListener("click", () => setOpen(false, true));

    sidebar.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("keydown", event => {
        if (!component.classList.contains("sidebar-open")) {
            return;
        }

        if (event.key === "Escape") {
            setOpen(false, true);
            return;
        }

        if (event.key !== "Tab") {
            return;
        }

        const focusableElements = [...sidebar.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )];
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
        }
    });

    window.addEventListener("resize", () => {
        if (!isMobile()) {
            setOpen(false);
        } else {
            setOpen(component.classList.contains("sidebar-open"));
        }
    });

    setOpen(false);
}
