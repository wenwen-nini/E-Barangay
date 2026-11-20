const express = require("express");
const cors = require("cors");
const session = require("express-session");

const app = express();

// 1. CORS configuration
app.use(cors({
    origin: "http://127.0.0.1:5500",
    credentials: true
}));

// 2. Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Session configuration
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

// 4. API routes
// app.use("/api/auth", authRoutes);
// app.use("/api/documents", documentRoutes);

// 5. Start server
app.listen(3000, () => {
    console.log("E-Barangay backend running on port 3000");
});