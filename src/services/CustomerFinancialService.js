const { Op } = require('sequelize');
const { sequelize, sequelizeTVL } = require('../../config/db');
const BillTVL = require('../models/BillTVL');
const Payment = require('../models/Payment');
const CustomerLedger = require('../models/CustomerLedger');
const PaymentAllocation = require('../models/PaymentAllocation');

class CustomerFinancialService {
  /**
   * Calculate customer financial summary
   * @param {string} customerId - Customer user ID (cu_usid)
   * @returns {Promise<{customerId: string, totalBilled: number, totalReceived: number, outstanding: number, advance: number}>}
   */
  static async getFinancialSummary(customerId) {
    try {
      // 1. Total Billed
      let totalBilled = 0;
      try {
        const billedResult = await BillTVL.findOne({
          attributes: [
            [
              sequelize.fn(
                'COALESCE',
                sequelize.fn('SUM', sequelize.col('bl_total_amount')),
                0
              ),
              'totalBilled'
            ]
          ],
          where: {
            bl_customer_id: customerId,
            is_cancelled: { [Op.ne]: 1 }
          }
        });
        totalBilled = parseFloat(billedResult?.dataValues?.totalBilled || 0);
      } catch (e) {
        console.error('Failed to calculate total billed:', e);
      }

      // 2. Total Received
      let totalReceived = 0;
      try {
        const receivedResult = await Payment.findOne({
          attributes: [
            [
              sequelize.fn(
                'COALESCE',
                sequelize.fn('SUM', sequelize.col('py_amount')),
                0
              ),
              'totalReceived'
            ]
          ],
          where: {
            py_customer_id: customerId,
            py_status: 'Active'
          }
        });
        totalReceived = parseFloat(receivedResult?.dataValues?.totalReceived || 0);
      } catch (e) {
        console.error('Failed to calculate total received:', e);
      }

      // 3. Calculate from ledger (most accurate)
      let outstanding = 0;
      let advance = 0;
      try {
        const latestLedger = await CustomerLedger.findOne({
          where: { customerId },
          order: [['id', 'DESC']],
          limit: 1
        });
        
        if (latestLedger) {
          const balance = parseFloat(latestLedger.runningBalance || 0);
          if (balance > 0) {
            outstanding = balance;
          } else {
            advance = Math.abs(balance);
          }
        } else {
          // Fallback if no ledger entries yet
          outstanding = Math.max(0, totalBilled - totalReceived);
        }
      } catch (e) {
        console.error('Failed to calculate from ledger:', e);
        outstanding = Math.max(0, totalBilled - totalReceived);
      }

      return {
        customerId,
        totalBilled,
        totalReceived,
        outstanding,
        advance
      };
    } catch (error) {
      console.error('Critical error in getFinancialSummary:', error);
      return {
        customerId,
        totalBilled: 0,
        totalReceived: 0,
        outstanding: 0,
        advance: 0
      };
    }
  }
}

module.exports = CustomerFinancialService;