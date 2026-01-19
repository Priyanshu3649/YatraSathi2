// Passenger Routes - API endpoints for passenger management
// Implements psXpassenger table operations as per YatraSathi specification

const express = require('express');
const router = express.Router();
const passengerController = require('../controllers/passengerController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Create a new passenger
router.post('/', passengerController.createPassenger);

// Create multiple passengers for a booking (batch operation)
router.post('/batch', passengerController.createMultiplePassengers);
router.post('/booking/:bookingId/batch', passengerController.createMultiplePassengers);

// Get passengers by booking ID
router.get('/booking/:bookingId', passengerController.getPassengersByBookingId);

// Get passenger count for a booking
router.get('/booking/:bookingId/count', passengerController.getPassengerCount);

// Search passengers by name (for customer master list)
router.get('/search', passengerController.searchPassengers);

// Get passenger statistics (admin only)
router.get('/statistics', passengerController.getPassengerStatistics);

// Get passenger by ID
router.get('/:id', passengerController.getPassengerById);

// Update passenger
router.put('/:id', passengerController.updatePassenger);

// Delete passenger (soft delete)
router.delete('/:id', passengerController.deletePassenger);

module.exports = router;