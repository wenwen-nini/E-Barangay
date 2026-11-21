async function protectResidentGuard() {
    try {
        const user = await getCurrentUser();

        if (user.role !== "Resident") {
            window.location.replace = "../public/login.html";
            return;
        }

        console.log("Authenticated resident:", user.user_id);

    } catch (error) {
        console.error("Session verification failed:", error);

        window.location.replace = "../public/login.html";
    }
}

protectResidentGuard();