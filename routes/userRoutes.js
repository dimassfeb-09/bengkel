const express = require('express');
const router = express.Router();
const { registerUser, updateProfile } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadAvatar');

router.post('/register', registerUser);
router.put('/profile', authMiddleware, upload.single('avatar'), updateProfile);

module.exports = router;
