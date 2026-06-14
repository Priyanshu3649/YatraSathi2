const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const CompanyTVL = sequelizeTVL.define('coCompany', {
  co_coid: {
    type: DataTypes.STRING(3),
    primaryKey: true,
    allowNull: false,
    comment: 'Company ID'
  },
  co_coidb: {
    type: DataTypes.STRING(3),
    allowNull: true,
    comment: 'Base Company ID'
  },
  co_coshort: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true,
    comment: 'Company Short Name'
  },
  co_codesc: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Company Description'
  },
  co_addr1: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Address Line 1'
  },
  co_addr2: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Address Line 2'
  },
  co_city: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'City'
  },
  co_state: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'State'
  },
  co_pin: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'PIN Code'
  },
  co_phone: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Phone Number'
  },
  co_email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Email Address'
  },
  co_gst: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'GST Number'
  },
  co_pan: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'PAN Number'
  },
  co_rmrks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Remarks'
  },
  co_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: 'Active Status'
  },
  co_cdtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Closed Date Time'
  },
  co_cby: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Closed By'
  },
  // Audit fields
  edtm: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: true,
    comment: 'Entered Date Time'
  },
  eby: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Entered By'
  },
  mdtm: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: true,
    onUpdate: DataTypes.NOW,
    comment: 'Modified Date Time'
  },
  mby: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Modified By'
  }
}, {
  tableName: 'coCompany',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['co_coshort']
    }
  ]
});

// Define self-referencing foreign key
CompanyTVL.belongsTo(CompanyTVL, {
  foreignKey: 'co_coidb',
  as: 'baseCompany'
});

module.exports = CompanyTVL;
