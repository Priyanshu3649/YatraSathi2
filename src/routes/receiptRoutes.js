const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { body } = require('express-validator');
const authenticateToken = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Receipt routes
router.get('/', receiptController.getAllReceipts);
router.get('/:id', receiptController.getReceiptById);
router.post('/', [
  body('rc_customer_name').notEmpty().withMessage('Customer name is required'),
  body('rc_amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('rc_payment_mode').isIn(['Cash', 'Bank', 'Cheque', 'Online']).withMessage('Invalid payment mode')
], receiptController.createReceipt);
router.put('/:id', receiptController.updateReceipt);
router.delete('/:id', receiptController.deleteReceipt);

module.exports = router;