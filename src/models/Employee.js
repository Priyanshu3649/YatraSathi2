const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');
const User = require('./User');

const Employee = sequelize.define('emEmployee', {
  em_usid: {
    type: DataTypes.STRING(15),
    primaryKey: true,
    allowNull: false,
    comment: 'User ID'
  },
  em_empno: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    comment: 'Employee Number'
  },
  em_designation: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Designation'
  },
  em_dept: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Department'
  },
  em_salary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Salary'
  },
  em_joindt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Join Date'
  },
  em_manager: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Manager User ID'
  },
  em_status: {
    type: DataTypes.STRING(10),
    defaultValue: 'ACTIVE',
    comment: 'Employee Status'
  },
  em_address: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Address'
  },
  em_city: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'City'
  },
  em_state: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'State'
  },
  em_pincode: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Pincode'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'emEmployee',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['em_empno']
    }
  ]
});

// Define associations
Employee.belongsTo(User, {
  foreignKey: 'em_usid',
  targetKey: 'us_usid'
});

Employee.belongsTo(User, {
  foreignKey: 'em_manager',
  targetKey: 'us_usid',
  as: 'manager'
});

module.exports = Employee;