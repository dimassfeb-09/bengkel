const db = require('../config/db');
class Booking {
        static createWithProducts(bookingData, products) {
            return new Promise((resolve, reject) => {
                db.beginTransaction(async (err) => {
                    if (err) return reject(err);

                    try {
                        // 1. Buat booking terlebih dahulu
                        const bookingQuery = `
                            INSERT INTO bookings 
                            (user_id, motorcycle_id, service_id, booking_date, booking_time, 
                            complaint, payment_method, payment_proof, status, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'terjadwal', NOW(), NOW())
                        `;
                        const bookingParams = [
                            bookingData.user_id, 
                            bookingData.motorcycle_id, 
                            bookingData.service_id, 
                            bookingData.booking_date, 
                            bookingData.booking_time,
                            bookingData.complaint,
                            bookingData.payment_method,
                            bookingData.payment_proof
                        ];

                        const [bookingResult] = await db.promise().query(bookingQuery, bookingParams);

                        // 2. Simpan produk yang dipilih
                        if (products && products.length > 0) {
                            const productQuery = `
                                INSERT INTO booking_products 
                                (booking_id, product_id, price, quantity)
                                VALUES ?
                            `;
                            
                            const productValues = products.map(product => [
                                bookingResult.insertId,
                                product.id,
                                product.price,
                                product.quantity || 1
                            ]);
                            const [productResult] = await db.promise().query(productQuery, [productValues]);
                        }

                        await db.promise().commit();
                        resolve(bookingResult);
                    } catch (error) {
                        await db.promise().rollback();
                        reject(error);
                    }
                });
            });
        }

        static findByUserId(user_id) {
            return new Promise((resolve, reject) => {
                const query = `
                    SELECT 
                        b.*, 
                        m.brand, 
                        m.model, 
                        m.license_plate,
                        s.name as service_name,
                        s.current_price AS service_price,
                        CONCAT(b.booking_date, ' ', b.booking_time) AS full_booking_datetime
                    FROM bookings b
                    JOIN motorcycles m ON b.motorcycle_id = m.id
                    JOIN services s ON b.service_id = s.id
                    WHERE b.user_id = ?
                    ORDER BY b.booking_date DESC, b.booking_time DESC
                `;
                db.query(query, [user_id], (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                });
            });
        }

        static findById(id) {
            return new Promise((resolve, reject) => {
                const query = `
                    SELECT 
                        b.*, 
                        m.brand, 
                        m.model, 
                        m.license_plate,
                        s.name as service_name,
                        s.current_price as service_price
                    FROM bookings b
                    JOIN motorcycles m ON b.motorcycle_id = m.id
                    JOIN services s ON b.service_id = s.id
                    WHERE b.id = ?
                `;
                db.query(query, [id], (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0] || null);
                });
            });
        }


        static cancelBooking(id) {
            return new Promise((resolve, reject) => {
                const query = `
                    UPDATE bookings 
                    SET status = 'dibatalkan', updated_at = NOW()
                    WHERE id = ? AND status = 'terjadwal'
                `;
                db.query(query, [id], (err, result) => {
                    if (err) return reject(err);
                    resolve(result.affectedRows > 0);
                });
            });
        }

        static findByMotorcycleId(motorcycleId) {
            return new Promise((resolve, reject) => {
                const query = `
                    SELECT id FROM bookings 
                    WHERE motorcycle_id = ? 
                    LIMIT 1
                `;
                db.query(query, [motorcycleId], (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                });
            });
        }

        static countBookingsLastWeek() {
            return new Promise((resolve, reject) => {
                const query = `
                    SELECT COUNT(*) as count 
                    FROM bookings 
                    WHERE YEARWEEK(booking_date, 1) = YEARWEEK(CURDATE() - INTERVAL 1 WEEK, 1)
                `;
                db.query(query, (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0].count);
                });
            });
        }

        static countBookingsLastMonth() {
            return new Promise((resolve, reject) => {
                const query = `
                    SELECT COUNT(*) as count 
                    FROM bookings 
                    WHERE YEAR(booking_date) = YEAR(CURDATE() - INTERVAL 1 MONTH)
                    AND MONTH(booking_date) = MONTH(CURDATE() - INTERVAL 1 MONTH)
                `;
                db.query(query, (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0].count);
                });
            });
        }

        static countBookingsByDate(date) {
            return new Promise((resolve, reject) => {
                const query = `
                    SELECT COUNT(*) as count 
                    FROM bookings 
                    WHERE booking_date = ?
                `;
                db.query(query, [date], (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0].count);
                });
            });
        }

        static countBookingsThisWeek() {
            return new Promise((resolve, reject) => {
                const query = `
                    SELECT COUNT(*) as count 
                    FROM bookings 
                    WHERE YEARWEEK(booking_date, 1) = YEARWEEK(CURDATE(), 1)
                `;
                db.query(query, (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0].count);
                });
            });
        }

        static countBookingsThisMonth() {
            return new Promise((resolve, reject) => {
                const query = `
                    SELECT COUNT(*) as count 
                    FROM bookings 
                    WHERE YEAR(booking_date) = YEAR(CURDATE()) 
                    AND MONTH(booking_date) = MONTH(CURDATE())
                `;
                db.query(query, (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0].count);
                });
            });
        }

        static getRecentBookings(limit = 5) {
            return new Promise((resolve, reject) => {
                const query = `
                    SELECT 
                        b.id,
                        b.booking_date,
                        b.booking_time,
                        b.status,
                        u.name as user_name,
                        m.brand,
                        m.model,
                        m.license_plate,
                        s.name as service_name
                    FROM bookings b
                    JOIN users u ON b.user_id = u.id
                    JOIN motorcycles m ON b.motorcycle_id = m.id
                    JOIN services s ON b.service_id = s.id
                    ORDER BY b.created_at DESC
                    LIMIT ?
                `;
                db.query(query, [limit], (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                });
            });
        }

        // Di models/Booking.js
        static getBookingWithProducts(bookingId) {
            return new Promise((resolve, reject) => {
                const query = `
                    SELECT 
                        b.*,
                        m.brand as motorcycle_brand,
                        m.model as motorcycle_model,
                        m.license_plate,
                        s.name as service_name,
                        s.current_price as service_price,
                        s.has_products as service_has_products,
                        GROUP_CONCAT(
                            JSON_OBJECT(
                                'id', bp.product_id,
                                'name', sp.name,
                                'brand', sp.brand,
                                'price', bp.price,
                                'quantity', bp.quantity
                            )
                        ) as products
                    FROM bookings b
                    LEFT JOIN motorcycles m ON b.motorcycle_id = m.id
                    LEFT JOIN services s ON b.service_id = s.id
                    LEFT JOIN booking_products bp ON b.id = bp.booking_id
                    LEFT JOIN service_products sp ON bp.product_id = sp.id
                    WHERE b.id = ?
                    GROUP BY b.id
                `;
                
                db.query(query, [bookingId], (err, results) => {
                    if (err) return reject(err);
                    
                    if (results.length > 0) {
                        const booking = results[0];
                        try {
                            booking.products = booking.products 
                                ? JSON.parse(`[${booking.products}]`) 
                                : [];
                            
                            // Hanya set harga service ke 0 jika:
                            // 1. Service memiliki produk (has_products = 1) DAN
                            // 2. Ada produk yang dipilih
                            if (booking.service_has_products && booking.products.length > 0) {
                                booking.service_price = 0;
                            }
                        } catch (e) {
                            console.error('Error parsing products:', e);
                            booking.products = [];
                        }
                        resolve(booking);
                    } else {
                        resolve(null);
                    }
                });
            });
        }

        static getAllForAdmin() {
            return new Promise((resolve, reject) => {
                const query = `
                    SELECT 
                        b.id,
                        u.name AS customer_name,
                        u.phone AS customer_phone,
                        m.brand,
                        m.model,
                        m.license_plate,
                        s.name AS service_name,
                        b.booking_date,
                        b.booking_time,
                        b.status,
                        b.complaint
                    FROM bookings b
                    JOIN users u ON b.user_id = u.id
                    JOIN motorcycles m ON b.motorcycle_id = m.id
                    JOIN services s ON b.service_id = s.id
                    ORDER BY b.booking_date DESC, b.booking_time DESC
                `;
                db.query(query, (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                });
            });
        }

        static updateStatus(id, status) {
            return new Promise((resolve, reject) => {
                const query = `
                    UPDATE bookings 
                    SET status = ?, updated_at = NOW()
                    WHERE id = ?
                `;
                db.query(query, [status, id], (err, result) => {
                    if (err) return reject(err);
                    resolve(result.affectedRows > 0);
                });
            });
        }

        static checkDailyAvailability(date) {
            return new Promise((resolve, reject) => {
                const query = `
                    SELECT COUNT(*) as count 
                    FROM bookings 
                    WHERE booking_date = ? 
                    AND status NOT IN ('dibatalkan', 'selesai')
                `;
                db.query(query, [date], (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0].count);
                });
            });
        }
}

module.exports = Booking;