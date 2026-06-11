const { sequelize } = require('../../config/db');
const Payment = require('../models/Payment');
const BillTVL = require('../models/BillTVL');
const PaymentAllocation = require('../models/PaymentAllocation');
const LedgerService = require('./LedgerService');

class PaymentAllocationService {
  /**
   * Allocate a payment to bills
   */
  static async allocatePayment(paymentId, allocations, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      // 1. Get payment
      const payment = await Payment.findByPk(paymentId, { transaction });
      if (!payment) {
        throw new Error('Payment not found');
      }

      // 2. Validate total allocated equals payment amount
      const totalAllocated = allocations.reduce((sum, a) => sum + parseFloat(a.allocatedAmount), 0);
      if (Math.abs(totalAllocated - parseFloat(payment.py_amount)) > 0.01) {
        throw new Error('Total allocated must equal payment amount');
      }

      // 3. Create allocations
      for (const alloc of allocations) {
        await PaymentAllocation.create({
          paymentId,
          billId: alloc.billId,
          allocatedAmount: alloc.allocatedAmount,
          eby: userId
        }, { transaction });
      }

      // 4. Add ledger entry for payment
      await LedgerService.addPaymentEntry(
        payment.py_customer_id,
        paymentId,
        parseFloat(payment.py_amount),
        userId
      );

      await transaction.commit();
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      console.error('Error allocating payment:', error);
      throw error;
    }
  }

  /**
   * Get bill payment status
   */
  static async getBillStatus(billId) {
    const totalAllocations = await PaymentAllocation.sum('allocatedAmount', {
      where: { billId }
    });

    const bill = await BillTVL.findByPk(billId);
    if (!bill) return null;

    const billAmount = parseFloat(bill.bl_total_amount || 0);
    const allocated = parseFloat(totalAllocations || 0);

    if (bill.is_cancelled) {
      return 'CANCELLED';
    } else if (allocated >= billAmount) {
      return 'PAID';
    } else if (allocated > 0) {
      return 'PARTIALLY_PAID';
    } else {
      return 'UNPAID';
    }
  }
}

module.exports = PaymentAllocationService;