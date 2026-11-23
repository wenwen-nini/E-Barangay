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

module.exports = router;