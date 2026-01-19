// Accounting Routes - Routes for all four accounting entry types
const express = require('express');
const router = express.Router();

// Import controllers
const ContraController = require('../controllers/contraController');
const PaymentController = require('../controllers/paymentController');
const ReceiptController = require('../controllers/receiptController');
const JournalController = require('../controllers/journalController');
const LedgerController = require('../controllers/ledgerController');

// Middleware for authentication (if needed)
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ==================== CONTRA ENTRY ROUTES ====================
router.get('/contra', ContraController.getAllEntries);
router.get('/contra/next-voucher', ContraController.getNextVoucherNumber);
router.get('/contra/cash-bank-ledgers', ContraController.getCashBankLedgers);
router.get('/contra/:id', ContraController.getEntryById);
router.post('/contra', ContraController.createEntry);
router.put('/contra/:id', ContraController.updateEntry);
router.delete('/contra/:id', ContraController.deleteEntry);

// ==================== PAYMENT ENTRY ROUTES ====================
router.get('/payment', PaymentController.getAllEntries);
router.get('/payment/next-voucher', PaymentController.getNextVoucherNumber);
router.get('/payment/modes', PaymentController.getPaymentModes);
router.get('/payment/balance/:ledger_name', PaymentController.getLedgerBalance);
router.get('/payment/:id', PaymentController.getEntryById);
router.post('/payment', PaymentController.createEntry);
router.put('/payment/:id', PaymentController.updateEntry);
router.delete('/payment/:id', PaymentController.deleteEntry);

// ==================== RECEIPT ENTRY ROUTES ====================
router.get('/receipt', ReceiptController.getAllEntries);
router.get('/receipt/next-voucher', ReceiptController.getNextVoucherNumber);
router.get('/receipt/modes', ReceiptController.getReceiptModes);
router.get('/receipt/balance/:ledger_name', ReceiptController.getLedgerBalance);
router.get('/receipt/:id', ReceiptController.getEntryById);
router.post('/receipt', ReceiptController.createEntry);
router.put('/receipt/:id', ReceiptController.updateEntry);
router.delete('/receipt/:id', ReceiptController.deleteEntry);

// ==================== JOURNAL ENTRY ROUTES ====================
router.get('/journal', JournalController.getAllEntries);
router.get('/journal/next-voucher', JournalController.getNextVoucherNumber);
router.get('/journal/ledgers', JournalController.getAllLedgers);
router.get('/journal/balance/:ledger_name', JournalController.getLedgerBalance);
router.get('/journal/:id', JournalController.getEntryById);
router.post('/journal', JournalController.createEntry);
router.put('/journal/:id', JournalController.updateEntry);
router.delete('/journal/:id', JournalController.deleteEntry);

// ==================== LEDGER MASTER ROUTES ====================
router.get('/ledgers', LedgerController.getAllLedgers);
router.get('/ledgers/list', LedgerController.getLedgerList);
router.get('/ledgers/cash-bank', LedgerController.getCashBankLedgers);
router.get('/ledgers/types', LedgerController.getLedgerTypes);
router.get('/ledgers/balance/:name', LedgerController.getLedgerBalance);
router.get('/ledgers/:name', LedgerController.getLedgerByName);
router.post('/ledgers', LedgerController.createLedger);

module.exports = router;