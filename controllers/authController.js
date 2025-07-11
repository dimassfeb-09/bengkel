// controllers/authController.js
const bcrypt = require('bcrypt');
const User = require('../models/User');

// Di authController.js
const jwt = require('jsonwebtoken');

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'Email tidak ditemukan' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Password salah' });
        }

        // Buat token JWT
        const token = jwt.sign(
            { userId: user.id,
                role: user.is_admin ? 'admin' : 'user' 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Login berhasil',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                is_admin : user.is_admin
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

// Asumsikan kamu pakai JWT dan middleware autentikasi yang decode token dan simpan userId di req.userId
const getProfile = async (req, res) => {
    try {
        // User ID sudah tersedia dari middleware
        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        // Tidak perlu filter data karena sudah difilter di model
        res.json({ user });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { loginUser, getProfile };
