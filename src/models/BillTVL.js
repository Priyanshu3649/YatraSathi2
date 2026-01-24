const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const BillTVL = sequelizeTVL.define('billXbill', {
  bill_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Bill ID'
  },
  bill_no: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Bill Number'
  },
  booking_id: {
    type: DataTypes.BIGINT,
    allowNull: true, // Can be null for ad-hoc bills if allowed, but requirement says "Billing cannot be created manually", implying linkage. Keeping true for safety unless strict.
    comment: 'Booking ID (Foreign Key)'
  },
  customer_id: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'Customer ID'
  },
  customer_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Customer Name'
  },
  train_number: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Train Number'
  },
  reservation_class: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Reservation Class'
  },
  ticket_type: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Ticket Type (NORMAL, TATKAL, PREMIUM_TATKAL)'
  },
  pnr_numbers: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'PNR Numbers (JSON array)'
  },
  net_fare: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: 'Net Journey Fare'
  },
  service_charges: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: 'Service Charges'
  },
  platform_fees: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: 'Platform Fees'
  },
  agent_fees: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: 'Agent Fees'
  },
  extra_charges: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Extra Charges (JSON array)'
  },
  discounts: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Discounts (JSON array)'
  },
  total_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: 'Total Amount'
  },
  bill_date: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Bill Date'
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'DRAFT',
    comment: 'Bill Status (DRAFT, FINAL, PAID, PARTIAL)'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Remarks'
  },
  created_by: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'Created By User ID'
  },
  created_on: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    comment: 'Created On Date Time'
  },
  modified_by: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Modified By User ID'
  },
  modified_on: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
    comment: 'Modified On Date Time'
  },
  closed_by: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Closed By User ID'
  },
  closed_on: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Closed On Date Time'
  }
}, {
  tableName: 'billXbill',
  timestamps: false
});

module.exports = BillTVL;