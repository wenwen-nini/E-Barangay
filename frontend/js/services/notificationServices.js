import { API_BASE_URL } from "../config/apiConfig.js";

export async function getNotifications() {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/`, {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to retrieve notifications"
            );
        }

        return data.notifications || [];
    } catch (error) {
        console.error("Get notifications error:", error);
        throw error;
    }
}

export async function markNotificationAsRead(notificationId) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/notifications/${notificationId}/read`,
            {
                method: "PUT",
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to mark notification as read."
            );
        }

        return data;

    } catch (error) {
        console.error("Mark notification as read error:", error);
        throw error;
    }
}