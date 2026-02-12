const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');

/**
 * Journal Entry Model
 * Handles journal transactions and accounting entries
 */
const Journal = sequelize.define('jeJournal', {
  je_jeid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Journal Entry ID'
  },
  
  je_entry_no: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Auto-generated entry number'
  },
  
  je_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Journal entry date'
  },
  
  je_account: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Account name'
  },
  
  je_entry_type: {
    type: DataTypes.ENUM('Debit', 'Credit'),
    allowNull: false,
    comment: 'Entry type'
  },
  
  je_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Journal entry amount'
  },
  
  je_narration: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Narration/description'
  },
  
  je_ref_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Reference number'
  },
  
  je_voucher_type: {
    type: DataTypes.ENUM('Cash', 'Bank', 'Contra', 'Purchase', 'Sales', 'Journal'),
    allowNull: false,
    defaultValue: 'Journal',
    comment: 'Voucher type'
  },
  
  je_created_by: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'User ID who created the journal entry'
  },
  
  je_status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Deleted'),
    allowNull: false,
    defaultValue: 'Active',
    comment: 'Journal entry status'
  },
  
  // Audit fields from BaseModel
  ...BaseModel
  
}, {
  tableName: 'jeXjournal',
  timestamps: true,
  indexes: [
    {
      name: 'idx_je_entry_no',
      fields: ['je_entry_no']
    },
    {
      name: 'idx_je_date',
      fields: ['je_date']
    },
    {
      name: 'idx_je_account',
      fields: ['je_account']
    },
    {
      name: 'idx_je_entry_type',
      fields: ['je_entry_type']
    },
    {
      name: 'idx_je_voucher_type',
      fields: ['je_voucher_type']
    },
    {
      name: 'idx_je_created_by',
      fields: ['je_created_by']
    }
  ]
});

// Define associations
Journal.associate = function(models) {
  // Journal entry belongs to user who created it
  Journal.belongsTo(models.User, {
    foreignKey: 'je_created_by',
    targetKey: 'us_usid',
    as: 'creator'
  });
};

module.exports = Journal;