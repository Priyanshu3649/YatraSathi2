const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { body } = require('express-validator');
const authenticateToken = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Payment routes
router.get('/', paymentController.getAllPayments);
router.get('/stats', paymentController.getPaymentStats);
router.get('/:id', paymentController.getPaymentById);
router.post('/', [
  body('py_entry_type').isIn(['Debit', 'Credit']).withMessage('Invalid entry type'),
  body('py_customer_name').notEmpty().withMessage('Customer name is required'),
  body('py_amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number')
], paymentController.createPayment);
router.put('/:id', paymentController.updatePayment);
router.delete('/:id', paymentController.deletePayment);

module.exports = router;