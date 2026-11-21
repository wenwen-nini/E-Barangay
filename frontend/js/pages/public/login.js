document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("form");

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = document.getElementById("email")
            .value.trim().toLowerCase();

        const password = document.getElementById("password").value;

        const loginData = {
            email: email,
            password: password
        };

        try {
            const result = await window.authService.loginUser(loginData);

            if (result.user.role === "Staff") {
                window.location.href = "../staff/dashboard.html";
            } else {
                window.location.href = "../resident/overview.html";
            }

        } catch (error) {
            alert(error.message);
        }
    });
});
    

