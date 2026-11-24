const express = require("express");
const router = express.Router();

const announcementController = require("../controllers/announcementController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

// Get Announcements route
router.get(
    "/",
    requireAuth,
    requireRole("Resident"),
    announcementController.getPublishedAnnouncements
);

// Get all announcements for staff route
router.get(
    "/staff/all",
    requireAuth,
    requireRole("Staff"),
    announcementController.getAllAnnouncementsForStaff
);

// Create an announcement route
router.post(
    "/staff",
    requireAuth,
    requireRole("Staff"),
    announcementController.createAnnouncement
);

// Automatically archives expired announcements route
router.patch(
    "/staff/archive-expired",
    requireAuth,
    requireRole("Staff"),
    announcementController.archiveExpiredAnnouncements
);

// Update an announcement route
router.put(
    "/staff/:id",
    requireAuth,
    requireRole("Staff"),
    announcementController.updateAnnouncement
);

// Update an announcement status route
router.patch(
    "/staff/:id/status",
    requireAuth,
    requireRole("Staff"),
    announcementController.updateAnnouncementStatus
);

// Delete an announcement route
router.delete(
    "/staff/:id",
    requireAuth,
    requireRole("Staff"),
    announcementController.deleteAnnouncement
);

module.exports = router;