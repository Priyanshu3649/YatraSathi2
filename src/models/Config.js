const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');

const Config = sequelize.define('cfConfig', {
  cf_cfid: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false,
    comment: 'Config ID'
  },
  cf_cfval: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Config Value'
  },
  cf_cfdesc: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Config Description'
  },
  cf_cftype: {
    type: DataTypes.STRING(20),
    defaultValue: 'STRING',
    comment: 'Config Type'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'cfConfig',
  timestamps: false
});

module.exports = Config;