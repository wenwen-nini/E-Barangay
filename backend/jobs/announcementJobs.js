
const cron = require("node-cron");
const announcementModel = require("../models/announcementModel");

function startAnnouncementExpirationJob() {
    // Runs every day at midnight
    cron.schedule("0 0 * * *", async () => {
        try {
            const archivedCount =
                await announcementModel.archiveExpiredAnnouncements();

            console.log(
                `[Announcement Job] ${archivedCount} expired announcement(s) archived.`
            );

        } catch (error) {
            console.error(
                "[Announcement Job] Failed to archive expired announcements:",
                error
            );
        }
    }, {
        timezone: "Asia/Manila"
    });

    console.log("[Announcement Job] Scheduled to run daily at midnight.");
}

module.exports = { startAnnouncementExpirationJob };
