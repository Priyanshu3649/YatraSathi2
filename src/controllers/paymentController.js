const { Payment, Contra, Receipt, Journal, User } = require('../models');
const { validationResult } = require('express-validator');

/**
 * Payment Controller
 * Handles all payment-related CRUD operations
 */
class PaymentController {
  /**
   * Get all payment records
   * GET /api/payments
   */
  async getAllPayments(req, res) {
    try {
      const { page = 1, limit = 20, search, sortBy = 'py_date', sortOrder = 'DESC' } = req.query;
      
      const offset = (page - 1) * limit;
      
      // Build where clause
      const whereClause = {
        py_status: 'Active'
      };
      
      if (search) {
        whereClause[Op.or] = [
          { py_entry_no: { [Op.like]: `%${search}%` } },
          { py_customer_name: { [Op.like]: `%${search}%` } },
          { py_customer_phone: { [Op.like]: `%${search}%` } }
        ];
      }
      
      const { count, rows: payments } = await Payment.findAndCountAll({
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
        data: payments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalRecords: count,
          hasNext: page < Math.ceil(count / limit),
          hasPrev: page > 1
        },
        message: 'Payments retrieved successfully'
      });
      
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payments',
        error: error.message
      });
    }
  }
  
  /**
   * Get payment by ID
   * GET /api/payments/:id
   */
  async getPaymentById(req, res) {
    try {
      const { id } = req.params;
      
      const payment = await Payment.findOne({
        where: { 
          py_pymtid: id,
          py_status: 'Active'
        },
        include: [{
          model: User,
          as: 'creator',
          attributes: ['us_usid', 'us_fname', 'us_lname']
        }]
      });
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }
      
      res.json({
        success: true,
        data: payment,
        message: 'Payment retrieved successfully'
      });
      
    } catch (error) {
      console.error('Get payment by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment',
        error: error.message
      });
    }
  }
  
  /**
   * Create new payment
   * POST /api/payments
   */
  async createPayment(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const { 
        py_entry_type, 
        py_customer_name, 
        py_customer_phone, 
        py_amount, 
        py_ref_number, 
        py_bank_account 
      } = req.body;
      
      // Generate entry number
      const entryNo = this.generateEntryNo('PY');
      
      // Calculate totals
      let totalDebit = 0;
      let totalCredit = 0;
      let balance = 0;
      
      const amount = parseFloat(py_amount) || 0;
      
      if (py_entry_type === 'Debit') {
        totalDebit = amount;
        balance = totalDebit - totalCredit;
      } else {
        totalCredit = amount;
        balance = totalCredit - totalDebit;
      }
      
      const payment = await Payment.create({
        py_entry_no: entryNo,
        py_date: new Date(),
        py_entry_type,
        py_customer_name,
        py_customer_phone,
        py_amount: amount,
        py_ref_number,
        py_bank_account,
        py_balance: balance,
        py_total_credit: totalCredit,
        py_total_debit: totalDebit,
        py_created_by: req.user.us_usid,
        py_status: 'Active'
      });
      
      res.status(201).json({
        success: true,
        data: payment,
        message: 'Payment created successfully'
      });
      
    } catch (error) {
      console.error('Create payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment',
        error: error.message
      });
    }
  }
  
  /**
   * Update payment
   * PUT /api/payments/:id
   */
  async updatePayment(req, res) {
    try {
      const { id } = req.params;
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const payment = await Payment.findOne({
        where: { 
          py_pymtid: id,
          py_status: 'Active'
        }
      });
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }
      
      // Update payment data
      const updatedPayment = await payment.update({
        ...req.body,
        py_modified_by: req.user.us_usid,
        py_modified_dt: new Date()
      });
      
      res.json({
        success: true,
        data: updatedPayment,
        message: 'Payment updated successfully'
      });
      
    } catch (error) {
      console.error('Update payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payment',
        error: error.message
      });
    }
  }
  
  /**
   * Delete payment (soft delete)
   * DELETE /api/payments/:id
   */
  async deletePayment(req, res) {
    try {
      const { id } = req.params;
      
      const payment = await Payment.findOne({
        where: { 
          py_pymtid: id,
          py_status: 'Active'
        }
      });
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }
      
      await payment.update({
        py_status: 'Deleted',
        py_modified_by: req.user.us_usid,
        py_modified_dt: new Date()
      });
      
      res.json({
        success: true,
        message: 'Payment deleted successfully'
      });
      
    } catch (error) {
      console.error('Delete payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete payment',
        error: error.message
      });
    }
  }
  
  /**
   * Generate entry number
   */
  generateEntryNo(prefix) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${year}${month}${day}${random}`;
  }
  
  /**
   * Get payment statistics
   * GET /api/payments/stats
   */
  async getPaymentStats(req, res) {
    try {
      const totalPayments = await Payment.count({
        where: { py_status: 'Active' }
      });
      
      const totalAmount = await Payment.sum('py_amount', {
        where: { py_status: 'Active' }
      }) || 0;
      
      const debitTotal = await Payment.sum('py_total_debit', {
        where: { py_status: 'Active' }
      }) || 0;
      
      const creditTotal = await Payment.sum('py_total_credit', {
        where: { py_status: 'Active' }
      }) || 0;
      
      res.json({
        success: true,
        data: {
          totalPayments,
          totalAmount,
          debitTotal,
          creditTotal,
          balance: debitTotal - creditTotal
        },
        message: 'Payment statistics retrieved successfully'
      });
      
    } catch (error) {
      console.error('Get payment stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment statistics',
        error: error.message
      });
    }
  }
}

module.exports = new PaymentController();