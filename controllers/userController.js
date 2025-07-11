const bcrypt = require('bcrypt');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

exports.registerUser = async (req, res) => {
    const { name, email, password, phone, avatar, address } = req.body;

    if (!name || !email || !password || !phone) {
        return res.status(400).json({ message: 'Harap lengkapi semua field yang wajib' });
    }

    try {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email sudah digunakan' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.createUser({
            name,
            email,
            password: hashedPassword,
            phone,
            avatar,
            address
        });

        res.status(201).json({ message: 'Registrasi berhasil' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

exports.updateProfile = async (req, res) => {
    const userId = req.userId;
    const { name, phone } = req.body;
    const avatar = req.file ? `/uploads/avatars/${req.file.filename}` : undefined;

    try {
        // Ambil data user lama
        const existing = await User.findById(userId);

        // Hapus avatar lama jika ada dan upload baru
        if (avatar && existing.avatar) {
            const oldPath = path.join(__dirname, '../public', existing.avatar);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        const data = {};
        if (name) data.name = name;
        if (phone) data.phone = phone;
        if (avatar) data.avatar = avatar;

        await User.updateById(userId, data);
        res.json({ success: true, message: 'Profil berhasil diperbarui' });
    } catch (error) {
        console.error('Update profil gagal:', error);
        res.status(500).json({ success: false, message: 'Gagal update profil' });
    }
};
