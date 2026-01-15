const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db').sequelizeTVL;

const MasterPassengerList = sequelize.define('mlXmasterlist', {
  ml_mlid: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false,
    field: 'ml_mlid'
  },
  ml_cuid: {
    type: DataTypes.STRING(20),
    allowNull: false,
    references: {
      model: 'cuXcustomer',
      key: 'cu_usid'
    },
    field: 'ml_cuid'
  },
  ml_firstname: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'ml_firstname'
  },
  ml_lastname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'ml_lastname'
  },
  ml_age: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'ml_age'
  },
  ml_gender: {
    type: DataTypes.ENUM('M', 'F', 'O'),
    allowNull: false,
    field: 'ml_gender'
  },
  ml_berthpref: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'ml_berthpref'
  },
  ml_idtype: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'ml_idtype'
  },
  ml_idnumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'ml_idnumber'
  },
  ml_aadhaar: {
    type: DataTypes.STRING(12),
    allowNull: true,
    field: 'ml_aadhaar'
  },
  ml_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    allowNull: false,
    field: 'ml_active'
  },
  ml_created_by: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'ml_created_by'
  },
  ml_modified_by: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'ml_modified_by'
  }
}, {
  tableName: 'mlXmasterlist',
  timestamps: true,
  createdAt: 'ml_created_at',
  updatedAt: 'ml_modified_at',
  underscored: true
});

module.exports = MasterPassengerList;