import { registerResident } from "../../services/authServices.js";

const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

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

        alert(result.message);

        console.log("Registration successful", result.data);

        registrationForm.reset();
    } catch (error) {
        alert(error.message);
        console.log("Registration error:", error);
    }
});