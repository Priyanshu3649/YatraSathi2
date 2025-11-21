const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');

const Train = sequelize.define('trTrain', {
  tr_trid: {
    type: DataTypes.STRING(10),
    primaryKey: true,
    allowNull: false,
    comment: 'Train ID'
  },
  tr_trno: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    comment: 'Train Number'
  },
  tr_trname: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Train Name'
  },
  tr_fromst: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'From Station'
  },
  tr_tost: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'To Station'
  },
  tr_deptime: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Departure Time'
  },
  tr_arrtime: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Arrival Time'
  },
  tr_distance: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    comment: 'Distance'
  },
  tr_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: 'Active Status'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'trTrain',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['tr_trno']
    }
  ]
});

module.exports = Train;