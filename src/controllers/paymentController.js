const { ptPayment: Payment, bkBooking: Booking, acAccount: Account, emEmployee: Employee, usUser: User, pnPnr: Pnr, paPaymentAlloc: PaymentAlloc, lgLedger: Ledger, Sequelize } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../../config/db');

// Create a new payment with allocation
const createPayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      bookingId,
      amount,
      mode,
      transactionId,
      bankName,
      branch,
      chequeNumber,
      paymentDate,
      remarks,
      // Detailed payment breakdown
      ticketPrice,
      platformFee,
      agentFee,
      tax,
      otherCharges,
      // PNR for which payment is received
      pnrNumber
    } = req.body;
    
    // Verify booking exists
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Get or create account for this booking
    let account = await Account.findOne({ where: { ac_bkid: bookingId } });
    if (!account) {
      // Create account if it doesn't exist
      account = await Account.create({
        ac_bkid: bookingId,
        ac_usid: booking.bk_usid,
        ac_totamt: booking.bk_total_amount || 0,
        ac_rcvdamt: 0,
        ac_duedt: new Date(),
        eby: req.user.us_usid,
        mby: req.user.us_usid
      }, { transaction });
    }
    
    // Calculate accounting period
    const paymentDt = paymentDate ? new Date(paymentDate) : new Date();
    const acctPeriod = `${paymentDt.getFullYear()}-${String(paymentDt.getMonth() + 1).padStart(2, '0')}`;
    
    // Create new payment
    const payment = await Payment.create({
      pt_acid: account.ac_acid,
      pt_bkid: bookingId,
      pt_amount: amount,
      pt_mode: mode,
      pt_refno: transactionId,
      pt_paydt: paymentDate || new Date(),
      pt_remarks: remarks,
      pt_status: 'RECEIVED',
      pt_rcvby: req.user.us_usid,
      pt_acct_period: acctPeriod,
      // Detailed payment breakdown
      pt_ticket_price: ticketPrice || 0,
      pt_platform_fee: platformFee || 0,
      pt_agent_fee: agentFee || 0,
      pt_tax: tax || 0,
      pt_other_charges: otherCharges || 0,
      pt_pnr: pnrNumber,
      eby: req.user.us_usid,
      mby: req.user.us_usid
    }, { transaction });
    
    // Update account with received amount
    account.ac_rcvdamt = (account.ac_rcvdamt || 0) + amount;
    account.mby = req.user.us_usid;
    await account.save({ transaction });
    
    // Update booking with payment information
    booking.bk_amount_paid = (booking.bk_amount_paid || 0) + amount;
    if (booking.bk_total_amount) {
      booking.bk_amount_pending = booking.bk_total_amount - booking.bk_amount_paid;
    }
    
    // If fully paid, update booking status
    if (booking.bk_amount_pending <= 0) {
      booking.bk_status = 'COMPLETED';
    }
    
    booking.mby = req.user.us_usid;
    await booking.save({ transaction });
    
    // If PNR number is provided, allocate payment to PNR
    if (pnrNumber) {
      const pnr = await Pnr.findOne({ where: { pn_pnr: pnrNumber } });
      if (pnr) {
        // Create allocation record
        await PaymentAlloc.create({
          pa_ptid: payment.pt_ptid,
          pa_pnid: pnr.pn_pnid,
          pa_amount: amount,
          pa_alloctn_type: 'MANUAL',
          pa_remarks: remarks || 'Payment allocation',
          eby: req.user.us_usid
        }, { transaction });
        
        // Update PNR payment information
        pnr.pn_paidamt = (pnr.pn_paidamt || 0) + amount;
        pnr.pn_pendingamt = (pnr.pn_totamt || 0) - pnr.pn_paidamt;
        
        // Update payment status based on pending amount
        if (pnr.pn_pendingamt <= 0) {
          pnr.pn_payment_status = 'PAID';
        } else if (pnr.pn_paidamt > 0) {
          pnr.pn_payment_status = 'PARTIAL';
        } else {
          pnr.pn_payment_status = 'UNPAID';
        }
        
        await pnr.save({ transaction });
        
        // Create ledger entry
        await Ledger.create({
          lg_entry_type: 'CREDIT',
          lg_entry_ref: `PAYMENT-${payment.pt_ptid}`,
          lg_amount: amount,
          lg_opening_bal: 0,
          lg_closing_bal: amount,
          lg_remarks: `Payment received for PNR ${pnrNumber}`,
          lg_usid: req.user.us_usid,
          lg_pnid: pnr.pn_pnid,
          lg_ptid: payment.pt_ptid,
          lg_acid: account.ac_acid,
          eby: req.user.us_usid,
          mby: req.user.us_usid
        }, { transaction });
      }
    }
    
    await transaction.commit();
    
    res.status(201).json(payment);
  } catch (error) {
    await transaction.rollback();
    console.error('Payment creation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Refund a payment
const refundPayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { refundAmount, remarks } = req.body;
    
    // Find the original payment
    const originalPayment = await Payment.findByPk(id, {
      include: [
        {
          model: Account,
          attributes: ['ac_acid', 'ac_bkid', 'ac_usid']
        },
        {
          model: BookingTVL,
          attributes: ['bk_bkid', 'bk_bkno', 'bk_fromst', 'bk_tost', 'bk_status']
        }
      ]
    });
    
    if (!originalPayment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Check permissions (only admin and accounts team can refund)
    if (req.user.us_usertype !== 'admin') {
      // For employees, check if they're in the accounts department
      if (req.user.us_usertype === 'employee') {
        const employee = await Employee.findOne({ where: { em_usid: req.user.us_usid } });
        if (!employee || employee.em_dept !== 'accounts') {
          return res.status(403).json({ message: 'Access denied. Accounts team access required.' });
        }
      } else {
        return res.status(403).json({ message: 'Access denied. Admin or accounts team access required.' });
      }
    }
    
    // Validate refund amount
    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({ message: 'Refund amount must be greater than zero' });
    }
    
    if (refundAmount > originalPayment.pt_amount) {
      return res.status(400).json({ message: 'Refund amount cannot exceed original payment amount' });
    }
    
    // Check if this payment has already been refunded
    if (originalPayment.pt_status === 'REFUNDED') {
      return res.status(400).json({ message: 'Payment has already been refunded' });
    }
    
    // Create refund payment record
    const refundPayment = await Payment.create({
      pt_acid: originalPayment.pt_acid,
      pt_bkid: originalPayment.pt_bkid,
      pt_amount: -refundAmount, // Negative amount to indicate refund
      pt_mode: originalPayment.pt_mode,
      pt_refno: `REFUND-${originalPayment.pt_refno || originalPayment.pt_ptid}`,
      pt_paydt: new Date(),
      pt_remarks: remarks || `Refund of ${refundAmount} from payment ${originalPayment.pt_ptid}`,
      pt_status: 'REFUNDED',
      eby: req.user.us_usid,
      mby: req.user.us_usid
    }, { transaction });
    
    // Update original payment status
    originalPayment.pt_status = 'REFUNDED';
    originalPayment.pt_remarks = originalPayment.pt_remarks ? 
      `${originalPayment.pt_remarks} | Refunded ${refundAmount}` : 
      `Refunded ${refundAmount}`;
    originalPayment.mby = req.user.us_usid;
    await originalPayment.save({ transaction });
    
    // Update account balance
    const account = await Account.findByPk(originalPayment.pt_acid);
    if (account) {
      account.ac_rcvdamt = (account.ac_rcvdamt || 0) - refundAmount;
      account.mby = req.user.us_usid;
      await account.save({ transaction });
    }
    
    // Update booking payment information
    const booking = await BookingTVL.findByPk(originalPayment.pt_bkid);
    if (booking) {
      booking.bk_amount_paid = (booking.bk_amount_paid || 0) - refundAmount;
      booking.bk_amount_pending = (booking.bk_amount_pending || 0) + refundAmount;
      
      // Update booking status if needed
      if (booking.bk_amount_paid <= 0) {
        booking.bk_status = 'PENDING';
      } else if (booking.bk_status === 'COMPLETED') {
        booking.bk_status = 'PARTIALLY_REFUNDED';
      }
      
      booking.mby = req.user.us_usid;
      await booking.save({ transaction });
    }
    
    // Update related PNRs if payment was allocated
    const allocations = await PaymentAlloc.findAll({ 
      where: { pa_ptid: originalPayment.pt_ptid },
      transaction 
    });
    
    for (const allocation of allocations) {
      const pnr = await Pnr.findByPk(allocation.pa_pnid);
      if (pnr) {
        pnr.pn_paidamt = (pnr.pn_paidamt || 0) - allocation.pa_amount;
        pnr.pn_pendingamt = (pnr.pn_totamt || 0) - pnr.pn_paidamt;
        
        // Update payment status based on pending amount
        if (pnr.pn_pendingamt <= 0) {
          pnr.pn_payment_status = 'PAID';
        } else if (pnr.pn_paidamt > 0) {
          pnr.pn_payment_status = 'PARTIAL';
        } else {
          pnr.pn_payment_status = 'UNPAID';
        }
        
        await pnr.save({ transaction });
      }
    }
    
    await transaction.commit();
    
    res.status(201).json({
      message: 'Payment refunded successfully',
      refundPayment,
      originalPayment
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Payment refund error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Allocate payment to PNRs
const allocatePayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { paymentId } = req.params;
    const { allocations } = req.body; // Array of { pnrId, amount, remarks }
    
    // Find the payment
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Check permissions
    if (req.user.us_usertype !== 'admin' && req.user.us_dept !== 'accounts') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    let totalAllocated = 0;
    
    for (const allocation of allocations) {
      const { pnrId, amount, remarks, allocationType = 'MANUAL' } = allocation;
      
      // Validate allocation amount
      if (amount <= 0) {
        throw new Error('Allocation amount must be greater than zero');
      }
      
      // Find the PNR
      const pnr = await Pnr.findByPk(pnrId);
      if (!pnr) {
        throw new Error(`PNR with ID ${pnrId} not found`);
      }
      
      // Check if allocation exceeds pending amount
      const pendingAmount = (pnr.pn_totamt || 0) - (pnr.pn_paidamt || 0);
      if (amount > pendingAmount) {
        throw new Error(`Cannot allocate ${amount} to PNR ${pnr.pn_pnr}, pending amount is only ${pendingAmount}`);
      }
      
      // Create allocation record
      await PaymentAlloc.create({
        pa_ptid: payment.pt_ptid,
        pa_pnid: pnr.pn_pnid,
        pa_amount: amount,
        pa_alloctn_type: allocationType,
        pa_remarks: remarks || 'Payment allocation',
        eby: req.user.us_usid
      }, { transaction });
      
      // Update PNR payment information
      pnr.pn_paidamt = (pnr.pn_paidamt || 0) + amount;
      pnr.pn_pendingamt = (pnr.pn_totamt || 0) - pnr.pn_paidamt;
      
      // Update payment status based on pending amount
      if (pnr.pn_pendingamt <= 0) {
        pnr.pn_payment_status = 'PAID';
      } else if (pnr.pn_paidamt > 0) {
        pnr.pn_payment_status = 'PARTIAL';
      } else {
        pnr.pn_payment_status = 'UNPAID';
      }
      
      await pnr.save({ transaction });
      
      // Create ledger entry
      await Ledger.create({
        lg_entry_type: 'CREDIT',
        lg_entry_ref: `ALLOC-${payment.pt_ptid}`,
        lg_amount: amount,
        lg_opening_bal: 0,
        lg_closing_bal: amount,
        lg_remarks: `Payment allocation to PNR ${pnr.pn_pnr}`,
        lg_usid: req.user.us_usid,
        lg_pnid: pnr.pn_pnid,
        lg_ptid: payment.pt_ptid,
        lg_acid: payment.pt_acid,
        eby: req.user.us_usid,
        mby: req.user.us_usid
      }, { transaction });
      
      totalAllocated += amount;
    }
    
    // Update payment status to ADJUSTED if fully allocated
    if (totalAllocated >= payment.pt_amount) {
      payment.pt_status = 'ADJUSTED';
    }
    payment.mby = req.user.us_usid;
    await payment.save({ transaction });
    
    await transaction.commit();
    
    res.json({ message: 'Payment allocated successfully', totalAllocated });
  } catch (error) {
    await transaction.rollback();
    console.error('Payment allocation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get payment allocations for a payment
const getPaymentAllocations = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const allocations = await PaymentAlloc.findAll({
      where: { pa_ptid: paymentId },
      include: [
        {
          model: Pnr,
          attributes: ['pn_pnid', 'pn_pnr', 'pn_totamt', 'pn_paidamt', 'pn_pendingamt', 'pn_payment_status']
        }
      ]
    });
    
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get PNR payments
const getPNRPayments = async (req, res) => {
  try {
    const { pnrId } = req.params;
    
    const allocations = await PaymentAlloc.findAll({
      where: { pa_pnid: pnrId },
      include: [
        {
          model: Payment,
          attributes: ['pt_ptid', 'pt_amount', 'pt_mode', 'pt_paydt', 'pt_status']
        }
      ]
    });
    
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all payments for a customer
const getCustomerPayments = async (req, res) => {
  try {
    // First get account IDs for the user
    const userAccounts = await Account.findAll({ 
      where: { ac_usid: req.user.us_usid },
      attributes: ['ac_acid']
    });
    
    const accountIds = userAccounts.map(acc => acc.ac_acid);
    
    const payments = await Payment.findAll({ 
      where: { pt_acid: accountIds },
      order: [['edtm', 'DESC']]
    });
    
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all payments (admin only)
const getAllPayments = async (req, res) => {
  try {
    // Only admin can get all payments
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const payments = await Payment.findAll({ 
      include: [
        {
          model: Account,
          attributes: ['ac_acid', 'ac_bkid', 'ac_totamt', 'ac_rcvdamt', 'ac_pendamt']
        }
      ],
      order: [['edtm', 'DESC']] 
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: Account,
          attributes: ['ac_acid', 'ac_bkid', 'ac_totamt', 'ac_rcvdamt', 'ac_pendamt']
        }
      ]
    });
    
    // Check if payment exists
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Check if user has permission to view this payment
    const account = await Account.findByPk(payment.pt_acid);
    if (req.user.us_usertype !== 'admin' && 
        account?.ac_usid !== req.user.us_usid) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update payment (accounts functionality)
const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Check permissions (admin and accounts team can update)
    if (req.user.us_usertype !== 'admin' && 
        req.user.us_dept !== 'accounts') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update payment fields
    const {
      status,
      receivedDate,
      remarks
    } = req.body;
    
    // Update fields if provided
    if (status) payment.pt_status = status;
    if (receivedDate) payment.pt_rcvdt = receivedDate;
    if (remarks) payment.pt_remarks = remarks;
    
    payment.mby = req.user.us_usid;
    const updatedPayment = await payment.save();
    res.json(updatedPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete payment
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Check permissions
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await payment.destroy();
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payments by booking ID
const getPaymentsByBookingId = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Verify booking exists and user has access
    const booking = await BookingTVL.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user has permission to view this booking's payments
    if (req.user.us_usertype !== 'admin' && 
        booking.bk_usid !== req.user.us_usid) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const payments = await Payment.findAll({ 
      where: { pt_bkid: bookingId },
      order: [['edtm', 'DESC']]
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get daily, monthly, and annual earnings and profits
const getEarningsReport = async (req, res) => {
  try {
    // Only admin can access this report
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { startDate, endDate } = req.query;
    
    // Build date filter conditions
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.pt_paydt = {};
      if (startDate) {
        dateFilter.pt_paydt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        dateFilter.pt_paydt[Op.lte] = new Date(endDate);
      }
    }
    
    // Get daily earnings
    const dailyEarnings = await Payment.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('pt_paydt')), 'date'],
        [Sequelize.fn('SUM', Sequelize.col('pt_amount')), 'totalAmount'],
        [Sequelize.fn('COUNT', Sequelize.col('pt_ptid')), 'paymentCount']
      ],
      where: {
        pt_status: 'RECEIVED',
        ...dateFilter
      },
      group: [Sequelize.fn('DATE', Sequelize.col('pt_paydt'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('pt_paydt')), 'DESC']]
    });
    
    // Get monthly earnings
    const monthlyEarnings = await Payment.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('pt_paydt'), '%Y-%m'), 'month'],
        [Sequelize.fn('SUM', Sequelize.col('pt_amount')), 'totalAmount'],
        [Sequelize.fn('COUNT', Sequelize.col('pt_ptid')), 'paymentCount']
      ],
      where: {
        pt_status: 'RECEIVED',
        ...dateFilter
      },
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('pt_paydt'), '%Y-%m')],
      order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('pt_paydt'), '%Y-%m'), 'DESC']]
    });
    
    // Get annual earnings
    const annualEarnings = await Payment.findAll({
      attributes: [
        [Sequelize.fn('YEAR', Sequelize.col('pt_paydt')), 'year'],
        [Sequelize.fn('SUM', Sequelize.col('pt_amount')), 'totalAmount'],
        [Sequelize.fn('COUNT', Sequelize.col('pt_ptid')), 'paymentCount']
      ],
      where: {
        pt_status: 'RECEIVED',
        ...dateFilter
      },
      group: [Sequelize.fn('YEAR', Sequelize.col('pt_paydt'))],
      order: [[Sequelize.fn('YEAR', Sequelize.col('pt_paydt')), 'DESC']]
    });
    
    // Calculate detailed breakdown
    const totalEarnings = await Payment.sum('pt_amount', {
      where: {
        pt_status: 'RECEIVED',
        ...dateFilter
      }
    });
    
    const detailedBreakdown = await Payment.findAll({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('pt_ticket_price')), 'totalTicketPrice'],
        [Sequelize.fn('SUM', Sequelize.col('pt_platform_fee')), 'totalPlatformFee'],
        [Sequelize.fn('SUM', Sequelize.col('pt_agent_fee')), 'totalAgentFee'],
        [Sequelize.fn('SUM', Sequelize.col('pt_tax')), 'totalTax'],
        [Sequelize.fn('SUM', Sequelize.col('pt_other_charges')), 'totalOtherCharges']
      ],
      where: {
        pt_status: 'RECEIVED',
        ...dateFilter
      }
    });
    
    res.json({
      daily: dailyEarnings,
      monthly: monthlyEarnings,
      annual: annualEarnings,
      totalEarnings: totalEarnings || 0,
      detailedBreakdown: detailedBreakdown[0] || {}
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPayment,
  refundPayment,
  allocatePayment,
  getPaymentAllocations,
  getPNRPayments,
  getCustomerPayments,
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getPaymentsByBookingId,
  getEarningsReport
};