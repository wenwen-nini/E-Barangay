const logoutModal = document.getElementById("logout-modal");

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

        document.getElementById("bday").value =
            profile.birth_date
                ? String(profile.birth_date).slice(0, 10)
                : "";

        document.getElementById("email").value =
            profile.email || "";

    } catch (error) {
        console.error("Unable to load Resident profile:", error);
        alert(error.message || "Unable to load your profile information.");
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
        alert("Unable to load notification preferences.");
    }
}

async function cancelNotificationChanges() {
    await loadNotificationPreferences();
}

async function handleProfileUpdate(event) {
    event.preventDefault();

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

        alert(result.message);

        await loadResidentProfile();

    } catch (error) {
        console.error("Profile update error:", error);
        alert(error.message);
    }
}

async function handleNotificationUpdate(event) {
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

        await loadNotificationPreferences();

    } catch (error) {
        console.error("Notification preferences error:", error);

        messageElement.textContent = error.message;
        messageElement.className = "form-message error";
        messageElement.hidden = false;
    }
}

async function handlePasswordUpdate(event) {
    event.preventDefault();

    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirmation").value;
    const messageElement = document.getElementById("password-message");
    messageElement.hidden = true;
    messageElement.textContent = "";

    if (newPassword.length < 8) {
        showPasswordMessage(
            "New password must contain at least 8 characters.",
            "error"
        );
        return;
    }

    if (newPassword !== confirmPassword) {
        showPasswordMessage(
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

        showPasswordMessage(
            result.message || "Password updated successfully.",
            "success"
        );

        document.getElementById("password-form").reset();

    } catch (error) {
        console.error("Password update error:", error);
        showPasswordMessage(
            error.message || "Unable to update your password.",
            "error"
        );
    }
}

function showPasswordMessage(message, type) {
    const messageElement = document.getElementById("password-message");
    messageElement.textContent = message;
    messageElement.className = `form-message ${type}`;
    messageElement.hidden = false;
}

async function handleLogout() {
    try {
        const result = await window.authService.logoutResident();

        alert(result.message);

        window.location.href = "../public/login.html";
    } catch (error) {
        alert(error.message);
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

document.addEventListener("DOMContentLoaded", () => {
    loadResidentProfile();
    loadNotificationPreferences();

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
});