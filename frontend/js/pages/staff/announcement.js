import { getAnnouncement } from "../../services/getServiceForStaff.js";

let searchQuery = "";
let statusFilter = "";
let announcements = await getAnnouncement() ?? [];
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
    const filteredAnnouncements = announcements.filter(ann => {
        const matchesSearch = ann.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || ann.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const htmlRows = filteredAnnouncements.map(ann => {
        const safeId = escapeHtml(ann.announcement_id);
        const isSelected = String(ann.announcement_id) === String(selectedId) ? "selected" : "";

        return `
            <tr class="announcement-row ${isSelected}" data-id="${safeId}">
                <td class="cell-title">
                    ${escapeHtml(ann.title)}
                    <small>ANN-${safeId}</small>
                </td>
                <td>${escapeHtml(ann.audience)}</td>
                <td>${escapeHtml(ann.published_at)}</td>
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

    tableBody.innerHTML = htmlRows || `<tr><td colspan="5" style="text-align: center; color: var(--primary-color);">No announcements match your filter.</td></tr>`;
    showEntries.textContent = `Showing ${filteredAnnouncements.length} of ${announcements.length} entries`;
}

function renderPreview(item) {
    if (!item) return;

    const previewMeta = `${item.published_at} ● ${item.audience}`;

    document.getElementById("preview-id").textContent = String(item.announcement_id).padStart(2, "0");
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
    deleteAnnouncementMeta.textContent = `ANN-${String(ann.announcement_id).padStart(2, "0")} ● ${ann.audience} ● Published ${ann.published_at}`;
    deleteModal.showModal();
}

function openEditor(ann = null) {
    editingAnnouncementId = ann?.announcement_id ?? null;
    announcementForm.reset();

    const isEditing = Boolean(ann);
    formTitle.textContent = isEditing ? "Edit announcement" : "Add announcement";
    formDescription.textContent = isEditing ? `ANN-${ann.announcement_id} ● ${ann.title}` : "Create a service update for the resident portal." ;
    titleInput.value = ann?.title ?? "";
    descriptionInput.value = ann?.content ?? "";
    audienceInput.value = "All residents";
    statusInput.value = ann?.status ?? "Draft";
    saveAnnouncementButton.textContent = isEditing ? "Save Changes" : "Publish";
    editorModal.showModal();
}

function saveAnnouncement(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const content = descriptionInput.value.trim();
    if (!title || !content) return;

    const existingAnnouncement = announcements.find(
        ann => ann.announcement_id === editingAnnouncementId
    );
    const announcementId = existingAnnouncement?.announcement_id
        ?? Math.max(0, ...announcements.map(ann => Number(ann.announcement_id)).filter(Number.isFinite)) + 1;
    const today = new Date().toISOString().slice(0, 10);
    const updatedAnnouncement = {
        ...existingAnnouncement,
        announcement_id: announcementId,
        staff_id: existingAnnouncement?.staff_id ?? 1,
        title,
        content,
        published_at: existingAnnouncement?.published_at ?? today,
        expires_at: existingAnnouncement?.expires_at ?? null,
        audience: audienceInput.value,
        status: statusInput.value
    };

    announcements = existingAnnouncement
        ? announcements.map(ann => ann.announcement_id === announcementId ? updatedAnnouncement : ann)
        : [...announcements, updatedAnnouncement];

    selectedId = announcementId;
    closeEditor();
    renderTable();
    renderPreview(updatedAnnouncement);
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
    const exists = announcements.some(ann => ann.announcement_id === deletingAnnouncementId);
    if (!exists) {
        return;
    }

    announcements = announcements.filter(ann => ann.announcement_id !== deletingAnnouncementId);
    if (String(selectedId) === String(deletingAnnouncementId)) {
        selectedId = announcements[0]?.announcement_id ?? null;
    }
    deleteModal.close();
    renderTable();
    if (selectedId !== null) {
        renderPreview(announcements.find(ann => ann.announcement_id === selectedId));
    } else {
        document.getElementById("preview-id").textContent = "";
        document.getElementById("preview-meta").textContent = "";
        document.getElementById("preview-title").textContent = "No announcement selected";
        document.getElementById("preview-body").textContent = "";
        document.getElementById("preview-status").textContent = "";
        document.getElementById("preview-status").className = "";
    }
})

renderTable();
if (announcements.length > 0) {
    renderPreview(announcements[0]);
}