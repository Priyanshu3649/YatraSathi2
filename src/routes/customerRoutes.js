const express = require('express');
const {
  getCustomerDashboard,
  createBooking,
  getCustomerBookings,
  getBookingDetails,
  cancelBooking,
  getAllCustomers,
  searchCustomers,
  getCustomerById
} = require('../controllers/customerController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Customer dashboard
router.get('/dashboard', getCustomerDashboard);

// Customer management
router.get('/', getAllCustomers);
router.get('/search', searchCustomers);
router.get('/:id', getCustomerById);

// Booking management
router.post('/bookings', createBooking);
router.get('/bookings', getCustomerBookings);
router.get('/bookings/:bookingId', getBookingDetails);
router.put('/bookings/:bookingId/cancel', cancelBooking);

module.exports = router;