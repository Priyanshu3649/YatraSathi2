/**
 * Employee Payment Controller
 * Contains functions specifically for employee payment operations
 */

const { 
  ptXpayment: Payment,
  pnXpnr: Pnr,
  paXpayalloc: PaymentAlloc,
  cuXcustomer: Customer,
  bkXbooking: Booking
} = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../../config/db');

// Utility function to get accounting period
const getAccountingPeriod = (date) => {
  const d = date ? new Date(date) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Utility function to get financial year
const getFinancialYear = (date) => {
  const d = date ? new Date(date) : new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  
  // Financial year runs from April to March
  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  } else {
    return `${year - 1}-${String(year).slice(-2)}`;
  }
};

// Get all payments (for employees with proper permissions)
const getAllPayments = async (req, res) => {
  try {
    const { customerId, status, startDate, endDate, limit = 100, offset = 0 } = req.query;

    const whereClause = {};
    
    if (customerId) {
      whereClause.pt_custid = customerId;
    }
    
    if (status) {
      whereClause.pt_status = status;
    }
    
    if (startDate || endDate) {
      whereClause.pt_paydt = {};
      if (startDate) {
        whereClause.pt_paydt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.pt_paydt[Op.lte] = new Date(endDate);
      }
    }

    const payments = await Payment.findAll({
      where: whereClause,
      order: [['edtm', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await Payment.count({ where: whereClause });

    res.json({
      success: true,
      payments: payments || [],
      pagination: {
        total: total || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < (total || 0)
      }
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payments'
    });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByPk(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      payment
    });
  } catch (error) {
    console.error('Get payment by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payment'
    });
  }
};

// Get payment allocations
const getPaymentAllocations = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const allocations = await PaymentAlloc.findAll({
      where: { pa_ptid: paymentId },
      order: [['edtm', 'DESC']]
    });
    
    res.json({
      success: true,
      allocations: allocations || []
    });
  } catch (error) {
    console.error('Get payment allocations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payment allocations'
    });
  }
};

// Get PNR payments
const getPNRPayments = async (req, res) => {
  try {
    const { pnrNumber } = req.params;
    
    // Find PNR by number
    const pnr = await Pnr.findOne({
      where: { pn_pnr: pnrNumber }
    });
    
    if (!pnr) {
      return res.status(404).json({
        success: false,
        message: 'PNR not found'
      });
    }
    
    // Get allocations for this PNR
    const allocations = await PaymentAlloc.findAll({
      where: { pa_pnid: pnr.pn_pnid },
      order: [['edtm', 'DESC']]
    });
    
    // Get payment details for each allocation
    const payments = [];
    for (const alloc of allocations) {
      const payment = await Payment.findByPk(alloc.pa_ptid);
      if (payment) {
        payments.push({
          payment: payment,
          allocation: alloc
        });
      }
    }
    
    res.json({
      success: true,
      payments: payments || []
    });
  } catch (error) {
    console.error('Get PNR payments error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get PNR payments'
    });
  }
};

// Get customer pending PNRs
const getCustomerPendingPNRs = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // First get bookings for this customer
    const customerBookings = await Booking.findAll({
      where: { bk_usid: customerId },
      attributes: ['bk_bkid']
    });
    
    const bookingIds = customerBookings.map(b => b.bk_bkid);
    
    // Get pending PNRs for these bookings
    const pendingPNRs = await Pnr.findAll({
      where: {
        pn_bkid: { [Op.in]: bookingIds },
        pn_payment_status: { [Op.in]: ['UNPAID', 'PARTIAL'] }
      },
      order: [['edtm', 'ASC']]
    });
    
    res.json({
      success: true,
      pendingPNRs: pendingPNRs || []
    });
  } catch (error) {
    console.error('Get customer pending PNRs error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get customer pending PNRs'
    });
  }
};

// Get customer advance balance
const getCustomerAdvance = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // Get all payments for customer
    const payments = await Payment.findAll({
      where: {
        pt_custid: customerId,
        pt_status: { [Op.in]: ['RECEIVED', 'ADJUSTED'] }
      }
    });

    let totalPayment = 0;
    let totalAllocated = 0;

    for (const payment of payments) {
      totalPayment += parseFloat(payment.pt_amount) || 0;
      
      // Get allocations separately
      const allocations = await PaymentAlloc.findAll({
        where: { pa_ptid: payment.pt_ptid }
      });
      
      if (allocations && allocations.length > 0) {
        for (const alloc of allocations) {
          totalAllocated += parseFloat(alloc.pa_allocamt) || 0;
        }
      }
    }

    const advanceBalance = totalPayment - totalAllocated;

    res.json({
      success: true,
      advanceBalance: advanceBalance,
      totalPayment: totalPayment,
      totalAllocated: totalAllocated
    });
  } catch (error) {
    console.error('Get customer advance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get customer advance'
    });
  }
};

// Get outstanding receivables report
const getOutstandingReceivables = async (req, res) => {
  try {
    // Get all PNRs with unpaid amounts
    const unpaidPNRs = await Pnr.findAll({
      where: {
        pn_payment_status: { [Op.in]: ['UNPAID', 'PARTIAL'] }
      },
      order: [['edtm', 'ASC']]
    });
    
    // Calculate total outstanding
    let totalOutstanding = 0;
    const outstandingDetails = [];
    
    for (const pnr of unpaidPNRs) {
      const pendingAmount = parseFloat(pnr.pn_pendingamt) || 0;
      if (pendingAmount > 0) {
        totalOutstanding += pendingAmount;
        outstandingDetails.push({
          pnrNumber: pnr.pn_pnr,
          pendingAmount: pendingAmount,
          bookingId: pnr.pn_bkid,
          createdDate: pnr.edtm
        });
      }
    }
    
    res.json({
      success: true,
      totalOutstanding: totalOutstanding,
      details: outstandingDetails
    });
  } catch (error) {
    console.error('Get outstanding receivables error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get outstanding receivables'
    });
  }
};

// Allocate payment to PNRs
const allocatePayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { paymentId } = req.params;
    const { allocations } = req.body; // [{ pnrNumber, amount, remarks }]

    if (!allocations || !Array.isArray(allocations) || allocations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Allocations array is required'
      });
    }

    const payment = await Payment.findByPk(paymentId, { transaction });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    let totalAllocated = 0;
    const results = [];

    for (const alloc of allocations) {
      const { pnrNumber, amount, remarks } = alloc;

      if (!pnrNumber || !amount) {
        continue;
      }

      // Find PNR by number
      const pnr = await Pnr.findOne({
        where: { pn_pnr: pnrNumber }
      }, { transaction });
      
      if (!pnr) {
        throw new Error(`PNR ${pnrNumber} not found`);
      }

      // Create allocation record
      const allocation = await PaymentAlloc.create({
        pa_ptid: paymentId,
        pa_pnid: pnr.pn_pnid,
        pa_pnr: pnrNumber,
        pa_allocamt: amount,
        pa_allocdt: new Date(),
        pa_status: 'MANUAL',
        pa_rmrks: remarks || null,
        edtm: new Date(),
        eby: req.user.us_usid,
        mdtm: new Date(),
        mby: req.user.us_usid
      }, { transaction });

      totalAllocated += parseFloat(amount);
      results.push({
        allocationId: allocation.pa_paid,
        allocatedAmount: parseFloat(amount)
      });
    }

    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Payment allocated successfully',
      totalAllocated,
      allocations: results
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Payment allocation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to allocate payment'
    });
  }
};

// Refund payment
const refundPayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { paymentId } = req.params;
    const { amount, remarks } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid refund amount is required'
      });
    }

    const payment = await Payment.findByPk(paymentId, { transaction });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Create negative allocation for refund
    const refundAllocation = await PaymentAlloc.create({
      pa_ptid: paymentId,
      pa_pnid: null, // No specific PNR for refund
      pa_pnr: 'REFUND',
      pa_allocamt: -parseFloat(amount), // Negative amount for refund
      pa_allocdt: new Date(),
      pa_status: 'REFUND',
      pa_rmrks: remarks || 'Payment refund',
      edtm: new Date(),
      eby: req.user.us_usid,
      mdtm: new Date(),
      mby: req.user.us_usid
    }, { transaction });

    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Payment refunded successfully',
      refundAmount: parseFloat(amount),
      allocationId: refundAllocation.pa_paid
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Payment refund error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to refund payment'
    });
  }
};

// Update payment
const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      amount,
      mode,
      refNo,
      paymentDate,
      status,
      remarks
    } = req.body;
    
    // Find the payment
    const payment = await Payment.findByPk(id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Update payment fields
    const updates = {};
    if (amount !== undefined) updates.pt_amount = parseFloat(amount);
    if (mode !== undefined) updates.pt_mode = mode;
    if (refNo !== undefined) updates.pt_refno = refNo;
    if (paymentDate !== undefined) updates.pt_paydt = new Date(paymentDate);
    if (status !== undefined) updates.pt_status = status;
    if (remarks !== undefined) updates.pt_remarks = remarks;
    
    updates.mby = req.user.us_usid;
    updates.mdtm = new Date();
    
    await payment.update(updates);
    
    res.json({
      success: true,
      message: 'Payment updated successfully',
      payment
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update payment'
    });
  }
};

// Delete payment (soft delete)
const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findByPk(id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Soft delete by updating status
    await payment.update({
      pt_status: 'DELETED',
      mby: req.user.us_usid,
      mdtm: new Date()
    });
    
    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete payment'
    });
  }
};

// Verify payment
const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findByPk(id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Update verification status
    await payment.update({
      pt_verification_status: 'VERIFIED',
      mby: req.user.us_usid,
      mdtm: new Date()
    });
    
    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify payment'
    });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  getPaymentAllocations,
  getPNRPayments,
  getCustomerPendingPNRs,
  getCustomerAdvance,
  getOutstandingReceivables,
  allocatePayment,
  refundPayment,
  updatePayment,
  deletePayment,
  verifyPayment
};