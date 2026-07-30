const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const BillTVL = sequelizeTVL.define('blXbilling', {
  bl_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Bill ID'
  },
  bl_entry_no: {
    type: DataTypes.STRING(30),
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
  station_boy_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Station Boy ID'
  },
  station_boy_name_snapshot: {
    type: DataTypes.STRING(150),
    allowNull: true,
    comment: 'Station Boy Name Snapshot'
  },
  station_boy_incentive_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Station Boy Incentive Amount'
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
  bl_advance_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Advance Amount Received'
  },
  bl_payment_mode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Payment Mode for Advance (e.g., CASH, UPI)'
  },
  bl_payment_reference: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'UTR or Reference Number for Advance Payment'
  },
  bl_bill_type: {
    type: DataTypes.ENUM('PRIMARY', 'CANCELLED_SPLIT'),
    defaultValue: 'PRIMARY',
    comment: 'Type of bill (PRIMARY or CANCELLED_SPLIT)'
  },
  bl_passenger_ids: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of active passenger IDs (ps_psid) included in this bill'
  },
  split_audit_log: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Immutable log of split events and references to newly created bills'
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
  bl_is_merged: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
    comment: 'Is Merged Bill'
  },
  bl_merged_into_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'ID of the bill this was merged into'
  },
  super_bill_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'Super Bill ID for combined printing'
  },
  bl_special_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Special Tracking ID for Client Organizations'
  },
  is_deleted: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0,
    comment: 'Soft delete flag (0=Active, 1=Deleted)'
  },
  bl_created_by: {
    type: DataTypes.STRING(30),
    allowNull: true,
    comment: 'Created By User ID'
  },
  bl_created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Created At'
  },
  // Standard audit fields
  entered_by: {
    type: DataTypes.STRING(30),
    allowNull: true,
    comment: 'User ID who created the record'
  },
  entered_on: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Timestamp when record was created'
  },
  modified_by: {
    type: DataTypes.STRING(30),
    allowNull: true,
    comment: 'User ID who last modified the record'
  },
  modified_on: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when record was last modified'
  },
  closed_by: {
    type: DataTypes.STRING(30),
    allowNull: true,
    comment: 'User ID who closed the record'
  },
  closed_on: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when record was closed'
  },
  status: {
    type: DataTypes.ENUM('OPEN', 'CLOSED', 'CANCELLED', 'DRAFT', 'FINAL', 'PAID', 'CNF', 'CAN'),
    defaultValue: 'OPEN',
    comment: 'Record status'
  },
  bl_railway_cancellation_charge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  bl_agent_cancellation_charge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  bl_station_boy_cancellation_charge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total_cancel_charges: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  refund_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  payment_status: {
    type: DataTypes.ENUM('UNPAID', 'PARTIALLY_PAID', 'FULLY_PAID', 'REFUND_DUE'),
    defaultValue: 'UNPAID'
  },
  is_cancelled: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  cancellation_data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Nested object for cancellation form data'
  },
  cancellation_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelled_on: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelled_by: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  bl_cancellation_remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  bl_status: {
    type: DataTypes.ENUM('DRAFT', 'CONFIRMED', 'CANCELLED', 'PENDING', 'PAID', 'FINAL', 'CNF', 'CAN'),
    defaultValue: 'CNF',
    comment: 'Billing status'
  },
  bl_modified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  bl_bill_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  bl_booking_no: {
    type: DataTypes.STRING(30),
    allowNull: true
  }
}, {
  tableName: 'blXbilling',
  timestamps: false,
  hooks: {
    beforeCreate: (bill, options) => {
      // Auto-populate audit fields on create if userId is provided
      if (options.userId) {
        bill.entered_by = options.userId;
        bill.entered_on = new Date();
        bill.bl_created_by = options.userId;
        bill.bl_created_at = new Date();
        if (!bill.status) bill.status = 'OPEN';
      }
    },
    beforeUpdate: (bill, options) => {
      // Auto-populate audit fields on update if userId is provided
      if (options.userId) {
        bill.modified_by = options.userId;
        bill.modified_on = new Date();
        bill.bl_modified_at = new Date();
      }
      
      // If status is being changed to CLOSED or CANCELLED, set closed_by/closed_on
      if (bill.changed('status')) {
        const newStatus = bill.getDataValue('status');
        if (newStatus && ['CLOSED', 'CANCELLED'].includes(newStatus.toUpperCase())) {
          if (options.userId && !bill.closed_by) {
            bill.closed_by = options.userId;
            bill.closed_on = new Date();
          }
        }
      }
    }
  }
});

module.exports = BillTVL;