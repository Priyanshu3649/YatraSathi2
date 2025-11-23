const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');
const User = require('./User');
const Company = require('./Company');

const Session = sequelize.define('ssSession', {
  ss_start: {
    type: DataTypes.DATE,
    primaryKey: true,
    allowNull: false,
    comment: 'Session Start Time'
  },
  ss_ssid: {
    type: DataTypes.STRING(128),
    primaryKey: true,
    allowNull: false,
    comment: 'Session ID'
  },
  ss_usid: {
    type: DataTypes.STRING(15),
    primaryKey: true,
    allowNull: false,
    comment: 'User ID'
  },
  ss_coid: {
    type: DataTypes.STRING(3),
    allowNull: true,
    comment: 'Company ID'
  },
  ss_ipaddr: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP Address'
  },
  ss_useragent: {
    type: DataTypes.STRING(512),
    allowNull: true,
    comment: 'User Agent'
  },
  ss_token: {
    type: DataTypes.STRING(512),
    allowNull: true,
    comment: 'Session Token (JWT can be long)'
  },
  ss_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: 'Active Status'
  },
  ss_lastact: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Last Activity'
  },
  ss_end: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Session End Time'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'ssSession',
  timestamps: false
});

// Define associations
Session.belongsTo(User, {
  foreignKey: 'ss_usid',
  targetKey: 'us_usid'
});

Session.belongsTo(Company, {
  foreignKey: 'ss_coid',
  targetKey: 'co_coid'
});

module.exports = Session;