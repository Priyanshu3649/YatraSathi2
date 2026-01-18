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
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Booking Number'
  },
  bk_usid: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'Customer User ID'
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
    type: DataTypes.STRING(15),
    defaultValue: 'DRAFT',
    comment: 'Booking Status'
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
  }
}, {
  tableName: 'bkXbooking',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['bk_bkno']
    }
  ]
});

module.exports = BookingTVL;