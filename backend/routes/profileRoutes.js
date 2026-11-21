const express = require("express");
const router = express.Router();

const profileController = require("../controllers/profileController");

const {
    requireAuth
} = require("../middleware/authMiddleware.js");

// Retrieve Profile route
router.get("/", requireAuth, profileController.getProfile);

// Update Profile route
router.put("/", requireAuth, profileController.updateProfile);

// Update Notification Preferences route
router.put(
    "/notifications",
    requireAuth,
    profileController.updateNotificationPreferences
);

router.put(
    "/change-password",
    requireAuth,
    profileController.changePassword
);

module.exports = router;