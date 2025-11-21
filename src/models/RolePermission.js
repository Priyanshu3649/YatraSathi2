const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');
const Role = require('./Role');
const Permission = require('./Permission');

const RolePermission = sequelize.define('rpRolePermission', {
  rp_roid: {
    type: DataTypes.STRING(3),
    allowNull: false,
    comment: 'Role ID'
  },
  rp_peid: {
    type: DataTypes.STRING(3),
    allowNull: false,
    comment: 'Permission ID'
  },
  rp_canview: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: 'Can View'
  },
  rp_canadd: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: 'Can Add'
  },
  rp_canmod: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: 'Can Modify'
  },
  rp_candel: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: 'Can Delete'
  },
  rp_limit: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: 'Transaction Limit'
  },
  rp_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: 'Active Status'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'rpRolePermission',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['rp_roid', 'rp_peid']
    }
  ]
});

// Define associations
RolePermission.belongsTo(Role, {
  foreignKey: 'rp_roid',
  targetKey: 'ur_roid'
});

RolePermission.belongsTo(Permission, {
  foreignKey: 'rp_peid',
  targetKey: 'pr_peid',
  as: 'Permission'  // Add alias for the association
});

module.exports = RolePermission;