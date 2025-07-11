const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Buat folder upload jika belum ada
const folder = path.join(__dirname, '../public/uploads/avatars');
if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

const storage = multer.diskStorage({
    destination: folder,
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `avatar-${Date.now()}${ext}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    allowedTypes.includes(file.mimetype)
        ? cb(null, true)
        : cb(new Error('File harus berupa gambar JPG/PNG'));
};

module.exports = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }
});
