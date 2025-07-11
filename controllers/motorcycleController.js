const Motorcycle = require('../models/Motorcycle');
const Booking = require('../models/Booking'); // Pastikan model Booking di-import

// Fungsi untuk mengecek apakah motor memiliki booking
const checkMotorcycleBookings = async (motorcycleId) => {
    try {
        // Cari booking yang menggunakan motor ini
        const bookings = await Booking.findByMotorcycleId(motorcycleId);
        
        // Jika ada booking yang ditemukan, return true
        return bookings.length > 0;
    } catch (error) {
        console.error('Error checking motorcycle bookings:', error);
        return true;
    }
};

const getMotorcyclesByUser = async (req, res) => {
    try {
        const userId = req.userId; // Dari middleware auth
        const motorcycles = await Motorcycle.findByUserId(userId);
        res.json({ motorcycles });
    } catch (error) {
        console.error('Error fetching motorcycles:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const addMotorcycle = async (req, res) => {
    try {
        const { brand, model, year, license_plate } = req.body;
        const userId = req.userId;
        const result = await Motorcycle.create({
            user_id: userId,
            brand,
            model,
            year,
            license_plate
        });
        res.status(201).json({
            message: 'Motorcycle added successfully',
            motorcycleId: result.insertId
        });
    } catch (error) {
        console.error('Error adding motorcycle:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateMotorcycle = async (req, res) => {
    try {
        const { id } = req.params;
        const { brand, model, year, license_plate } = req.body;
        const userId = req.userId;
        // Verifikasi motor milik user
        const motorcycle = await Motorcycle.findById(id);
        if (!motorcycle || motorcycle.user_id !== userId) {
            return res.status(404).json({ message: 'Motorcycle not found' });
        }
        await Motorcycle.update(id, { brand, model, year, license_plate });
        res.json({ message: 'Motorcycle updated successfully' });
    } catch (error) {
        console.error('Error updating motorcycle:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteMotorcycle = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Verifikasi motor milik user
        const motorcycle = await Motorcycle.findById(id);
        if (!motorcycle || motorcycle.user_id !== userId) {
            return res.status(404).json({ message: 'Motorcycle not found' });
        }
        // Cek apakah motor memiliki relasi booking
        const hasBookings = await checkMotorcycleBookings(id);
        if (hasBookings) {
            return res.status(400).json({ 
                message: 'Tidak dapat menghapus motor karena memiliki riwayat booking' 
            });
        }   
        await Motorcycle.delete(id);
        res.json({ message: 'Motorcycle deleted successfully' });
    } catch (error) {
        console.error('Error deleting motorcycle:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ 
                message: 'Tidak dapat menghapus motor karena memiliki riwayat booking' 
            });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getMotorcyclesByUser,
    addMotorcycle,
    updateMotorcycle,
    deleteMotorcycle,
    checkMotorcycleBookings
};