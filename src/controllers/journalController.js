const { Journal, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const queryHelper = require('../utils/queryHelper');
const Audit = require('../services/forensicAuditService');


/**
 * Journal Controller
 * Handles all journal entry CRUD operations
 */
class JournalController {
  async getAllJournals(req, res) {
    try {
      const { limit, offset, page } = queryHelper.getPaginationOptions(req.query);
      const sortBy = req.query.sortBy || 'je_date';
      const sortOrder = (req.query.sortOrder || 'DESC').toUpperCase();
      
      const whereClause = { je_status: 'Active' };
      
      if (req.query.search) {
        whereClause[Op.or] = [
          { je_entry_no: { [Op.like]: `%${req.query.search}%` } },
          { je_account: { [Op.like]: `%${req.query.search}%` } },
          { je_narration: { [Op.like]: `%${req.query.search}%` } }
        ];
      }
      
      const { count, rows: journals } = await Journal.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'creator',
          attributes: ['us_usid', 'us_fname', 'us_lname']
        }],
        order: [[sortBy, sortOrder]],
        limit,
        offset
      });
      
      res.json(queryHelper.formatPaginatedResponse(count, journals, page, limit));
    } catch (error) {
      console.error('Get journals error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve journal entries',
        error: error.message
      });
    }
  }
  
  async getJournalById(req, res) {
    try {
      const { id } = req.params;
      const journal = await Journal.findOne({
        where: { je_jeid: id, je_status: 'Active' },
        include: [{ model: User, as: 'creator' }]
      });
      
      if (!journal) {
        return res.status(404).json({ success: false, message: 'Journal entry not found' });
      }
      
      res.json({ success: true, data: journal, message: 'Journal entry retrieved successfully' });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve journal entry',
        error: error.message
      });
    }
  }
  
  async createJournal(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      }
      
      const { 
        je_account, 
        je_entry_type, 
        je_amount, 
        je_narration, 
        je_ref_number, 
        je_voucher_type 
      } = req.body;
      
      const entryNo = this.generateEntryNo('JE');
      
      const journal = await Journal.create({
        je_entry_no: entryNo,
        je_date: new Date(),
        je_account,
        je_entry_type,
        je_amount: parseFloat(je_amount) || 0,
        je_narration,
        je_ref_number,
        je_voucher_type,
        je_created_by: req.user.us_usid,
        je_status: 'Active'
      }, req.audit ? req.audit.sequelizeOptions() : {});
      
      // Forensic Audit: INSERT
      if (req.audit) req.audit.logInsert(journal.toJSON(), { module: 'Journal', recordId: journal.je_jeid });
      
      // ── Forensic Audit: INSERT (async) ─────────────────────────────────────────────
      Audit.logAction({ module: Audit.MODULES.JOURNAL, recordId: journal.je_jeid,
        action: Audit.ACTIONS.INSERT, req, fieldName: 'je_entry_no',
        oldValue: null, newValue: journal.je_entry_no });
      Audit.logAction({ module: Audit.MODULES.JOURNAL, recordId: journal.je_jeid,
        action: Audit.ACTIONS.INSERT, req, fieldName: 'je_amount',
        oldValue: null, newValue: String(journal.je_amount) });
      // ───────────────────────────────────────────────────────────────
      res.status(201).json({
        success: true,
        data: journal,
        message: 'Journal entry created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create journal entry',
        error: error.message
      });
    }
  }
  
  async updateJournal(req, res) {
    try {
      const { id } = req.params;
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      }
      
      const journal = await Journal.findOne({ where: { je_jeid: id, je_status: 'Active' } });
      if (!journal) {
        return res.status(404).json({ success: false, message: 'Journal entry not found' });
      }
      
      const journalBefore = journal.toJSON();
      const updatedJournal = await journal.update({
        ...req.body,
        je_modified_by: req.user.us_usid,
        je_modified_dt: new Date(),
        modified_by: req.user.us_usid,
        modified_on: new Date()
      });
      // ── Forensic Audit: UPDATE (async) ─────────────────────────────────────────
      Audit.logFieldChanges(journalBefore, updatedJournal.toJSON(), {
        module: Audit.MODULES.JOURNAL, recordId: journal.je_jeid, req });
      // ───────────────────────────────────────────────────────────────────────
      res.json({
        success: true,
        data: updatedJournal,
        message: 'Journal entry updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update journal entry',
        error: error.message
      });
    }
  }
  
  async deleteJournal(req, res) {
    try {
      const { id } = req.params;
      const journal = await Journal.findOne({ where: { je_jeid: id, je_status: 'Active' } });
      
      if (!journal) {
        return res.status(404).json({ success: false, message: 'Journal entry not found' });
      }
      
      await journal.update({
        je_status: 'Deleted',
        je_modified_by: req.user.us_usid,
        je_modified_dt: new Date()
      }, req.audit ? req.audit.sequelizeOptions() : {});
      
      // Forensic Audit: DELETE
      if (req.audit) req.audit.logAction({ module: 'Journal', recordId: journal.je_jeid, action: 'DELETE' });
      
      res.json({ success: true, message: 'Journal entry deleted successfully' });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete journal entry',
        error: error.message
      });
    }
  }
  
  generateEntryNo(prefix) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${year}${month}${day}${random}`;
  }
}

module.exports = new JournalController();