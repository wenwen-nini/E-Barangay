const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

// Get Notification route
router.get(
    "/",
    requireAuth,
    requireRole("Resident"),
    notificationController.getUserNotifications
);

// Mark Notification route
router.put(
    "/:id/read",
    requireAuth,
    requireRole("Resident"),
    notificationController.markNotificationAsRead
);

module.exports = router;