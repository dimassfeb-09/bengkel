// routes/motorcycleRoutes.js
const express = require('express');
const router = express.Router();
const motorcycleController = require('../controllers/motorcycleController');
const authMiddleware = require('../middleware/authMiddleware');

// Gunakan middleware auth untuk semua route motorcycle
router.use(authMiddleware);

// Endpoint untuk motorcycle
router.get('/', motorcycleController.getMotorcyclesByUser);
router.post('/', motorcycleController.addMotorcycle);
router.put('/:id', motorcycleController.updateMotorcycle);
router.delete('/:id', motorcycleController.deleteMotorcycle);

module.exports = router;