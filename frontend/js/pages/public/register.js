import { registerResident } from "../../services/authServices.js";
import { showNotice } from "../../utils/notice.js";

const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const submitButton = registerForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "Creating account...";
    registerForm.setAttribute("aria-busy", "true");

    const contactNumber = document.getElementById("number").value;

    const registrationData = {
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        first_name: document.getElementById("firstname").value,
        middle_name: document.getElementById("middlename").value,
        last_name: document.getElementById("lastname").value,
        name_extension: document.getElementById("name-extension").value,
        birth_date: document.getElementById("birthday").value,
        complete_address: document.getElementById("address").value,
        contact_number: contactNumber.replace(/-/g, "")
    };

    try {
        const result = await registerResident(registrationData);

        showNotice(result.message || "Account created successfully.", "success");

        console.log("Registration successful", result.data);

        registerForm.reset();
    } catch (error) {
        showNotice(error.message || "Unable to create your account.");
        console.log("Registration error:", error);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Create Account";
        registerForm.removeAttribute("aria-busy");
    }
});