const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const StationBoyPaymentAllocation = sequelizeTVL.define('StationBoyPaymentAllocation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  payment_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  bill_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  allocated_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  allocation_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  is_reconciled: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  reconciled_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  reconciled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reconciliation_remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'sbXsbpayalloc',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['payment_id', 'bill_id'] }
  ]
});

module.exports = StationBoyPaymentAllocation;
