
import { users } from "../../mock-data/users.js";
import { setCurrentUser } from "../../core/session.js";

const loginForm = document.getElementById("form");

if (loginForm) {

    loginForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const email = document.getElementById("email")
            .value.trim().toLowerCase();

        const password = document.getElementById("password").value;

        const matchedUser = users.find(
            user => user.email.toLowerCase() === email
        );

        if (!matchedUser) {
            window.alert("Account not found. Please check your credentials.");
            return;
        }

        if (matchedUser.password !== password) {
            window.alert("Incorrect password.");
            return;
        }

        try {

            const currentUser = setCurrentUser(matchedUser);

            if (currentUser.role === "Resident") {

                window.location.href = "../resident/overview.html";

            } else if (currentUser.role === "Staff") {

                window.location.href = "../staff/dashboard.html";

            }

        } catch (error) {

            console.error("Login error:", error);
            window.alert(error.message);

        }

    });

}
