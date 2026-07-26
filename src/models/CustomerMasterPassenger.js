const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db').sequelizeTVL;

const CustomerMasterPassenger = sequelize.define('CustomerMasterPassenger', {
  cmp_cmpid: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false,
    field: 'cmp_cmpid'
  },
  cmp_cuid: {
    type: DataTypes.STRING(15),
    allowNull: false,
    references: {
      model: 'cuXcustomer',
      key: 'cu_usid'
    },
    field: 'cmp_cuid'
  },
  cmp_firstname: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'cmp_firstname'
  },
  cmp_lastname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'cmp_lastname'
  },
  cmp_age: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'cmp_age'
  },
  cmp_dob: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'cmp_dob'
  },
  cmp_nationality: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'cmp_nationality'
  },
  cmp_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'cmp_phone'
  },
  cmp_email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'cmp_email'
  },
  cmp_last_booking_ref: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'cmp_last_booking_ref'
  },
  cmp_gender: {
    type: DataTypes.ENUM('M', 'F', 'O'),
    allowNull: false,
    field: 'cmp_gender'
  },
  cmp_berthpref: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'cmp_berthpref'
  },
  cmp_idtype: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'cmp_idtype'
  },
  cmp_idnumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'cmp_idnumber'
  },
  cmp_aadhaar: {
    type: DataTypes.STRING(12),
    allowNull: true,
    field: 'cmp_aadhaar'
  },
  cmp_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    allowNull: false,
    field: 'cmp_active'
  },
  cmp_created_by: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'cmp_created_by'
  },
  cmp_modified_by: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'cmp_modified_by'
  }
}, {
  tableName: 'cmpXmasterpassenger',
  timestamps: true,
  createdAt: 'cmp_created_at',
  updatedAt: 'cmp_modified_at',
  underscored: true
});

module.exports = CustomerMasterPassenger;