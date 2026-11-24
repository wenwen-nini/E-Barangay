const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadData = path.join(
    __dirname,
    "../uploads/document-previews"
);

fs.mkdirSync(uploadData, { recursive: true });

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, uploadData);
    },

    filename: function (req, file, callback) {
        const uniqueName = 
            Date.now() + "-" + Math.round(Math.random() * 1E9);

        callback(
            null,
            uniqueName + path.extname(file.originalname).toLowerCase()
        );
    }
});

const fileFilter = (req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png"];

    if (allowedTypes.includes(file.mimetype)) {
        callback(null, true);
    } else {
        callback(new Error("Only JPEG and PNG images are allowed."));
    }
};

const uploadDocumentPreview = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = uploadDocumentPreview;