const { DataTypes } = require('sequelize');
const { sequelize, BaseModel, auditHooks } = require('./baseModel');

/**
 * Payment Model
 * Handles payment transactions and records
 */
const Payment = sequelize.define('pyPayment', {
  py_pymtid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Payment ID'
  },
  
  py_entry_no: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Auto-generated entry number'
  },
  
  py_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Payment date'
  },
  
  py_entry_type: {
    type: DataTypes.ENUM('Debit', 'Credit'),
    allowNull: false,
    comment: 'Entry type'
  },
  
  py_customer_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Customer name'
  },
  
  py_customer_phone: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Customer phone'
  },
  
  py_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Payment amount'
  },
  
  py_ref_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Reference number'
  },
  
  py_bank_account: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Bank account name'
  },
  
  py_balance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Current balance'
  },
  
  py_total_credit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Total credit amount'
  },
  
  py_total_debit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Total debit amount'
  },
  
  py_created_by: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'User ID who created the payment'
  },
  
  py_status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Deleted'),
    allowNull: false,
    defaultValue: 'Active',
    comment: 'Payment status'
  },
  
  // Audit fields from BaseModel
  ...BaseModel,
  
  entered_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Entered By User ID'
  },
  entered_on: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Entered On'
  },
  modified_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Modified By User ID'
  },
  modified_on: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Modified On'
  },
  closed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Closed By User ID'
  },
  closed_on: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Closed On'
  },
  status: {
    type: DataTypes.ENUM('OPEN', 'CLOSED', 'CANCELLED'),
    defaultValue: 'OPEN',
    comment: 'Record Status'
  }
  
}, {
  tableName: 'pyXpayment',
  timestamps: true,
  hooks: {
    beforeCreate: (payment, options) => {
      // Legacy hooks
      if (options && options.userId) {
        if (!payment.eby)  payment.eby  = options.userId;
        if (!payment.edtm) payment.edtm = new Date();
        payment.mby  = options.userId;
        payment.mdtm = new Date();
      }
      // Forensic hooks
      const uid = (options && options.userId) ? options.userId : 1;
      const numericId = typeof uid === 'string'
        ? (uid.match(/\d+/) ? parseInt(uid.match(/\d+/)[0]) : 1)
        : uid;
      payment.entered_by = numericId;
      payment.entered_on = new Date();
      if (!payment.status) payment.status = 'OPEN';
    },
    beforeUpdate: (payment, options) => {
      // Legacy hooks
      if (options && options.userId) {
        payment.mby  = options.userId;
        payment.mdtm = new Date();
      }
      // Forensic hooks
      if (options && options.userId) {
        const uid = options.userId;
        const numericId = typeof uid === 'string'
          ? (uid.match(/\d+/) ? parseInt(uid.match(/\d+/)[0]) : 1)
          : uid;
        payment.modified_by = numericId;
        payment.modified_on = new Date();
      }
    }
  },
  indexes: [
    {
      name: 'idx_py_entry_no',
      fields: ['py_entry_no']
    },
    {
      name: 'idx_py_date',
      fields: ['py_date']
    },
    {
      name: 'idx_py_customer_phone',
      fields: ['py_customer_phone']
    },
    {
      name: 'idx_py_created_by',
      fields: ['py_created_by']
    },
    {
      name: 'idx_py_status',
      fields: ['py_status']
    }
  ]
});

// Define associations
Payment.associate = function(models) {
  // Payment belongs to user who created it
  Payment.belongsTo(models.User, {
    foreignKey: 'py_created_by',
    targetKey: 'us_usid',
    as: 'creator'
  });
};

module.exports = Payment;