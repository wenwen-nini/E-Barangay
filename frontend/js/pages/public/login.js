import { setCurrentUser } from "../../core/session.js";
import { showNotice } from "../../utils/notice.js";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("form");
    const loginButton = document.getElementById("login");

    loginForm.addEventListener("submit", async event => {
        event.preventDefault();

        const email = document.getElementById("email")
            .value.trim().toLowerCase();

        const password = document.getElementById("password").value;

        const loginData = {
            email,
            password
        };

        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";
        loginForm.setAttribute("aria-busy", "true");

        try {
            const result = await window.authService.loginUser(loginData);

            setCurrentUser(result.user);
            sessionStorage.removeItem("residentSidebarLoaded");
            sessionStorage.removeItem("staffSidebarLoaded");

            if (result.user.role === "Staff") {
                window.location.href = "../staff/dashboard.html";
            } else {
                window.location.href = "../resident/overview.html";
            }

        } catch (error) {
            showNotice(error.message || "Unable to log in.");
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = "Login";
            loginForm.removeAttribute("aria-busy");
        }
    });
});