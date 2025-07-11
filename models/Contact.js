const db = require('../config/db');

class Contact {
    static create({ name, email, phone, message }) {
        return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO contacts (name, email, phone, message, created_at)
            VALUES (?, ?, ?, ?, NOW())
        `;
        db.query(query, [name, email, phone, message], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM contacts ORDER BY created_at DESC';
        db.query(query, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
        });
    }
    
    static deleteById(id) {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM contacts WHERE id = ?';
            db.query(query, [id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
            });
        });
    }
}

module.exports = Contact;