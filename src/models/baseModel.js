const { DataTypes } = require('sequelize');
const { sequelizeTVL: sequelize } = require('../../config/db');

// Base model with audit fields — present in ALL tables (eby, edtm, mby, mdtm only)
// NOTE: cby/cdtm are NOT included here because only emXemployee has those columns.
//       Models that need cby/cdtm must declare them explicitly (e.g. EmployeeTVL.js).
const BaseModel = {
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
    comment: 'Modified Date Time'
  },
  mby: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Modified By'
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
      }
    }
  }
};

module.exports = { BaseModel, auditHooks, sequelize };