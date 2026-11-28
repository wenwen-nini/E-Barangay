import { setCurrentUser } from "../../core/session.js";
import { showNotice } from "../../utils/notice.js";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("form");
    const loginButton = document.getElementById("login");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    const registrationNotice = sessionStorage.getItem("registrationSuccessNotice");
    if (registrationNotice) {
        sessionStorage.removeItem("registrationSuccessNotice");
        showNotice(registrationNotice, "success");
    }

    function clearLoginError() {
        emailInput.classList.remove("login-input-error");
        passwordInput.classList.remove("login-input-error");
        emailInput.removeAttribute("aria-invalid");
        passwordInput.removeAttribute("aria-invalid");
    }

    function showLoginError() {
        emailInput.classList.add("login-input-error");
        passwordInput.classList.add("login-input-error");
        emailInput.setAttribute("aria-invalid", "true");
        passwordInput.setAttribute("aria-invalid", "true");
    }

    [emailInput, passwordInput].forEach(input => {
        input.addEventListener("input", clearLoginError);
    });

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

            clearLoginError();
            setCurrentUser(result.user);
            sessionStorage.removeItem("residentSidebarLoaded");
            sessionStorage.removeItem("staffSidebarLoaded");

            if (result.user.role === "Staff") {
                window.location.href = "../staff/dashboard.html";
            } else {
                window.location.href = "../resident/overview.html";
            }

        } catch (error) {
            const message = error.attemptsRemaining > 0
                ? `Invalid email or password. You have ${error.attemptsRemaining} attempt${error.attemptsRemaining === 1 ? "" : "s"} remaining before a 15-minute lockout.`
                : error.message || "Unable to log in.";
            showLoginError();
            showNotice(message);
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = "Login";
            loginForm.removeAttribute("aria-busy");
        }
    });
});