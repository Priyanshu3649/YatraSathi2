const express = require('express');
const {
  createBooking,
  getCustomerBookings,
  getAllBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  deleteBooking,
  assignBooking,
  approveBooking,
  confirmBooking,
  getBookingsByStatus,
  searchBookings
} = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Specific routes first (more specific paths)
router.post('/', createBooking);
router.get('/my-bookings', getCustomerBookings);
router.get('/status/:status', getBookingsByStatus);
router.get('/search', searchBookings);

// Admin routes
router.get('/', getAllBookings);
router.post('/assign', assignBooking);
router.post('/approve', approveBooking);
router.post('/confirm', confirmBooking);

// Parameterized routes last (less specific paths)
router.get('/:id', getBookingById);
router.put('/:id', updateBooking);
router.post('/:id/cancel', cancelBooking);
router.delete('/:id', deleteBooking);

module.exports = router;