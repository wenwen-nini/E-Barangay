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

module.exports = {
    getPublishedAnnouncements
};