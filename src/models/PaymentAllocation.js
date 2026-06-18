const { DataTypes } = require('sequelize');
const { sequelize } = require('./baseModel');

const PaymentAllocation = sequelize.define('PaymentAllocation', {
  allocation_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    field: 'allocation_id'
  },
  id: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('allocation_id');
    },
    set(val) {
      this.setDataValue('allocation_id', val);
    }
  },
  payment_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'payment_id'
  },
  paymentId: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('payment_id');
    },
    set(val) {
      this.setDataValue('payment_id', val);
    }
  },
  bill_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'bill_id'
  },
  billId: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('bill_id');
    },
    set(val) {
      this.setDataValue('bill_id', val);
    }
  },
  allocated_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'allocated_amount'
  },
  allocatedAmount: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('allocated_amount');
    },
    set(val) {
      this.setDataValue('allocated_amount', val);
    }
  },
  allocation_date: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'allocation_date',
    defaultValue: DataTypes.NOW
  },
  allocatedDate: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('allocation_date');
    },
    set(val) {
      this.setDataValue('allocation_date', val);
    }
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
  tableName: 'payment_allocations',
  timestamps: false,
  indexes: [
    { name: 'idx_payment', fields: ['payment_id'] },
    { name: 'idx_bill', fields: ['bill_id'] }
  ]
});

module.exports = PaymentAllocation;