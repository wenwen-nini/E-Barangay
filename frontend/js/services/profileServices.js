import { API_BASE_URL } from "../config/apiConfig.js";

export async function getCurrentUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to retrieve resident profile"
            );
        }

        return data;
    } catch (error) {
        console.error("Get current user profile error:", error);
        throw error;
    }
}

export async function uploadProfileImage(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/profile/image`, {
            method: "POST",
            credentials: "include",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to upload profile image."
            );
        }

        return data;

    } catch (error) {
        console.error("Upload profile image service error:", error);
        throw error;
    }
}
