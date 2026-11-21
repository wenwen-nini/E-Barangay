const express = require("express");
const cors = require("cors");
const session = require("express-session");

const authRoutes = require("./routes/authRoutes");

const app = express();

// 1. CORS
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || "http://127.0.0.1:5500",
    credentials: true
}));

// 2. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Session
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

// 4. Debugging middleware

// 5. Routes
app.use("/api/auth", authRoutes);

module.exports = app;