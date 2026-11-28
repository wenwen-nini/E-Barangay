import { getCurrentUser } from "../services/authServices.js";
import { startSessionAccountMonitor } from "./session.js";

startSessionAccountMonitor();

async function protectResidentGuard() {
    try {
        const user = await getCurrentUser();

        if (user.role !== "Resident") {
            window.location.replace("../public/login.html");
            return;
        }

    } catch (error) {
        console.error("Session verification failed:", error);

        window.location.replace("../public/login.html");
    }
}

protectResidentGuard();