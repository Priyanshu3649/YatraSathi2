const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');
const User = require('./User');

const Login = sequelize.define('lgLogin', {
  lg_usid: {
    type: DataTypes.STRING(15),
    primaryKey: true,
    allowNull: false,
    comment: 'User ID'
  },
  lg_email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Email Address'
  },
  lg_passwd: {
    type: DataTypes.STRING(128),
    allowNull: false,
    comment: 'Password'
  },
  lg_salt: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: 'Salt'
  },
  lg_lastlogin: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last Login Date'
  },
  lg_failcount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Failed Login Count'
  },
  lg_locked: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: 'Account Locked'
  },
  lg_pwdexp: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Password Expiry Date'
  },
  lg_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: 'Active Status'
  },
  lg_reset_token: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: 'Password Reset Token'
  },
  lg_reset_token_expiry: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Password Reset Token Expiry'
  },
  lg_email_verified: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: 'Email Verified Status'
  },
  lg_verification_token: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: 'Email Verification Token'
  },
  lg_verification_token_expiry: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Email Verification Token Expiry'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'lgLogin',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['lg_email']
    }
  ]
});

// Define associations
Login.belongsTo(User, {
  foreignKey: 'lg_usid',
  targetKey: 'us_usid'
});

module.exports = Login;