const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const PaymentTVL = sequelizeTVL.define('ptXpayment', {
  pt_ptid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Payment ID (Primary Key)'
  },
  pt_custid: {
    type: DataTypes.BIGINT, // Changed from STRING(15) to BIGINT to match database
    allowNull: false,
    comment: 'Customer ID (User ID)'
  },
  pt_totalamt: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    comment: 'Total Payment Amount'
  },
  pt_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    comment: 'Payment Amount'
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
  pt_acid: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'Account ID'
  },
  pt_mode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Payment Mode'
  },
  pt_refno: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Reference Number'
  },
  pt_paydt: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Payment Date'
  },
  pt_rcvdt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Received Date'
  },
  pt_allocatedamt: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Allocated Amount'
  },
  pt_unallocamt: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Unallocated Amount (generated field)'
  },
  pt_finyear: {
    type: DataTypes.STRING(9),
    allowNull: false,
    comment: 'Financial Year'
  },
  pt_period: {
    type: DataTypes.STRING(7),
    allowNull: false,
    comment: 'Accounting Period'
  },
  pt_locked: {
    type: DataTypes.TINYINT,
    allowNull: true,
    defaultValue: 0,
    comment: 'Lock Flag'
  },
  // Audit fields
  edtm: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    comment: 'Entered Date Time'
  },
  eby: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'Entered By'
  },
  mdtm: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    onUpdate: DataTypes.NOW,
    comment: 'Modified Date Time'
  },
  mby: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Modified By'
  }
}, {
  tableName: 'ptXpayment',
  timestamps: false
});

module.exports = PaymentTVL;