const multer = require('multer');
const path = require('path');

// Folder tujuan penyimpanan
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/products');
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random()   * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `product-${unique}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    cb(null, allowed.includes(file.mimetype));
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // max 2MB
});

module.exports = upload;
