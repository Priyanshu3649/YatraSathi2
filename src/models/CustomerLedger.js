const { DataTypes } = require('sequelize');
const { sequelize } = require('./baseModel');

const CustomerLedger = sequelize.define('CustomerLedger', {
  ledger_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    field: 'ledger_id'
  },
  id: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('ledger_id');
    },
    set(val) {
      this.setDataValue('ledger_id', val);
    }
  },
  customer_id: {
    type: DataTypes.STRING(15),
    allowNull: false,
    field: 'customer_id'
  },
  customerId: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('customer_id');
    },
    set(val) {
      this.setDataValue('customer_id', val);
    }
  },
  entry_date: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'entry_date',
    defaultValue: DataTypes.NOW
  },
  transactionDate: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('entry_date');
    },
    set(val) {
      this.setDataValue('entry_date', val);
    }
  },
  entry_type: {
    type: DataTypes.ENUM('BILL', 'PAYMENT', 'PAYMENT_REVERSAL', 'BILL_CANCELLED', 'ADJUSTMENT'),
    allowNull: false,
    field: 'entry_type'
  },
  transactionType: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('entry_type');
    },
    set(val) {
      this.setDataValue('entry_type', val);
    }
  },
  reference_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'reference_type'
  },
  referenceType: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('reference_type');
    },
    set(val) {
      this.setDataValue('reference_type', val);
    }
  },
  reference_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'reference_id'
  },
  referenceId: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('reference_id');
    },
    set(val) {
      this.setDataValue('reference_id', val);
    }
  },
  debit_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'debit_amount'
  },
  debit: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('debit_amount');
    },
    set(val) {
      this.setDataValue('debit_amount', val);
    }
  },
  credit_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'credit_amount'
  },
  credit: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('credit_amount');
    },
    set(val) {
      this.setDataValue('credit_amount', val);
    }
  },
  runningBalance: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('runningBalance') || 0.00;
    },
    set(val) {
      this.setDataValue('runningBalance', val);
    }
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'remarks'
  },
  created_by: {
    type: DataTypes.STRING(15),
    allowNull: true,
    field: 'created_by'
  },
  eby: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('created_by');
    },
    set(val) {
      this.setDataValue('created_by', val);
    }
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  edtm: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('created_at');
    },
    set(val) {
      this.setDataValue('created_at', val);
    }
  }
}, {
  tableName: 'customer_ledger',
  timestamps: false,
  indexes: [
    { name: 'idx_customer', fields: ['customer_id'] },
    { name: 'idx_entry_type', fields: ['entry_type'] },
    { name: 'idx_reference', fields: ['reference_type', 'reference_id'] }
  ]
});

module.exports = CustomerLedger;