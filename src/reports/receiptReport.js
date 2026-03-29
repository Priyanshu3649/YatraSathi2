const { Receipt } = require('../models');
const { Op, fn, col } = require('sequelize');

/**
 * Generates the Receipt Report
 * @param {Object} filters - { startDate, endDate, customerId }
 */
const generateReceiptReport = async (filters) => {
  const { startDate, endDate, customerId } = filters;

  const where = {
    rc_date: {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    },
    rc_status: 'Active'
  };

  if (customerId) {
    where.rc_customer_id = customerId;
  }

  const reports = await Receipt.findAll({
    where,
    attributes: [
      ['rc_date', 'Date'],
      ['rc_entry_no', 'Receipt No'],
      ['rc_customer_name', 'Customer'],
      ['rc_amount', 'Amount'],
      ['rc_payment_mode', 'Mode']
    ],
    order: [['rc_date', 'ASC']]
  });

  const summary = await Receipt.findOne({
    where,
    attributes: [
      [fn('SUM', col('rc_amount')), 'totalAmount'],
      [fn('COUNT', col('rc_rcid')), 'totalCount']
    ],
    raw: true
  });

  return {
    columns: ["Date", "Receipt No", "Customer", "Amount", "Mode"],
    rows: reports.map(r => r.toJSON()),
    summary: {
      totalAmount: parseFloat(summary.totalAmount) || 0,
      totalCount: parseInt(summary.totalCount) || 0
    }
  };
};

module.exports = { generateReceiptReport };
