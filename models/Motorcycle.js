const db = require('../config/db');

class Motorcycle {
    
    static create(motorData) {
        const { user_id, brand, model, year, license_plate } = motorData;
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO motorcycles 
                (user_id, brand, model, year, license_plate, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            `;
            db.query(query, [
                user_id, 
                brand, 
                model, 
                year, 
                license_plate
            ], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    static findByUserId(user_id) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT id, brand, model, year, license_plate
                FROM motorcycles 
                WHERE user_id = ?
                ORDER BY created_at DESC
            `;
            db.query(query, [user_id], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    static update(id, motorData) {
        const { brand, model, year, license_plate } = motorData;
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE motorcycles 
                SET brand = ?, model = ?, year = ?, license_plate = ?, updated_at = NOW()
                WHERE id = ?
            `;
            db.query(query, [brand, model, year, license_plate, id], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    static delete(id) {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM motorcycles WHERE id = ?`;
            db.query(query, [id], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    static findById(id) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM motorcycles WHERE id = ?`;
            db.query(query, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0]);
            });
        });
    }

    static countMotorcycles() {
        return new Promise((resolve, reject) => {
            const query = 'SELECT COUNT(*) as count FROM motorcycles';
            db.query(query, (err, results) => {
                if (err) return reject(err);
                resolve(results[0].count);
            });
        });
    }

    static countMotorcyclesLastWeek() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT COUNT(*) as count 
                FROM motorcycles 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)
            `;
            db.query(query, (err, results) => {
                if (err) return reject(err);
                resolve(results[0].count);
            });
        });
    }
}

module.exports = Motorcycle;