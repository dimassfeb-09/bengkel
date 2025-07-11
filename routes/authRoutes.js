// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { loginUser, getProfile } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Endpoint untuk autentikasi
router.post('/login', loginUser);
router.get('/profile', authMiddleware, getProfile);

module.exports = router;