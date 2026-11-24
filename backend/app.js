const express = require("express");
const cors = require("cors");
const session = require("express-session");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const documentRoutes = require("./routes/documentRoutes");
const requestRoutes = require("./routes/requestRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reportRoutes = require("./routes/reportRoutes");

const {
    requireAuth,
    requireRole
} = require("./middleware/authMiddleware");

const app = express();

app.use(cors({
    origin: "http://127.0.0.1:5500",
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    }
}));

app.use(
    "/uploads/document-previews",
    express.static(path.join(__dirname, "uploads/document-previews"))
);

app.use(
    "/uploads/profile-images",
    express.static(path.join(__dirname, "uploads/profile-images"))
);

// 5. Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);


module.exports = app;