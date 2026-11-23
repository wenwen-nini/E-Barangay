import { API_BASE_URL } from "../config/apiConfig.js";

export async function registerResident(registrationData) {

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(registrationData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Registration failed");
    }

    return data;
}

export async function loginUser(loginData) {

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(loginData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Login failed");
    }

    return data;
}

export async function getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        credentials: "include"
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to verify session.");
    }

    return data.user;
}

async function logoutResident() {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include"
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Logout failed.");
    }

    return data;
}

async function getUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to retrieve profile.");
        }

        return data.profile;

    } catch (error) {
        console.error("Get profile error:", error);
        throw error;
    }
}

async function updateUserProfile(profileData) {
    try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(profileData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to update profile.");
        }

        return data;

    } catch (error) {
        console.error("Update profile error:", error);
        throw error;
    }
}

async function updateNotificationPreferences(preferences) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/profile/notifications`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(preferences)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to save notification preferences."
            );
        }

        return data;

    } catch (error) {
        console.error("Notification preferences error:", error);
        throw error;
    }
}

async function changeUserPassword(passwordData) {
    try {
        const response = await fetch(`${API_BASE_URL}/profile/change-password`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(passwordData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to change password.");
        }

        return data;

    } catch (error) {
        console.error("Change password error:", error);
        throw error;
    }
}

window.authService = {
    registerResident,
    loginUser,
    getCurrentUser,
    logoutResident,
    getUserProfile,
    updateUserProfile,
    updateNotificationPreferences,
    changeUserPassword
};