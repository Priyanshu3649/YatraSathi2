const { Receipt, User } = require('../models');
const { validationResult } = require('express-validator');

/**
 * Receipt Controller
 * Handles all receipt CRUD operations
 */
class ReceiptController {
  async getAllReceipts(req, res) {
    try {
      const { page = 1, limit = 20, search, sortBy = 'rc_date', sortOrder = 'DESC' } = req.query;
      const offset = (page - 1) * limit;
      
      const whereClause = { rc_status: 'Active' };
      
      if (search) {
        whereClause[Op.or] = [
          { rc_entry_no: { [Op.like]: `%${search}%` } },
          { rc_customer_name: { [Op.like]: `%${search}%` } },
          { rc_customer_phone: { [Op.like]: `%${search}%` } }
        ];
      }
      
      const { count, rows: receipts } = await Receipt.findAndCountAll({
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
        data: receipts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalRecords: count
        },
        message: 'Receipts retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve receipts',
        error: error.message
      });
    }
  }
  
  async getReceiptById(req, res) {
    try {
      const { id } = req.params;
      const receipt = await Receipt.findOne({
        where: { rc_rcid: id, rc_status: 'Active' },
        include: [{ model: User, as: 'creator' }]
      });
      
      if (!receipt) {
        return res.status(404).json({ success: false, message: 'Receipt not found' });
      }
      
      res.json({ success: true, data: receipt, message: 'Receipt retrieved successfully' });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve receipt',
        error: error.message
      });
    }
  }
  
  async createReceipt(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      }
      
      const { 
        rc_customer_name, 
        rc_customer_phone, 
        rc_amount, 
        rc_payment_mode, 
        rc_ref_number, 
        rc_bank_account, 
        rc_narration 
      } = req.body;
      
      const entryNo = this.generateEntryNo('RC');
      
      const receipt = await Receipt.create({
        rc_entry_no: entryNo,
        rc_date: new Date(),
        rc_customer_name,
        rc_customer_phone,
        rc_amount: parseFloat(rc_amount) || 0,
        rc_payment_mode,
        rc_ref_number,
        rc_bank_account,
        rc_narration,
        rc_created_by: req.user.us_usid,
        rc_status: 'Active'
      });
      
      res.status(201).json({
        success: true,
        data: receipt,
        message: 'Receipt created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create receipt',
        error: error.message
      });
    }
  }
  
  async updateReceipt(req, res) {
    try {
      const { id } = req.params;
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      }
      
      const receipt = await Receipt.findOne({ where: { rc_rcid: id, rc_status: 'Active' } });
      if (!receipt) {
        return res.status(404).json({ success: false, message: 'Receipt not found' });
      }
      
      const updatedReceipt = await receipt.update({
        ...req.body,
        rc_modified_by: req.user.us_usid,
        rc_modified_dt: new Date()
      });
      
      res.json({
        success: true,
        data: updatedReceipt,
        message: 'Receipt updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update receipt',
        error: error.message
      });
    }
  }
  
  async deleteReceipt(req, res) {
    try {
      const { id } = req.params;
      const receipt = await Receipt.findOne({ where: { rc_rcid: id, rc_status: 'Active' } });
      
      if (!receipt) {
        return res.status(404).json({ success: false, message: 'Receipt not found' });
      }
      
      await receipt.update({
        rc_status: 'Deleted',
        rc_modified_by: req.user.us_usid,
        rc_modified_dt: new Date()
      });
      
      res.json({ success: true, message: 'Receipt deleted successfully' });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete receipt',
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

module.exports = new ReceiptController();