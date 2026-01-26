const express = require('express');
const {
  createBill,
  getCustomerBills,
  getAllBills,
  getBillById,
  updateBill,
  finalizeBill,
  deleteBill,
  searchBills,
  getCustomerLedger,
  getCustomerBalance
} = require('../controllers/billingController');
const { getBillingByBookingId } = require('../controllers/billingIntegrationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Specific routes first (more specific paths)
router.post('/', createBill);
router.get('/my-bills', getCustomerBills);
router.get('/search', searchBills);

// Customer-specific routes
router.get('/customer/:customerId/ledger', getCustomerLedger);
router.get('/customer/:customerId/balance', getCustomerBalance);

// Booking integration routes
router.get('/booking/:bookingId', getBillingByBookingId);

// Admin routes
router.get('/', getAllBills);

// Parameterized routes last (less specific paths)
router.get('/:id', getBillById);
router.put('/:id', updateBill);
router.put('/:id/finalize', finalizeBill);
router.delete('/:id', deleteBill);

module.exports = router;