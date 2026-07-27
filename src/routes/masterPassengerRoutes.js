const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const masterPassengerController = require('../controllers/masterPassengerController');

// All routes require authentication
router.use(auth);

// GET all master passengers for logged-in customer
router.get('/', masterPassengerController.getAllMasterPassengers);

// GET single master passenger by ID
router.get('/:id', masterPassengerController.getMasterPassengerById);

// POST create new master passenger
router.post('/', masterPassengerController.createMasterPassenger);

// PUT update master passenger
router.put('/:id', masterPassengerController.updateMasterPassenger);

// DELETE soft delete master passenger
router.delete('/:id', masterPassengerController.deleteMasterPassenger);

module.exports = router;
