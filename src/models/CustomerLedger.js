const { DataTypes } = require('sequelize');
const { sequelize } = require('./baseModel');

const CustomerLedger = sequelize.define('CustomerLedger', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  customerId: {
    type: DataTypes.STRING(15),
    allowNull: false,
    field: 'customer_id',
    comment: 'Foreign key to customer (cu_usid)'
  },
  transactionDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'transaction_date',
    defaultValue: DataTypes.NOW
  },
  transactionType: {
    type: DataTypes.ENUM(
      'BILL', 
      'PAYMENT', 
      'RECEIPT', 
      'ADJUSTMENT', 
      'REVERSAL', 
      'CONTRA'
    ),
    allowNull: false,
    field: 'transaction_type'
  },
  referenceType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'reference_type',
    comment: 'e.g., BILLING, PAYMENT, RECEIPT'
  },
  referenceId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'reference_id'
  },
  debit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  credit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  runningBalance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'running_balance',
    comment: 'Outstanding after this transaction'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'customer_ledger',
  timestamps: false,
  indexes: [
    { name: 'idx_customer', fields: ['customer_id'] },
    { name: 'idx_transaction_date', fields: ['transaction_date'] },
    { name: 'idx_reference', fields: ['reference_type', 'reference_id'] }
  ]
});

module.exports = CustomerLedger;