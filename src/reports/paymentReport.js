const { Payment } = require('../models');
const { Op, fn, col } = require('sequelize');

/**
 * Generates the Payment Report
 * @param {Object} filters - { startDate, endDate, customerId }
 */
const generatePaymentReport = async (filters) => {
  const { startDate, endDate, customerId } = filters;

  const where = {
    py_date: {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    },
    py_status: 'Active'
  };

  // Note: Payment model might not have customerId directly, using customer name if available
  // Adjusting based on pyXpayment schema
  if (customerId) {
    where.py_customer_id = customerId; 
  }

  const reports = await Payment.findAll({
    where,
    attributes: [
      ['py_date', 'Date'],
      ['py_entry_no', 'Voucher No'],
      ['py_customer_name', 'Account'],
      ['py_amount', 'Amount'],
      ['py_entry_type', 'Type']
    ],
    order: [['py_date', 'ASC']]
  });

  const summary = await Payment.findOne({
    where,
    attributes: [
      [fn('SUM', col('py_amount')), 'totalAmount'],
      [fn('COUNT', col('py_pymtid')), 'totalCount']
    ],
    raw: true
  });

  return {
    columns: ["Date", "Voucher No", "Account", "Amount", "Type"],
    rows: reports.map(r => r.toJSON()),
    summary: {
      totalAmount: parseFloat(summary.totalAmount) || 0,
      totalCount: parseInt(summary.totalCount) || 0
    }
  };
};

module.exports = { generatePaymentReport };
