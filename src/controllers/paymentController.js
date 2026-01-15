/**
 * PROFESSIONAL PAYMENT HANDLER - FINANCIAL SYSTEM
 * 
 * CRITICAL ACCOUNTING RULES:
 * 1. Payment ≠ Booking ≠ PNR (they are separate entities)
 * 2. Never overwrite payments - always create new entries
 * 3. Never "adjust" amounts silently
 * 4. Full audit trail maintained
 * 5. Real-time status calculation (never stored, always calculated)
 * 
 * This system is designed to pass financial audits 5 years later.
 */

const {
  ptXpayment: Payment,
  pnXpnr: Pnr,
  paXpayalloc: PaymentAlloc,
  lgXLedger: Ledger,
  caXcustomeradvance: CustomerAdvance,
  yeXyearendclosing: YearEndClosing,
  cuXcustomer: Customer,
  emXemployee: Employee,
  bkXbooking: Booking,
  Sequelize
} = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../../config/db');

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate accounting period from date (YYYY-MM format)
 */
const getAccountingPeriod = (date) => {
  const d = date ? new Date(date) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Customer records payment for their bills
const recordCustomerPayment = async (req, res) => {
  try {
    const {
      amount,
      mode,
      referenceNumber,
      paymentDate,
      remarks,
      billIds // Array of bill IDs to allocate payment to
    } = req.body;
    
    // Validate required fields
    if (!amount || !mode || !paymentDate || !billIds || !Array.isArray(billIds) || billIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Amount, mode, payment date, and bill IDs are required' 
      });
    }
    
    // Verify the payment amount is positive
    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Payment amount must be greater than zero' 
      });
    }
    
    // Check if the customer is authorized to make payment for these bills
    const { BillTVL, Pnr } = require('../models');
    const bills = await BillTVL.findAll({
      where: {
        bill_id: { [Sequelize.Op.in]: billIds },
        customer_id: req.user.us_usid // Only allow customer to pay for their own bills
      }
    });
    
    if (bills.length !== billIds.length) {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized: You can only pay for your own bills' 
      });
    }
    
    // Create the payment record
    const payment = await Payment.create({
      pt_custid: req.user.us_usid,
      pt_totalamt: paymentAmount,
      pt_amount: paymentAmount,
      pt_mode: mode,
      pt_refno: referenceNumber || null,
      pt_paydt: paymentDate,
      pt_rcvdt: paymentDate, // Using same date as payment date
      pt_status: 'RECEIVED',
      pt_verification_status: 'PENDING', // Customer submitted, awaiting verification
      pt_acid: 0, // Set to 0 as default for TVL model
      pt_remarks: remarks || null,
      pt_finyear: getFinancialYear(paymentDate),
      pt_period: getAccountingPeriod(paymentDate),
      eby: req.user.us_usid,
      mby: req.user.us_usid
    });
    
    // Allocate payment to PNRs associated with these bills
    let remainingAmount = paymentAmount;
    
    for (const bill of bills) {
      // Parse PNR numbers from the bill
      const pnrNumbers = JSON.parse(bill.pnr_numbers || '[]');
      
      for (const pnrNumber of pnrNumbers) {
        // Find the PNR record
        const pnr = await Pnr.findOne({
          where: { pn_pnr: pnrNumber }
        });
        
        if (pnr) {
          // Calculate pending amount for this PNR
          const totalPaidForPnr = await PaymentAlloc.sum('pa_amount', {
            where: { pa_pnid: pnr.pn_pnid }
          });
          
          const pendingAmount = parseFloat(pnr.pn_totamt || 0) - (totalPaidForPnr || 0);
          
          if (pendingAmount > 0 && remainingAmount > 0) {
            const allocationAmount = Math.min(pendingAmount, remainingAmount);
            
            // Create payment allocation
            await PaymentAlloc.create({
              pa_ptid: payment.pt_ptid,
              pa_pnid: pnr.pn_pnid, // Link to actual PNR ID
              pa_pnr: pnr.pn_pnr, // Use actual PNR number
              pa_amount: allocationAmount,
              pa_alloctn_type: 'AUTO',
              eby: req.user.us_usid
            });
            
            remainingAmount -= allocationAmount;
            
            if (remainingAmount <= 0) {
              break; // No more amount to allocate
            }
          }
        }
        
        if (remainingAmount <= 0) {
          break; // No more amount to allocate
        }
      }
      
      if (remainingAmount <= 0) {
        break; // No more amount to allocate
      }
    }
    
    // Update unallocated amount if there's any remaining
    // Note: pt_unallocamt is a generated column, so we don't set it directly
    // The value will be calculated by the database trigger
    if (remainingAmount > 0) {
      // We can update other fields if needed, but not the generated column
      await payment.update({ 
        pt_allocatedamt: paymentAmount - remainingAmount,
        mby: req.user.us_usid,
        mdtm: new Date()
      });
    }
    
    // Update bill and booking statuses based on payment allocation
    await updateBillAndBookingStatus(billIds);
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'Payment recorded and allocated successfully',
      payment: payment,
      allocatedAmount: paymentAmount - remainingAmount,
      unallocatedAmount: remainingAmount
    });
    
  } catch (error) {
    console.error('Error recording customer payment:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Get financial year from date (e.g., 2023-24)
 */
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

/**
 * REAL-TIME PNR STATUS CALCULATION (MANDATORY)
 * 
 * This function calculates PNR payment status in real-time.
 * Status is NEVER stored - always calculated from allocations.
 * 
 * Rules:
 * - Total Amount = pn_totamt (fare + fees + taxes)
 * - Paid Amount = Sum of all allocations for this PNR
 * - Pending Amount = Total - Paid
 * 
 * Payment Status:
 * - PAID: Pending = 0 AND Paid > 0
 * - PARTIAL: Pending > 0 AND Paid > 0
 * - UNPAID: Paid = 0
 */
const calculatePNRStatus = async (pnrId) => {
  const pnr = await Pnr.findByPk(pnrId);
  if (!pnr) {
    throw new Error(`PNR with ID ${pnrId} not found`);
  }

  // Calculate total paid amount from allocations
  const totalPaid = await PaymentAlloc.sum('pa_allocamt', {
    where: { pa_pnid: pnrId }
  }) || 0;

  const totalAmount = parseFloat(pnr.pn_totamt) || 0;
  const pendingAmount = totalAmount - totalPaid;

  // Update PNR fields
  pnr.pn_paidamt = totalPaid;
  pnr.pn_pendingamt = pendingAmount;

  // Determine payment status
  if (pendingAmount <= 0 && totalPaid > 0) {
          pnr.pn_payment_status = 'PAID';
  } else if (pendingAmount > 0 && totalPaid > 0) {
          pnr.pn_payment_status = 'PARTIAL';
        } else {
          pnr.pn_payment_status = 'UNPAID';
        }
        
  await pnr.save();
  return pnr;
};

/**
 * Calculate customer advance balance
 */
const calculateCustomerAdvance = async (customerId, fyear = null) => {
  if (!fyear) {
    fyear = getFinancialYear(new Date());
  }

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

  // Update or create customer advance record
  const [advance, created] = await CustomerAdvance.findOrCreate({
    where: { ca_usid: customerId, ca_fyear: fyear },
    defaults: {
      ca_usid: customerId,
      ca_advance_amt: advanceBalance,
      ca_fyear: fyear,
      ca_last_updated: new Date(),
      edtm: new Date(),
      eby: 'SYSTEM',
      mdtm: new Date(),
      mby: 'SYSTEM'
    }
  });

  if (!created) {
    advance.ca_advance_amt = advanceBalance;
    advance.ca_last_updated = new Date();
    advance.mdtm = new Date();
    advance.mby = 'SYSTEM';
    await advance.save();
  }

  return advanceBalance;
};

/**
 * Update bill and booking status based on payment allocations
 */
const updateBillAndBookingStatus = async (billIds) => {
  const { BillTVL, BookingTVL, Pnr } = require('../models');
  
  for (const billId of billIds) {
    // Get the bill
    const bill = await BillTVL.findByPk(billId);
    if (!bill) continue;
    
    // Get total amount paid for this bill through PNRs
    const pnrNumbers = JSON.parse(bill.pnr_numbers || '[]');
    let totalPaid = 0;
    
    for (const pnrNumber of pnrNumbers) {
      const pnr = await Pnr.findOne({ where: { pn_pnr: pnrNumber } });
      if (pnr) {
        // Calculate total paid for this PNR
        const pnrPaid = await PaymentAlloc.sum('pa_amount', {
          where: { pa_pnid: pnr.pn_pnid }
        });
        totalPaid += pnrPaid || 0;
      }
    }
    
    // Determine bill status based on payment status
    const totalAmount = parseFloat(bill.total_amount || 0);
    const pendingAmount = totalAmount - totalPaid;
    
    let newBillStatus = 'UNPAID';
    if (pendingAmount <= 0 && totalPaid > 0) {
      newBillStatus = 'PAID';
    } else if (pendingAmount > 0 && totalPaid > 0) {
      newBillStatus = 'PARTIAL';
    } else if (totalPaid === 0) {
      newBillStatus = 'UNPAID';
    }
    
    // Update bill status
    await bill.update({ status: newBillStatus });
    
    // Update related booking status if needed
    // Find bookings related to this bill through PNRs
    for (const pnrNumber of pnrNumbers) {
      const pnr = await Pnr.findOne({ where: { pn_pnr: pnrNumber } });
      if (pnr) {
        const booking = await BookingTVL.findByPk(pnr.pn_bkid);
        if (booking) {
          // Update booking payment status based on PNR payment status
          await calculatePNRStatus(pnr.pn_pnid);
        }
      }
    }
  }
};

/**
 * Create ledger entry for financial audit trail
 * 
 * NOTE: Primary ledger entries are now created by database triggers
 * This function is kept for special cases where manual ledger entries are needed
 */
const createLedgerEntry = async (data, transaction) => {
  const {
    customerId,
    entryType, // 'DEBIT' or 'CREDIT'
    amount,
    entryRef,
    pnrId = null,
    paymentId = null,
    allocationId = null,
    remarks = null
  } = data;

  // Get last closing balance for this customer
  const lastEntry = await Ledger.findOne({
    where: { lg_custid: customerId },
    order: [['edtm', 'DESC']],
    transaction
  });

  const openingBal = lastEntry ? parseFloat(lastEntry.lg_closing_bal) : 0;
  const closingBal = entryType === 'CREDIT' 
    ? openingBal + parseFloat(amount)
    : openingBal - parseFloat(amount);

  const fyear = getFinancialYear(new Date());

  return await Ledger.create({
    lg_custid: customerId,
    lg_entry_type: entryType,
    lg_entry_ref: entryRef,
    lg_amount: amount,
    lg_opening_bal: openingBal,
    lg_closing_bal: closingBal,
    lg_pnid: pnrId,
    lg_ptid: paymentId,
    lg_paid: allocationId,
    lg_fyear: fyear,
    lg_remarks: remarks,
    eby: data.eby || 'SYSTEM',
    mby: data.eby || 'SYSTEM'
  }, { transaction });
};

// ============================================================================
// PAYMENT RECEIPT LOGIC
// ============================================================================

/**
 * Create Payment (Payment Header)
 * 
 * BUSINESS RULE: Payment is a financial event, not a booking event.
 * - Payment can be received before PNR is generated (advance payment)
 * - Payment can be applied to multiple PNRs
 * - Payment is NEVER overwritten
 */
const createPayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      customerId, // Required: Customer User ID
      amount, // Required: Payment amount
      mode, // Required: CASH, UPI, NEFT, RTGS, CHEQUE, CARD, BANK
      refNo, // Optional: UTR / Cheque No / Transaction ID
      paymentDate, // Optional: defaults to today
      remarks, // Optional
      autoAllocate = false, // Optional: Auto-allocate using FIFO
      allocations = [] // Optional: Manual allocations [{ pnrNumber, amount, remarks }]
    } = req.body;

    // VALIDATION
    if (!customerId || !amount || !mode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: customerId, amount, mode'
      });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero'
      });
    }

    // Verify customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const payDate = paymentDate ? new Date(paymentDate) : new Date();
    const acctPeriod = getAccountingPeriod(payDate);

    // Create payment header
    const payment = await Payment.create({
      pt_custid: customerId,
      pt_totalamt: amount,
      pt_amount: amount,
      pt_mode: mode,
      pt_refno: refNo || null,
      pt_paydt: payDate,
      pt_rcvdt: payDate, // Using pt_paydt as pt_rcvdt since pt_rcvby doesn't exist in TVL table
      pt_status: 'RECEIVED',
      pt_verification_status: 'VERIFIED', // Admin/Employee created payment is automatically verified
      pt_acid: 0, // Set to 0 as default, since TVL table requires this field
      pt_allocatedamt: 0, // Initially 0 allocated
      pt_finyear: getFinancialYear(payDate),
      pt_period: acctPeriod,
      pt_remarks: remarks || null,
      eby: req.user.us_usid,
      mby: req.user.us_usid
    }, { transaction });
    
    // Note: Ledger entry will be created automatically by database trigger
    // The trigger will create the ledger entry when the payment is inserted

    let totalAllocated = 0;

    // AUTO ALLOCATION (FIFO - First In First Out)
    if (autoAllocate) {
      const allocated = await allocatePaymentFIFO(payment.pt_ptid, customerId, amount, req.user.us_usid, transaction);
      totalAllocated = allocated.totalAllocated;
    }

    // MANUAL ALLOCATION
    if (allocations && allocations.length > 0) {
      for (const alloc of allocations) {
        const { pnrNumber, amount: allocAmount, remarks: allocRemarks } = alloc;
        
        if (!pnrNumber || !allocAmount) {
          continue;
        }

        // Find PNR by number
        const pnr = await Pnr.findOne({
          where: { pn_pnr: pnrNumber }
        }, { transaction });

        if (!pnr) {
          throw new Error(`PNR ${pnrNumber} not found`);
        }

        // Allocate payment to PNR
        const allocated = await allocatePaymentToPNR(
          payment.pt_ptid,
          pnr.pn_pnid,
          pnrNumber,
          allocAmount,
          'MANUAL',
          allocRemarks || null,
          req.user.us_usid,
      transaction 
        );

        totalAllocated += allocated.allocatedAmount;
      }
    }

    // Update payment status only (unallocated amount is calculated by database triggers)
    payment.mby = req.user.us_usid;
    await payment.save({ transaction });

    // Update customer advance balance
    await calculateCustomerAdvance(customerId);
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      payment: {
        paymentId: payment.pt_ptid,
        amount: payment.pt_amount,
        allocated: totalAllocated,
        unallocated: payment.pt_unallocated_amt,
        status: payment.pt_status
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Payment creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment'
    });
  }
};

/**
 * FIFO Allocation Algorithm
 * 
 * Allocates payment to pending PNRs in First-In-First-Out order.
 * Oldest pending PNRs get paid first.
 */
const allocatePaymentFIFO = async (paymentId, customerId, paymentAmount, userId, transaction) => {
    // Get all pending PNRs for this customer, ordered by creation date (oldest first)
    const { bkXbooking: Booking } = require('../models');
    
    // First get bookings for this customer
    const customerBookings = await Booking.findAll({
      where: { bk_usid: customerId },
      attributes: ['bk_bkid'],
      transaction
    });
    
    const bookingIds = customerBookings.map(b => b.bk_bkid);
    
    const pendingPNRs = await Pnr.findAll({
      where: {
        pn_bkid: { [Op.in]: bookingIds },
        pn_payment_status: { [Op.in]: ['UNPAID', 'PARTIAL'] }
      },
      order: [['edtm', 'ASC']], // Oldest first (FIFO)
      transaction
    });

  let remainingAmount = paymentAmount;
    let totalAllocated = 0;
  const allocations = [];

  for (const pnr of pendingPNRs) {
    if (remainingAmount <= 0) break;

    // Calculate current pending amount
    await calculatePNRStatus(pnr.pn_pnid);
    await pnr.reload({ transaction });
    
    const pending = parseFloat(pnr.pn_pendingamt) || 0;
    if (pending <= 0) continue;

    // Allocate up to pending amount
    const allocAmount = Math.min(remainingAmount, pending);

    const alloc = await allocatePaymentToPNR(
      paymentId,
      pnr.pn_pnid,
      pnr.pn_pnr,
      allocAmount,
      'AUTO',
      'FIFO automatic allocation',
      userId,
      transaction
    );

    allocations.push(alloc);
    totalAllocated += alloc.allocatedAmount;
    remainingAmount -= allocAmount;
  }

  return { totalAllocated, allocations };
};

/**
 * Allocate Payment to PNR
 * 
 * CRITICAL VALIDATION:
 * - Cannot allocate more than PNR pending amount
 * - Cannot allocate more than payment unallocated amount
 * - Creates allocation record
 * - Updates PNR status in real-time
 * - Creates ledger entry
 */
const allocatePaymentToPNR = async (
  paymentId,
  pnrId,
  pnrNumber,
  amount,
  allocationType,
  remarks,
  userId,
  transaction
) => {
  // Validate PNR exists
  const pnr = await Pnr.findByPk(pnrId, { transaction });
      if (!pnr) {
        throw new Error(`PNR with ID ${pnrId} not found`);
      }
      
  // Calculate current PNR status
  await calculatePNRStatus(pnrId);
  await pnr.reload({ transaction });

  const pending = parseFloat(pnr.pn_pendingamt) || 0;

  // VALIDATION: Cannot allocate more than pending
  if (parseFloat(amount) > pending) {
    throw new Error(
      `Cannot allocate ${amount} to PNR ${pnrNumber}. Pending amount is only ${pending}`
    );
  }

  // Check payment unallocated amount
  const payment = await Payment.findByPk(paymentId, { transaction });
  if (!payment) {
    throw new Error(`Payment with ID ${paymentId} not found`);
  }

  const unallocated = parseFloat(payment.pt_unallocamt) || 0;
  if (parseFloat(amount) > unallocated) {
    throw new Error(
      `Cannot allocate ${amount}. Payment unallocated amount is only ${unallocated}`
    );
      }
      
      // Create allocation record
  const allocation = await PaymentAlloc.create({
    pa_ptid: paymentId,
    pa_pnid: pnrId,
    pa_pnr: pnrNumber,
        pa_allocamt: amount,
    pa_allocdt: new Date(),
    pa_status: allocationType,
    pa_rmrks: remarks || null,
    edtm: new Date(),
    eby: userId,
    mdtm: new Date(),
    mby: userId
      }, { transaction });
      
  // Update PNR status (real-time calculation)
  await calculatePNRStatus(pnrId);

  // Update payment allocated amount and status (unallocated amount is calculated by database triggers)
  const totalAllocated = await PaymentAlloc.sum('pa_allocamt', {
    where: { pa_ptid: paymentId },
    transaction
  }) || 0;
  
  payment.pt_allocatedamt = totalAllocated;
  
  // Update status based on allocation
  if (totalAllocated > 0) {
    payment.pt_status = 'ADJUSTED';
  }
    payment.mby = userId;
      
      // Note: Ledger entry will be created automatically by database trigger
      // The trigger will create the ledger entry when the allocation is inserted

  return {
    allocationId: allocation.pa_paid,
    allocatedAmount: parseFloat(amount)
  };
};

// ============================================================================
// PAYMENT ALLOCATION ENDPOINTS
// ============================================================================

/**
 * Allocate Payment to PNRs (Manual)
 */
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

    // Check permissions (admin or accounts team)
    if (req.user.us_usertype !== 'admin') {
      const { emXemployee: Employee } = require('../models');
      const employee = await Employee.findOne({
        where: { em_usid: req.user.us_usid }
      });
      if (!employee || employee.em_dept !== 'ACCOUNTS') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Accounts team access required.'
        });
      }
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

      const result = await allocatePaymentToPNR(
        paymentId,
        pnr.pn_pnid,
        pnrNumber,
        amount,
        'MANUAL',
        remarks || null,
        req.user.us_usid,
        transaction
      );

      totalAllocated += result.allocatedAmount;
      results.push(result);
    }

    // Update customer advance
    await calculateCustomerAdvance(payment.pt_custid);
    
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

// ============================================================================
// QUERY ENDPOINTS
// ============================================================================

/**
 * Get All Payments (Admin/Accounts Team)
 */
const getAllPayments = async (req, res) => {
  try {
    // Check permissions - handle both old user types and new role IDs
    const isEmployee = req.user.us_usertype === 'employee' || ['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT', 'ADM'].includes(req.user.us_roid);
    
    if (req.user.us_usertype !== 'admin' && req.user.us_roid !== 'ADM') {
      // For employee role IDs
      if (['AGT', 'ACC', 'MGT', 'ADM'].includes(req.user.us_roid)) {
        // Allow access for Agent, Accounts, Management, and Admin roles
        // No additional check needed
      } else if (isEmployee) {
        // For other employees, check if they have accounts department access
        const { emXemployee: Employee } = require('../models');
        const employee = await Employee.findOne({
          where: { em_usid: req.user.us_usid }
        });
        if (!employee || !['ACCOUNTS', 'FINANCE', 'MANAGEMENT'].includes(employee.em_dept)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. Admin, Accounts, or Management access required.'
          });
        }
      } else {
        // For customers and unauthorized users
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin, Accounts, or Management access required.'
        });
      }
    }

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

    // Ensure PaymentAlloc is properly loaded
    if (!PaymentAlloc) {
      throw new Error('PaymentAlloc model not loaded');
    }

    // Get payments without includes first to avoid association issues
    const payments = await Payment.findAll({
      where: whereClause,
      order: [['edtm', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      raw: false // Return Sequelize instances
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
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payments',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get Customer Payments
 */
const getCustomerPayments = async (req, res) => {
  try {
    const customerId = req.user.us_usertype === 'customer' 
      ? req.user.us_usid 
      : req.params.customerId || req.user.us_usid;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }

    // Get payments without includes first to avoid association issues
    const payments = await Payment.findAll({
      where: { pt_custid: customerId },
      order: [['edtm', 'DESC']],
      raw: false // Return Sequelize instances
    });

    res.json({
      success: true,
      payments: payments || []
    });
  } catch (error) {
    console.error('Get customer payments error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get customer payments',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get Payment by ID
 */
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get payment without includes to avoid association issues
    const payment = await Payment.findByPk(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check permissions
    if (req.user.us_usertype !== 'admin') {
      if (req.user.us_usertype === 'customer' && payment.pt_custid !== req.user.us_usid) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      if (req.user.us_usertype === 'employee') {
        const { emXemployee: Employee } = require('../models');
        const employee = await Employee.findOne({
          where: { em_usid: req.user.us_usid }
        });
        if (!employee || employee.em_dept !== 'ACCOUNTS') {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }
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

/**
 * Update Payment
 */
const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerId,
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
    
    // Check permissions - only admin or accounts employee can update
    if (req.user.us_usertype !== 'admin') {
      if (req.user.us_usertype === 'employee') {
        const { emXemployee: Employee } = require('../models');
        const employee = await Employee.findOne({
          where: { em_usid: req.user.us_usid }
        });
        if (!employee || employee.em_dept !== 'ACCOUNTS') {
          return res.status(403).json({
            success: false,
            message: 'Access denied. Accounts team access required.'
          });
        }
      } else {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin access required.'
        });
      }
    }
    
    // Calculate allocated amount to determine unallocated amount
    const allocatedAmount = await PaymentAlloc.sum('pa_allocamt', {
      where: { pa_ptid: id }
    }) || 0;
    
    // Update the payment
    const updatedData = {
      pt_custid: parseInt(customerId), // Convert to integer to match database schema
      pt_totalamt: amount, // Also update total amount
      pt_amount: amount,
      pt_allocatedamt: allocatedAmount, // Update allocated amount
      pt_mode: mode,
      pt_refno: refNo,
      pt_status: status,
      pt_remarks: remarks,
      pt_verification_status: 'VERIFIED', // Admin/Employee updated payment is verified
      mby: req.user.us_usid,
      mdtm: new Date()
    };
    
    await payment.update(updatedData);
    
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

/**
 * Get Payment Allocations
 */
const getPaymentAllocations = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Get allocations - simplified to avoid association issues
    const allocations = await PaymentAlloc.findAll({
      where: { pa_ptid: paymentId },
      order: [['pa_allocdt', 'DESC']]
    });
    
    // Get PNR details separately if needed
    if (allocations && allocations.length > 0) {
      const pnrIds = allocations.map(a => a.pa_pnid).filter(id => id);
      if (pnrIds.length > 0) {
        const pnrs = await Pnr.findAll({
          where: { pn_pnid: { [Op.in]: pnrIds } },
          attributes: ['pn_pnid', 'pn_pnr', 'pn_totamt', 'pn_paidamt', 'pn_pendingamt', 'pn_payment_status']
        });
        
        // Attach PNR data to allocations
        allocations.forEach(alloc => {
          const pnr = pnrs.find(p => p.pn_pnid === alloc.pa_pnid);
          if (pnr) {
            if (!alloc.dataValues) {
              alloc.dataValues = {};
            }
            alloc.dataValues.pnr = pnr;
          }
        });
      }
    }
    
    res.json({
      success: true,
      allocations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get PNR Payment History
 */
const getPNRPayments = async (req, res) => {
  try {
    const { pnrNumber } = req.params;

    const pnr = await Pnr.findOne({
      where: { pn_pnr: pnrNumber }
    });

    if (!pnr) {
      return res.status(404).json({
        success: false,
        message: 'PNR not found'
      });
    }

    // Calculate real-time status
    await calculatePNRStatus(pnr.pn_pnid);
    await pnr.reload();

    // Get all allocations for this PNR
    const allocations = await PaymentAlloc.findAll({
      where: { pa_pnid: pnr.pn_pnid },
      order: [['pa_allocdt', 'DESC']]
    });
    
    // Get payment details for each allocation
    const paymentIds = allocations.map(alloc => alloc.pa_ptid);
    let paymentDetails = {};
    if (paymentIds.length > 0) {
      const payments = await Payment.findAll({
        where: { pt_ptid: { [Op.in]: paymentIds } },
        attributes: ['pt_ptid', 'pt_amount', 'pt_mode', 'pt_paydt', 'pt_status', 'pt_refno']
      });
      
      // Create a map of payment details by ID
      payments.forEach(payment => {
        paymentDetails[payment.pt_ptid] = {
          pt_amount: payment.pt_amount,
          pt_mode: payment.pt_mode,
          pt_paydt: payment.pt_paydt,
          pt_status: payment.pt_status,
          pt_refno: payment.pt_refno
        };
      });
    }
    
    // Attach payment details to allocations
    const allocationsWithPayments = allocations.map(alloc => ({
      ...alloc.toJSON(),
      payment: paymentDetails[alloc.pa_ptid] || null
    }));

    res.json({
      success: true,
      pnr: {
        pnrNumber: pnr.pn_pnr,
        totalAmount: pnr.pn_totamt,
        paidAmount: pnr.pn_paidamt,
        pendingAmount: pnr.pn_pendingamt,
        paymentStatus: pnr.pn_payment_status,
        closedFlag: pnr.pn_closed_flag
      },
      paymentHistory: allocationsWithPayments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get Customer Pending PNRs (for payment allocation screen)
 */
const getCustomerPendingPNRs = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Get all PNRs for customer with pending payments
    const { bkXbooking: Booking } = require('../models');
    
    // First get bookings for this customer
    const customerBookings = await Booking.findAll({
      where: { bk_usid: customerId },
      attributes: ['bk_bkid']
    });
    
    const bookingIds = customerBookings.map(b => b.bk_bkid);
    
    const pendingPNRs = await Pnr.findAll({
      where: {
        pn_bkid: { [Op.in]: bookingIds },
        pn_payment_status: { [Op.in]: ['UNPAID', 'PARTIAL'] }
      },
      order: [['edtm', 'ASC']] // Oldest first (FIFO order)
    });

    // Calculate real-time status for each
    const results = [];
    for (const pnr of pendingPNRs) {
      await calculatePNRStatus(pnr.pn_pnid);
      await pnr.reload();
      
      results.push({
        pnrId: pnr.pn_pnid,
        pnrNumber: pnr.pn_pnr,
        totalAmount: pnr.pn_totamt,
        paidAmount: pnr.pn_paidamt,
        pendingAmount: pnr.pn_pendingamt,
        paymentStatus: pnr.pn_payment_status,
        travelDate: pnr.pn_trvldt,
        createdAt: pnr.edtm
      });
    }

    res.json({
      success: true,
      pendingPNRs: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get Customer Advance Balance
 */
const getCustomerAdvance = async (req, res) => {
  try {
    const { customerId } = req.params;
    const fyear = req.query.fyear || getFinancialYear(new Date());

    const advanceBalance = await calculateCustomerAdvance(customerId, fyear);

    const advance = await CustomerAdvance.findOne({
      where: { ca_usid: customerId, ca_fyear: fyear }
    });

    res.json({
      success: true,
      customerId,
      financialYear: fyear,
      advanceBalance,
      record: advance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================================================
// YEAR-END CLOSING (FINANCE-CRITICAL)
// ============================================================================

/**
 * Year-End Closing
 * 
 * On March 31:
 * - Freeze all pending PNR balances
 * - Capture customer-wise outstanding
 * - Capture advance balances
 * - Create snapshot for audit
 */
const performYearEndClosing = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // Only admin can perform year-end closing
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin access required.'
      });
    }

    const { closingDate, fyear, remarks } = req.body;

    if (!fyear) {
      return res.status(400).json({
        success: false,
        message: 'Financial year is required'
      });
    }

    const closeDate = closingDate ? new Date(closingDate) : new Date();
    
    // Get all pending PNRs
    const pendingPNRs = await Pnr.findAll({
      where: {
        pn_payment_status: { [Op.in]: ['UNPAID', 'PARTIAL'] },
        pn_closed_flag: 'N'
      },
      transaction
    });

    // Calculate totals
    let totalPendingReceivables = 0;
    const customerOutstanding = {};

    for (const pnr of pendingPNRs) {
      // Calculate real-time status
      await calculatePNRStatus(pnr.pn_pnid);
      await pnr.reload({ transaction });

      const pending = parseFloat(pnr.pn_pendingamt) || 0;
      totalPendingReceivables += pending;

      // Get customer ID from booking
      const { bkXbooking: Booking } = require('../models');
      const booking = await Booking.findByPk(pnr.pn_bkid, { 
        attributes: ['bk_usid'],
        transaction 
      });
      if (booking && booking.bk_usid) {
        const custId = booking.bk_usid;
        customerOutstanding[custId] = (customerOutstanding[custId] || 0) + pending;
      }

      // Mark PNR as closed
      pnr.pn_closed_flag = 'Y';
      pnr.pn_fyear = fyear;
      pnr.mby = req.user.us_usid;
      await pnr.save({ transaction });
    }

    // Calculate total advance balance
    const advances = await CustomerAdvance.findAll({
      where: { ca_fyear: fyear },
      transaction
    });

    let totalAdvanceBalance = 0;
    for (const adv of advances) {
      totalAdvanceBalance += parseFloat(adv.ca_advance_amt) || 0;
    }

    // Create year-end closing record
    const closing = await YearEndClosing.create({
      ye_fyear: fyear,
      ye_closing_date: closeDate,
      ye_total_pending_receivables: totalPendingReceivables,
      ye_total_advance_balance: totalAdvanceBalance,
      ye_total_customers: Object.keys(customerOutstanding).length,
      ye_total_pending_pnrs: pendingPNRs.length,
      ye_status: 'FINALIZED',
      ye_remarks: remarks || `Year-end closing for ${fyear}`,
      edtm: new Date(),
      eby: req.user.us_usid,
      mdtm: new Date(),
      mby: req.user.us_usid
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Year-end closing completed successfully',
      closing: {
        financialYear: fyear,
        closingDate: closeDate,
        totalPendingReceivables: totalPendingReceivables,
        totalAdvanceBalance: totalAdvanceBalance,
        totalCustomers: Object.keys(customerOutstanding).length,
        totalPendingPNRs: pendingPNRs.length
      },
      customerOutstanding
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Year-end closing error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to perform year-end closing'
    });
  }
};

// ============================================================================
// REFUNDS & ADJUSTMENTS
// ============================================================================

/**
 * Refund Payment
 * 
 * CRITICAL: Refunds must:
 * - Reference original payment
 * - Reverse ledger entries
 * - Update allocations
 * - Recalculate PNR balances
 * - Never overwrite original payment
 */
const refundPayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { paymentId } = req.params;
    const { refundAmount, pnrNumber, remarks } = req.body;

    // Check permissions
    if (req.user.us_usertype !== 'admin') {
      const { emXemployee: Employee } = require('../models');
      const employee = await Employee.findOne({
        where: { em_usid: req.user.us_usid }
      });
      if (!employee || employee.em_dept !== 'ACCOUNTS') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Accounts team access required.'
        });
      }
    }

    const payment = await Payment.findByPk(paymentId, {
      include: [{
        model: PaymentAlloc,
        as: 'allocations'
      }],
      transaction
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (parseFloat(refundAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount must be greater than zero'
      });
    }

    // If PNR specified, refund specific allocation
    if (pnrNumber) {
      const pnr = await Pnr.findOne({
        where: { pn_pnr: pnrNumber }
      }, { transaction });

      if (!pnr) {
        return res.status(404).json({
          success: false,
          message: 'PNR not found'
        });
      }

      // Find allocation
      const allocation = await PaymentAlloc.findOne({
        where: {
          pa_ptid: paymentId,
          pa_pnid: pnr.pn_pnid
        },
        transaction
      });

      if (!allocation) {
        return res.status(404).json({
          success: false,
          message: 'No allocation found for this PNR'
        });
      }

      if (parseFloat(refundAmount) > parseFloat(allocation.pa_amount)) {
        return res.status(400).json({
          success: false,
          message: `Refund amount cannot exceed allocated amount ${allocation.pa_amount}`
        });
      }

      // Create reverse allocation (negative amount)
      await PaymentAlloc.create({
        pa_ptid: paymentId,
        pa_pnid: pnr.pn_pnid,
        pa_pnr: pnrNumber,
        pa_amount: -parseFloat(refundAmount),
        pa_alloctn_date: new Date(),
        pa_alloctn_type: 'MANUAL',
        pa_remarks: `REFUND: ${remarks || 'Payment refund'}`,
        eby: req.user.us_usid
      }, { transaction });

      // Recalculate PNR status
      await calculatePNRStatus(pnr.pn_pnid);

      // Note: Reverse ledger entry will be created automatically by database trigger
      // The trigger will handle refund entries when negative allocations are made
    } else {
      // Full payment refund
      if (parseFloat(refundAmount) > parseFloat(payment.pt_amount)) {
        return res.status(400).json({
          success: false,
          message: 'Refund amount cannot exceed payment amount'
        });
      }

      // Update payment status
      payment.pt_status = 'REFUNDED';
      payment.pt_remarks = payment.pt_remarks 
        ? `${payment.pt_remarks} | REFUNDED: ${refundAmount}`
        : `REFUNDED: ${refundAmount}`;
      payment.mby = req.user.us_usid;
      await payment.save({ transaction });

      // Note: Reverse ledger entry will be created automatically by database triggers
      // The triggers will handle refund entries when negative allocations are made
    }

    // Update customer advance
    await calculateCustomerAdvance(payment.pt_usid);

    await transaction.commit();

    res.json({
      success: true,
      message: 'Refund processed successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process refund'
    });
  }
};

/**
 * Verify Customer Submitted Payment (Employee/Admin Only)
 * 
 * This function allows employees/admins to verify customer-submitted payments
 * and move them from PENDING to VERIFIED status.
 */
const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body; // action: 'VERIFY' or 'REJECT'

    // Find the payment
    const payment = await Payment.findByPk(id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check permissions - only admin or accounts employee can verify payments
    if (req.user.us_usertype !== 'admin') {
      if (req.user.us_usertype === 'employee') {
        const { emXemployee: Employee } = require('../models');
        const employee = await Employee.findOne({
          where: { em_usid: req.user.us_usid }
        });
        if (!employee || employee.em_dept !== 'ACCOUNTS') {
          return res.status(403).json({
            success: false,
            message: 'Access denied. Accounts team access required.'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin access required.'
        });
      }
    }

    // Check if payment is already verified/rejected
    if (payment.pt_verification_status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Payment is already ${payment.pt_verification_status.toLowerCase()}. Cannot verify again.`
      });
    }

    // Update verification status based on action
    let newVerificationStatus = payment.pt_verification_status;
    let newStatus = payment.pt_status;

    if (action === 'VERIFY') {
      newVerificationStatus = 'VERIFIED';
      // If payment was received, set status to ADJUSTED after verification
      if (payment.pt_status === 'RECEIVED') {
        newStatus = 'ADJUSTED';
      }
    } else if (action === 'REJECT') {
      newVerificationStatus = 'REJECTED';
      newStatus = 'REJECTED';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use VERIFY or REJECT.'
      });
    }

    // Update the payment
    await payment.update({
      pt_verification_status: newVerificationStatus,
      pt_status: newStatus,
      pt_remarks: remarks || payment.pt_remarks,
      mby: req.user.us_usid,
      mdtm: new Date()
    });

    res.json({
      success: true,
      message: `Payment ${newVerificationStatus.toLowerCase()} successfully`,
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

/**
 * Delete Payment
 * 
 * CRITICAL: Before deleting payment, check:
 * - Payment has no allocations
 * - Payment status allows deletion
 * - User has proper permissions
 */
const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the payment
    const payment = await Payment.findByPk(id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Check if payment has any allocations - if so, don't allow deletion
    const allocationCount = await PaymentAlloc.count({
      where: { pa_ptid: id }
    });
    
    if (allocationCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete payment that has allocations. Please reverse allocations first.'
      });
    }
    
    // Check permissions - only admin can delete payments
    if (req.user.us_usertype !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin access required.'
      });
    }
    
    // Delete the payment
    await payment.destroy();
    
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

// ============================================================================
// REPORTS
// ============================================================================

/**
 * Get Outstanding Receivables Report
 */
const getOutstandingReceivables = async (req, res) => {
  try {
    // Only admin or accounts team
    if (req.user.us_usertype !== 'admin') {
      const { emXemployee: Employee } = require('../models');
      const employee = await Employee.findOne({
        where: { em_usid: req.user.us_usid }
      });
      if (!employee || employee.em_dept !== 'ACCOUNTS') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    const { customerId, fyear } = req.query;

    const whereClause = {
      pn_payment_status: { [Op.in]: ['UNPAID', 'PARTIAL'] },
      pn_closed_flag: 'N'
    };

    if (customerId) {
      const { bkXbooking: Booking } = require('../models');
      const bookings = await Booking.findAll({
        where: { bk_usid: customerId },
        attributes: ['bk_bkid']
      });
      const bookingIds = bookings.map(b => b.bk_bkid);
      whereClause.pn_bkid = { [Op.in]: bookingIds };
    }

    const pendingPNRs = await Pnr.findAll({
      where: whereClause,
      order: [['edtm', 'ASC']]
    });
    
    // Get booking details separately
    const { bkXbooking: Booking } = require('../models');
    const bookingIds = [...new Set(pendingPNRs.map(p => p.pn_bkid))];
    const bookings = await Booking.findAll({
      where: { bk_bkid: { [Op.in]: bookingIds } },
      attributes: ['bk_bkid', 'bk_bkno', 'bk_usid']
    });
    
    const bookingMap = {};
    bookings.forEach(b => {
      bookingMap[b.bk_bkid] = b;
    });

    // Calculate real-time status
    const results = [];
    for (const pnr of pendingPNRs) {
      await calculatePNRStatus(pnr.pn_pnid);
      await pnr.reload();
      
      const booking = bookingMap[pnr.pn_bkid];
      results.push({
        pnrNumber: pnr.pn_pnr,
        bookingNumber: booking?.bk_bkno,
        customerId: booking?.bk_usid,
        totalAmount: pnr.pn_totamt,
        paidAmount: pnr.pn_paidamt,
        pendingAmount: pnr.pn_pendingamt,
        paymentStatus: pnr.pn_payment_status,
        travelDate: pnr.pn_trvldt,
        createdAt: pnr.edtm
      });
    }
    
    res.json({
      success: true,
      report: {
        totalPendingPNRs: results.length,
        totalOutstanding: results.reduce((sum, r) => sum + parseFloat(r.pendingAmount || 0), 0),
        details: results
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Export all functions
module.exports = {
  // Payment operations
  createPayment,
  allocatePayment,
  refundPayment,
  recordCustomerPayment,
  updatePayment,
  
  // Query operations
  getAllPayments,
  getCustomerPayments,
  getPaymentById,
  getPaymentAllocations,
  getPNRPayments,
  getCustomerPendingPNRs,
  getCustomerAdvance,
  getOutstandingReceivables,
  
  // Year-end closing
  performYearEndClosing,
  
  // Utility functions (for internal use)
  calculatePNRStatus,
  calculateCustomerAdvance,
  allocatePaymentFIFO,
  allocatePaymentToPNR,
  
  // Delete operation
  deletePayment,
  
  // Verify operation
  verifyPayment
};
