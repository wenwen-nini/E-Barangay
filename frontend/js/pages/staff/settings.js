import { setupProfileImageUpload } from "../../utils/profileImageSettings.js";
import { showNotice } from "../../utils/notice.js";

const logoutModal = document.getElementById("logout-modal");
const profileImageSettings = setupProfileImageUpload(
    new URL("../../../assets/images/profile_images/staff.png", import.meta.url).href,
    "app-staff-sidebar .staff-profile-image"
);

const logoutButtons = document.querySelectorAll(
    "#logout-btn, #support-logout-btn"
);

const cancelLogout = document.getElementById("cancel-logout");
const confirmLogout = document.getElementById("confirm-logout");

async function loadStaffProfile() {
    const messageElement = document.getElementById("profile-message");

    try {
        const response = await window.authService.getUserProfile();

        console.log("Staff profile response:", response);

        const profile = response;

        document.getElementById("first-name").value =
            profile.staff_first_name || "";

        document.getElementById("middle-name").value =
            profile.staff_middle_name || "";

        document.getElementById("last-name").value =
            profile.staff_last_name || "";

        document.getElementById("name-extension").value =
            profile.staff_name_extension || "";

        document.getElementById("staff-role").value =
            profile.position || "";

        document.getElementById("email-address").value =
            profile.email || "";

        profileImageSettings.setProfileImage(profile.profile_image_path);
        return true;

    } catch (error) {
        console.error("Unable to load staff profile:", error);
        messageElement.textContent =
            error.message || "Unable to load your profile information.";
        messageElement.className = "form-message error";
        messageElement.hidden = false;
        return false;
    }
}

const staffPasswordForm = document.getElementById("staff-password-form");

staffPasswordForm.addEventListener("submit", handleStaffPasswordUpdate);

async function handleStaffPasswordUpdate(event) {
    event.preventDefault();

    const messageElement = document.getElementById("password-message");

    messageElement.hidden = true;

    const passwordData = {
        current_password: document.getElementById("current-password").value,
        new_password: document.getElementById("new-password").value,
        confirm_password: document.getElementById("confirmation").value
    };

    try {
        const response = await window.authService.changeUserPassword(passwordData);

        messageElement.textContent =
            response.message || "Password changed successfully.";

        messageElement.className = "form-message success";
        messageElement.hidden = false;

        staffPasswordForm.reset();

    } catch (error) {
        messageElement.textContent =
            error.message || "Unable to change your password.";

        messageElement.className = "form-message error";
        messageElement.hidden = false;
    }
}

const staffProfileForm = document.getElementById("staff-profile-form");

staffProfileForm.addEventListener("submit", handleStaffProfileUpdate);

async function handleStaffProfileUpdate(event) {
    event.preventDefault();

    const messageElement = document.getElementById("profile-message");

    messageElement.hidden = true;

    const profileData = {
        first_name: document.getElementById("first-name").value.trim(),
        middle_name: document.getElementById("middle-name").value.trim(),
        last_name: document.getElementById("last-name").value.trim(),
        name_extension: document.getElementById("name-extension").value.trim()
    };

    try {
        const response = await window.authService.updateUserProfile(profileData);

        messageElement.textContent =
            response.message || "Profile updated successfully.";

        messageElement.className = "form-message success";
        messageElement.hidden = false;

        await loadStaffProfile();

    } catch (error) {
        messageElement.textContent = error.message ||
            "Unable to update your profile.";

        messageElement.className = "form-message error";
        messageElement.hidden = false;
    }
}

// Load Staff Notification Preferences
async function loadStaffNotificationPreferences() {
    try {
        const profile = await window.authService.getUserProfile();

        document.getElementById("request-updates").checked =
            Boolean(profile.notify_request_updates);

        document.getElementById("pickup-reminders").checked =
            Boolean(profile.notify_pickup_reminders);

        document.getElementById("announcements").checked =
            Boolean(profile.notify_announcements);

        return true;

    } catch (error) {
        console.error("Unable to load notification preferences:", error);
        const messageElement = document.getElementById("notification-message");
        messageElement.textContent =
            error.message || "Unable to load notification preferences.";
        messageElement.className = "form-message error";
        messageElement.hidden = false;
        return false;
    }
}


// Save Staff Notification Preferences
async function handleStaffNotificationUpdate(event) {
    event.preventDefault();

    const messageElement = document.getElementById("notification-message");
    messageElement.hidden = true;

    const preferences = {
        notify_request_updates: document.getElementById("request-updates").checked,
        notify_pickup_reminders: document.getElementById("pickup-reminders").checked,
        notify_announcements: document.getElementById("announcements").checked
    };

    try {
        const result = await window.authService.updateNotificationPreferences(preferences);

        messageElement.textContent = result.message;
        messageElement.className = "form-message success";
        messageElement.hidden = false;

        await loadStaffNotificationPreferences();

    } catch (error) {
        console.error("Notification preferences error:", error);

        messageElement.textContent =
            error.message || "Unable to update notification preferences.";

        messageElement.className = "form-message error";
        messageElement.hidden = false;
    }
}

const cancelNotificationsButton =
    document.getElementById("cancel-notifications");

cancelNotificationsButton.addEventListener("click", async () => {
    const loaded = await loadStaffNotificationPreferences();

    if (loaded) {
        document.getElementById("notification-message").hidden = true;
    }
});

async function handleLogout() {
    try {
        await window.authService.logoutResident();

        window.location.href = "../public/login.html";

    } catch (error) {
        showNotice(error.message || "Unable to log out.");
    }
}

const staffNotificationForm = document.getElementById("staff-notification-form");

staffNotificationForm.addEventListener(
    "submit",
    handleStaffNotificationUpdate
);

const cancelProfileButton = document.getElementById("cancel-profile");

logoutButtons.forEach(button => {
    button.addEventListener("click", () => {
        logoutModal.showModal();
    });
});

cancelLogout.addEventListener("click", () => {
    logoutModal.close();
});

confirmLogout.addEventListener("click", handleLogout);

cancelProfileButton.addEventListener("click", async () => {
    const loaded = await loadStaffProfile();
    if (loaded) {
        document.getElementById("profile-message").hidden = true;
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    await Promise.all([
        loadStaffProfile(),
        loadStaffNotificationPreferences()
    ]);
    window.finishPageSkeleton?.();
});