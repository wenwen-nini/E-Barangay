import { API_BASE_URL } from "../config/apiConfig.js";

const maxProfileImageSize = 5 * 1024 * 1024;
const allowedProfileImageTypes = ["image/jpeg", "image/png"];
const profileImageOrigin = new URL(API_BASE_URL).origin;

export function setupProfileImageUpload(defaultImageUrl, sidebarImageSelector) {
    const preview = document.getElementById("profile-image-preview");
    const input = document.getElementById("profile-image-input");
    const uploadButton = document.getElementById("upload-profile-image-btn");
    const message = document.getElementById("profile-image-message");
    let savedImagePath = null;
    let previewObjectUrl = null;
    let selectedFile = null;

    function setImageSource(image, imagePath) {
        image.onerror = () => {
            image.onerror = null;
            image.src = defaultImageUrl;
        };
        image.src = imagePath
            ? new URL(imagePath, profileImageOrigin).href
            : defaultImageUrl;
    }

    function setProfileImage(imagePath) {
        savedImagePath = imagePath;
        selectedFile = null;
        input.value = "";
        uploadButton.disabled = true;
        uploadButton.textContent = "Upload photo";
        message.hidden = true;

        if (previewObjectUrl) {
            URL.revokeObjectURL(previewObjectUrl);
            previewObjectUrl = null;
        }

        setImageSource(preview, savedImagePath);

        const sidebarImage = document.querySelector(sidebarImageSelector);
        if (sidebarImage) {
            setImageSource(sidebarImage, savedImagePath);
        }
    }

    function showMessage(text, type) {
        message.textContent = text;
        message.className = `form-message profile-image-message ${type}`;
        message.hidden = false;
    }

    input.addEventListener("change", () => {
        const file = input.files?.[0];
        selectedFile = null;
        uploadButton.disabled = true;
        message.hidden = true;

        if (previewObjectUrl) {
            URL.revokeObjectURL(previewObjectUrl);
            previewObjectUrl = null;
        }

        if (!file) {
            setImageSource(preview, savedImagePath);
            return;
        }

        if (!allowedProfileImageTypes.includes(file.type)) {
            input.value = "";
            setImageSource(preview, savedImagePath);
            showMessage("Choose a JPG or PNG image.", "error");
            return;
        }

        if (file.size > maxProfileImageSize) {
            input.value = "";
            setImageSource(preview, savedImagePath);
            showMessage("The profile image must be 5 MB or smaller.", "error");
            return;
        }

        selectedFile = file;
        previewObjectUrl = URL.createObjectURL(file);
        preview.src = previewObjectUrl;
        uploadButton.disabled = false;
    });

    uploadButton.addEventListener("click", async () => {
        if (!selectedFile) {
            return;
        }

        const fileToUpload = selectedFile;
        uploadButton.disabled = true;
        uploadButton.textContent = "Uploading...";
        message.hidden = true;

        try {
            const result = await window.authService.uploadProfileImage(fileToUpload);
            setProfileImage(result.profile_image_path);
            selectedFile = null;
            input.value = "";
            showMessage(result.message || "Profile photo updated.", "success");
        } catch (error) {
            console.error("Profile photo upload error:", error);
            showMessage(error.message || "Unable to upload profile photo.", "error");
        } finally {
            uploadButton.textContent = "Upload photo";
            uploadButton.disabled = !selectedFile;
        }
    });

    setProfileImage(null);

    return { setProfileImage };
}
