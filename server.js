// server.js
const express = require('express');
const app = express();
const serviceRoutes = require('./routes/serviceRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const motorcycleRoutes = require('./routes/motorcycleRoutes');
const contactRoutes = require('./routes/contactRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authOtpRoutes = require('./routes/authOtpRoutes');
const path = require('path');
require('dotenv').config();
const cors = require('cors');

app.use(cors());

// Middleware
app.use(express.json());

// Routes
app.use('/api/services', serviceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/motorcycles', motorcycleRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/otp', authOtpRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/uploads/payment_proofs', express.static(path.join(__dirname, 'uploads/payment_proofs')));
app.use('/uploads/avatars', express.static(path.join(__dirname, 'public/uploads/avatars')));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});