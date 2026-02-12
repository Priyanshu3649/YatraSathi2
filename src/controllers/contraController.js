const { Contra, User } = require('../models');
const { validationResult } = require('express-validator');

/**
 * Contra Controller
 * Handles all contra entry CRUD operations
 */
class ContraController {
  async getAllContras(req, res) {
    try {
      const { page = 1, limit = 20, search, sortBy = 'ct_date', sortOrder = 'DESC' } = req.query;
      const offset = (page - 1) * limit;
      
      const whereClause = { ct_status: 'Active' };
      
      if (search) {
        whereClause[Op.or] = [
          { ct_entry_no: { [Op.like]: `%${search}%` } },
          { ct_from_account: { [Op.like]: `%${search}%` } },
          { ct_to_account: { [Op.like]: `%${search}%` } }
        ];
      }
      
      const { count, rows: contras } = await Contra.findAndCountAll({
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
        data: contras,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalRecords: count
        },
        message: 'Contra entries retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve contra entries',
        error: error.message
      });
    }
  }
  
  async getContraById(req, res) {
    try {
      const { id } = req.params;
      const contra = await Contra.findOne({
        where: { ct_ctid: id, ct_status: 'Active' },
        include: [{ model: User, as: 'creator' }]
      });
      
      if (!contra) {
        return res.status(404).json({ success: false, message: 'Contra entry not found' });
      }
      
      res.json({ success: true, data: contra, message: 'Contra entry retrieved successfully' });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve contra entry',
        error: error.message
      });
    }
  }
  
  async createContra(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      }
      
      const { ct_from_account, ct_to_account, ct_amount, ct_narration, ct_ref_number } = req.body;
      const entryNo = this.generateEntryNo('CT');
      
      const contra = await Contra.create({
        ct_entry_no: entryNo,
        ct_date: new Date(),
        ct_from_account,
        ct_to_account,
        ct_amount: parseFloat(ct_amount) || 0,
        ct_narration,
        ct_ref_number,
        ct_created_by: req.user.us_usid,
        ct_status: 'Active'
      });
      
      res.status(201).json({
        success: true,
        data: contra,
        message: 'Contra entry created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create contra entry',
        error: error.message
      });
    }
  }
  
  async updateContra(req, res) {
    try {
      const { id } = req.params;
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      }
      
      const contra = await Contra.findOne({ where: { ct_ctid: id, ct_status: 'Active' } });
      if (!contra) {
        return res.status(404).json({ success: false, message: 'Contra entry not found' });
      }
      
      const updatedContra = await contra.update({
        ...req.body,
        ct_modified_by: req.user.us_usid,
        ct_modified_dt: new Date()
      });
      
      res.json({
        success: true,
        data: updatedContra,
        message: 'Contra entry updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update contra entry',
        error: error.message
      });
    }
  }
  
  async deleteContra(req, res) {
    try {
      const { id } = req.params;
      const contra = await Contra.findOne({ where: { ct_ctid: id, ct_status: 'Active' } });
      
      if (!contra) {
        return res.status(404).json({ success: false, message: 'Contra entry not found' });
      }
      
      await contra.update({
        ct_status: 'Deleted',
        ct_modified_by: req.user.us_usid,
        ct_modified_dt: new Date()
      });
      
      res.json({ success: true, message: 'Contra entry deleted successfully' });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete contra entry',
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

module.exports = new ContraController();