import { registerResident } from "../../services/authServices.js";
import { showNotice } from "../../utils/notice.js";

const registerForm = document.getElementById("registerForm");
const birthdayInput = document.getElementById("birthday");
const registrationFieldIds = {
    email: "email",
    password: "password",
    first_name: "firstname",
    last_name: "lastname",
    birth_date: "birthday",
    complete_address: "address",
    contact_number: "number"
};

function getTodayDateInputValue() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${today.getFullYear()}-${month}-${day}`;
}

birthdayInput.max = getTodayDateInputValue();

function clearFieldError(input) {
    input.classList.remove("registration-field-error");
    input.removeAttribute("aria-invalid");
}

function showFieldError(input, message) {
    input.classList.add("registration-field-error");
    input.setAttribute("aria-invalid", "true");
    input.focus();
    showNotice(message);
}

registerForm.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => clearFieldError(input));
    input.addEventListener("change", () => clearFieldError(input));
});

registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const contactNumber = document.getElementById("number").value;
    const registrationData = {
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value,
        first_name: document.getElementById("firstname").value.trim(),
        middle_name: document.getElementById("middlename").value.trim(),
        last_name: document.getElementById("lastname").value.trim(),
        name_extension: document.getElementById("name-extension").value.trim(),
        birth_date: document.getElementById("birthday").value,
        complete_address: document.getElementById("address").value.trim(),
        contact_number: contactNumber.replace(/-/g, "").trim()
    };

    const confirmPassword = document.getElementById("confirm-password").value;
    const validationRules = [
        ["firstname", Boolean(registrationData.first_name), "Enter your first name."],
        ["lastname", Boolean(registrationData.last_name), "Enter your last name."],
        [
            "email",
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrationData.email),
            "Enter a valid email address."
        ],
        ["birthday", Boolean(registrationData.birth_date), "Enter your birthday."],
        [
            "birthday",
            registrationData.birth_date <= getTodayDateInputValue(),
            "Birthday cannot be in the future."
        ],
        ["address", Boolean(registrationData.complete_address), "Enter your complete address."],
        [
            "number",
            /^\d{11}$/.test(registrationData.contact_number),
            "Enter an 11-digit contact number."
        ],
        [
            "password",
            registrationData.password.length >= 8
                && /\d/.test(registrationData.password),
            "Password must be at least 8 characters and include at least one number."
        ],
        [
            "confirm-password",
            Boolean(confirmPassword),
            "Confirm your password."
        ],
        [
            "confirm-password",
            confirmPassword === registrationData.password,
            "Passwords do not match."
        ],
        [
            "agreement",
            document.getElementById("agreement").checked,
            "You must agree to the Terms of Service and Privacy Policy."
        ]
    ];

    const invalidRule = validationRules.find(([, isValid]) => !isValid);
    if (invalidRule) {
        showFieldError(
            document.getElementById(invalidRule[0]),
            invalidRule[2]
        );
        return;
    }

    const submitButton = registerForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "Creating account...";
    registerForm.setAttribute("aria-busy", "true");

    try {
        await registerResident(registrationData);
        sessionStorage.setItem("registrationSuccessNotice", "Account created successfully. You can now log in.");
        window.location.replace("../public/login.html");
    } catch (error) {
        const fieldId = registrationFieldIds[error.field];
        if (fieldId) {
            showFieldError(
                document.getElementById(fieldId),
                error.message || "Please check this field."
            );
        } else {
            showNotice(error.message || "Unable to create your account.");
        }
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Create Account";
        registerForm.removeAttribute("aria-busy");
    }
});