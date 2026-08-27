const { DataTypes } = require('sequelize');
const { sequelize, BaseModel, auditHooks } = require('./baseModel');

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
    type: DataTypes.ENUM('Cash', 'Bank', 'Cheque', 'Online', 'UPI', 'NEFT', 'RTGS', 'IMPS', 'Bank Transfer', 'Credit Card', 'Debit Card'),
    allowNull: false,
    defaultValue: 'Cash',
    comment: 'Payment mode'
  },
  
  rc_ref_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Reference number'
  },

  utr_number: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Global unique UTR number'
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
  
  is_reconciled: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
    comment: 'Is Reconciled'
  },
  reconciled_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Reconciled By User ID'
  },
  reconciled_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Reconciliation Timestamp'
  },
  reconciliation_remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reconciliation Remarks'
  },
  bank_statement_ref: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Bank Statement Reference'
  },
  
  // Audit fields from BaseModel
  ...BaseModel,
  
  entered_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Entered By User ID'
  },
  attachment_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Path to receipt proof image'
  },
  attachment_mime: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'MIME type of receipt proof image'
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
  tableName: 'rcXreceipt',
  timestamps: true,
  hooks: {
    beforeCreate: (receipt, options) => {
      // Legacy hooks
      if (options && options.userId) {
        if (!receipt.eby)  receipt.eby  = options.userId;
        if (!receipt.edtm) receipt.edtm = new Date();
        receipt.mby  = options.userId;
        receipt.mdtm = new Date();
      }
      // Forensic hooks
      const uid = (options && options.userId) ? options.userId : 1;
      const numericId = typeof uid === 'string'
        ? (uid.match(/\d+/) ? parseInt(uid.match(/\d+/)[0]) : 1)
        : uid;
      receipt.entered_by = numericId;
      receipt.entered_on = new Date();
      if (!receipt.status) receipt.status = 'OPEN';
    },
    beforeUpdate: (receipt, options) => {
      // Legacy hooks
      if (options && options.userId) {
        receipt.mby  = options.userId;
        receipt.mdtm = new Date();
      }
      // Forensic hooks
      if (options && options.userId) {
        const uid = options.userId;
        const numericId = typeof uid === 'string'
          ? (uid.match(/\d+/) ? parseInt(uid.match(/\d+/)[0]) : 1)
          : uid;
        receipt.modified_by = numericId;
        receipt.modified_on = new Date();
      }
    }
  },
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