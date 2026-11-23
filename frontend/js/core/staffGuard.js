import { getCurrentUser } from "../services/authServices.js";

async function protectStaffPage() {
    try {
        const user = await getCurrentUser();

        if (user.role !== "Staff") {
            return window.location.replace("../public/login.html");
        }

    } catch (error) {
        console.error("Staff authentication failed:", error);
        window.location.replace("../public/login.html");
    }
}

protectStaffPage();