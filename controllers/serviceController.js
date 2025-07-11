const Service = require('../models/Service');
const db = require('../config/db');

exports.getAllServices = async (req, res) => {
    try {
        const services = await Service.getAllServices();
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getServiceById = async (req, res) => {
    try {
        const service = await Service.getById(req.params.id);
            if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.json(service);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getServiceProducts = async (req, res) => {
    try {
        const query = `
        SELECT * FROM service_products 
        WHERE service_id = ?
        ORDER BY price ASC
        `;
        db.query(query, [req.params.id], (err, results) => {
        if (err) throw err;
        res.json(results);
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};


