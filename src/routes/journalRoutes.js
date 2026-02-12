const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');
const { body } = require('express-validator');
const authenticateToken = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Journal routes
router.get('/', journalController.getAllJournals);
router.get('/:id', journalController.getJournalById);
router.post('/', [
  body('je_account').notEmpty().withMessage('Account is required'),
  body('je_entry_type').isIn(['Debit', 'Credit']).withMessage('Invalid entry type'),
  body('je_amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('je_voucher_type').isIn(['Cash', 'Bank', 'Contra', 'Purchase', 'Sales', 'Journal']).withMessage('Invalid voucher type')
], journalController.createJournal);
router.put('/:id', journalController.updateJournal);
router.delete('/:id', journalController.deleteJournal);

module.exports = router;