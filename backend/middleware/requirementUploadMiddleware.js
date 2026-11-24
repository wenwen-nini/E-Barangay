const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDirectory = path.join(
    __dirname,
    "../uploads/request-requirements"
);

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, uploadDirectory);
    },

    filename: function (req, file, callback) {
        const uniqueName =
            Date.now() + "-" + Math.round(Math.random() * 1E9);

        const newFilename =
            uniqueName + path.extname(file.originalname).toLowerCase();

        callback(null, newFilename);
    }
});

const fileFilter = (req, file, callback) => {
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "application/pdf"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        callback(null, true);
    } else {
        callback(
            new Error("Only JPEG, PNG, and PDF files are allowed")
        );
    }
};

const uploadRequirementsFiles = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 10
    }
});

module.exports = uploadRequirementsFiles;