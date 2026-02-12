/**
 * Accounting Controller
 * Wrapper controller that provides unified interface for all accounting entry types
 */

const ContraController = require('./contraController');
const PaymentController = require('./paymentController');
const ReceiptController = require('./receiptController');
const JournalController = require('./journalController');
const LedgerController = require('./ledgerController');

// Export controllers with unified method names
module.exports = {
  // Contra Controller
  contra: {
    getAllEntries: ContraController.getAllContras,
    getEntryById: ContraController.getContraById,
    createEntry: ContraController.createContra,
    updateEntry: ContraController.updateContra,
    deleteEntry: ContraController.deleteContra,
    getNextVoucherNumber: (req, res) => {
      const entryNo = ContraController.generateEntryNo('CT');
      res.json({ success: true, voucherNumber: entryNo });
    },
    getCashBankLedgers: (req, res) => {
      // Return list of cash/bank ledgers
      res.json({
        success: true,
        ledgers: [
          { name: 'Cash', type: 'Cash' },
          { name: 'Bank Account - SBI', type: 'Bank' },
          { name: 'Bank Account - HDFC', type: 'Bank' }
        ]
      });
    }
  },

  // Payment Controller
  payment: {
    getAllEntries: PaymentController.getAllPayments,
    getEntryById: PaymentController.getPaymentById,
    createEntry: PaymentController.createPayment,
    updateEntry: PaymentController.updatePayment,
    deleteEntry: PaymentController.deletePayment,
    getNextVoucherNumber: (req, res) => {
      const entryNo = PaymentController.generateEntryNo('PY');
      res.json({ success: true, voucherNumber: entryNo });
    },
    getPaymentModes: (req, res) => {
      res.json({
        success: true,
        modes: ['Cash', 'Bank', 'Cheque', 'Draft', 'UPI', 'Card']
      });
    },
    getLedgerBalance: (req, res) => {
      // Placeholder for ledger balance
      res.json({
        success: true,
        balance: 0,
        ledger: req.params.ledger_name
      });
    }
  },

  // Receipt Controller
  receipt: {
    getAllEntries: ReceiptController.getAllReceipts,
    getEntryById: ReceiptController.getReceiptById,
    createEntry: ReceiptController.createReceipt,
    updateEntry: ReceiptController.updateReceipt,
    deleteEntry: ReceiptController.deleteReceipt,
    getNextVoucherNumber: (req, res) => {
      const entryNo = ReceiptController.generateEntryNo('RC');
      res.json({ success: true, voucherNumber: entryNo });
    },
    getReceiptModes: (req, res) => {
      res.json({
        success: true,
        modes: ['Cash', 'Bank', 'Cheque', 'Draft', 'UPI', 'Card']
      });
    },
    getLedgerBalance: (req, res) => {
      // Placeholder for ledger balance
      res.json({
        success: true,
        balance: 0,
        ledger: req.params.ledger_name
      });
    }
  },

  // Journal Controller
  journal: {
    getAllEntries: JournalController.getAllJournals,
    getEntryById: JournalController.getJournalById,
    createEntry: JournalController.createJournal,
    updateEntry: JournalController.updateJournal,
    deleteEntry: JournalController.deleteJournal,
    getNextVoucherNumber: (req, res) => {
      const entryNo = JournalController.generateEntryNo('JN');
      res.json({ success: true, voucherNumber: entryNo });
    },
    getAllLedgers: (req, res) => {
      // Placeholder for all ledgers
      res.json({
        success: true,
        ledgers: [
          { name: 'Cash', type: 'Asset' },
          { name: 'Bank Account - SBI', type: 'Asset' },
          { name: 'Bank Account - HDFC', type: 'Asset' },
          { name: 'Accounts Receivable', type: 'Asset' },
          { name: 'Service Income', type: 'Income' },
          { name: 'Office Expenses', type: 'Expense' }
        ]
      });
    },
    getLedgerBalance: (req, res) => {
      // Placeholder for ledger balance
      res.json({
        success: true,
        balance: 0,
        ledger: req.params.ledger_name
      });
    }
  },

  // Ledger Controller
  ledger: {
    getAllLedgers: LedgerController.getAllLedgers,
    getLedgerList: LedgerController.getAllLedgers,
    getCashBankLedgers: (req, res) => {
      // Placeholder for cash/bank ledgers
      res.json({
        success: true,
        ledgers: [
          { name: 'Cash', type: 'Cash' },
          { name: 'Bank Account - SBI', type: 'Bank' },
          { name: 'Bank Account - HDFC', type: 'Bank' }
        ]
      });
    },
    getLedgerTypes: (req, res) => {
      res.json({
        success: true,
        types: ['Asset', 'Liability', 'Income', 'Expense', 'Equity']
      });
    },
    getLedgerBalance: (req, res) => {
      // Placeholder for ledger balance
      res.json({
        success: true,
        balance: 0,
        ledger: req.params.name
      });
    },
    getLedgerByName: (req, res) => {
      // Placeholder for ledger by name
      res.json({
        success: true,
        ledger: {
          name: req.params.name,
          type: 'Asset',
          balance: 0
        }
      });
    },
    createLedger: LedgerController.createLedger
  }
};