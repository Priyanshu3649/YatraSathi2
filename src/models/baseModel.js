const { DataTypes } = require('sequelize');
const { sequelizeTVL: sequelize } = require('../../config/db');

// Base model with audit fields
const BaseModel = {
  // Audit fields that should be included in all models
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
  cby: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Closed By'
  },
  cdtm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Closed Date Time'
  }
};

/**
 * Sequelize hooks that auto-populate audit fields when `options.userId` is passed.
 * Usage in model definition:
 *   sequelize.define('myTable', { ...fields, ...BaseModel }, {
 *     ...auditHooks,
 *     tableName: 'myTable',
 *     timestamps: false
 *   });
 */
const auditHooks = {
  hooks: {
    beforeCreate: (record, options) => {
      if (options && options.userId) {
        if (!record.eby)  record.eby  = options.userId;
        if (!record.edtm) record.edtm = new Date();
        record.mby  = options.userId;
        record.mdtm = new Date();
      }
    },
    beforeUpdate: (record, options) => {
      if (options && options.userId) {
        record.mby  = options.userId;
        record.mdtm = new Date();
        // If status changed to a closed value, set closed-by/on
        if (record.changed && record.changed('eby') === false) {
          // check if any status-like field changed to a terminal state
        }
      }
      // Detect close: if cby is being set, stamp cdtm
      if (record.cby && !record.cdtm) {
        record.cdtm = new Date();
      }
    }
  }
};

module.exports = { BaseModel, auditHooks, sequelize };