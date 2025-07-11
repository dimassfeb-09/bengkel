const db = require('../config/db');

class Service {
    static async getAllServices() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT s.*, GROUP_CONCAT(sf.feature SEPARATOR '||') as features 
                FROM services s
                LEFT JOIN service_features sf ON s.id = sf.service_id
                GROUP BY s.id
            `;
            
            db.query(query, (err, results) => {
                if (err) reject(err);
                
                // Format hasil query
                const services = results.map(service => ({
                    ...service,
                    id: service.id,
                    name: service.name,
                    duration: service.duration,
                    price: service.current_price,
                    original_price: service.original_price,
                    recommended_interval: service.recommended_interval,
                    description: service.description,
                    isPopular: Boolean(service.is_popular),
                    has_products: Boolean(service.has_products),
                    createdAt: service.created_at,
                    features: service.features ? service.features.split('||') : []
                }));
                resolve(services);
            });
        }); 
    }

    static async getById(id) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT id FROM services WHERE id = ? LIMIT 1';
            db.query(query, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0]);
            });
        });
    }

    static async addService({ name, duration, price, description, isPopular }) {
        return new Promise((resolve, reject) => {
            const query = `
            INSERT INTO services (name, duration, current_price, description, is_popular, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            `;
            db.query(query, [name, duration, price, description, isPopular ? 1 : 0], (err, result) => {
            if (err) return reject(err);
            resolve(result);
            });
    });
    }

    static async updateService(id, { name, duration, price, description, isPopular }) {
        return new Promise((resolve, reject) => {
            const query = `
            UPDATE services 
            SET name = ?, duration = ?, current_price = ?, description = ?, is_popular = ?, updated_at = NOW()
            WHERE id = ?
            `;
            db.query(query, [name, duration, price, description, isPopular ? 1 : 0, id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
            });
        });
    }

    static async deleteService(id) {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM services WHERE id = ?';
            db.query(query, [id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
            });
        });
    }

    static async addServiceWithFeatures({ name, duration, current_price, original_price, recommended_interval, description, isPopular, features }) {
        return new Promise((resolve, reject) => {
            const insertService = `
            INSERT INTO services (name, duration, current_price, original_price, recommended_interval, description, is_popular, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `;
            db.query(
            insertService,
            [name, duration, current_price, original_price, recommended_interval, description, isPopular ? 1 : 0],
            (err, result) => {
                if (err) return reject(err);
                const serviceId = result.insertId;

                if (!features || features.length === 0) return resolve({ insertId: serviceId });

                const values = features.map(f => [serviceId, f]);
                const insertFeatures = `
                INSERT INTO service_features (service_id, feature)
                VALUES ?
                `;
                db.query(insertFeatures, [values], (err2) => {
                if (err2) return reject(err2);
                resolve({ insertId: serviceId });
                });
            }
            );
        });
    }


    static async updateServiceWithFeatures(id, { name, duration, current_price, original_price, recommended_interval, description, isPopular, features }) {
        return new Promise((resolve, reject) => {
            const updateQuery = `
            UPDATE services 
            SET name = ?, duration = ?, current_price = ?, original_price = ?, recommended_interval = ?, description = ?, is_popular = ?, updated_at = NOW()
            WHERE id = ?
            `;
            db.query(updateQuery, [name, duration, current_price, original_price,recommended_interval, description, isPopular ? 1 : 0, id], (err, result) => {
            if (err) return reject(err);

            db.query(`DELETE FROM service_features WHERE service_id = ?`, [id], (err2) => {
                if (err2) return reject(err2);
                if (!features || features.length === 0) return resolve(result);

                const values = features.map(f => [id, f]);
                const insertFeatures = `
                INSERT INTO service_features (service_id, feature)
                VALUES ?
                `;
                db.query(insertFeatures, [values], (err3) => {
                if (err3) return reject(err3);
                resolve(result);
                });
            });
            });
        });
    }

}

module.exports = Service;