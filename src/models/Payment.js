const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');
const Account = require('./Account');
const Booking = require('./Booking');

const Payment = sequelize.define('ptPayment', {
  pt_ptid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Payment ID'
  },
  pt_acid: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'Account ID'
  },
  pt_bkid: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'Booking ID'
  },
  pt_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    comment: 'Total Payment Amount'
  },
  pt_mode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Payment Mode'
  },
  pt_refno: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Reference Number (UTR / Cheque / Txn ID)'
  },
  pt_paydt: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Payment Date'
  },
  pt_rcvby: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Received By'
  },
  pt_status: {
    type: DataTypes.STRING(15),
    defaultValue: 'RECEIVED',
    comment: 'Payment Status (RECEIVED | ADJUSTED | REFUNDED)'
  },
  pt_acct_period: {
    type: DataTypes.STRING(7),
    allowNull: true,
    comment: 'Accounting Period (YYYY-MM)'
  },
  // Detailed payment breakdown fields
  pt_ticket_price: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Ticket Price'
  },
  pt_platform_fee: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Platform Fee'
  },
  pt_agent_fee: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Agent Fee'
  },
  pt_tax: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Tax'
  },
  pt_other_charges: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Other Charges'
  },
  pt_pnr: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'PNR Number for which payment is received'
  },
  pt_rcvdt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Received Date'
  },
  pt_status: {
    type: DataTypes.STRING(15),
    defaultValue: 'RECEIVED',
    comment: 'Payment Status'
  },
  pt_remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Remarks'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'ptPayment',
  timestamps: false
});

// Define associations
Payment.belongsTo(Account, {
  foreignKey: 'pt_acid',
  targetKey: 'ac_acid',
  as: 'account'
});

Payment.belongsTo(Booking, {
  foreignKey: 'pt_bkid',
  targetKey: 'bk_bkid',
  as: 'booking'
});

module.exports = Payment;