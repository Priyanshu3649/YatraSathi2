const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const PaymentTVL = sequelizeTVL.define('ptXpayment', {
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
    comment: 'Payment Amount'
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