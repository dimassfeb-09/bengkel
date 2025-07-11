const Contact = require('../models/Contact');

exports.createContact = async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        // Validasi input
        if (!name || !email || !message) {
        return res.status(400).json({ 
            success: false,
            message: 'Nama, email, dan pesan wajib diisi' 
        });
        }
        await Contact.create({ name, email, phone, message });
        res.status(201).json({
        success: true,
        message: 'Pesan berhasil dikirim'
        });
    } catch (error) {
        console.error('Error creating contact:', error);
        res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
        });
    }
};

    exports.getAllContacts = async (req, res) => {
        try {
            const contacts = await Contact.getAll();
            res.json({
            success: true,
            data: contacts
            });
        } catch (error) {
            console.error('Error getting contacts:', error);
            res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
            });
        }
    };

exports.deleteContact = async (req, res) => {
    try {
        const { id } = req.params;
        await Contact.deleteById(id);
        res.json({ success: true, message: 'Kontak dihapus' });
    } catch (err) {
        console.error('Gagal hapus kontak:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
