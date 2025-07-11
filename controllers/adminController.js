const db = require('../config/db');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Motorcycle = require('../models/Motorcycle');
const { sendStatusUpdateNotification } = require('../services/bookingNotifier');
const Service = require('../models/Service');

const getStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
            
        const [
            todayBookings,
            weekBookings,
            monthBookings,
            totalUsers,
            totalMotorcycles,
            lastWeekBookings,
            lastMonthBookings,
            lastWeekUsers,
            lastWeekMotorcycles
        ] = await Promise.all([
            Booking.countBookingsByDate(today),
            Booking.countBookingsThisWeek(),
            Booking.countBookingsThisMonth(),
            User.countUsers(),
            Motorcycle.countMotorcycles(),
            Booking.countBookingsLastWeek(),
            Booking.countBookingsLastMonth(),
            User.countUsersLastWeek(),
            Motorcycle.countMotorcyclesLastWeek()
        ]);

        // Hitung persentase perubahan
            const todayChange = lastWeekBookings > 0 ? 
                `+${Math.round((todayBookings - lastWeekBookings) / lastWeekBookings * 100)}%` : '+0%';
            
            const weekChange = lastWeekBookings > 0 ? 
                `+${Math.round((weekBookings - lastWeekBookings) / lastWeekBookings * 100)}%` : '+0%';
                
            const monthChange = lastMonthBookings > 0 ? 
                `+${Math.round((monthBookings - lastMonthBookings) / lastMonthBookings * 100)}%` : '+0%';
                
            const usersChange = lastWeekUsers > 0 ? 
                `+${Math.round((totalUsers - lastWeekUsers) / lastWeekUsers * 100)}%` : '+0%';
                
            const motorcyclesChange = lastWeekMotorcycles > 0 ? 
                `+${Math.round((totalMotorcycles - lastWeekMotorcycles) / lastWeekMotorcycles * 100)}%` : '+0%';

        res.json({
            todayBookings,
            weekBookings,
            monthBookings,
            totalUsers,
            totalMotorcycles,
            todayChange,
            weekChange,
            monthChange,
            usersChange,
            motorcyclesChange
        });

        } catch (error) {
            console.error('Error getting admin stats:', error);
            res.status(500).json({ message: 'Server error' });
        }
};

const getRecentBookings = async (req, res) => {
    try {
        const bookings = await Booking.getRecentBookings(5);
        res.json(bookings);
    } catch (error) {
        console.error('Error getting recent bookings:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.getAllForAdmin();
        res.json(bookings);
    } catch (error) {
        console.error('Error getting all bookings:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Validasi status
        const validStatuses = ['terjadwal', 'diproses', 'selesai', 'dibatalkan'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Status tidak valid' });
        }

        const updated = await Booking.updateStatus(id, status);
        
        if (!updated) {
            return res.status(404).json({ message: 'Booking tidak ditemukan' });
        }
        await sendStatusUpdateNotification(id, status);

        res.json({ message: 'Status booking berhasil diperbarui' });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { booking_date, booking_time } = req.body;

        if (!booking_date || !booking_time) {
            return res.status(400).json({ message: 'Tanggal dan waktu booking wajib diisi' });
        }

        const query = `
            UPDATE bookings 
            SET booking_date = ?, booking_time = ?, updated_at = NOW() 
            WHERE id = ?
        `;

        const result = await new Promise((resolve, reject) => {
            db.query(query, [booking_date, booking_time, id], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Booking tidak ditemukan' });
        }

        res.json({ message: 'Booking berhasil diperbarui' });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

const getAllCustomers = async (req, res) => {
    try {
        const { search } = req.query;
        let query = `
        SELECT 
            u.id, u.name, u.email, u.phone, u.created_at as joinDate,
            COUNT(b.id) as bookingCount
        FROM users u
        LEFT JOIN bookings b ON u.id = b.user_id
        WHERE u.is_admin = 0
        `;

        const params = [];

        if (search) {
        query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ` GROUP BY u.id ORDER BY u.created_at DESC`;

        const customers = await new Promise((resolve, reject) => {
        db.query(query, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
        });

        res.json(customers);
    } catch (error) {
        console.error('Error getting customers:', error);
        res.status(500).json({ message: 'Server error' });
    }
    };

const getCustomerDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await User.getCustomerWithDetails(id);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // ⬇️ Kirim semua properti
        res.json({
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            joinDate: customer.joinDate,
            vehicles: customer.vehicles || [],
            bookings: customer.bookings || []
        });
    } catch (error) {
        console.error('Error getting customer detail:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};



const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone } = req.body;

        // Validasi input
        if (!name || !email || !phone) {
        return res.status(400).json({ message: 'Name, email, and phone are required' });
        }

        // Update customer
        const result = await new Promise((resolve, reject) => {
        const query = `
            UPDATE users 
            SET name = ?, email = ?, phone = ?, updated_at = NOW()
            WHERE id = ? AND is_admin = 0
        `;
        db.query(query, [name, email, phone, id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
        });

        if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Customer not found' });
        }

        res.json({ message: 'Customer updated successfully' });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const addMotorcycle = async (req, res) => {
    try {
        const { user_id, brand, model, year, license_plate } = req.body;

        if (!user_id || !brand || !model || !year || !license_plate) {
            return res.status(400).json({ message: 'Semua data kendaraan wajib diisi' });
        }

        const query = `
            INSERT INTO motorcycles (user_id, brand, model, year, license_plate, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `;

        const result = await new Promise((resolve, reject) => {
            db.query(query, [user_id, brand, model, year, license_plate], (err, res) => {
                if (err) return reject(err);
                resolve(res);
            });
        });

        res.status(201).json({ message: 'Kendaraan berhasil ditambahkan', motorcycle_id: result.insertId });
    } catch (error) {
        console.error('Error adding motorcycle:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateMotorcycle = (req, res) => {
    const { id } = req.params;
    const { brand, model, year, license_plate } = req.body;

    const query = `
        UPDATE motorcycles
        SET brand = ?, model = ?, year = ?, license_plate = ?
        WHERE id = ?
    `;
    db.query(query, [brand, model, year, license_plate, id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Gagal update motor' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Motor tidak ditemukan' });
        res.json({ message: 'Motor berhasil diperbarui' });
    });
};

const deleteMotorcycle = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM motorcycles WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Gagal menghapus motor' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Motor tidak ditemukan' });
        res.json({ message: 'Motor berhasil dihapus' });
    });
};

const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Cek apakah user punya booking aktif
        const bookings = await Booking.findByUserId(id); // Pastikan fungsi ini tersedia

        const hasActiveBookings = bookings.some(b => 
        b.status === 'terjadwal' || b.status === 'diproses'
        );

        if (hasActiveBookings) {
        return res.status(400).json({
            message: 'Customer tidak dapat dihapus karena masih memiliki booking aktif'
        });
        }

        // 2. Lanjut hapus jika aman
        const result = await User.deleteCustomer(id);

        if (!result) {
        return res.status(404).json({ message: 'Customer tidak ditemukan' });
        }

        res.json({ message: 'Customer berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


const getBookingDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.getBookingWithProducts(id); // Sudah tersedia di model

        if (!booking) {
            return res.status(404).json({ message: 'Booking tidak ditemukan' });
        }

        res.json(booking); // Langsung kirim data lengkap
    } catch (error) {
        console.error('Error fetching booking detail (admin):', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllServices = async (req, res) => {
    try {
        const services = await Service.getAllServices();
        res.json(services);
    } catch (err) {
        console.error('Error getAllServices:', err);
        res.status(500).json({ message: 'Gagal mengambil layanan' });
    }
};


const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, duration, price, original_price, recommended_interval, description, isPopular, features } = req.body;
        await Service.updateServiceWithFeatures(id, {
            name,
            duration,
            current_price: price,
            original_price,
            recommended_interval,
            description,
            isPopular,
            features
        });
        res.json({ message: 'Layanan diperbarui' });
    } catch (err) {
        console.error('Error updateService:', err);
        res.status(500).json({ message: 'Gagal memperbarui layanan' });
    }
};


const deleteService = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Hapus fitur layanan terkait
        await new Promise((resolve, reject) => {
            db.query('DELETE FROM service_features WHERE service_id = ?', [id], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
        // 2. Hapus produk layanan terkait
        await new Promise((resolve, reject) => {
            db.query('DELETE FROM service_products WHERE service_id = ?', [id], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
        // 3. Hapus layanan
        const result = await new Promise((resolve, reject) => {
            db.query('DELETE FROM services WHERE id = ?', [id], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Layanan tidak ditemukan' });
        }
        res.json({ message: 'Layanan dan data terkait berhasil dihapus' });
    } catch (err) {
        console.error('Gagal hapus layanan dan data terkait:', err);
        res.status(500).json({ message: 'Gagal menghapus layanan' });
    }
};

const createService = async (req, res) => {
    try {
        const { name, duration, price, original_price, recommended_interval,description, isPopular, features } = req.body;
        const result = await Service.addServiceWithFeatures({
            name,
            duration,
            current_price: price,
            original_price,
            recommended_interval,
            description,
            isPopular,
            features
        });
        res.status(201).json({ message: 'Layanan ditambahkan', id: result.insertId });
    } catch (err) {
        console.error('Error createService:', err);
        res.status(500).json({ message: 'Gagal menambahkan layanan' });
    }
};

const getServiceProducts = async (req, res) => {
    const { serviceId } = req.params;
    const query = `SELECT * FROM service_products WHERE service_id = ?`;
    db.query(query, [serviceId], (err, results) => {
        if (err) {
        console.error('Error fetching products:', err);
        return res.status(500).json({ message: 'Gagal mengambil produk' });
        }
        res.json(results);
    });
};

const addServiceProduct = async (req, res) => {
    const { serviceId } = req.params;
    const { name, brand, price, description } = req.body;
    const image_url = req.file?.filename;

    // 1. Validasi wajib isi
    if (!name || !brand || !price) {
        return res.status(400).json({ message: 'Field wajib tidak lengkap' });
    }

    // 2. Cek apakah serviceId valid
    const serviceExists = await Service.getById(serviceId);
    if (!serviceExists) {
        return res.status(400).json({ message: 'Layanan tidak ditemukan' });
    }

    // 3. Lanjutkan insert
    const query = `
        INSERT INTO service_products (service_id, name, brand, price, image_url, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    db.query(
        query,
        [serviceId, name, brand, price, image_url, description],
        (err, result) => {
        if (err) {
            console.error('Error adding product:', err);
            return res.status(500).json({ message: 'Gagal menambahkan produk' });
        }
        res.status(201).json({ message: 'Produk berhasil ditambahkan', id: result.insertId });
        }
    );
};


const updateServiceProduct = (req, res) => {
    const { id } = req.params;
    const { name, brand, price, description } = req.body;
    const image_url = req.file?.filename;

    const updates = [];
    const params = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (brand) { updates.push('brand = ?'); params.push(brand); }
    if (price) { updates.push('price = ?'); params.push(price); }
    if (description) { updates.push('description = ?'); params.push(description); }
    if (image_url) { updates.push('image_url = ?'); params.push(image_url); }

    if (updates.length === 0) {
        return res.status(400).json({ message: 'Tidak ada perubahan yang dikirim' });
    }

    const query = `UPDATE service_products SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
    params.push(id);

    db.query(query, params, (err, result) => {
        if (err) {
        console.error('Error updating product:', err);
        return res.status(500).json({ message: 'Gagal update produk' });
        }
        res.json({ message: 'Produk berhasil diperbarui' });
    });
};

const deleteServiceProduct = (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM service_products WHERE id = ?`;
    db.query(query, [id], (err, result) => {
        if (err) {
        console.error('Error deleting product:', err);
        return res.status(500).json({ message: 'Gagal menghapus produk' });
        }
        if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }
        res.json({ message: 'Produk berhasil dihapus' });
    });
};


module.exports = {
    getStats,
    getRecentBookings,
    getAllBookings,
    getBookingDetail,
    updateBookingStatus,
    updateBooking,
    getAllCustomers,
    getCustomerDetail,
    updateCustomer,
    deleteCustomer,
    addMotorcycle,
    updateMotorcycle,
    deleteMotorcycle,
    getAllServices,
    createService,
    updateService,
    deleteService,
    updateServiceProduct,
    getServiceProducts,
    addServiceProduct,
    deleteServiceProduct
};