const express = require('express');
const {
  getCustomerDashboard,
  createBooking,
  getCustomerBookings,
  getBookingDetails,
  cancelBooking,
  getAllCustomers,
  searchCustomers,
  getCustomerById,
  getCustomerBills,
  getCustomerPayments,
  getBookingPassengers
} = require('../controllers/customerController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Check if user is a customer
router.use((req, res, next) => {
  // For TVL users, check us_roid field
  if (req.user.us_roid !== 'CUS') {
    return res.status(403).json({ 
      success: false, 
      error: { code: 'FORBIDDEN', message: 'Access denied. Customer role required.' } 
    });
  }
  next();
});

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
router.get('/bookings/:bookingId/passengers', getBookingPassengers);
router.put('/bookings/:bookingId/cancel', cancelBooking);

// Bill and payment management
router.get('/bills', getCustomerBills);
router.get('/payments', getCustomerPayments);

module.exports = router;