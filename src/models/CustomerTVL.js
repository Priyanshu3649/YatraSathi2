const { DataTypes } = require('sequelize');
const { sequelizeTVL } = require('../../config/db');

function parseUserIdToInt(id) {
  if (!id) return null;
  if (typeof id === 'number') return id;
  const num = parseInt(String(id).replace(/\D/g, ''));
  return isNaN(num) ? 1 : num;
}

const CustomerTVL = sequelizeTVL.define('cuXcustomer', {
  cu_cusid: {
    type: DataTypes.STRING(15),
    primaryKey: true,
    allowNull: false,
    comment: 'Customer ID'
  },
  cu_usid: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true,
    comment: 'User ID / Customer User ID'
  },
  cu_custno: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Customer Number'
  },
  cu_custtype: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'INDIVIDUAL',
    comment: 'Customer Type'
  },
  cu_compid: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'Company ID (for corporate customers)'
  },
  cu_name: {
    type: DataTypes.STRING(150),
    allowNull: true,
    unique: true,
    comment: 'Customer Full Name (Unique Constraint)'
  },
  // Consolidated user fields directly in cuXcustomer
  us_fname: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'First Name'
  },
  us_lname: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Last Name'
  },
  us_email: {
    type: DataTypes.STRING(120),
    allowNull: true,
    comment: 'Email Address'
  },
  us_phone: {
    type: DataTypes.STRING(30),
    allowNull: true,
    comment: 'Phone Number'
  },
  us_pwd: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Password Hash'
  },
  us_addr1: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Address Line 1'
  },
  us_city: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'City'
  },
  us_state: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'State'
  },
  us_pin: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Pincode'
  },
  us_aadhaar: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Aadhaar Number'
  },
  us_title: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Title'
  },
  cu_creditlimit: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Credit Limit'
  },
  cu_creditdays: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Credit Days'
  },
  cu_discount: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: 'Discount Percentage'
  },
  cu_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: 'Active? (1=Active, 0=Inactive)'
  },
  cu_panno: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'PAN Number'
  },
  cu_gstno: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: 'GST Number'
  },
  cu_servicecharge_config: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Service charge configuration matrix for reservation & cancellation'
  },
  entered_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Entered By User ID'
  },
  entered_on: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Entered On'
  },
  modified_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Modified By User ID'
  },
  modified_on: {
    type: DataTypes.DATE,
    comment: 'Modified On'
  },
  status: {
    type: DataTypes.ENUM('OPEN', 'CLOSED', 'CANCELLED'),
    defaultValue: 'OPEN'
  }
}, {
  sequelize: sequelizeTVL,
  modelName: 'cuXcustomer',
  tableName: 'cuXcustomer',
  timestamps: false,
  getterMethods: {
    fullName() {
      const first = this.us_fname || '';
      const last = this.us_lname || '';
      return `${first} ${last}`.trim() || 'N/A';
    },
    name() {
      const first = this.us_fname || '';
      const last = this.us_lname || '';
      return `${first} ${last}`.trim() || 'N/A';
    },
    phone() {
      return this.us_phone || '';
    },
    email() {
      return this.us_email || '';
    }
  },
  hooks: {
    beforeCreate: (customer, options) => {
      if (options.userId) {
        customer.entered_by = parseUserIdToInt(options.userId);
        customer.entered_on = new Date();
        if (!customer.status) customer.status = 'OPEN';
      }
    },
    beforeUpdate: (customer, options) => {
      if (options.userId) {
        customer.modified_by = parseUserIdToInt(options.userId);
        customer.modified_on = new Date();
      }
    }
  }
});

// Define associations (kept for backwards compatibility)
CustomerTVL.belongsTo(require('./UserTVL'), {
  foreignKey: 'cu_usid',
  targetKey: 'us_usid',
  as: 'user'
});

module.exports = CustomerTVL;