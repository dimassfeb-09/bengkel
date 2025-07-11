const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

router.get('/', serviceController.getAllServices);
router.get('/:id', serviceController.getServiceById);
router.get('/:id/products', serviceController.getServiceProducts);

module.exports = router;