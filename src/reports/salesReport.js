const { BillingMaster } = require('../models');
const { Op, fn, col } = require('sequelize');

/**
 * Generates the Sales Report (Billing)
 * @param {Object} filters - { startDate, endDate, customerId }
 */
const generateSalesReport = async (filters) => {
  const { startDate, endDate, customerId } = filters;

  const where = {
    bl_billing_date: {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    },
    status: { [Op.ne]: 'CANCELLED' } // Exclude cancelled from active sales
  };

  if (customerId) {
    where.bl_customer_id = customerId;
  }

  const reports = await BillingMaster.findAll({
    where,
    attributes: [
      ['bl_billing_date', 'Date'],
      ['bl_bill_no', 'Bill No'],
      ['bl_customer_name', 'Customer'],
      ['bl_total_amount', 'Amount'],
      ['status', 'Status']
    ],
    order: [['bl_billing_date', 'ASC']]
  });

  const summary = await BillingMaster.findOne({
    where,
    attributes: [
      [fn('SUM', col('bl_total_amount')), 'totalAmount'],
      [fn('COUNT', col('bl_id')), 'totalCount']
    ],
    raw: true
  });

  return {
    columns: ["Date", "Bill No", "Customer", "Amount", "Status"],
    rows: reports.map(r => r.toJSON()),
    summary: {
      totalAmount: parseFloat(summary.totalAmount) || 0,
      totalCount: parseInt(summary.totalCount) || 0
    }
  };
};

module.exports = { generateSalesReport };
