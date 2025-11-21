const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');

const Role = sequelize.define('urRole', {
  ur_roid: {
    type: DataTypes.STRING(3),
    primaryKey: true,
    allowNull: false,
    comment: 'Role ID'
  },
  ur_roshort: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Role Short Name'
  },
  ur_rodesc: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Role Description'
  },
  ur_dept: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Department'
  },
  ur_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: 'Active Status'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'urRole',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['ur_roshort']
    }
  ]
});

module.exports = Role;