const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const TravelPlanTVL = sequelizeTVL.define('tvXtravelplan', {
  tp_planid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Travel Plan ID'
  },
  tp_planid_str: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Travel Plan ID String (auto-generated)'
  },
  tp_status: {
    type: DataTypes.STRING(20),
    defaultValue: 'Draft',
    comment: 'Plan Status (Draft/Active/Closed)'
  },
  tp_packagename: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Package Name'
  },
  tp_packagecode: {
    type: DataTypes.STRING(50),
    comment: 'Package Code'
  },
  tp_startdate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Start Date'
  },
  tp_starttime: {
    type: DataTypes.TIME,
    comment: 'Start Time'
  },
  tp_enddate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'End Date'
  },
  tp_endtime: {
    type: DataTypes.TIME,
    comment: 'End Time'
  },
  tp_sourcecity: {
    type: DataTypes.STRING(100),
    comment: 'Source City'
  },
  tp_destcity: {
    type: DataTypes.STRING(100),
    comment: 'Destination City'
  },
  tp_duration: {
    type: DataTypes.STRING(20),
    comment: 'Duration (calculated)'
  },
  tp_baseprice: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Base Package Price'
  },
  tp_pricebasis: {
    type: DataTypes.STRING(20),
    defaultValue: 'Per Person',
    comment: 'Price Basis (Per Person/Per Group)'
  },
  tp_tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Tax Amount'
  },
  tp_discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Discount Amount'
  },
  tp_finalamount: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Final Package Amount'
  },
  tp_inclusions: {
    type: DataTypes.JSON,
    comment: 'Package Inclusions (JSON format)'
  },
  tp_destinations: {
    type: DataTypes.JSON,
    comment: 'Destinations Covered (Array)'
  },
  tp_itinerary: {
    type: DataTypes.TEXT,
    comment: 'Detailed Itinerary'
  },
  tp_terms: {
    type: DataTypes.TEXT,
    comment: 'Terms & Conditions'
  },
  tp_cancellation: {
    type: DataTypes.TEXT,
    comment: 'Cancellation Policy'
  },
  tp_notes: {
    type: DataTypes.TEXT,
    comment: 'Additional Notes'
  },
  tp_maxseats: {
    type: DataTypes.INTEGER,
    comment: 'Maximum Seats/Capacity'
  },
  tp_minparticipants: {
    type: DataTypes.INTEGER,
    comment: 'Minimum Participants Required'
  },
  tp_agelimit: {
    type: DataTypes.STRING(100),
    comment: 'Age Restrictions'
  },
  tp_applydeadline: {
    type: DataTypes.DATEONLY,
    comment: 'Last Date to Apply'
  },
  tp_visible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Visible to Customers'
  },
  tp_notifyall: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Notify All Customers'
  },
  tp_notifygroups: {
    type: DataTypes.JSON,
    comment: 'Selected Customer Groups for Notification'
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
  }
}, {
  tableName: 'tvXtravelplan',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['tp_planid_str']
    }
  ]
});

module.exports = TravelPlanTVL;