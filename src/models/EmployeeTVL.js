const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const EmployeeTVL = sequelizeTVL.define('emXemployee', {
  em_usid: {
    type: DataTypes.STRING(15),
    primaryKey: true,
    allowNull: false,
    comment: 'Employee User ID'
  },
  em_empno: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    comment: 'Employee Number'
  },

  em_dept: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Employee Department'
  },
  em_salary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Employee Salary'
  },
  em_joindt: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Join Date'
  },
  em_manager: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Manager User ID'
  },
  em_status: {
    type: DataTypes.STRING(15),
    defaultValue: 'ACTIVE',
    comment: 'Employee Status'
  },
  em_address: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Address'
  },
  em_city: {
    type: DataTypes.STRING(30),
    allowNull: true,
    comment: 'City'
  },
  em_state: {
    type: DataTypes.STRING(30),
    allowNull: true,
    comment: 'State'
  },
  em_pincode: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Pincode'
  },
  // Audit fields
  edtm: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    comment: 'Entered Date Time'
  },
  eby: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'Entered By'
  },
  mdtm: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    onUpdate: DataTypes.NOW,
    comment: 'Modified Date Time'
  },
  mby: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Modified By'
  },
  cdtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Closed Date Time'
  },
  cby: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Closed By'
  },
  em_photo: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Employee Photo Path'
  }
}, {
  tableName: 'emXemployee',
  timestamps: false
});

module.exports = EmployeeTVL;

// Define associations after module export to avoid circular dependency issues
const UserTVL = require('./UserTVL');

EmployeeTVL.belongsTo(UserTVL, {
  foreignKey: 'em_usid',
  targetKey: 'us_usid',
  as: 'user'
});