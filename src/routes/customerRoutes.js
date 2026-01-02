const express = require('express');
const {
  getCustomerDashboard,
  createBooking,
  getCustomerBookings,
  getBookingDetails,
  cancelBooking,
  getAllCustomers
} = require('../controllers/customerController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Customer dashboard
router.get('/dashboard', getCustomerDashboard);

// Customer management
router.get('/', getAllCustomers);

// Booking management
router.post('/bookings', createBooking);
router.get('/bookings', getCustomerBookings);
router.get('/bookings/:bookingId', getBookingDetails);
router.put('/bookings/:bookingId/cancel', cancelBooking);

module.exports = router;