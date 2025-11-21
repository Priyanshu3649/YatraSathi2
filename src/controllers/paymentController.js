const { Payment, Booking, Account, Employee, Sequelize } = require('../models');

// Create a new payment
const createPayment = async (req, res) => {
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
      remarks
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
      });
    }
    
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
      eby: req.user.us_usid,
      mby: req.user.us_usid
    });
    
    // Update account with received amount
    account.ac_rcvdamt = (account.ac_rcvdamt || 0) + amount;
    account.mby = req.user.us_usid;
    await account.save();
    
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
    await booking.save();
    
    res.status(201).json(payment);
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Refund a payment
const refundPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { refundAmount, remarks } = req.body;
    
    // Find the original payment
    const originalPayment = await Payment.findByPk(id, {
      include: [Account, Booking]
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
    });
    
    // Update original payment status
    originalPayment.pt_status = 'REFUNDED';
    originalPayment.pt_remarks = originalPayment.pt_remarks ? 
      `${originalPayment.pt_remarks} | Refunded ${refundAmount}` : 
      `Refunded ${refundAmount}`;
    originalPayment.mby = req.user.us_usid;
    await originalPayment.save();
    
    // Update account balance
    const account = await Account.findByPk(originalPayment.pt_acid);
    if (account) {
      account.ac_rcvdamt = (account.ac_rcvdamt || 0) - refundAmount;
      account.mby = req.user.us_usid;
      await account.save();
    }
    
    // Update booking payment information
    const booking = await Booking.findByPk(originalPayment.pt_bkid);
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
      await booking.save();
    }
    
    res.status(201).json({
      message: 'Payment refunded successfully',
      refundPayment,
      originalPayment
    });
  } catch (error) {
    console.error('Payment refund error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all payments for a customer
const getCustomerPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({ 
      include: [{
        model: Account,
        where: {
          ac_usid: req.user.us_usid
        }
      }],
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
      include: [Account, Booking],
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
      include: [Account, Booking]
    });
    
    // Check if payment exists
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Check if user has permission to view this payment
    if (req.user.us_usertype !== 'admin' && 
        payment.Account.ac_usid !== req.user.us_usid) {
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
        req.user.us_department !== 'accounts') {
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
    const booking = await Booking.findByPk(bookingId);
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

module.exports = {
  createPayment,
  refundPayment,
  getCustomerPayments,
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getPaymentsByBookingId
};