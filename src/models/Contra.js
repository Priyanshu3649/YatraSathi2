const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');

/**
 * Contra Entry Model
 * Handles contra transactions between accounts
 */
const Contra = sequelize.define('ctContra', {
  ct_ctid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Contra ID'
  },
  
  ct_entry_no: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Auto-generated entry number'
  },
  
  ct_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Contra date'
  },
  
  ct_from_account: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Source account'
  },
  
  ct_to_account: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Destination account'
  },
  
  ct_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Contra amount'
  },
  
  ct_narration: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Narration/description'
  },
  
  ct_ref_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Reference number'
  },
  
  ct_created_by: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'User ID who created the contra entry'
  },
  
  ct_status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Deleted'),
    allowNull: false,
    defaultValue: 'Active',
    comment: 'Contra status'
  },
  
  // Audit fields from BaseModel
  ...BaseModel
  
}, {
  tableName: 'ctXcontra',
  timestamps: true,
  indexes: [
    {
      name: 'idx_ct_entry_no',
      fields: ['ct_entry_no']
    },
    {
      name: 'idx_ct_date',
      fields: ['ct_date']
    },
    {
      name: 'idx_ct_from_account',
      fields: ['ct_from_account']
    },
    {
      name: 'idx_ct_to_account',
      fields: ['ct_to_account']
    },
    {
      name: 'idx_ct_created_by',
      fields: ['ct_created_by']
    }
  ]
});

// Define associations
Contra.associate = function(models) {
  // Contra belongs to user who created it
  Contra.belongsTo(models.User, {
    foreignKey: 'ct_created_by',
    targetKey: 'us_usid',
    as: 'creator'
  });
};

module.exports = Contra;