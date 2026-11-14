import { logoutUser } from "../../core/session.js";

const logoutModal = document.getElementById("logout-modal");

const logoutButtons = document.querySelectorAll(
    "#logout-btn, #support-logout-btn"
);

const cancelLogout = document.getElementById("cancel-logout");
const confirmLogout = document.getElementById("confirm-logout");

logoutButtons.forEach(button => {
    button.addEventListener("click", () => {
        logoutModal.showModal();
    });
});

cancelLogout.addEventListener("click", () => {
    logoutModal.close();
});

confirmLogout.addEventListener("click", () => {
    logoutUser();

    window.location.href = "../public/login.html";
});