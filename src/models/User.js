const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');
const Role = require('./Role');
const Company = require('./Company');

const User = sequelize.define('usUser', {
  us_usid: {
    type: DataTypes.STRING(15),
    primaryKey: true,
    allowNull: false,
    comment: 'User ID'
  },
  us_fname: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'First Name'
  },
  us_lname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Last Name'
  },
  us_email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Email Address'
  },
  us_phone: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true,
    comment: 'Phone Number'
  },
  us_aadhaar: {
    type: DataTypes.STRING(12),
    allowNull: true,
    unique: true,
    comment: 'Aadhaar Number'
  },
  us_pan: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'PAN Number'
  },
  us_addr1: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Address Line 1'
  },
  us_addr2: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Address Line 2'
  },
  us_city: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'City'
  },
  us_state: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'State'
  },
  us_pin: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'PIN Code'
  },
  us_usertype: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'User Type'
  },
  us_roid: {
    type: DataTypes.STRING(3),
    allowNull: true,
    comment: 'Role ID'
  },
  us_coid: {
    type: DataTypes.STRING(3),
    allowNull: true,
    comment: 'Company ID'
  },
  us_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: 'Active Status'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'usUser',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['us_email']
    },
    {
      unique: true,
      fields: ['us_phone']
    },
    {
      unique: true,
      fields: ['us_aadhaar']
    }
  ]
});

// Define associations
User.belongsTo(Role, {
  foreignKey: 'us_roid',
  targetKey: 'ur_roid'
});

User.belongsTo(Company, {
  foreignKey: 'us_coid',
  targetKey: 'co_coid'
});

module.exports = User;