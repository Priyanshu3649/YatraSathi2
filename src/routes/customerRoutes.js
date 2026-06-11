const express = require('express');
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Create new customer (admin only)
router.post(
  '/',
  authMiddleware,
  customerController.createCustomer
);

router.get(
  '/:id/details',
  authMiddleware,
  customerController.getCustomerDetails
);

router.get(
  '/:id/ledger',
  authMiddleware,
  customerController.getCustomerLedger
);

module.exports = router;