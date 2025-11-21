const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');
const User = require('./User');

const TravelPlan = sequelize.define('tpTravelPlan', {
  tp_tpid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Travel Plan ID'
  },
  tp_title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Travel Plan Title'
  },
  tp_description: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Travel Plan Description'
  },
  tp_startdate: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Start Date'
  },
  tp_enddate: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'End Date'
  },
  tp_destination: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Destination'
  },
  tp_budget: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    comment: 'Budget'
  },
  tp_activities: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Activities'
  },
  tp_usid: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'User ID'
  },
  tp_ispublic: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: 'Is Public (0 = private, 1 = public)'
  },
  tp_sharedwith: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Shared With User IDs (JSON array)'
  },
  // Audit fields
  ...BaseModel
}, {
  tableName: 'tpTravelPlan',
  timestamps: false
});

// Define associations
TravelPlan.belongsTo(User, {
  foreignKey: 'tp_usid',
  targetKey: 'us_usid'
});

module.exports = TravelPlan;