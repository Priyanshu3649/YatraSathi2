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
}

module.exports = new CustomerLedgerService();
