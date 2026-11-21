async function protectStaffPage() {
    try {
        const user = await window.authService.getCurrentUser();

        console.log("User returned:", user);
        console.log("User role:", user.role);

        if (user.role !== "Staff") {
            console.log("Role mismatch. Redirecting to login.");
            window.location.replace("../public/login.html");
            return;
        }

        console.log("Staff authentication successful.");

    } catch (error) {
        console.error("Staff authentication failed:", error);
        window.location.replace("../public/login.html");
    }
}

protectStaffPage();