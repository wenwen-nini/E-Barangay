const navbar = document.querySelector(".navbar");
const hero = document.querySelector(".hero-wrapper");
const navLinks = document.querySelectorAll(".nav-links a");
const sections = document.querySelectorAll("section[id]");

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
        target.scrollIntoView({ behavior: "smooth" });
    });
});   