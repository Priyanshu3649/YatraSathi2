const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const BookingTVL = sequelizeTVL.define('bkXbooking', {
  bk_bkid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Booking ID'
  },
  bk_bkno: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    comment: 'Booking Number'
  },
  bk_usid: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'Customer User ID'
  },
  // MANDATORY: Phone-based customer identification fields
  bk_phonenumber: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Customer Phone Number (10-15 digits)'
  },
  bk_customername: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Customer Name (for quick access)'
  },
  bk_fromst: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'From Station'
  },
  bk_tost: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'To Station'
  },
  bk_trvldt: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Travel Date'
  },
  bk_class: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Travel Class'
  },
  bk_quota: {
    type: DataTypes.STRING(10),
    defaultValue: 'TATKAL',
    comment: 'Quota'
  },
  bk_berthpref: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Berth Preference'
  },
  bk_totalpass: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Total Passengers'
  },
  bk_reqdt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Request Date'
  },
  bk_status: {
    type: DataTypes.ENUM('DRF', 'CNF', 'CAN', 'PND', 'PAD', 'FNL', 'INA'),
    defaultValue: 'DRF',
    comment: 'Booking Status (DRF: Draft, CNF: Confirmed, CAN: Cancelled, PND: Pending, etc.)'
  },
  bk_agent: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Assigned Agent'
  },
  bk_priority: {
    type: DataTypes.STRING(10),
    defaultValue: 'NORMAL',
    comment: 'Booking Priority'
  },
  bk_remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Remarks'
  },
  bk_pnr: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'PNR Number'
  },
  bk_billed: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: 'Billing Status'
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
  entered_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Entered By User ID'
  },
  entered_on: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Entered On'
  },
  modified_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Modified By User ID'
  },
  modified_on: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Modified On'
  },
  closed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Closed By User ID'
  },
  closed_on: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Closed On'
  },
  status: {
    type: DataTypes.ENUM('OPEN', 'CLOSED', 'CANCELLED'),
    defaultValue: 'OPEN',
    comment: 'Record Status'
  }
}, {
  tableName: 'bkXbooking',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['bk_bkno']
    }
  ],
  hooks: {
    beforeCreate: (booking, options) => {
      // Auto-populate audit fields on create if userId is provided
      if (options.userId) {
        booking.entered_by = options.userId;
        booking.entered_on = new Date();
        if (!booking.status) booking.status = 'OPEN';
      }
    },
    beforeUpdate: (booking, options) => {
      // Auto-populate audit fields on update if userId is provided
      if (options.userId) {
        booking.modified_by = options.userId;
        booking.modified_on = new Date();
      }
      
      // If status is being changed to CLOSED or CANCELLED, set closed_by/closed_on
      if (booking.changed('status')) {
        const newStatus = booking.getDataValue('status');
        if (newStatus && ['CLOSED', 'CANCELLED'].includes(newStatus.toUpperCase())) {
          if (options.userId && !booking.closed_by) {
            booking.closed_by = options.userId;
            booking.closed_on = new Date();
          }
        }
      }
    }
  }
});

module.exports = BookingTVL;