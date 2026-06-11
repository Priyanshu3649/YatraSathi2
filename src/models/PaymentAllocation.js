const { DataTypes } = require('sequelize');
const { sequelize } = require('./baseModel');

const PaymentAllocation = sequelize.define('PaymentAllocation', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  paymentId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'payment_id'
  },
  billId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'bill_id'
  },
  allocatedAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'allocated_amount'
  },
  allocatedDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'allocated_date',
    defaultValue: DataTypes.NOW
  },
  // Base Model Audit Fields
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
    onUpdate: DataTypes.NOW,
    allowNull: false,
    comment: 'Modified Date Time'
  },
  mby: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Modified By'
  },
  cby: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Closed By'
  },
  cdtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Closed Date Time'
  }
}, {
  tableName: 'payment_allocations',
  timestamps: false,
  indexes: [
    { name: 'idx_payment', fields: ['payment_id'] },
    { name: 'idx_bill', fields: ['bill_id'] }
  ]
});

module.exports = PaymentAllocation;