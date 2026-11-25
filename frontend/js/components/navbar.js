const navbar = document.querySelector(".navbar");
const hero = document.querySelector(".hero-wrapper");
const navigationLinks = document.querySelector("#primary-navigation");
const navigationToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".nav-links a");
const sections = document.querySelectorAll("section[id]");
const mobileNavigation = window.matchMedia("(max-width: 1100px)");

function setNavigationOpen(isOpen) {
    navbar.classList.toggle("menu-open", isOpen);
    navigationToggle.setAttribute("aria-expanded", String(isOpen));
    navigationToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    navigationLinks.setAttribute("aria-hidden", String(mobileNavigation.matches && !isOpen));
    navigationLinks.inert = mobileNavigation.matches && !isOpen;
}

navigationToggle.addEventListener("click", () => {
    setNavigationOpen(navigationToggle.getAttribute("aria-expanded") !== "true");
});

mobileNavigation.addEventListener("change", () => setNavigationOpen(false));
setNavigationOpen(false);

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navigationToggle.getAttribute("aria-expanded") === "true") {
        setNavigationOpen(false);
        navigationToggle.focus();
    }
});

const updateNavbar = () => {
    const heroBottom = hero.getBoundingClientRect().bottom;
    navbar.classList.toggle("scrolled", heroBottom <= navbar.offsetHeight);
};
window.addEventListener("scroll", updateNavbar, { passive: true });
updateNavbar();

function setActive(id) {
    navLinks.forEach(link => {
        link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
    });
}

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            setActive(entry.target.id);
        }
    });
}, {
    rootMargin: "-50% 0px -50% 0px", 
    threshold: 0
});

sections.forEach(section => observer.observe(section));

navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute("href"));
        setActive(link.getAttribute("href").slice(1));
        setNavigationOpen(false);
        target.scrollIntoView({ behavior: "smooth" });
    });
});   