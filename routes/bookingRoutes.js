const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

router.use(authMiddleware);

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/payment_proofs/');
    },
    filename: function (req, file, cb) {
        // Format nama file: timestamp-ekstensi
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname); // Dapatkan ekstensi file
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// Filter file hanya menerima gambar dan PDF
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Hanya file gambar (JPEG, JPG, PNG) dan PDF yang diperbolehkan'));
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // Maksimal 2MB
});

router.post('/', 
    upload.single('payment_proof'), // Field name untuk upload file
    bookingController.createBooking
);
router.get('/', bookingController.getUserBookings);
router.get('/availability', bookingController.checkAvailability);
router.get('/:id', bookingController.getBookingDetail);
router.put('/:id/cancel', bookingController.cancelBooking);
router.get('/stats', bookingController.getBookingStats);

module.exports = router;

