const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');

const Station = sequelize.define('stStation', {
  st_stid: {
    type: DataTypes.STRING(10),
    primaryKey: true,
    allowNull: false,
    comment: 'Station ID'
  },
  st_stcode: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    comment: 'Station Code'
  },
  st_stname: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Station Name'
  },
  st_city: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'City'
  },
  st_state: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'State'
  },
  st_zone: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Railway Zone'
  },
  st_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: 'Active Status'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'stStation',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['st_stcode']
    }
  ]
});

module.exports = Station;