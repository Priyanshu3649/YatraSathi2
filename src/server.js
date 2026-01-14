console.log('Starting server.js...');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  console.log('Request headers:', req.headers);
  next();
});

// Serve static files from public directory
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  console.log('Root route called');
  res.redirect('/demo-portals.html');
});

// Import models to ensure associations are initialized
require('./models');

// Import routes
const authRoutes = require('./routes/authRoutes');
const travelPlanRoutes = require('./routes/travelPlanRoutes');
const reportRoutes = require('./routes/reportRoutes');
const debugRoutes = require('./routes/debugRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const employeeDashboardRoutes = require('./routes/employeeRoutes');
const customerRoutes = require('./routes/customerRoutes');
const auditRoutes = require('./routes/auditRoutes');
const configRoutes = require('./routes/configRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const searchRoutes = require('./routes/searchRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const stationRoutes = require('./routes/stationRoutes');
const trainRoutes = require('./routes/trainRoutes');
const companyRoutes = require('./routes/companyRoutes');
const userRoutes = require('./routes/userRoutes');
const securityRoutes = require('./routes/securityRoutes');
const billingRoutes = require('./routes/billingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const profileRoutes = require('./routes/profileRoutes');

// Use routes
console.log('Registering auth routes');
app.use('/api/auth', authRoutes);
app.use('/api/security', securityRoutes);
console.log('Auth routes registered');
app.use('/api/travel-plans', travelPlanRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/employee', employeeDashboardRoutes); // Employee dashboard routes
app.use('/api/customers', customerRoutes);
app.use('/api/customer', customerRoutes); // Customer portal routes
app.use('/api/audit', auditRoutes);
app.use('/api/config', configRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/trains', trainRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Database connection
const { connectDB } = require('../config/db');

// Connect to database and start server
connectDB().then(() => {
  console.log('Database connection established');
  
  const PORT = process.env.PORT || 5003;
  const HOST = '127.0.0.1'; // Explicitly set host

  const server = app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
  
  server.on('listening', () => {
    const address = server.address();
    console.log(`Server is listening on:`, address);
  });
  
  server.on('error', (error) => {
    console.error('Server error:', error);
  });
}).catch((error) => {
  console.error('Failed to connect to database:', error);
  process.exit(1);
});