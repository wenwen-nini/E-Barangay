import { setupProfileImageUpload } from "../../utils/profileImageSettings.js";
import { showNotice } from "../../utils/notice.js";
import { logoutUser } from "../../core/session.js";

const logoutModal = document.getElementById("logout-modal");
const birthdayInput = document.getElementById("bday");
const profileImageSettings = setupProfileImageUpload(
    new URL("../../../assets/images/profile_images/default.png", import.meta.url).href,
    "app-navbar .profile img"
);

function getTodayDateInputValue() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${today.getFullYear()}-${month}-${day}`;
}

birthdayInput.max = getTodayDateInputValue();
["input", "change"].forEach(eventName => {
    birthdayInput.addEventListener(eventName, () => {
        birthdayInput.classList.remove("birthday-field-error");
        birthdayInput.removeAttribute("aria-invalid");
    });
});

async function loadResidentProfile() {
    const profileForm = document.getElementById("resident-profile-form");

    try {
        const profile = await window.authService.getUserProfile();

        // Populate personal information
        document.getElementById("first-name").value =
            profile.resident_first_name || "";

        document.getElementById("middle-name").value =
            profile.resident_middle_name || "";

        document.getElementById("last-name").value =
            profile.resident_last_name || "";

        document.getElementById("name-extension").value =
            profile.resident_name_extension || "";

        document.getElementById("address").value =
            profile.complete_address || "";

        document.getElementById("contact").value =
            profile.contact_number || "";

        if (profile.birth_date) {
            const birthDate = String(profile.birth_date);

            if (/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
                document.getElementById("bday").value = birthDate;
            } else {
                const date = new Date(birthDate);

                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");

                document.getElementById("bday").value =
                    `${year}-${month}-${day}`;
            }
        } else {
            document.getElementById("bday").value = "";
        }

        document.getElementById("email").value =
            profile.email || "";

        profileImageSettings.setProfileImage(profile.profile_image_path);

    } catch (error) {
        console.error("Unable to load Resident profile:", error);
        showNotice(error.message || "Unable to load your profile information.");
    }
}

async function cancelProfileChanges() {
    await loadResidentProfile();
}

async function loadNotificationPreferences() {
    try {
        const profile = await window.authService.getUserProfile();

        document.getElementById("request-updates").checked =
            Boolean(profile.notify_request_updates);

        document.getElementById("pickup-reminders").checked =
            Boolean(profile.notify_pickup_reminders);

        document.getElementById("announcements").checked =
            Boolean(profile.notify_announcements);

    } catch (error) {
        console.error("Unable to load notification preferences:", error);
        showNotice("Unable to load notification preferences.");
    }
}

async function cancelNotificationChanges() {
    await loadNotificationPreferences();
}

async function handleProfileUpdate(event) {
    event.preventDefault();

    if (birthdayInput.value
        && birthdayInput.value > getTodayDateInputValue()) {
        birthdayInput.classList.add("birthday-field-error");
        birthdayInput.setAttribute("aria-invalid", "true");
        birthdayInput.focus();
        showNotice("Birthday cannot be in the future.");
        return;
    }

    const profileData = {
        first_name: document.getElementById("first-name").value.trim(),
        middle_name: document.getElementById("middle-name").value.trim(),
        last_name: document.getElementById("last-name").value.trim(),
        name_extension: document.getElementById("name-extension").value.trim(),
        birth_date: document.getElementById("bday").value,
        complete_address: document.getElementById("address").value.trim(),
        contact_number: document.getElementById("contact").value.replace(/-/g, "").trim()
    };

    try {
        const result = await window.authService.updateUserProfile(profileData);

        showNotice(result.message || "Profile updated successfully.", "success");

        await loadResidentProfile();

    } catch (error) {
        console.error("Profile update error:", error);
        if (error.field === "birth_date") {
            birthdayInput.classList.add("birthday-field-error");
            birthdayInput.setAttribute("aria-invalid", "true");
            birthdayInput.focus();
        }
        showNotice(error.message || "Unable to update your profile.");
    }
}

async function handleNotificationUpdate(event) {
    event.preventDefault();

    const preferences = {
        notify_request_updates: document.getElementById("request-updates").checked,
        notify_pickup_reminders: document.getElementById("pickup-reminders").checked,
        notify_announcements: document.getElementById("announcements").checked
    };

    try {
        const result = await window.authService.updateNotificationPreferences(preferences);

        showNotice(
            result.message || "Notification preferences updated successfully.",
            "success"
        );

        await loadNotificationPreferences();

    } catch (error) {
        console.error("Notification preferences error:", error);
        showNotice(
            error.message || "Unable to update notification preferences."
        );
    }
}

async function handlePasswordUpdate(event) {
    event.preventDefault();

    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirmation").value;
    if (newPassword.length < 8) {
        showNotice(
            "New password must contain at least 8 characters.",
            "error"
        );
        return;
    }

    if (newPassword !== confirmPassword) {
        showNotice(
            "New password and confirmation do not match.",
            "error"
        );
        return;
    }

    const passwordData = {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
    };

    try {
        const result = await window.authService.changeUserPassword(passwordData);

        showNotice(
            result.message || "Password updated successfully.",
            "success"
        );

        document.getElementById("password-form").reset();

    } catch (error) {
        console.error("Password update error:", error);
        showNotice(
            error.message || "Unable to update your password.",
            "error"
        );
    }
}

async function handleLogout() {
    try {
        await window.authService.logoutResident();
        logoutUser();

        window.location.href = "../public/login.html";
    } catch (error) {
        showNotice(error.message || "Unable to log out.");
    }
}

async function loadStaffProfile() {
    try {
        const response = await window.authService.getUserProfile();

        const profile = response.profile;

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

    } catch (error) {
        console.error("Unable to load staff profile:", error);
    }
}

const logoutButtons = document.querySelectorAll(
    "#logout-btn, #support-logout-btn"
);

const cancelLogout = document.getElementById("cancel-logout");
const confirmLogout = document.getElementById("confirm-logout");

logoutButtons.forEach(button => {
    button.addEventListener("click", () => {
        logoutModal.showModal();
    });
});

cancelLogout.addEventListener("click", () => {
    logoutModal.close();
});

confirmLogout.addEventListener("click", handleLogout);

document.addEventListener("DOMContentLoaded", async () => {
    const initialLoads = Promise.all([
        loadResidentProfile(),
        loadNotificationPreferences()
    ]);

    document.getElementById("resident-profile-form")
        .addEventListener("submit", handleProfileUpdate);

    document.getElementById("notification-preferences-form")
        .addEventListener("submit", handleNotificationUpdate);

    document.getElementById("cancel-profile")
        .addEventListener("click", cancelProfileChanges);

    document.getElementById("cancel-notifications")
        .addEventListener("click", cancelNotificationChanges);

    document.getElementById("password-form")
        .addEventListener("submit", handlePasswordUpdate);
    
    document.addEventListener("DOMContentLoaded", () => {
        loadStaffProfile();
    });

    await initialLoads;
    window.finishPageSkeleton?.();
});