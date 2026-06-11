const { sequelize } = require('../../config/db');
const CustomerLedger = require('../models/CustomerLedger');
const BillTVL = require('../models/BillTVL');
const Payment = require('../models/Payment');

class LedgerService {
  /**
   * Get customer ledger with pagination
   * @param {string} customerId 
   * @param {number} page 
   * @param {number} limit 
   */
  static async getCustomerLedger(customerId, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    try {
      const { count, rows } = await CustomerLedger.findAndCountAll({
        where: { customerId },
        order: [['id', 'DESC']],
        limit,
        offset
      });
      
      return {
        data: rows,
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page
      };
    } catch (error) {
      console.error('Error getting customer ledger:', error);
      return {
        data: [],
        total: 0,
        totalPages: 0,
        currentPage: page
      };
    }
  }

  /**
   * Add a ledger entry
   */
  static async addLedgerEntry(entryData) {
    const transaction = await sequelize.transaction();
    try {
      // 1. Calculate running balance
      const latestEntry = await CustomerLedger.findOne({
        where: { customerId: entryData.customerId },
        order: [['id', 'DESC']],
        transaction
      });
      
      const previousBalance = parseFloat(latestEntry?.runningBalance || 0);
      const newBalance = previousBalance + parseFloat(entryData.debit) - parseFloat(entryData.credit);
      
      // 2. Create entry
      const entry = await CustomerLedger.create({
        ...entryData,
        runningBalance: newBalance
      }, { transaction });
      
      await transaction.commit();
      return entry;
    } catch (error) {
      await transaction.rollback();
      console.error('Error adding ledger entry:', error);
      throw error;
    }
  }

  /**
   * Add bill entry to ledger
   */
  static async addBillEntry(customerId, billId, amount, userId) {
    return this.addLedgerEntry({
      customerId,
      transactionType: 'BILL',
      referenceType: 'BILLING',
      referenceId: billId,
      debit: amount,
      credit: 0,
      remarks: `Bill #${billId}`,
      eby: userId
    });
  }

  /**
   * Add payment entry to ledger
   */
  static async addPaymentEntry(customerId, paymentId, amount, userId) {
    return this.addLedgerEntry({
      customerId,
      transactionType: 'PAYMENT',
      referenceType: 'PAYMENT',
      referenceId: paymentId,
      debit: 0,
      credit: amount,
      remarks: `Payment #${paymentId}`,
      eby: userId
    });
  }

  /**
   * Add reversal entry (for cancellations
   */
  static async addReversalEntry(customerId, referenceType, referenceId, originalEntry, userId) {
    return this.addLedgerEntry({
      customerId,
      transactionType: 'REVERSAL',
      referenceType,
      referenceId,
      debit: originalEntry.credit,
      credit: originalEntry.debit,
      remarks: `Reversal for ${referenceType} #${referenceId}`,
      eby: userId
    });
  }
}

module.exports = LedgerService;