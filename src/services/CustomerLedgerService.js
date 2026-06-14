const { CustomerLedger, PaymentAllocation, ptXpayment: PaymentTVL, billXbill: BillTVL, BookingTVL } = require('../models');
const { sequelizeTVL } = require('../../config/db');
const { QueryTypes, Op } = require('sequelize');
const Audit = require('./forensicAuditService');

class CustomerLedgerService {
  /**
   * Write an entry to the customer ledger (immutable audit trail)
   */
  async writeLedgerEntry({
    customerId,
    entryType,
    referenceType,
    referenceId,
    debitAmount = 0.00,
    creditAmount = 0.00,
    remarks = null,
    createdBy = 'SYSTEM',
    entryDate = new Date()
  }, transaction) {
    return CustomerLedger.create({
      customer_id: customerId,
      entry_type: entryType,
      reference_type: referenceType,
      reference_id: referenceId,
      debit_amount: parseFloat(debitAmount) || 0,
      credit_amount: parseFloat(creditAmount) || 0,
      entry_date: entryDate,
      remarks,
      created_by: createdBy,
      created_at: new Date()
    }, { transaction });
  }

  /**
   * Get the customer financial summary on-the-fly
   */
  async getCustomerFinancialSummary(customerId) {
    // 1. Calculate total billed (excluding cancelled bills)
    const [billedResult] = await sequelizeTVL.query(`
      SELECT 
        COALESCE(SUM(b.bl_total_amount), 0) AS totalBilled,
        MAX(b.bl_billing_date) AS lastBillDate
      FROM blXbilling b
      JOIN bkXbooking bk ON b.bl_booking_id = bk.bk_bkid
      WHERE bk.bk_usid = :customerId
        AND b.bl_status NOT IN ('CANCELLED', 'CAN')
    `, {
      replacements: { customerId },
      type: QueryTypes.SELECT
    });

    // 2. Calculate total received (excluding reversed payments)
    const [receivedResult] = await sequelizeTVL.query(`
      SELECT 
        COALESCE(SUM(pt_amount), 0) AS totalReceived,
        MAX(pt_paydt) AS lastPaymentDate
      FROM ptXpayment
      WHERE pt_custid = :customerId
        AND pt_status != 'REVERSED'
    `, {
      replacements: { customerId },
      type: QueryTypes.SELECT
    });

    const totalBilled = parseFloat(billedResult.totalBilled) || 0;
    const totalReceived = parseFloat(receivedResult.totalReceived) || 0;
    const netBalance = totalBilled - totalReceived;

    let outstandingAmount = 0;
    let advanceAmount = 0;

    if (netBalance > 0) {
      outstandingAmount = netBalance;
    } else if (netBalance < 0) {
      advanceAmount = Math.abs(netBalance);
    }

    return {
      customerId,
      totalBilled,
      totalReceived,
      outstandingAmount,
      advanceAmount,
      lastBillDate: billedResult.lastBillDate,
      lastPaymentDate: receivedResult.lastPaymentDate
    };
  }

  /**
   * FIFO Auto-allocation of a payment to outstanding bills
   */
  async allocatePaymentOnCreation(paymentId, customerId, amount, transaction, userId = 'SYSTEM') {
    // Step 1: Write PAYMENT ledger entry
    await this.writeLedgerEntry({
      customerId,
      entryType: 'PAYMENT',
      referenceType: 'PAYMENT',
      referenceId: paymentId,
      debitAmount: 0.00,
      creditAmount: amount,
      remarks: `Payment received. Ref: ${paymentId}`,
      createdBy: userId
    }, transaction);

    // Step 2: Fetch unpaid / partially paid bills ordered by bill_date ASC (oldest first)
    const [unpaidBills] = await sequelizeTVL.query(`
      SELECT 
        b.bl_id, 
        b.bl_total_amount, 
        COALESCE(SUM(pa.allocated_amount), 0) AS already_allocated
      FROM blXbilling b
      JOIN bkXbooking bk ON b.bl_booking_id = bk.bk_bkid
      LEFT JOIN payment_allocations pa ON b.bl_id = pa.bill_id
      WHERE bk.bk_usid = :customerId
        AND b.bl_status NOT IN ('CANCELLED', 'CAN')
        AND (b.payment_status IS NULL OR b.payment_status IN ('UNPAID', 'PARTIALLY_PAID'))
      GROUP BY b.bl_id, b.bl_total_amount, b.bl_billing_date
      ORDER BY b.bl_billing_date ASC, b.bl_id ASC
    `, {
      replacements: { customerId },
      type: QueryTypes.SELECT,
      transaction
    });

    let remainingPayment = parseFloat(amount) || 0;

    for (const bill of unpaidBills) {
      if (remainingPayment <= 0) break;

      const billTotal = parseFloat(bill.bl_total_amount) || 0;
      const alreadyAllocated = parseFloat(bill.already_allocated) || 0;
      const billPending = Math.max(0, billTotal - alreadyAllocated);

      if (billPending <= 0) continue;

      const allocAmount = Math.min(remainingPayment, billPending);
      
      // Store allocation entry
      await PaymentAllocation.create({
        payment_id: paymentId,
        bill_id: bill.bl_id,
        allocated_amount: allocAmount,
        allocation_date: new Date(),
        created_by: userId,
        created_at: new Date()
      }, { transaction });

      // Store allocation audit in ledger
      await this.writeLedgerEntry({
        customerId,
        entryType: 'ADJUSTMENT',
        referenceType: 'BILL',
        referenceId: bill.bl_id,
        debitAmount: 0.00,
        creditAmount: 0.00,
        remarks: `Auto-allocation: Allocated ₹${allocAmount} from Payment ${paymentId} to Bill ${bill.bl_id}`,
        createdBy: userId
      }, transaction);

      // Audit log creation
      Audit.logAction({
        module: Audit.MODULES.LEDGER,
        recordId: String(bill.bl_id),
        action: 'ALLOCATION_CREATED',
        fieldName: 'allocated_amount',
        oldValue: null,
        newValue: String(allocAmount)
      });

      // Recalculate bill payment status
      const totalAllocated = alreadyAllocated + allocAmount;
      let newStatus = 'UNPAID';
      if (totalAllocated >= billTotal) {
        newStatus = 'FULLY_PAID';
      } else if (totalAllocated > 0) {
        newStatus = 'PARTIALLY_PAID';
      }

      await sequelizeTVL.query(`
        UPDATE blXbilling 
        SET payment_status = :newStatus 
        WHERE bl_id = :billId
      `, {
        replacements: { newStatus, billId: bill.bl_id },
        type: QueryTypes.UPDATE,
        transaction
      });

      remainingPayment -= allocAmount;
    }

    // Update the payment's allocated and unallocated details
    const totalAllocated = amount - remainingPayment;
    await sequelizeTVL.query(`
      UPDATE ptXpayment 
      SET pt_allocatedamt = :totalAllocated, pt_unallocamt = :remainingPayment
      WHERE pt_ptid = :paymentId
    `, {
      replacements: { totalAllocated, remainingPayment, paymentId },
      type: QueryTypes.UPDATE,
      transaction
    });
  }

  /**
   * Auto-adjust existing customer advance against a newly created bill
   */
  async adjustAdvanceOnBillCreation(billId, customerId, totalAmount, transaction, userId = 'SYSTEM') {
    // Step 1: Write BILL ledger entry
    await this.writeLedgerEntry({
      customerId,
      entryType: 'BILL',
      referenceType: 'BILL',
      referenceId: billId,
      debitAmount: totalAmount,
      creditAmount: 0.00,
      remarks: `Bill generated. Ref: ${billId}`,
      createdBy: userId
    }, transaction);

    // Step 2: Fetch active payments with remaining unallocated balance
    const unallocatedPayments = await PaymentTVL.findAll({
      where: {
        pt_custid: customerId,
        pt_status: { [Op.not]: 'REVERSED' },
        pt_unallocamt: { [Op.gt]: 0 }
      },
      order: [['pt_paydt', 'ASC'], ['pt_ptid', 'ASC']],
      transaction
    });

    let remainingBill = parseFloat(totalAmount) || 0;
    let totalAdjusted = 0;

    for (const payment of unallocatedPayments) {
      if (remainingBill <= 0) break;

      const unalloc = parseFloat(payment.pt_unallocamt) || 0;
      if (unalloc <= 0) continue;

      const allocAmount = Math.min(remainingBill, unalloc);

      // Create allocation entry
      await PaymentAllocation.create({
        payment_id: payment.pt_ptid,
        bill_id: billId,
        allocated_amount: allocAmount,
        allocation_date: new Date(),
        created_by: userId,
        created_at: new Date()
      }, { transaction });

      // Store allocation audit in ledger
      await this.writeLedgerEntry({
        customerId,
        entryType: 'ADJUSTMENT',
        referenceType: 'BILL',
        referenceId: billId,
        debitAmount: 0.00,
        creditAmount: 0.00,
        remarks: `Advance adjustment: Applied ₹${allocAmount} from Payment ${payment.pt_ptid} to Bill ${billId}`,
        createdBy: userId
      }, transaction);

      // Audit log creation
      Audit.logAction({
        module: Audit.MODULES.LEDGER,
        recordId: String(billId),
        action: 'ALLOCATION_CREATED',
        fieldName: 'allocated_amount',
        oldValue: null,
        newValue: String(allocAmount)
      });

      // Update payment record amounts
      const newAllocated = (parseFloat(payment.pt_allocatedamt) || 0) + allocAmount;
      const newUnallocated = unalloc - allocAmount;
      
      await payment.update({
        pt_allocatedamt: newAllocated,
        pt_unallocamt: newUnallocated
      }, { transaction });

      totalAdjusted += allocAmount;
      remainingBill -= allocAmount;
    }

    // Update bill payment status
    let paymentStatus = 'UNPAID';
    if (totalAdjusted >= totalAmount) {
      paymentStatus = 'FULLY_PAID';
    } else if (totalAdjusted > 0) {
      paymentStatus = 'PARTIALLY_PAID';
    }

    await sequelizeTVL.query(`
      UPDATE blXbilling 
      SET payment_status = :paymentStatus 
      WHERE bl_id = :billId
    `, {
      replacements: { paymentStatus, billId },
      type: QueryTypes.UPDATE,
      transaction
    });
  }

  /**
   * Reverse all allocations for a given payment (e.g. payment gets cancelled or reversed)
   */
  async reversePaymentAllocations(paymentId, amount, customerId, transaction, userId = 'SYSTEM') {
    // Step 1: Write PAYMENT_REVERSAL ledger entry
    await this.writeLedgerEntry({
      customerId,
      entryType: 'PAYMENT_REVERSAL',
      referenceType: 'PAYMENT',
      referenceId: paymentId,
      debitAmount: amount,
      creditAmount: 0.00,
      remarks: `Payment reversed. Ref: ${paymentId}`,
      createdBy: userId
    }, transaction);

    // Step 2: Fetch all allocations for this payment
    const allocations = await PaymentAllocation.findAll({
      where: { payment_id: paymentId },
      transaction
    });

    const billIds = allocations.map(a => a.bill_id);

    // Step 3: Remove allocation records
    await PaymentAllocation.destroy({
      where: { payment_id: paymentId },
      transaction
    });

    // Step 4: Recalculate and update status for all affected bills
    for (const billId of billIds) {
      const [sumRes] = await sequelizeTVL.query(`
        SELECT COALESCE(SUM(allocated_amount), 0) AS total_allocated
        FROM payment_allocations
        WHERE bill_id = :billId
      `, {
        replacements: { billId },
        type: QueryTypes.SELECT,
        transaction
      });

      const [billRes] = await sequelizeTVL.query(`
        SELECT bl_total_amount FROM blXbilling WHERE bl_id = :billId
      `, {
        replacements: { billId },
        type: QueryTypes.SELECT,
        transaction
      });

      if (!billRes) continue;

      const totalAllocated = parseFloat(sumRes.total_allocated) || 0;
      const billTotal = parseFloat(billRes.bl_total_amount) || 0;

      let newStatus = 'UNPAID';
      if (totalAllocated >= billTotal) {
        newStatus = 'FULLY_PAID';
      } else if (totalAllocated > 0) {
        newStatus = 'PARTIALLY_PAID';
      }

      await sequelizeTVL.query(`
        UPDATE blXbilling 
        SET payment_status = :newStatus 
        WHERE bl_id = :billId
      `, {
        replacements: { newStatus, billId },
        type: QueryTypes.UPDATE,
        transaction
      });

      // Audit log reversal
      Audit.logAction({
        module: Audit.MODULES.LEDGER,
        recordId: String(billId),
        action: 'ALLOCATION_REVERSED',
        fieldName: 'payment_status',
        oldValue: 'PAID/PARTIALLY_PAID',
        newValue: newStatus
      });
    }
  }

  /**
   * Cancel allocations on a bill (when a bill is cancelled, release allocations back to payments)
   */
  async cancelBillAllocations(billId, billAmount, customerId, transaction, userId = 'SYSTEM') {
    // Step 1: Write BILL_CANCELLED ledger entry
    await this.writeLedgerEntry({
      customerId,
      entryType: 'BILL_CANCELLED',
      referenceType: 'BILL',
      referenceId: billId,
      debitAmount: 0.00,
      creditAmount: billAmount,
      remarks: `Bill cancelled. Ref: ${billId}`,
      createdBy: userId
    }, transaction);

    // Step 2: Fetch allocations for this bill
    const allocations = await PaymentAllocation.findAll({
      where: { bill_id: billId },
      transaction
    });

    // Step 3: Release allocation amounts back to payments
    for (const alloc of allocations) {
      const payment = await PaymentTVL.findByPk(alloc.payment_id, { transaction });
      if (payment) {
        const releasedAmt = parseFloat(alloc.allocated_amount) || 0;
        const newAllocated = Math.max(0, (parseFloat(payment.pt_allocatedamt) || 0) - releasedAmt);
        const newUnallocated = (parseFloat(payment.pt_unallocamt) || 0) + releasedAmt;

        await payment.update({
          pt_allocatedamt: newAllocated,
          pt_unallocamt: newUnallocated
        }, { transaction });
      }
    }

    // Step 4: Remove allocation records
    await PaymentAllocation.destroy({
      where: { bill_id: billId },
      transaction
    });

    // Update bill payment status to UNPAID
    await sequelizeTVL.query(`
      UPDATE blXbilling 
      SET payment_status = 'UNPAID' 
      WHERE bl_id = :billId
    `, {
      replacements: { billId },
      type: QueryTypes.UPDATE,
      transaction
    });
  }

  /**
   * Vintage Customer Ledger Report (ERP Grade)
   * Dynamically calculates opening balance, debits, credits, and running balance
   */
  async getCustomerVintageLedger(customerId, fromDate, toDate) {
    // 1. Calculate default dates: Current Financial Year (April 1st to March 31st)
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed: April is 3
    const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;

    const defaultFromDate = `${startYear}-04-01`;
    const defaultToDate = `${startYear + 1}-03-31`;

    const finalFromDate = fromDate || defaultFromDate;
    const finalToDate = toDate || defaultToDate;

    // 2. Retrieve customer and user profile details
    const [customerRes] = await sequelizeTVL.query(`
      SELECT 
        c.cu_usid AS id,
        c.cu_custno AS customerNo,
        CONCAT(u.us_fname, ' ', COALESCE(u.us_lname, '')) AS name,
        u.us_phone AS phone,
        c.cu_compid AS company
      FROM cuXcustomer c
      JOIN usXuser u ON c.cu_usid = u.us_usid
      WHERE c.cu_usid = :customerId OR c.cu_custno = :customerId OR c.cu_cusid = :customerId
      LIMIT 1
    `, {
      replacements: { customerId },
      type: QueryTypes.SELECT
    });

    const actualCustomerId = customerRes ? customerRes.id : customerId;

    // 3. Calculate Opening Balance: Sum(Bills) - Sum(Payments) before finalFromDate
    const [billsBefore] = await sequelizeTVL.query(`
      SELECT COALESCE(SUM(bl.bl_total_amount), 0) AS total_debit
      FROM blXbilling bl
      JOIN bkXbooking bk ON bl.bl_booking_id = bk.bk_bkid
      WHERE bk.bk_usid = :customerId
        AND bl.bl_status NOT IN ('CANCELLED', 'CAN')
        AND bl.bl_billing_date < :fromDate
    `, {
      replacements: { customerId: actualCustomerId, fromDate: finalFromDate },
      type: QueryTypes.SELECT
    });

    const [paymentsBefore] = await sequelizeTVL.query(`
      SELECT COALESCE(SUM(pt.pt_amount), 0) AS total_credit
      FROM ptXpayment pt
      WHERE pt.pt_custid = :customerId
        AND pt.pt_status NOT IN ('REVERSED', 'CANCELLED')
        AND pt.pt_paydt < :fromDate
    `, {
      replacements: { customerId: actualCustomerId, fromDate: finalFromDate },
      type: QueryTypes.SELECT
    });

    const totalDebitBefore = parseFloat(billsBefore?.total_debit || 0);
    const totalCreditBefore = parseFloat(paymentsBefore?.total_credit || 0);
    const openingBalance = totalDebitBefore - totalCreditBefore;

    // 4. Fetch Bills in the period
    const bills = await sequelizeTVL.query(`
      SELECT 
        bl.bl_billing_date AS date,
        bl.bl_bill_no AS invoice_number,
        bl.bl_total_amount AS amount
      FROM blXbilling bl
      JOIN bkXbooking bk ON bl.bl_booking_id = bk.bk_bkid
      WHERE bk.bk_usid = :customerId
        AND bl.bl_status NOT IN ('CANCELLED', 'CAN')
        AND bl.bl_billing_date >= :fromDate
        AND bl.bl_billing_date <= :toDate
    `, {
      replacements: { customerId: actualCustomerId, fromDate: finalFromDate, toDate: finalToDate },
      type: QueryTypes.SELECT
    });

    // 5. Fetch Payments in the period
    const payments = await sequelizeTVL.query(`
      SELECT 
        pt.pt_paydt AS date,
        pt.pt_refno AS reference_number,
        pt.pt_ptid AS payment_id,
        pt.pt_amount AS amount,
        pt.pt_mode AS mode
      FROM ptXpayment pt
      WHERE pt.pt_custid = :customerId
        AND pt.pt_status NOT IN ('REVERSED', 'CANCELLED')
        AND pt.pt_paydt >= :fromDate
        AND pt.pt_paydt <= :toDate
    `, {
      replacements: { customerId: actualCustomerId, fromDate: finalFromDate, toDate: finalToDate },
      type: QueryTypes.SELECT
    });

    // 6. Map and merge entries
    const billEntries = (bills || []).map(b => ({
      date: b.date,
      particular: `Invoice Generated (#${b.invoice_number})`,
      reference: b.invoice_number || '',
      debit: parseFloat(b.amount) || 0,
      credit: 0,
      sortDate: new Date(b.date).getTime()
    }));

    const paymentEntries = (payments || []).map(p => ({
      date: p.date,
      particular: `Payment Received (${p.mode || 'Direct'})`,
      reference: p.reference_number || `PAY-${p.payment_id}`,
      debit: 0,
      credit: parseFloat(p.amount) || 0,
      sortDate: new Date(p.date).getTime()
    }));

    const mergedEntries = [...billEntries, ...paymentEntries];

    // Sort entries chronologically
    mergedEntries.sort((a, b) => {
      if (a.sortDate !== b.sortDate) {
        return a.sortDate - b.sortDate;
      }
      if (a.debit > 0 && b.credit > 0) return -1;
      if (a.credit > 0 && b.debit > 0) return 1;
      return 0;
    });

    // 7. Calculate running balance and populate final array
    let runningBalance = openingBalance;
    const entries = [];

    // Format date utility
    const formatDateStr = (d) => {
      const dateObj = new Date(d);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Include Opening Balance entry as the first record
    entries.push({
      date: formatDateStr(finalFromDate),
      particular: 'Opening Balance',
      reference: '',
      debit: 0,
      credit: 0,
      balance: openingBalance
    });

    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of mergedEntries) {
      runningBalance = runningBalance + entry.debit - entry.credit;
      totalDebit += entry.debit;
      totalCredit += entry.credit;

      entries.push({
        date: formatDateStr(entry.date),
        particular: entry.particular,
        reference: entry.reference,
        debit: entry.debit,
        credit: entry.credit,
        balance: runningBalance
      });
    }

    return {
      success: true,
      customer: {
        id: actualCustomerId,
        name: customerRes ? customerRes.name : 'Unknown Customer',
        phone: customerRes ? customerRes.phone : '',
        company: customerRes ? customerRes.company : ''
      },
      openingBalance,
      entries,
      totals: {
        debit: totalDebit,
        credit: totalCredit
      },
      closingBalance: runningBalance
    };
  }
}

module.exports = new CustomerLedgerService();
