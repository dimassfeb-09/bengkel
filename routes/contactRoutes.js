const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
// Public routes
router.post('/', contactController.createContact);

// Admin-only route
router.get('/', authMiddleware, adminMiddleware, contactController.getAllContacts);
router.delete('/:id', authMiddleware, adminMiddleware, contactController.deleteContact);


module.exports = router;