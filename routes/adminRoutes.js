const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadProductImage');
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/stats', adminController.getStats);
router.get('/bookings/recent', adminController.getRecentBookings);
router.get('/bookings/:id', adminController.getBookingDetail);
router.get('/bookings', adminController.getAllBookings);
router.put('/bookings/:id/status', adminController.updateBookingStatus);
router.put('/bookings/:id', adminController.updateBooking);
router.get('/customers', adminController.getAllCustomers);
router.get('/customers/:id', adminController.getCustomerDetail);
router.put('/customers/:id', adminController.updateCustomer);
router.delete('/customers/:id', adminController.deleteCustomer);
router.post('/motorcycles', adminController.addMotorcycle);
router.put('/motorcycles/:id', adminController.updateMotorcycle);
router.delete('/motorcycles/:id', adminController.deleteMotorcycle);
router.get('/services', adminController.getAllServices);
router.post('/services', adminController.createService);
router.put('/services/:id', adminController.updateService);
router.delete('/services/:id', adminController.deleteService);
router.get('/services/:serviceId/products', adminController.getServiceProducts);
router.delete('/products/:id', adminController.deleteServiceProduct);
router.post(
    '/services/:serviceId/products',
    upload.single('image'),
    adminController.addServiceProduct
);
router.put(
    '/products/:id',
    upload.single('image'),
    adminController.updateServiceProduct
);

module.exports = router;