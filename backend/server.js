require("dotenv").config();

const app = require("./app");

const {
    startAnnouncementExpirationJob
} = require("./jobs/announcementJobs");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`E-Barangay backend running on port ${PORT}`);

    startAnnouncementExpirationJob();
});