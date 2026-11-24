const announcementModel = require("../models/announcementModel");

async function getPublishedAnnouncements(req, res) {
    try {
        const announcements = await announcementModel.getPublishedAnnouncements();

        return res.status(200).json({
            success: true,
            announcements
        });
    } catch (error) {
        console.error("Get announcement error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve published announcements"
        });
    }
}

async function getAllAnnouncementsForStaff(req, res) {
    try {
        const announcements = await announcementModel.getAllAnnouncementsForStaff();

        return res.status(200).json({
            success: true,
            announcements
        });
    } catch (error) {
        console.error("Get all staff announcements error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve all staff announcements"
        });
    }
}

async function createAnnouncement(req, res) {
    try {
        const { title, content, expires_at, status = "Draft" } = req.body;

        if (
            !title ||
            typeof title !== "string" ||
            !content ||
            typeof content !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Title and content are required."
            });
        }

        const trimmedTitle = title.trim();
        const trimmedContent = content.trim();

        if (!trimmedTitle || !trimmedContent) {
            return res.status(400).json({
                success: false,
                message: "Title and content cannot be empty."
            });
        }

        if (trimmedTitle.length > 200) {
            return res.status(400).json({
                success: false,
                message: "Title must not exceed 200 characters."
            });
        }

        if (!["Draft", "Published"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid announcement status."
            });
        }

        if (expires_at) {
            const expirationDate = new Date(expires_at);

            if (Number.isNaN(expirationDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid expiration date."
                });
            }

            if (expirationDate <= new Date()) {
                return res.status(400).json({
                    success: false,
                    message: "Expiration date must be in the future."
                });
            }
        }

        const announcementId =
            await announcementModel.createAnnouncement(
                req.session.user.user_id,
                {
                    title: trimmedTitle,
                    content: trimmedContent,
                    expires_at: expires_at || null,
                    status
                }
            );

        return res.status(201).json({
            success: true,
            message: "Announcement created successfully.",
            announcement_id: announcementId
        });

    } catch (error) {
        console.error("Create announcement error:", error);

        if (error.message === "STAFF_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Staff account not found."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create announcement."
        });
    }
}

async function updateAnnouncement(req, res) {
    try {
        const announcementId = Number(req.params.id);
        const { title, content, expires_at } = req.body;

        if (!Number.isInteger(announcementId) || announcementId < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid announcement ID."
            });
        }

        if (
            typeof title !== "string" ||
            typeof content !== "string" ||
            !title.trim() ||
            !content.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Title and content are required."
            });
        }

        const trimmedTitle = title.trim();
        const trimmedContent = content.trim();

        if (trimmedTitle.length > 200) {
            return res.status(400).json({
                success: false,
                message: "Title must not exceed 200 characters."
            });
        }

        if (expires_at) {
            const expirationDate = new Date(expires_at);

            if (Number.isNaN(expirationDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid expiration date."
                });
            }

            if (expirationDate <= new Date()) {
                return res.status(400).json({
                    success: false,
                    message: "Expiration date must be in the future."
                });
            }
        }

        const updated = await announcementModel.updateAnnouncement(
            announcementId,
            {
                title: trimmedTitle,
                content: trimmedContent,
                expires_at: expires_at || null
            }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Announcement updated successfully."
        });

    } catch (error) {
        console.error("Update announcement error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update announcement."
        });
    }
}

async function updateAnnouncementStatus(req, res) {
    try {
        const announcementId = Number(req.params.id);
        const { status } = req.body;

        if (!Number.isInteger(announcementId) || announcementId < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid announcement ID."
            });
        }

        if (!["Draft", "Published", "Archived"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid announcement status."
            });
        }

        const updated = await announcementModel.updateAnnouncementStatus(
            announcementId,
            status
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: `Announcement ${status.toLowerCase()} successfully.`
        });

    } catch (error) {
        console.error("Update announcement status error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update announcement status."
        });
    }
}

async function archiveExpiredAnnouncements(req, res) {
    try {
        const archivedCount =
            await announcementModel.archiveExpiredAnnouncements();

        return res.status(200).json({
            success: true,
            message: "Expired announcements processed successfully.",
            archivedCount
        });

    } catch (error) {
        console.error("Archive expired announcements error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to process expired announcements."
        });
    }
}

async function deleteAnnouncement(req, res) {
    try {
        const { id } = req.params;

        if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid announcement ID."
            });
        }

        const deleted = await announcementModel.deleteAnnouncement(Number(id));

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Announcement deleted successfully."
        });

    } catch (error) {
        console.error("Delete announcement error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete announcement."
        });
    }
}

module.exports = {
    getPublishedAnnouncements,
    getAllAnnouncementsForStaff,
    createAnnouncement,
    updateAnnouncement,
    updateAnnouncementStatus,
    archiveExpiredAnnouncements,
    deleteAnnouncement
};