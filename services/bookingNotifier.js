// services/bookingNotifier.js
const db = require('../config/db');
const whatsappClient = require('./whatsappClient');

const formatPhone = (phone) => {
    if (phone.startsWith('08')) return '62' + phone.slice(1);
    if (phone.startsWith('+')) return phone.slice(1);
    return phone;
};

const sendBookingNotification = async (bookingId) => {
    try {
        const [rows] = await db.promise().query(
        `SELECT b.id, b.booking_date, b.booking_time, b.complaint, b.payment_method,
                s.name AS service_name,
                u.name AS user_name, u.phone,
                m.brand, m.model
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN services s ON b.service_id = s.id
            JOIN motorcycles m ON b.motorcycle_id = m.id
            WHERE b.id = ?`,
        [bookingId]
        );

        const booking = rows[0];
        if (!booking) throw new Error('Data booking tidak ditemukan');

        const recipient = `${formatPhone(booking.phone)}@c.us`;

        const bookingDate = new Date(booking.booking_date);
        const hari = bookingDate.toLocaleDateString('id-ID', { weekday: 'long' });
        const tanggal = bookingDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        const message = `Halo ${booking.user_name}, booking kamu berhasil ✅\n\n` +
        `🔧 Layanan: ${booking.service_name}\n` +
        `📅 Tanggal: ${hari}, ${tanggal}\n` +
        `⏰ Waktu: ${booking.booking_time}\n` +
        `🏍️ Motor: ${booking.brand} ${booking.model}\n` +
        `📝 Keluhan: ${booking.complaint || '-'}\n` +
        `💳 Pembayaran: ${booking.payment_method || 'Belum dipilih'}\n\n` +
        `Jika ada sesuatu bisa langsung hubungi kami.`;

        await whatsappClient.sendMessage(recipient, message);
        console.log(`✅ Notifikasi booking terkirim ke ${booking.phone}`);

    } catch (err) {
        console.error('❌ Gagal kirim notifikasi booking:', err);
    }
};

const sendCancellationNotification = async (bookingId) => {
    try {
        const [rows] = await db.promise().query(
            `SELECT b.id, b.booking_date, b.booking_time, b.complaint, b.payment_method,
                    s.name AS service_name,
                    u.name AS user_name, u.phone,
                    m.brand, m.model
                    FROM bookings b
                    JOIN users u ON b.user_id = u.id
                    JOIN services s ON b.service_id = s.id
                    JOIN motorcycles m ON b.motorcycle_id = m.id
                    WHERE b.id = ?`,
            [bookingId]
        );

        const booking = rows[0];
        if (!booking) throw new Error('Data booking tidak ditemukan');

        const recipient = `${formatPhone(booking.phone)}@c.us`;

        const bookingDate = new Date(booking.booking_date);
        const hari = bookingDate.toLocaleDateString('id-ID', { weekday: 'long' });
        const tanggal = bookingDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        const message = `Hai ${booking.user_name}, booking servis kamu telah *dibatalkan* ❌\n\n` +
            `🔧 Layanan: ${booking.service_name}\n` +
            `📅 Tanggal: ${hari}, ${tanggal}\n` +
            `⏰ Waktu: ${booking.booking_time}\n` +
            `🏍️ Motor: ${booking.brand} ${booking.model}\n` +
            `📝 Keluhan: ${booking.complaint || '-'}\n\n` +
            `Jika ini tidak kamu lakukan, hubungi admin kami segera.`;

        await whatsappClient.sendMessage(recipient, message);
        console.log(`✅ Notifikasi pembatalan terkirim ke ${booking.phone}`);
    } catch (err) {
        console.error('❌ Gagal kirim notifikasi pembatalan:', err);
    }
};

const sendStatusUpdateNotification = async (bookingId, newStatus) => {
    try {
        const [rows] = await db.promise().query(
            `SELECT b.id, b.booking_date, b.booking_time, b.complaint, b.payment_method,
                    s.name AS service_name,
                    u.name AS user_name, u.phone,
                    m.brand, m.model
                FROM bookings b
                JOIN users u ON b.user_id = u.id
                JOIN services s ON b.service_id = s.id
                JOIN motorcycles m ON b.motorcycle_id = m.id
                WHERE b.id = ?`,
            [bookingId]
        );

        const booking = rows[0];
        if (!booking) throw new Error('Data booking tidak ditemukan');

        const recipient = `${formatPhone(booking.phone)}@c.us`;

        const bookingDate = new Date(booking.booking_date);
        const hari = bookingDate.toLocaleDateString('id-ID', { weekday: 'long' });
        const tanggal = bookingDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        let message = `🔔 Halo ${booking.user_name}, status booking kamu telah diperbarui.\n\n` +
            `🔧 Layanan: ${booking.service_name}\n` +
            `📅 Tanggal: ${hari}, ${tanggal}\n` +
            `⏰ Waktu: ${booking.booking_time}\n` +
            `🏍️ Motor: ${booking.brand} ${booking.model}\n` +
            `📝 Keluhan: ${booking.complaint || '-'}\n\n`;

        switch (newStatus) {
            case 'diproses':
                message += `📌 Booking kamu sudah dikonfirmasi dan segera diproses.`;
                break;
            case 'selesai':
                message += `✅ Servis sudah selesai. Silakan ambil motor kamu. Terima kasih!`;
                break;
            case 'dibatalkan':
                message += `❌ Booking kamu dibatalkan oleh admin. Jika kamu tidak melakukan ini, hubungi kami.`;
                break;
            default:
                message += `Status terbaru: ${newStatus}`;
        }

        await whatsappClient.sendMessage(recipient, message);
        console.log(`✅ Notifikasi status "${newStatus}" terkirim ke ${booking.phone}`);
    } catch (err) {
        console.error(`❌ Gagal kirim notifikasi status ${newStatus}:`, err);
    }
};
module.exports = { 
    sendBookingNotification,
    sendCancellationNotification,
    sendStatusUpdateNotification
};
