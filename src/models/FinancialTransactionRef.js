const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const FinancialTransactionRef = sequelizeTVL.define('FinancialTransactionRef', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  utr_number: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
    comment: 'Global unique UTR number'
  },
  transaction_type: {
    type: DataTypes.ENUM('PAYMENT', 'RECEIPT', 'JOURNAL', 'CONTRA'),
    allowNull: false,
    comment: 'Type of financial transaction'
  },
  transaction_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID of the related transaction record'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'FinancialTransactionRefs',
  timestamps: false
});

module.exports = FinancialTransactionRef;
