// Payment Controller - Handles customer payments and allocations
const { ptPayment, paPaymentAlloc, Pnr, Booking, Customer, CustomerAdvance, YearEndClosing } = require('../models');
const { Op } = require('sequelize');

// Create a new customer payment
const createPayment = async (req, res) => {
  try {
    const paymentData = {
      ...req.body,
      pt_usid: req.user.us_usid,
      pt_createdby: req.user.us_usid
    };

    const payment = await ptPayment.create(paymentData);
    
    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Allocate payment to PNRs
const allocatePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { allocations } = req.body;

    // Process allocations
    for (const alloc of allocations) {
      await paPaymentAlloc.create({
        pa_ptid: paymentId,
        pa_pnid: alloc.pnrId,
        pa_amount: alloc.amount,
        pa_allocatedby: req.user.us_usid
      });
    }

    res.json({
      success: true,
      message: 'Payment allocated successfully'
    });
  } catch (error) {
    console.error('Error allocating payment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Refund a payment
const refundPayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if payment exists and is not refunded
    const payment = await ptPayment.findByPk(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Update payment as refunded
    await payment.update({
      pt_refunded: 1,
      pt_refundedby: req.user.us_usid,
      pt_refundedon: new Date()
    });

    res.json({
      success: true,
      message: 'Payment refunded successfully'
    });
  } catch (error) {
    console.error('Error refunding payment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update payment
const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const payment = await ptPayment.findByPk(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    await payment.update(updateData);

    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete payment
const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await ptPayment.findByPk(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    await payment.destroy();

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all payments
const getAllPayments = async (req, res) => {
  try {
    const payments = await ptPayment.findAll({
      include: [{
        model: Customer,
        as: 'paymentCustomer',
        attributes: ['cu_name', 'cu_email']
      }, {
        model: Booking,
        as: 'paymentBooking',
        attributes: ['bk_bkno']
      }]
    });
    
    res.json({
      success: true,
      data: payments,
      count: payments.length
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get customer payments
const getCustomerPayments = async (req, res) => {
  try {
    const userId = req.user.us_usid;
    
    const payments = await ptPayment.findAll({
      where: { pt_usid: userId },
      order: [['createdAt', 'DESC']],
      include: [{
        model: Booking,
        as: 'paymentBooking',
        attributes: ['bk_bkno']
      }]
    });
    
    res.json({
      success: true,
      data: payments,
      count: payments.length
    });
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await ptPayment.findByPk(id, {
      include: [{
        model: Customer,
        as: 'paymentCustomer',
        attributes: ['cu_name', 'cu_email']
      }, {
        model: Booking,
        as: 'paymentBooking',
        attributes: ['bk_bkno']
      }, {
        model: paPaymentAlloc,
        as: 'allocations',
        include: [{
          model: Pnr,
          as: 'pnr',
          attributes: ['pn_pnrno', 'pn_amount']
        }]
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
      data: payment
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get payment allocations
const getPaymentAllocations = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const allocations = await paPaymentAlloc.findAll({
      where: { pa_ptid: paymentId },
      include: [{
        model: Pnr,
        as: 'pnr',
        attributes: ['pn_pnrno', 'pn_amount']
      }]
    });
    
    res.json({
      success: true,
      data: allocations
    });
  } catch (error) {
    console.error('Error fetching payment allocations:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get PNR payments
const getPNRPayments = async (req, res) => {
  try {
    const { pnrNumber } = req.params;
    
    // First get the PNR
    const pnr = await Pnr.findOne({ where: { pn_pnrno: pnrNumber } });
    if (!pnr) {
      return res.status(404).json({
        success: false,
        message: 'PNR not found'
      });
    }
    
    // Get allocations for this PNR
    const allocations = await paPaymentAlloc.findAll({
      where: { pa_pnid: pnr.pn_pnid },
      include: [{
        model: ptPayment,
        as: 'payment',
        attributes: ['pt_ptid', 'pt_amount', 'pt_mode', 'pt_date']
      }]
    });
    
    res.json({
      success: true,
      data: allocations
    });
  } catch (error) {
    console.error('Error fetching PNR payments:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get customer pending PNRs
const getCustomerPendingPNRs = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // Check authorization
    if (req.user.us_usertype === 'customer' && req.user.us_usid !== customerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Get customer bookings
    const bookings = await Booking.findAll({
      where: { bk_usid: customerId },
      attributes: ['bk_bkid']
    });
    
    const bookingIds = bookings.map(b => b.bk_bkid);
    
    // Get PNRs for these bookings that are pending payment
    const pnrs = await Pnr.findAll({
      where: {
        pn_bkid: { [Op.in]: bookingIds },
        pn_paid: { [Op.lt]: Sequelize.col('pn_amount') }
      },
      include: [{
        model: Booking,
        as: 'pnrBooking',
        attributes: ['bk_bkno']
      }]
    });
    
    res.json({
      success: true,
      data: pnrs
    });
  } catch (error) {
    console.error('Error fetching customer pending PNRs:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get customer advance
const getCustomerAdvance = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // Check authorization
    if (req.user.us_usertype === 'customer' && req.user.us_usid !== customerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Get customer advance balance
    const advance = await CustomerAdvance.findOne({
      where: { ca_usid: customerId }
    });
    
    res.json({
      success: true,
      data: advance || { ca_balance: 0 }
    });
  } catch (error) {
    console.error('Error fetching customer advance:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get outstanding receivables
const getOutstandingReceivables = async (req, res) => {
  try {
    // Get all unpaid PNRs
    const outstandingPNRs = await Pnr.findAll({
      where: {
        pn_paid: { [Op.lt]: Sequelize.col('pn_amount') }
      },
      include: [{
        model: Booking,
        as: 'pnrBooking',
        include: [{
          model: Customer,
          as: 'customer',
          attributes: ['cu_name', 'cu_email']
        }]
      }]
    });
    
    res.json({
      success: true,
      data: outstandingPNRs
    });
  } catch (error) {
    console.error('Error fetching outstanding receivables:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Perform year-end closing
const performYearEndClosing = async (req, res) => {
  try {
    const closing = await YearEndClosing.create({
      yec_closedby: req.user.us_usid,
      yec_status: 'completed'
    });
    
    res.json({
      success: true,
      message: 'Year-end closing completed successfully',
      data: closing
    });
  } catch (error) {
    console.error('Error performing year-end closing:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Record customer payment
const recordCustomerPayment = async (req, res) => {
  try {
    const paymentData = {
      ...req.body,
      pt_usid: req.user.us_usid,
      pt_createdby: req.user.us_usid,
      pt_status: 'pending_verification'
    };

    const payment = await ptPayment.create(paymentData);
    
    res.status(201).json({
      success: true,
      message: 'Customer payment recorded successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error recording customer payment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify payment
const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await ptPayment.findByPk(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    await payment.update({
      pt_status: 'verified',
      pt_verifiedby: req.user.us_usid,
      pt_verifiedon: new Date()
    });

    res.json({
      success: true,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Payment Entry Controller - Handles money going out
const PaymentEntry = require('../models/PaymentEntry');
const LedgerMaster = require('../models/LedgerMaster');

// Get all payment entries
const getAllEntries = async (req, res) => {
  try {
    const filters = {
      entry_date_from: req.query.entry_date_from,
      entry_date_to: req.query.entry_date_to,
      voucher_no: req.query.voucher_no,
      payment_mode: req.query.payment_mode
    };

    const entries = await PaymentEntry.findAll(filters);
    
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
};

// Get single payment entry by ID
const getEntryById = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await PaymentEntry.findById(id);
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Payment entry not found'
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
};

// Create new payment entry
const createEntry = async (req, res) => {
  try {
    const entryData = {
      ...req.body,
      created_by: req.user?.us_usid || req.user?.id || 1
    };

    // Validate data
    const validation = PaymentEntry.validate(entryData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Check if sufficient balance exists
    const ledgerName = entryData.payment_mode === 'Cash' ? 'Cash' : 'Bank';
    const currentBalance = await LedgerMaster.getBalance(ledgerName);
    
    if (currentBalance < parseFloat(entryData.amount)) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance in ${ledgerName}. Available: ₹${currentBalance.toFixed(2)}`
      });
    }

    const entry = await PaymentEntry.create(entryData);
    
    res.status(201).json({
      success: true,
      message: 'Payment entry created successfully',
      data: entry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update payment entry
const updateEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate data
    const validation = PaymentEntry.validate(updateData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const entry = await PaymentEntry.update(id, updateData);
    
    res.json({
      success: true,
      message: 'Payment entry updated successfully',
      data: entry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete payment entry
const deleteEntry = async (req, res) => {
  try {
    const { id } = req.params;
    
    await PaymentEntry.delete(id);
    
    res.json({
      success: true,
      message: 'Payment entry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get next voucher number
const getNextVoucherNumber = async (req, res) => {
  try {
    const voucherNo = await PaymentEntry.generateVoucherNumber();
    
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
};

// Get payment modes
const getPaymentModes = async (req, res) => {
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
};

// Get ledger balance
const getLedgerBalance = async (req, res) => {
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
};

// Export all functions for both accounting and customer payment purposes
module.exports = {
  // Accounting functions
  getAllEntries,
  getEntryById,
  createEntry,
  updateEntry,
  deleteEntry,
  getNextVoucherNumber,
  getPaymentModes,
  getLedgerBalance,
  
  // Customer payment functions
  createPayment,
  allocatePayment,
  refundPayment,
  updatePayment,
  deletePayment,
  getAllPayments,
  getCustomerPayments,
  getPaymentById,
  getPaymentAllocations,
  getPNRPayments,
  getCustomerPendingPNRs,
  getCustomerAdvance,
  getOutstandingReceivables,
  performYearEndClosing,
  recordCustomerPayment,
  verifyPayment
};