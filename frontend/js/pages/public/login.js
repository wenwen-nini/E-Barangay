import {users} from "../../mock-data/users.js";

const loginform = document.getElementById("form");

function getRoleFromEmail(email) {
    const domain = email.toLowerCase().split('@')[1];

    return domain === 'balagtas.gov.ph' ? 'Staff' : 'Resident';
}

if (loginform) {
    loginform.addEventListener("submit", function(event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim().toLowerCase();
        const password = document.getElementById("password").value;

        const role = getRoleFromEmail(email);

        const matchedUser = users.find(user => user.email.toLowerCase() === email);

        if (matchedUser) {
            if (role === 'Resident') {
                window.location.href = "../resident/overview.html";
            } else if (role === 'Staff') {
                window.location.href = "../staff/dashboard.html";
            } else {
            window.alert("Location pickup error!");
            }
        } else {
            window.alert("Account not found. Please check your credentials.")
        }
    });
}