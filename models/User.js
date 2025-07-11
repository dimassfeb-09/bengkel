// models/User.js (sudah kamu punya)
const db = require('../config/db');
const Motorcycle = require('./Motorcycle');
const Booking = require('./Booking');
class User {
    static createUser(userData) {
        const { name, email, password, phone, avatar } = userData;
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO users (name, email, password, phone, avatar, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            `;
            db.query(query, [name, email, password, phone, avatar || null], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    static findByEmail(email) {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
                if (err) reject(err);
                resolve(results[0]);
            });
        });
    }

    static findById(id) {
        return new Promise((resolve, reject) => {
            db.query('SELECT id, name, email, phone, avatar, is_admin FROM users WHERE id = ?', [id], (err, results) => {
                if (err) reject(err);
                resolve(results[0]);
            });
        });
    }

    static countUsers() {
        return new Promise((resolve, reject) => {
                const query = 'SELECT COUNT(*) as count FROM users';
                db.query(query, (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0].count);
                }
            );
        });
    }

    static countUsersLastWeek() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT COUNT(*) as count 
                FROM users 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)
            `;
            db.query(query, (err, results) => {
                if (err) return reject(err);
                resolve(results[0].count);
            });
        });
    }
    
    static getAllCustomers() {
        return new Promise((resolve, reject) => {
        const query = `
            SELECT 
            u.id, u.name, u.email, u.phone, u.avatar, u.created_at as joinDate,
            COUNT(b.id) as bookingCount
            FROM users u
            LEFT JOIN bookings b ON u.id = b.user_id
            WHERE u.is_admin = 0
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `;
        db.query(query, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
        });
    }

    static async getCustomerWithDetails(id) {
        try {
            const [users] = await db.promise().query(
                `SELECT id, name, email, phone, created_at as joinDate FROM users WHERE id = ? AND is_admin = 0`,
                [id]
            );

            if (users.length === 0) return null;

            const user = users[0];

            const vehicles = await Motorcycle.findByUserId(id);
            const bookings = await Booking.findByUserId(id);

            return {
                ...user,
                vehicles,
                bookings
            };
        } catch (error) {
            throw error;
        }
    }


    static deleteCustomer(id) {
        return new Promise((resolve, reject) => {
        // Pertama cek apakah customer memiliki booking aktif
        const checkQuery = 'SELECT COUNT(*) as count FROM bookings WHERE user_id = ? AND status NOT IN ("dibatalkan", "selesai")';
        db.query(checkQuery, [id], (err, results) => {
            if (err) return reject(err);
            
            if (results[0].count > 0) {
            return reject(new Error('Customer memiliki booking aktif'));
            }
            
            // Jika tidak ada booking aktif, hapus customer
            const deleteQuery = 'DELETE FROM users WHERE id = ? AND is_admin = 0';
            db.query(deleteQuery, [id], (err, result) => {
            if (err) return reject(err);
            resolve(result.affectedRows > 0);
            });
        });
        });
    }

    static updateById(id, data) {
        const fields = [];
        const values = [];

        if (data.name) {
            fields.push('name = ?');
            values.push(data.name);
        }

        if (data.phone) {
            fields.push('phone = ?');
            values.push(data.phone);
        }

        if (data.avatar) {
            fields.push('avatar = ?');
            values.push(data.avatar);
        }

        values.push(id);
        const query = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;

        return new Promise((resolve, reject) => {
            db.query(query, values, (err, result) => {
            if (err) return reject(err);
            resolve(result);
            });
        });
    }
}


module.exports = User;
