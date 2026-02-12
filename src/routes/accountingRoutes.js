// Accounting Routes - Routes for all four accounting entry types
const express = require('express');
const router = express.Router();

// Import controllers
const { contra, payment, receipt, journal, ledger } = require('../controllers/accountingController');

// Middleware for authentication (if needed)
const authenticateToken = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ==================== CONTRA ENTRY ROUTES ====================
router.get('/contra', contra.getAllEntries);
router.get('/contra/next-voucher', contra.getNextVoucherNumber);
router.get('/contra/cash-bank-ledgers', contra.getCashBankLedgers);
router.get('/contra/:id', contra.getEntryById);
router.post('/contra', contra.createEntry);
router.put('/contra/:id', contra.updateEntry);
router.delete('/contra/:id', contra.deleteEntry);

// ==================== PAYMENT ENTRY ROUTES ====================
router.get('/payment', payment.getAllEntries);
router.get('/payment/next-voucher', payment.getNextVoucherNumber);
router.get('/payment/modes', payment.getPaymentModes);
router.get('/payment/balance/:ledger_name', payment.getLedgerBalance);
router.get('/payment/:id', payment.getEntryById);
router.post('/payment', payment.createEntry);
router.put('/payment/:id', payment.updateEntry);
router.delete('/payment/:id', payment.deleteEntry);

// ==================== RECEIPT ENTRY ROUTES ====================
router.get('/receipt', receipt.getAllEntries);
router.get('/receipt/next-voucher', receipt.getNextVoucherNumber);
router.get('/receipt/modes', receipt.getReceiptModes);
router.get('/receipt/balance/:ledger_name', receipt.getLedgerBalance);
router.get('/receipt/:id', receipt.getEntryById);
router.post('/receipt', receipt.createEntry);
router.put('/receipt/:id', receipt.updateEntry);
router.delete('/receipt/:id', receipt.deleteEntry);

// ==================== JOURNAL ENTRY ROUTES ====================
router.get('/journal', journal.getAllEntries);
router.get('/journal/next-voucher', journal.getNextVoucherNumber);
router.get('/journal/ledgers', journal.getAllLedgers);
router.get('/journal/balance/:ledger_name', journal.getLedgerBalance);
router.get('/journal/:id', journal.getEntryById);
router.post('/journal', journal.createEntry);
router.put('/journal/:id', journal.updateEntry);
router.delete('/journal/:id', journal.deleteEntry);

// ==================== LEDGER MASTER ROUTES ====================
router.get('/ledgers', ledger.getAllLedgers);
router.get('/ledgers/list', ledger.getLedgerList);
router.get('/ledgers/cash-bank', ledger.getCashBankLedgers);
router.get('/ledgers/types', ledger.getLedgerTypes);
router.get('/ledgers/balance/:name', ledger.getLedgerBalance);
router.get('/ledgers/:name', ledger.getLedgerByName);
router.post('/ledgers', ledger.createLedger);

module.exports = router;