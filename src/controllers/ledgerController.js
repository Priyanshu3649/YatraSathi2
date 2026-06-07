// Ledger Master Controller - Handles chart of accounts
const LedgerMaster = require('../models/LedgerMaster');
const Audit = require('../services/forensicAuditService');
const queryHelper = require('../utils/queryHelper');

class LedgerController {
  // Get all ledgers
  static async getAllLedgers(req, res) {
    try {
      const filters = {
        ledger_type: req.query.ledger_type,
        search: req.query.search
      };

      const { limit, offset, page } = queryHelper.getPaginationOptions(req.query);
      const ledgers = await LedgerMaster.findAll(filters);
      const totalRecords = ledgers.length;
      const paged = ledgers.slice(offset, offset + limit);
      const totalPages = Math.ceil(totalRecords / limit);

      res.json({
        success: true,
        data: paged,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get ledger list for dropdown
  static async getLedgerList(req, res) {
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

  // Get cash and bank ledgers only
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

  // Get ledger by name
  static async getLedgerByName(req, res) {
    try {
      const { name } = req.params;
      const ledger = await LedgerMaster.findByName(name);
      
      if (!ledger) {
        return res.status(404).json({
          success: false,
          message: 'Ledger not found'
        });
      }
      
      res.json({
        success: true,
        data: ledger
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create new ledger
  static async createLedger(req, res) {
    try {
      const ledgerData = req.body;

      // Validate data
      const validation = LedgerMaster.validate(ledgerData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const ledger = await LedgerMaster.create(ledgerData);
      
      // Forensic Audit: INSERT (ledgers are immutable - create only)
      if (req.audit) req.audit.logInsert(ledgerData, { module: 'Ledger', recordId: ledger.id || ledger.lg_lgid || 'new' });
      
      res.status(201).json({
        success: true,
        message: 'Ledger created successfully',
        data: ledger
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
      const { name } = req.params;
      const balance = await LedgerMaster.getBalance(name);
      
      res.json({
        success: true,
        ledger_name: name,
        balance: balance
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get ledger types
  static async getLedgerTypes(req, res) {
    try {
      const types = ['Cash', 'Bank', 'Expense', 'Income', 'Asset', 'Liability', 'Capital'];
      
      res.json({
        success: true,
        data: types
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = LedgerController;