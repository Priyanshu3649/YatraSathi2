const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');
const Payment = require('./Payment');
const Pnr = require('./Pnr');

const PaymentAlloc = sequelize.define('paPaymentAlloc', {
  pa_paid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Payment Allocation ID'
  },
  pa_ptid: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'Payment ID'
  },
  pa_pnid: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'PNR ID'
  },
  pa_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    comment: 'Allocated Amount'
  },
  // Audit fields (only edtm and eby as per schema)
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
  }
}, {
  tableName: 'paPaymentAlloc',
  timestamps: false
});

// Define associations
PaymentAlloc.belongsTo(Payment, {
  foreignKey: 'pa_ptid',
  targetKey: 'pt_ptid',
  as: 'payment'
});

PaymentAlloc.belongsTo(Pnr, {
  foreignKey: 'pa_pnid',
  targetKey: 'pn_pnid',
  as: 'pnr'
});

module.exports = PaymentAlloc;