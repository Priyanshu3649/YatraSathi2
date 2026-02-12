const { Journal, User } = require('../models');
const { validationResult } = require('express-validator');

/**
 * Journal Controller
 * Handles all journal entry CRUD operations
 */
class JournalController {
  async getAllJournals(req, res) {
    try {
      const { page = 1, limit = 20, search, sortBy = 'je_date', sortOrder = 'DESC' } = req.query;
      const offset = (page - 1) * limit;
      
      const whereClause = { je_status: 'Active' };
      
      if (search) {
        whereClause[Op.or] = [
          { je_entry_no: { [Op.like]: `%${search}%` } },
          { je_account: { [Op.like]: `%${search}%` } },
          { je_narration: { [Op.like]: `%${search}%` } }
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
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      res.json({
        success: true,
        data: journals,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalRecords: count
        },
        message: 'Journal entries retrieved successfully'
      });
    } catch (error) {
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
      });
      
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
      
      const updatedJournal = await journal.update({
        ...req.body,
        je_modified_by: req.user.us_usid,
        je_modified_dt: new Date()
      });
      
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
      });
      
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