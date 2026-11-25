import {
    getAllAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    updateAnnouncementStatus,
    deleteAnnouncement
} from "../../services/announcementServices.js";
import { shortFormatDateTime, formatDateTime } from "../../utils/dateFormatter.js";
import { formatId } from "../../utils/idFormatter.js";
import { showNotice } from "../../utils/notice.js";

let searchQuery = "";
let statusFilter = "";
let announcements = [];
let announcementsLoadError = false;

try {
    announcements = await getAllAnnouncements() ?? [];
} catch (error) {
    console.error("Error loading announcements:", error);
    announcementsLoadError = true;
}

let editingAnnouncementId = null;
let deletingAnnouncementId = null;

let selectedId = announcements.length > 0 ? announcements[0].announcement_id : null;

const tableBody = document.querySelector("#table-body");
const searchInput = document.querySelector("#search-input");
const statusSelect = document.querySelector("#status");
const addAnnouncementButton = document.querySelector(".add-document-btn");
const showEntries = document.querySelector("#show-entries");

const editorModal = document.querySelector("#announcement-editor-modal");
const announcementForm = document.querySelector("#announcement-form");
const formTitle = document.querySelector("#announcement-form-title");
const formDescription = document.querySelector("#announcement-form-description");
const titleInput = document.querySelector("#announcement-title-input");
const descriptionInput = document.querySelector("#announcement-description-input");
const audienceInput = document.querySelector("#announcement-audience-input");
const statusInput = document.querySelector("#announcement-status-input");
const expirationInput = document.querySelector("#announcement-expiration-input");
const saveAnnouncementButton = document.querySelector("#save-announcement-btn");

const deleteModal = document.querySelector("#delete-announcement-modal");
const deleteAnnouncementStatus = document.querySelector("#delete-modal-status");
const deleteAnnouncementTitle = document.querySelector("#delete-modal-title");
const deleteAnnouncementMeta = document.querySelector("#delete-modal-meta");
const confirmDeleteButton = document.querySelector("#confirm-delete-announcement");

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function renderTable() {
    if (announcementsLoadError) {
        tableBody.innerHTML = `<tr><td colspan="5" role="alert">Unable to load announcements. Try adding an announcement or refresh the page.</td></tr>`;
        showEntries.textContent = "Announcements could not be loaded.";
        return;
    }

    const filteredAnnouncements = announcements.filter(ann => {
        const matchesSearch = ann.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || ann.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const htmlRows = filteredAnnouncements.map(ann => {
        const safeId = escapeHtml(ann.announcement_id);
        const formattedId = escapeHtml(formatId(ann.announcement_id, "ANN"));
        const isSelected = String(ann.announcement_id) === String(selectedId) ? "selected" : "";

        return `
            <tr class="announcement-row ${isSelected}" data-id="${safeId}">
                <td class="cell-title">
                    ${escapeHtml(ann.title)}
                    <small>${formattedId}</small>
                </td>
                <td>${escapeHtml(ann.audience)}</td>
                <td>${escapeHtml(
                    ann.published_at
                        ? formatDateTime(ann.published_at)
                        : "Not published"
                )}</td>
                <td>
                    <span class="badge badge-${escapeHtml(ann.status.toLowerCase())}">${escapeHtml(ann.status)}</span>
                </td>
                <td>
                    <div class="actions-btn">
                        <button type="button" class="edit-btn" data-action="edit" data-document-id="${safeId}">Edit</button>
                        <button type="button" class="delete-btn" data-action="delete" data-document-id="${safeId}">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    const emptyMessage = announcements.length === 0
        ? "No announcements have been created yet."
        : "No announcements match your filter.";
    tableBody.innerHTML = htmlRows || `<tr><td colspan="5" style="text-align: center; color: var(--primary-color);">${emptyMessage}</td></tr>`;
    showEntries.textContent = `Showing ${filteredAnnouncements.length} of ${announcements.length} entries`;
}

function renderPreview(item) {
    if (!item) return;

    const previewMeta = `${shortFormatDateTime(item.published_at)}`;

    document.getElementById("preview-id").textContent = formatId(item.announcement_id);
    document.getElementById("preview-meta").textContent = previewMeta;
    document.getElementById("preview-title").textContent = item.title;
    document.getElementById("preview-body").textContent = item.content;

    const statusBadge = document.getElementById("preview-status");
    statusBadge.textContent = item.status;
    statusBadge.className = `badge badge-${item.status.toLowerCase()}`;
}

function closeEditor() {
    if (editorModal.open) editorModal.close();
}

function openDeleteConfirmation(ann) {
    deletingAnnouncementId = ann.announcement_id;
    deleteAnnouncementStatus.textContent = ann.status;
    deleteAnnouncementStatus.className = `badge badge-${ann.status.toLowerCase()}`;
    deleteAnnouncementTitle.textContent = ann.title;
    deleteAnnouncementMeta.textContent = `${formatId(ann.announcement_id, "ANN")} ● ${ann.audience} ● Published ${ann.published_at}`;
    deleteModal.showModal();
}

function openEditor(ann = null) {
    editingAnnouncementId = ann?.announcement_id ?? null;
    announcementForm.reset();

    const isEditing = Boolean(ann);
    formTitle.textContent = isEditing ? "Edit announcement" : "Add announcement";
    formDescription.textContent = isEditing ? `${formatId(ann.announcement_id, "ANN")} ● ${ann.title}` : "Create a service update for the resident portal." ;
    titleInput.value = ann?.title ?? "";
    descriptionInput.value = ann?.content ?? "";
    audienceInput.value = "All residents";
    statusInput.value = ann?.status ?? "Draft";
    expirationInput.value = ann?.expires_at
        ? String(ann.expires_at).slice(0, 10)
        : "";
    saveAnnouncementButton.textContent = isEditing ? "Save Changes" : "Publish";
    editorModal.showModal();
}

async function saveAnnouncement(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const content = descriptionInput.value.trim();
    const status = statusInput.value;

    if (!title || !content) {
        showNotice("Please complete the announcement title and content.");
        return;
    }

    const announcementData = {
        title,
        content,
        expires_at: expirationInput.value
            ? `${expirationInput.value} 23:59:59`
            : null
    };

    const isEditing = editingAnnouncementId !== null;

    saveAnnouncementButton.disabled = true;
    saveAnnouncementButton.textContent = "Saving...";

    try {
        if (isEditing) {
            // Update announcement content and expiration
            await updateAnnouncement(
                editingAnnouncementId,
                announcementData
            );

            // Update status separately if it changed
            const existingAnnouncement = announcements.find(
                ann => String(ann.announcement_id) === String(editingAnnouncementId)
            );

            if (existingAnnouncement.status !== status) {
                await updateAnnouncementStatus(
                    editingAnnouncementId,
                    status
                );
            }

        } else {
            // Create a new announcement
            await createAnnouncement({
                ...announcementData,
                status
            });
        }

        // Retrieve updated records from the database
        announcements = await getAllAnnouncements() ?? [];
        announcementsLoadError = false;

        selectedId = isEditing
            ? editingAnnouncementId
            : announcements[0]?.announcement_id ?? null;

        closeEditor();
        renderTable();

        const selectedAnnouncement = announcements.find(
            ann => String(ann.announcement_id) === String(selectedId)
        );

        if (selectedAnnouncement) {
            renderPreview(selectedAnnouncement);
        }

        showNotice(
            isEditing
                ? "Announcement updated successfully."
                : "Announcement created successfully.",
            "success"
        );

    } catch (error) {
        console.error("Save announcement error:", error);
        showNotice(error.message || "Unable to save announcement.");

    } finally {
        saveAnnouncementButton.disabled = false;
        saveAnnouncementButton.textContent = "Save Changes";
    }
}

addAnnouncementButton.addEventListener("click", () => openEditor());

document.querySelectorAll("[data-close-editor]").forEach(button => {
    button.addEventListener("click", closeEditor);
});

document.querySelectorAll("[data-close-delete]").forEach(button => {
    button.addEventListener("click", () => {
        if (deleteModal.open) deleteModal.close();
    })
});

editorModal.addEventListener("close", () => {
    editingAnnouncementId = null;
    announcementForm.reset();
});

deleteModal.addEventListener("close", () => {
    deletingAnnouncementId = null;
});

searchInput.addEventListener("input", event => {
    searchQuery = event.target.value.trim();
    renderTable();
});

statusSelect.addEventListener("change", event => {
    statusFilter = event.target.value;
    renderTable();
});

tableBody.addEventListener("click", event => {
    const actionButton = event.target.closest("button[data-action]");
    if (actionButton) {
        const announcement = announcements.find(
            item => String(item.announcement_id) === actionButton.dataset.documentId
        );
        if (!announcement) return;

        if (actionButton.dataset.action === "edit") {
            openEditor(announcement);
        } else if (actionButton.dataset.action === "delete") {
            openDeleteConfirmation(announcement);
        }
        return;
    }

    const clickedCell = event.target.closest(".cell-title");
    if (!clickedCell) return;

    const row = clickedCell.closest(".announcement-row");
    if (!row) return;

    const clickedId = row.dataset.id;

    const selectedAnnouncement = announcements.find(
        item => String(item.announcement_id) === String(clickedId)
    );
    if (!selectedAnnouncement) return;

    selectedId = selectedAnnouncement.announcement_id;

    document.querySelectorAll(".announcement-row").forEach(r => r.classList.remove("selected"));
    row.classList.add("selected");

    renderPreview(selectedAnnouncement);
});

announcementForm.addEventListener("submit", saveAnnouncement);

confirmDeleteButton.addEventListener("click", () => {
    async function confirmDeleteAnnouncement() {
        if (deletingAnnouncementId === null) {
            return;
        }

        const announcementId = deletingAnnouncementId;

        const exists = announcements.some(
            ann => String(ann.announcement_id) === String(announcementId)
        );

        if (!exists) {
            return;
        }

        confirmDeleteButton.disabled = true;
        confirmDeleteButton.textContent = "Deleting...";

        try {
            // Delete announcement from the database
            await deleteAnnouncement(announcementId);

            // Retrieve updated announcements
            announcements = await getAllAnnouncements() ?? [];
            announcementsLoadError = false;

            // Update selected announcement
            if (String(selectedId) === String(announcementId)) {
                selectedId = announcements[0]?.announcement_id ?? null;
            }

            deleteModal.close();

            renderTable();

            // Update announcement preview
            const selectedAnnouncement = announcements.find(
                ann => String(ann.announcement_id) === String(selectedId)
            );

            if (selectedAnnouncement) {
                renderPreview(selectedAnnouncement);
            } else {
                document.getElementById("preview-id").textContent = "";
                document.getElementById("preview-meta").textContent = "";
                document.getElementById("preview-title").textContent = "No announcement selected";
                document.getElementById("preview-body").textContent = "";
                document.getElementById("preview-status").textContent = "";
                document.getElementById("preview-status").className = "";
            }

            showNotice("Announcement deleted successfully.", "success");

        } catch (error) {
            console.error("Delete announcement error:", error);
            showNotice(error.message || "Unable to delete announcement.");

        } finally {
            confirmDeleteButton.disabled = false;
            confirmDeleteButton.textContent = "Delete Announcement";
        }
    }

    confirmDeleteButton.addEventListener(
        "click",
        confirmDeleteAnnouncement
    );
})

renderTable();
if (announcements.length > 0) {
    renderPreview(announcements[0]);
}

window.finishPageSkeleton?.();