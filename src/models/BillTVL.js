const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const BillTVL = sequelizeTVL.define('blXbilling', {
  bl_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Bill ID'
  },
  bl_entry_no: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Entry Number'
  },
  bl_bill_no: {
    type: DataTypes.STRING(30),
    allowNull: true,
    comment: 'Bill Number'
  },
  bl_sub_bill_no: {
    type: DataTypes.STRING(30),
    allowNull: true,
    comment: 'Sub Bill Number'
  },
  bl_booking_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'Booking ID (Foreign Key)'
  },
  bl_billing_date: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Billing Date'
  },
  bl_journey_date: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Journey Date'
  },
  bl_customer_name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    comment: 'Customer Name'
  },
  bl_customer_phone: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'Customer Phone'
  },
  bl_station_boy: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Station Boy Name'
  },
  bl_from_station: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'From Station'
  },
  bl_to_station: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'To Station'
  },
  bl_train_no: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Train Number'
  },
  bl_class: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Reservation Class'
  },
  bl_pnr: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'PNR Number'
  },
  bl_seats_reserved: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Seats Reserved'
  },
  bl_railway_fare: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Railway Fare'
  },
  bl_sb_incentive: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Station Boy Incentive'
  },
  bl_gst: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'GST'
  },
  bl_misc_charges: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Miscellaneous Charges'
  },
  bl_platform_fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Platform Fee'
  },
  bl_service_charge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Service Charge'
  },
  bl_delivery_charge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Delivery Charge'
  },
  bl_cancellation_charge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Cancellation Charge'
  },
  bl_surcharge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Surcharge'
  },
  bl_discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Discount'
  },
  bl_gst_type: {
    type: DataTypes.ENUM('INCLUSIVE', 'EXCLUSIVE', 'C'),
    defaultValue: 'EXCLUSIVE',
    comment: 'GST Type'
  },
  bl_total_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    comment: 'Total Amount'
  },
  bl_is_split: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
    comment: 'Is Split Bill'
  },
  bl_parent_bill_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Parent Bill ID'
  },
  bl_created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Created By User ID'
  },
  bl_created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Created At'
  }
}, {
  tableName: 'blXbilling',
  timestamps: false
});

module.exports = BillTVL;