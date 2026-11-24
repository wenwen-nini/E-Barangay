
const express = require("express");
const router = express.Router();

const reportController = require("../controllers/reportController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

// Retrieve Reports & Analytics data
router.get(
    "/",
    requireAuth,
    requireRole("Staff"),
    reportController.getReports
);

module.exports = router;
