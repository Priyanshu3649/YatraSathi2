const express = require('express');
const {
  getAllStationBoys,
  getStationBoyById,
  createStationBoy,
  updateStationBoy,
  deleteStationBoy,
  getActiveStationBoys
} = require('../controllers/stationBoyController');
const { createPayment, getAllPayments } = require('../controllers/stationBoyPaymentController');
const { getLedger } = require('../controllers/stationBoyLedgerController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Specific routes first
router.get('/active', getActiveStationBoys);
router.get('/payments', getAllPayments);

// CRUD routes
router.get('/', getAllStationBoys);
router.post('/', createStationBoy);
router.get('/:id', getStationBoyById);
router.put('/:id', updateStationBoy);
router.delete('/:id', deleteStationBoy);

// Payment entry route
router.post('/:id/payments', createPayment);

// Ledger report route
router.get('/:id/ledger', getLedger);

module.exports = router;
