const navbar = document.querySelector(".navbar");
const hero = document.querySelector(".hero-wrapper");

const updateNavbar = () => {
    const heroBottom = hero.getBoundingClientRect().bottom;

    const isScrolled = heroBottom <= navbar.offsetHeight;

    navbar.classList.toggle("scrolled", isScrolled);
};

window.addEventListener("scroll", updateNavbar, { passive: true });
updateNavbar();

const navLinks = document.querySelectorAll(".nav-links a");

navLinks.forEach(link => {
    link.addEventListener("click", () => {
        navLinks.forEach(nav => nav.classList.remove("active"));
        link.classList.add("active");
    });
});