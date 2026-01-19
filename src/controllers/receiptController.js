// Receipt Entry Controller - Handles money coming in
const ReceiptEntry = require('../models/ReceiptEntry');
const LedgerMaster = require('../models/LedgerMaster');

class ReceiptController {
  // Get all receipt entries
  static async getAllEntries(req, res) {
    try {
      const filters = {
        entry_date_from: req.query.entry_date_from,
        entry_date_to: req.query.entry_date_to,
        voucher_no: req.query.voucher_no,
        receipt_mode: req.query.receipt_mode
      };

      const entries = await ReceiptEntry.findAll(filters);
      
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

  // Get single receipt entry by ID
  static async getEntryById(req, res) {
    try {
      const { id } = req.params;
      const entry = await ReceiptEntry.findById(id);
      
      if (!entry) {
        return res.status(404).json({
          success: false,
          message: 'Receipt entry not found'
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

  // Create new receipt entry
  static async createEntry(req, res) {
    try {
      const entryData = {
        ...req.body,
        created_by: req.user?.us_usid || req.user?.id || 1
      };

      // Validate data
      const validation = ReceiptEntry.validate(entryData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const entry = await ReceiptEntry.create(entryData);
      
      res.status(201).json({
        success: true,
        message: 'Receipt entry created successfully',
        data: entry
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update receipt entry
  static async updateEntry(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate data
      const validation = ReceiptEntry.validate(updateData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const entry = await ReceiptEntry.update(id, updateData);
      
      res.json({
        success: true,
        message: 'Receipt entry updated successfully',
        data: entry
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete receipt entry
  static async deleteEntry(req, res) {
    try {
      const { id } = req.params;
      
      await ReceiptEntry.delete(id);
      
      res.json({
        success: true,
        message: 'Receipt entry deleted successfully'
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
      const voucherNo = await ReceiptEntry.generateVoucherNumber();
      
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

  // Get receipt modes
  static async getReceiptModes(req, res) {
    try {
      const modes = ['Cash', 'Bank', 'Cheque', 'Draft'];
      
      res.json({
        success: true,
        data: modes
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

module.exports = ReceiptController;