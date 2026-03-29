const { Payment, Contra, Receipt, Journal, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const queryHelper = require('../utils/queryHelper');
const RealTimeService = require('../services/realTimeService');

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
      const { limit, offset, page } = queryHelper.getPaginationOptions(req.query);
      const order = queryHelper.getSortingOptions(req.query, 'py_date', 'DESC');
      
      const filterMap = {
        dateColumn: 'py_date',
        amountColumn: 'py_amount',
        statusColumn: 'py_status',
        searchColumns: ['py_entry_no', 'py_customer_name', 'py_customer_phone'],
        customFilters: {
          type: 'py_entry_type'
        }
      };
      
      const where = queryHelper.buildWhereClause(req.query, filterMap);
      
      // Default filter for active payments if not specified
      if (!req.query.status) {
        where.py_status = 'Active';
      }
      
      const { count, rows: payments } = await Payment.findAndCountAll({
        where,
        include: [{
          model: User,
          as: 'creator',
          attributes: ['us_usid', 'us_fname', 'us_lname']
        }],
        order,
        limit,
        offset
      });
      
      // Handle Export Request
      if (req.query.export === 'csv') {
        const columns = [
          { label: 'Entry No', key: 'py_entry_no' },
          { label: 'Date', key: 'py_date' },
          { label: 'Customer', key: 'py_customer_name' },
          { label: 'Phone', key: 'py_customer_phone' },
          { label: 'Amount', key: 'py_amount' },
          { label: 'Type', key: 'py_entry_type' },
          { label: 'Status', key: 'py_status' }
        ];
        const csv = queryHelper.convertToCSV(payments.map(p => p.toJSON()), columns);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=payments.csv');
        return res.send(csv);
      }
      
      res.json(queryHelper.formatPaginatedResponse(count, payments, page, limit));
      
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
      
      // Emit real-time update
      RealTimeService.emitPaymentUpdate(payment.toJSON());

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
      
      // Emit real-time update
      RealTimeService.broadcast('payment_update', {
        type: 'PAYMENT_UPDATED',
        data: updatedPayment.toJSON()
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