const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

// Resident Register route
router.post("/register", authController.registerResident);

// User Login route
router.post("/login", authController.loginUser);

// Check current user role session
router.get("/me", requireAuth, authController.getCurrentUser);

// Logout route
router.post("/logout", requireAuth, authController.logout);

module.exports = router;