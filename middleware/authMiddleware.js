const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Skip auth untuk endpoint tertentu
    if (req.path === '/api/bookings/availability' && req.method === 'GET') {
        return next();
    }
    
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;
    
    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'Token tidak ditemukan',
            isTokenInvalid: true // Flag khusus untuk frontend
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        
        let message = 'Invalid or expired token';
        if (error.name === 'TokenExpiredError') {
            message = 'Token expired';
        } else if (error.name === 'JsonWebTokenError') {
            message = 'Invalid token';
        }
        
        return res.status(401).json({ 
            success: false,
            message,
            isTokenInvalid: true, // Flag khusus untuk frontend
            isTokenExpired: error.name === 'TokenExpiredError'
        });
    }
};

module.exports = authMiddleware;