const express = require('express');
const {
  createBooking,
  getCustomerBookings,
  getAllBookings,
  getBookingById,
  updateBooking,
  updateBookingStatus, // ✓ Add new import
  cancelBooking,
  deleteBooking,
  assignBooking,
  approveBooking,
  confirmBooking,
  getBookingsByStatus,
  searchBookings,
  getBookingPassengers
} = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');
const { canEditBooking, canViewBooking, canCancelBooking } = require('../middleware/bookingAuthorization');

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

// New route for getting passengers for a booking
router.get('/:id/passengers', getBookingPassengers);

// Parameterized routes last (less specific paths) - with authorization middleware
router.get('/:id', canViewBooking, getBookingById);
router.put('/:id', canEditBooking, updateBooking);
router.put('/:id/status', updateBookingStatus); // ✓ Add status update route
router.post('/:id/cancel', canCancelBooking, cancelBooking);
router.delete('/:id', canEditBooking, deleteBooking);

module.exports = router;