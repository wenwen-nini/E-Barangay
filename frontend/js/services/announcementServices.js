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

export async function getAllAnnouncements() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/announcements/staff/all`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to retrieve announcements."
            );
        }

        return data.announcements || [];

    } catch (error) {
        console.error("Get announcements error:", error);
        throw error;
    }
}

export async function createAnnouncement(announcementData) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/announcements/staff`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(announcementData)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to create announcement."
            );
        }

        return data;

    } catch (error) {
        console.error("Create announcement error:", error);
        throw error;
    }
}


export async function updateAnnouncement(announcementId, announcementData) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/announcements/staff/${announcementId}`,
            {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(announcementData)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to update announcement."
            );
        }

        return data;

    } catch (error) {
        console.error("Update announcement error:", error);
        throw error;
    }
}


export async function updateAnnouncementStatus(announcementId, status) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/announcements/staff/${announcementId}/status`,
            {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to update announcement status."
            );
        }

        return data;

    } catch (error) {
        console.error("Update announcement status error:", error);
        throw error;
    }
}

export async function deleteAnnouncement(announcementId) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/announcements/staff/${announcementId}`,
            {
                method: "DELETE",
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to delete announcement."
            );
        }

        return data;

    } catch (error) {
        console.error("Delete announcement service error:", error);
        throw error;
    }
}
