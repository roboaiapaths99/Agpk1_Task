const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: parseInt(process.env.MAX_UPLOAD_SIZE, 10) || 200 * 1024 * 1024 }, // Default 200MB
    fileFilter: (req, file, cb) => {
        // Accept most common file types
        cb(null, true);
    }
});

module.exports = upload;
