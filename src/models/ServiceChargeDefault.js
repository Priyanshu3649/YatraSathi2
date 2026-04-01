const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

/**
 * Service Charge Default Model
 * Defines fallback charging rules when no customer-specific rule is found.
 */
const ServiceChargeDefault = sequelizeTVL.define('service_charges_default', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  service_type: {
    type: DataTypes.ENUM('RESERVATION', 'CANCELLATION'),
    allowNull: false,
    defaultValue: 'RESERVATION'
  },
  travel_class: {
    type: DataTypes.ENUM('SL', '3A', '2A', '1A', 'CC', '2S'),
    allowNull: false,
    comment: 'Reservation class'
  },
  charge_mode: {
    type: DataTypes.ENUM('FIXED', 'PER_PASSENGER'),
    allowNull: false,
    defaultValue: 'FIXED'
  },
  passenger_min: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  passenger_max: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'NULL means no upper limit (e.g. 6+)'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  // Standard project audit fields
  entered_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  entered_on: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  modified_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  modified_on: {
    type: DataTypes.DATE,
    allowNull: true
  },
  closed_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  closed_on: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'service_charges_default',
  timestamps: false,
  hooks: {
    beforeCreate: (record, options) => {
      if (options.userId) {
        record.entered_by = options.userId;
        record.entered_on = new Date();
      }
    },
    beforeUpdate: (record, options) => {
      if (options.userId) {
        record.modified_by = options.userId;
        record.modified_on = new Date();
      }
      if (record.changed('is_active') && record.is_active === false) {
        if (options.userId && !record.closed_by) {
          record.closed_by = options.userId;
          record.closed_on = new Date();
        }
      }
    }
  }
});

module.exports = ServiceChargeDefault;
