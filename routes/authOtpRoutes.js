// routes/authOtpRoutes.js (versi produksi DB, fix promise)
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/db');
const bcrypt = require('bcrypt');
const whatsappClient = require('../services/whatsappClient');

// Helper
const formatPhone = (phone) => {
    if (phone.startsWith('08')) return '62' + phone.slice(1);
    if (phone.startsWith('+')) return phone.slice(1);
    return phone;
};

// 1. Kirim OTP ke WhatsApp
router.post('/request-otp', async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Nomor HP wajib diisi' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

    try {
        // Simpan ke tabel otp_requests
        await db.promise().query(
        `INSERT INTO otp_requests (phone, otp_code, expires_at) VALUES (?, ?, ?)`,
        [phone, otp, expiresAt]
        );

        // Kirim ke WhatsApp
        const formatted = formatPhone(phone);
        await whatsappClient.sendMessage(
        `${formatted}@c.us`,
        `Kode OTP kamu: *${otp}*\nBerlaku selama 5 menit.`
        );

        res.json({ message: 'Kode OTP berhasil dikirim via WhatsApp' });
    } catch (err) {
        console.error('Gagal kirim OTP:', err);
        res.status(500).json({ message: 'Gagal mengirim OTP' });
    }
});

// 2. Verifikasi OTP & buat token reset
router.post('/verify-otp', async (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: 'Nomor dan OTP wajib diisi' });

    try {
        const [rows] = await db.promise().query(
        `SELECT * FROM otp_requests WHERE phone = ? AND otp_code = ? AND verified = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
        [phone, otp]
        );

        const match = rows[0];
        if (!match) return res.status(400).json({ message: 'OTP tidak valid atau kadaluarsa' });

        const token = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 15 * 60 * 1000); // token reset password 15 menit

        // Tandai OTP terverifikasi
        await db.promise().query(`UPDATE otp_requests SET verified = TRUE, token = ? WHERE id = ?`, [token, match.id]);

        // Simpan token ke users
        await db.promise().query(`UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE phone = ?`, [token, tokenExpires, phone]);

        res.json({ message: 'OTP terverifikasi', token });
    } catch (err) {
        console.error('Gagal verifikasi OTP:', err);
        res.status(500).json({ message: 'Gagal verifikasi OTP' });
    }
});

// 3. Reset password
router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token dan password wajib diisi' });

    try {
        const [rows] = await db.promise().query(
        `SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW() LIMIT 1`,
        [token]
        );

        const user = rows[0];
        if (!user) return res.status(400).json({ message: 'Token tidak valid atau kadaluarsa' });

        const hash = await bcrypt.hash(password, 10);

        await db.promise().query(
        `UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?`,
        [hash, user.id]
        );

        res.json({ message: 'Password berhasil diubah' });
    } catch (err) {
        console.error('Gagal reset password:', err);
        res.status(500).json({ message: 'Gagal reset password' });
    }
});

module.exports = router;
