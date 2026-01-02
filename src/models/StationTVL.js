const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const StationTVL = sequelizeTVL.define('stXstation', {
  st_stid: {
    type: DataTypes.STRING(10),
    primaryKey: true,
    allowNull: false,
    comment: 'Station ID'
  },
  st_stcode: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    comment: 'Station Code'
  },
  st_stname: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Station Name'
  },
  st_city: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'City'
  },
  st_state: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'State'
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
  tableName: 'stXstation',
  timestamps: false
});

module.exports = StationTVL;