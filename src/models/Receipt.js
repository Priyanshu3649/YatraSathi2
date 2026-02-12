const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');

/**
 * Receipt Model
 * Handles receipt transactions and records
 */
const Receipt = sequelize.define('rcReceipt', {
  rc_rcid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Receipt ID'
  },
  
  rc_entry_no: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Auto-generated entry number'
  },
  
  rc_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Receipt date'
  },
  
  rc_customer_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Customer name'
  },
  
  rc_customer_phone: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Customer phone'
  },
  
  rc_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Receipt amount'
  },
  
  rc_payment_mode: {
    type: DataTypes.ENUM('Cash', 'Bank', 'Cheque', 'Online'),
    allowNull: false,
    defaultValue: 'Cash',
    comment: 'Payment mode'
  },
  
  rc_ref_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Reference number'
  },
  
  rc_bank_account: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Bank account name'
  },
  
  rc_narration: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Narration/description'
  },
  
  rc_created_by: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'User ID who created the receipt'
  },
  
  rc_status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Deleted'),
    allowNull: false,
    defaultValue: 'Active',
    comment: 'Receipt status'
  },
  
  // Audit fields from BaseModel
  ...BaseModel
  
}, {
  tableName: 'rcXreceipt',
  timestamps: true,
  indexes: [
    {
      name: 'idx_rc_entry_no',
      fields: ['rc_entry_no']
    },
    {
      name: 'idx_rc_date',
      fields: ['rc_date']
    },
    {
      name: 'idx_rc_customer_phone',
      fields: ['rc_customer_phone']
    },
    {
      name: 'idx_rc_payment_mode',
      fields: ['rc_payment_mode']
    },
    {
      name: 'idx_rc_created_by',
      fields: ['rc_created_by']
    }
  ]
});

// Define associations
Receipt.associate = function(models) {
  // Receipt belongs to user who created it
  Receipt.belongsTo(models.User, {
    foreignKey: 'rc_created_by',
    targetKey: 'us_usid',
    as: 'creator'
  });
};

module.exports = Receipt;