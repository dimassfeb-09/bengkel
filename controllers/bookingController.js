const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const Motorcycle = require('../models/Motorcycle');
const { sendBookingNotification, sendCancellationNotification } = require('../services/bookingNotifier');
const fs = require('fs');
const path = require('path');

const createBooking = async (req, res) => {
    try {
        const { motorcycle_id, service_id, booking_date, booking_time, complaint, payment_method, products } = req.body;
        const payment_proof = req.file ? req.file.filename : null;
        const userId = req.userId;

        // Cek jika ada error upload
        if (req.fileValidationError) {
            return res.status(400).json({
                success: false,
                message: req.fileValidationError
            });
        }

         // Validasi data wajib termasuk service_id
        if (!motorcycle_id || !service_id || !booking_date || !booking_time) {
            return res.status(400).json({ 
                message: 'Semua field wajib diisi' 
            });
        }

        // Cek ketersediaan slot
        const dailyBookings = await Booking.checkDailyAvailability(booking_date);
        if (dailyBookings >= 10) {
            return res.status(400).json({
                message: 'Slot booking untuk hari ini sudah penuh'
            });
        }

        // Validasi khusus untuk metode pembayaran non-cash
        if (payment_method !== 'cash' && !payment_proof) {
            return res.status(400).json({
                success: false,
                message: 'Harap upload bukti pembayaran'
            });
        }

        // Parse waktu dari frontend (format HH:MM)
        const [hours, minutes] = booking_time.split(':').map(Number);
        
        // Validasi format waktu
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            return res.status(400).json({
                message: 'Format waktu tidak valid'
            });
        }

        // Buat tanggal object untuk validasi
        const bookingDate = new Date(booking_date);
        bookingDate.setHours(hours, minutes);
        
        const now = new Date();

        // Validasi tanggal
        if (bookingDate < now) {
            return res.status(400).json({ 
                message: 'Tanggal booking tidak boleh di masa lalu' 
            });
        }
        
        // Validasi batas booking 3 bulan
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);
        if (bookingDate > maxDate) {
            return res.status(400).json({
                message: 'Booking hanya bisa dilakukan maksimal 3 bulan ke depan'
            });
        }
        
        // Validasi hari Minggu
        if (bookingDate.getDay() === 0) {
            return res.status(400).json({
                message: 'Kami tutup pada hari Minggu'
            });
        }
        
        // Validasi jam operasional (08:00-16:30)
        if (
            hours < 8 || 
            (hours === 16 && minutes > 30) || 
            hours >= 17
        ) {
            return res.status(400).json({
                message: 'Booking hanya bisa antara jam 08:00-16:30'
            });
        }

        let selectedProducts = [];
        try {
            selectedProducts = products ? JSON.parse(products) : [];
        } catch (e) {
            console.error('Error parsing products:', e);
            return res.status(400).json({
                success: false,
                message: 'Format data produk tidak valid'
            });
        }

        // Pastikan produk memiliki struktur yang benar
        if (selectedProducts.length > 0) {
            if (!selectedProducts[0].id || !selectedProducts[0].price) {
                return res.status(400).json({
                    success: false,
                    message: 'Data produk harus memiliki id dan price'
                });
            }
        }

        const serviceExists = await Service.getById(service_id);
        if (!serviceExists) {
            return res.status(400).json({ 
                message: 'Layanan servis tidak valid' 
            });
        }

        // Tentukan harga service
        let servicePrice = serviceExists.current_price;
        
        // Jika service memiliki produk DAN ada produk yang dipilih
        if (serviceExists.has_products && selectedProducts.length > 0) {
            servicePrice = 0;
        }

        // Simpan ke database
        const result = await Booking.createWithProducts({
            user_id: userId,
            motorcycle_id,
            service_id,
            booking_date, 
            booking_time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`,
            complaint,
            payment_method,
            payment_proof,
            service_price: servicePrice // Gunakan harga yang sudah ditentukan
        }, selectedProducts);

        await sendBookingNotification(result.insertId);
        res.status(201).json({
            message: 'Booking berhasil dibuat',
            bookingId: result.insertId
        });

    } catch (error) {
        console.error('Error creating booking:', error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ 
                message: 'Data motor atau layanan tidak valid' 
            });
        }
        if (error.code === 'LIMIT_FILE_TYPE') {
            return res.status(400).json({
                success: false,
                message: 'Hanya file gambar (JPEG, JPG, PNG) dan PDF yang diperbolehkan'
            });
        }
        res.status(500).json({ 
            message: 'Server error',
            error: error.message
        });
    }
};

const getUserBookings = async (req, res) => {
    try {
        const userId = req.userId;
        const bookings = await Booking.findByUserId(userId);
        res.json({ bookings });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message
        });
    }
};

const getBookingDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.getBookingWithProducts(id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking tidak ditemukan' });
        }
        // Verifikasi kepemilikan booking
        if (booking.user_id !== req.userId) {
            return res.status(403).json({ message: 'Akses ditolak' });
        }
        res.json(booking);
    } catch (error) {
        console.error('Error fetching booking detail:', error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message 
        });
    }
};

const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.getBookingWithProducts(id);
        
        // Verifikasi kepemilikan
        if (booking.user_id !== req.userId) {
            return res.status(403).json({ message: 'Akses ditolak' });
        }
        // Hapus bukti pembayaran jika ada
        if (booking.payment_proof) {
            const filePath = path.join(__dirname, '../uploads/payment_proofs', booking.payment_proof);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.warn('Gagal menghapus file bukti pembayaran:', err.message);
                }
            });
        }
        const isCancelled = await Booking.cancelBooking(id);
        await sendCancellationNotification(id);
        if (!isCancelled) {
            return res.status(400).json({ 
                message: 'Booking tidak dapat dibatalkan (status bukan "terjadwal" atau tidak ditemukan)' 
            });
        }
        res.json({ message: 'Booking berhasil dibatalkan' });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message 
        });
    }
};

const getBookingStats = async (req, res) => {
    try {
        const userId = req.userId;
        // Hitung statistik dari database
        const today = new Date().toISOString().split('T')[0];
        const stats = await Promise.all([
            // Booking hari ini
            Booking.countBookingsByDate(today),
            // Booking minggu ini
            Booking.countBookingsThisWeek(),
            // Booking bulan ini
            Booking.countBookingsThisMonth(),
            // Total pelanggan (asumsi ada model User)
            User.countUsers(),
            // Total motor terdaftar
            Motorcycle.countMotorcycles()
        ]);
        res.json({
            todayBookings: stats[0],
            weekBookings: stats[1],
            monthBookings: stats[2],
            totalUsers: stats[3],
            totalMotorcycles: stats[4]
        });
    } catch (error) {
        console.error('Error getting booking stats:', error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message 
        });
    }
};

const checkAvailability = async (req, res) => {
    try {
        const { date } = req.query;
        
        if (!date) {
            return res.status(400).json({ 
                message: 'Parameter date diperlukan' 
            });
        }
        const count = await Booking.checkDailyAvailability(date);
        res.json({ 
            count,
            available: count < 10 
        });
    } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    createBooking,
    getUserBookings,
    getBookingDetail,
    cancelBooking,
    getBookingStats,
    checkAvailability
};