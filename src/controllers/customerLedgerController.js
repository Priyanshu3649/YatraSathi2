const CustomerLedgerService = require('../services/CustomerLedgerService');
const { CustomerLedger, billXbill: BillTVL } = require('../models');

/**
 * Customer Ledger Validation Controller
 */
const getCustomerSummary = async (req, res) => {
  try {
    const customerId = req.params.id;
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer ID is required' });
    }

    const summary = await CustomerLedgerService.getCustomerFinancialSummary(customerId);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get customer summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer summary',
      error: error.message
    });
  }
};

const getCustomerLedger = async (req, res) => {
  try {
    const customerId = req.params.id;
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer ID is required' });
    }

    const ledgerEntries = await CustomerLedger.findAll({
      where: { customer_id: customerId },
      order: [['entry_date', 'ASC'], ['ledger_id', 'ASC']]
    });

    res.json({
      success: true,
      data: ledgerEntries
    });
  } catch (error) {
    console.error('Get customer ledger error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer ledger',
      error: error.message
    });
  }
};

const getCustomerOutstandingBills = async (req, res) => {
  try {
    const customerId = req.params.id;
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer ID is required' });
    }

    // Fetch unpaid or partially paid bills
    const { BookingTVL } = require('../models');
    const bills = await BillTVL.findAll({
      include: [{
        model: BookingTVL,
        as: 'booking',
        where: { bk_usid: customerId },
        attributes: []
      }],
      where: {
        payment_status: ['UNPAID', 'PARTIALLY_PAID'],
        bl_status: { [require('sequelize').Op.notIn]: ['CANCELLED', 'CAN'] }
      },
      order: [['bl_billing_date', 'ASC'], ['bl_id', 'ASC']]
    });

    res.json({
      success: true,
      data: bills
    });
  } catch (error) {
    console.error('Get customer outstanding bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer outstanding bills',
      error: error.message
    });
  }
};

module.exports = {
  getCustomerSummary,
  getCustomerLedger,
  getCustomerOutstandingBills
};
