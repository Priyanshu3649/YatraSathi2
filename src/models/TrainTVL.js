const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

const TrainTVL = sequelizeTVL.define('trXtrain', {
  tr_trid: {
    type: DataTypes.STRING(10),
    primaryKey: true,
    allowNull: false,
    comment: 'Train ID'
  },
  tr_trno: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    comment: 'Train Number'
  },
  tr_trname: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Train Name'
  },
  tr_fromst: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'From Station Code'
  },
  tr_tost: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'To Station Code'
  },
  tr_days: {
    type: DataTypes.STRING(7),
    allowNull: true,
    comment: 'Days of Operation (7-char string)'
  },
  tr_ac1: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'AC First Class Seats'
  },
  tr_ac2: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'AC Second Class Seats'
  },
  tr_ac3: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'AC Third Class Seats'
  },
  tr_sl: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Sleeper Class Seats'
  },
  tr_gen: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'General Seats'
  },
  tr_ac1fare: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'AC First Class Fare'
  },
  tr_ac2fare: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'AC Second Class Fare'
  },
  tr_ac3fare: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'AC Third Class Fare'
  },
  tr_slfare: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Sleeper Class Fare'
  },
  tr_genfare: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'General Fare'
  },
  tr_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: 'Active? (1=Active, 0=Inactive)'
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
  tableName: 'trXtrain',
  timestamps: false
});

// Define associations
TrainTVL.associate = function(models) {
  // Association for 'from' station
  TrainTVL.belongsTo(models.StationTVL, {
    foreignKey: 'tr_fromst',
    targetKey: 'st_stcode',
    as: 'fromStation'
  });
  
  // Association for 'to' station
  TrainTVL.belongsTo(models.StationTVL, {
    foreignKey: 'tr_tost',
    targetKey: 'st_stcode',
    as: 'toStation'
  });
};

module.exports = TrainTVL;