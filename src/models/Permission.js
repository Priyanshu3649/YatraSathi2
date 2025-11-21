const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');

const Permission = sequelize.define('prPermission', {
  pr_peid: {
    type: DataTypes.STRING(3),
    primaryKey: true,
    allowNull: false,
    comment: 'Permission ID'
  },
  pr_peshort: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    comment: 'Permission Short Name'
  },
  pr_pedesc: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Permission Description'
  },
  pr_module: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Module Name'
  },
  pr_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: 'Active Status'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'prPermission',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['pr_peshort']
    }
  ]
});

module.exports = Permission;