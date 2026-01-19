// Journal Entry Controller - Handles adjustments and other entries
const JournalEntry = require('../models/JournalEntry');
const LedgerMaster = require('../models/LedgerMaster');

class JournalController {
  // Get all journal entries
  static async getAllEntries(req, res) {
    try {
      const filters = {
        entry_date_from: req.query.entry_date_from,
        entry_date_to: req.query.entry_date_to,
        voucher_no: req.query.voucher_no
      };

      const entries = await JournalEntry.findAll(filters);
      
      res.json({
        success: true,
        data: entries,
        count: entries.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get single journal entry by ID
  static async getEntryById(req, res) {
    try {
      const { id } = req.params;
      const entry = await JournalEntry.findById(id);
      
      if (!entry) {
        return res.status(404).json({
          success: false,
          message: 'Journal entry not found'
        });
      }
      
      res.json({
        success: true,
        data: entry
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create new journal entry
  static async createEntry(req, res) {
    try {
      const entryData = {
        ...req.body,
        created_by: req.user?.us_usid || req.user?.id || 1
      };

      // Validate data
      const validation = JournalEntry.validate(entryData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      // Verify ledgers exist
      const debitLedger = await LedgerMaster.findByName(entryData.debit_ledger);
      const creditLedger = await LedgerMaster.findByName(entryData.credit_ledger);

      if (!debitLedger || !creditLedger) {
        return res.status(400).json({
          success: false,
          message: 'One or both ledgers not found'
        });
      }

      const entry = await JournalEntry.create(entryData);
      
      res.status(201).json({
        success: true,
        message: 'Journal entry created successfully',
        data: entry
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update journal entry
  static async updateEntry(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate data
      const validation = JournalEntry.validate(updateData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const entry = await JournalEntry.update(id, updateData);
      
      res.json({
        success: true,
        message: 'Journal entry updated successfully',
        data: entry
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete journal entry
  static async deleteEntry(req, res) {
    try {
      const { id } = req.params;
      
      await JournalEntry.delete(id);
      
      res.json({
        success: true,
        message: 'Journal entry deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get next voucher number
  static async getNextVoucherNumber(req, res) {
    try {
      const voucherNo = await JournalEntry.generateVoucherNumber();
      
      res.json({
        success: true,
        voucher_no: voucherNo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all ledgers for dropdown
  static async getAllLedgers(req, res) {
    try {
      const ledgers = await LedgerMaster.getLedgerList();
      
      res.json({
        success: true,
        data: ledgers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get ledger balance
  static async getLedgerBalance(req, res) {
    try {
      const { ledger_name } = req.params;
      const balance = await LedgerMaster.getBalance(ledger_name);
      
      res.json({
        success: true,
        balance: balance
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = JournalController;