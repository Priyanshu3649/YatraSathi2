// Contra Entry Controller - Handles Cash to Bank / Bank to Cash transfers
const ContraEntry = require('../models/ContraEntry');
const LedgerMaster = require('../models/LedgerMaster');

class ContraController {
  // Get all contra entries
  static async getAllEntries(req, res) {
    try {
      const filters = {
        entry_date_from: req.query.entry_date_from,
        entry_date_to: req.query.entry_date_to,
        voucher_no: req.query.voucher_no
      };

      const entries = await ContraEntry.findAll(filters);
      
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

  // Get single contra entry by ID
  static async getEntryById(req, res) {
    try {
      const { id } = req.params;
      const entry = await ContraEntry.findById(id);
      
      if (!entry) {
        return res.status(404).json({
          success: false,
          message: 'Contra entry not found'
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

  // Create new contra entry
  static async createEntry(req, res) {
    try {
      const entryData = {
        ...req.body,
        created_by: req.user?.us_usid || req.user?.id || 1
      };

      // Validate data
      const validation = ContraEntry.validate(entryData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      // Verify ledgers exist and are cash/bank type
      const fromLedger = await LedgerMaster.findByName(entryData.ledger_from);
      const toLedger = await LedgerMaster.findByName(entryData.ledger_to);

      if (!fromLedger || !toLedger) {
        return res.status(400).json({
          success: false,
          message: 'One or both ledgers not found'
        });
      }

      // Contra entries should only be between Cash and Bank
      const validTypes = ['Cash', 'Bank'];
      if (!validTypes.includes(fromLedger.ledger_type) || !validTypes.includes(toLedger.ledger_type)) {
        return res.status(400).json({
          success: false,
          message: 'Contra entries are only allowed between Cash and Bank ledgers'
        });
      }

      const entry = await ContraEntry.create(entryData);
      
      res.status(201).json({
        success: true,
        message: 'Contra entry created successfully',
        data: entry
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update contra entry
  static async updateEntry(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate data
      const validation = ContraEntry.validate(updateData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const entry = await ContraEntry.update(id, updateData);
      
      res.json({
        success: true,
        message: 'Contra entry updated successfully',
        data: entry
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete contra entry
  static async deleteEntry(req, res) {
    try {
      const { id } = req.params;
      
      await ContraEntry.delete(id);
      
      res.json({
        success: true,
        message: 'Contra entry deleted successfully'
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
      const voucherNo = await ContraEntry.generateVoucherNumber();
      
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

  // Get cash and bank ledgers for dropdown
  static async getCashBankLedgers(req, res) {
    try {
      const ledgers = await LedgerMaster.getCashBankLedgers();
      
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
}

module.exports = ContraController;