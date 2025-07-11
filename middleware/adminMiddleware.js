const User = require('../models/User');

const adminMiddleware = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }
        
        if (!user.is_admin) {
            return res.status(403).json({ 
                success: false,
                message: 'Admin access required' 
            });
        }
        
        req.user = user; // Attach user object to request
        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

module.exports = adminMiddleware;