const express = require('express');
const {
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
  searchBookings,
  getBookingPassengers,
  getAssignedBookings
} = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Check if user is an employee (has employee role)
router.use((req, res, next) => {
  // Allow access for employees and admin
  const allowedRoles = ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'];
  if (!allowedRoles.includes(req.user.us_roid)) {
    return res.status(403).json({ 
      success: false, 
      error: { code: 'FORBIDDEN', message: 'Access denied. Employee role required.' } 
    });
  }
  next();
});

// Employee booking routes
// For agents and other employees who need to view all bookings
router.get('/', getAllBookings);



// Get bookings assigned to the current employee
router.get('/assigned', getAssignedBookings);

// Get booking by ID (employees can view bookings they're assigned to or all if admin/agent)
router.get('/:id', getBookingById);

// Update booking (employees can update bookings they're assigned to)
router.put('/:id', updateBooking);

// Cancel booking (employees can cancel bookings they're assigned to)
router.post('/:id/cancel', cancelBooking);

// Delete booking (only admin can delete)
router.delete('/:id', deleteBooking);

// Assign booking (for management/admin)
router.post('/assign', assignBooking);

// Approve booking (agents can approve)
router.post('/approve', approveBooking);

// Confirm booking (agents can confirm)
router.post('/confirm', confirmBooking);

// Get bookings by status (filtered by employee permissions)
router.get('/status/:status', getBookingsByStatus);

// Search bookings (filtered by employee permissions)
router.get('/search', searchBookings);

// Get passengers for a booking
router.get('/:id/passengers', getBookingPassengers);

module.exports = router;