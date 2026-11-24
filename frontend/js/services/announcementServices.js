import { API_BASE_URL } from "../config/apiConfig.js";

export async function getAnnouncements() {
    try {
        const response = await fetch(`${API_BASE_URL}/announcements/`, {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to retrieve annoucnements"
            );
        }

        return data.announcements || [];
    } catch (error) {
        console.error("Get announcements error:", error);
        throw error;
    }
}