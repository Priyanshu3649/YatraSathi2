const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

/**
 * Payment Allocation Table (TVL Version)
 * 
 * This table links payments to PNRs in the TVL database.
 * Each row = how much of a payment went to which PNR.
 * 
 * NON-NEGOTIABLE: This table is the source of truth for payment allocation.
 * Never delete allocations - only create new ones for adjustments.
 */
const PaymentAllocTVL = sequelizeTVL.define('paXpayalloc', {
  pa_paid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Payment Allocation ID (Primary Key)'
  },
  pa_ptid: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'Payment ID (Foreign Key to ptXpayment)'
  },
  pa_pnid: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'PNR ID (Foreign Key to pnXpnr)'
  },
  pa_pnr: {
    type: DataTypes.STRING(15),
    allowNull: true, // May not be required in TVL version
    comment: 'PNR Number (for quick reference and validation)'
  },
  pa_allocamt: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    comment: 'Allocated Amount (must be <= PNR pending amount)'
  },
  pa_allocdt: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Allocation Date'
  },
  pa_status: {
    type: DataTypes.STRING(15),
    defaultValue: 'ACTIVE',
    allowNull: false,
    comment: 'Allocation Status'
  },
  pa_rmrks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Allocation Remarks'
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
    comment: 'Entered By (User ID who made the allocation)'
  },
  mdtm: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    onUpdate: DataTypes.NOW,
    comment: 'Modification Date Time'
  },
  mby: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Modified By'
  }
}, {
  tableName: 'paXpayalloc',
  timestamps: false,
  indexes: [
    { fields: ['pa_ptid'], name: 'idx_pa_ptid' },
    { fields: ['pa_pnid'], name: 'idx_pa_pnid' },
    { fields: ['pa_pnr'], name: 'idx_pa_pnr' },
    { fields: ['pa_allocdt'], name: 'idx_pa_allocdt' }
  ]
});

module.exports = PaymentAllocTVL;