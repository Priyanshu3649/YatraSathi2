// Export all models
console.log('Loading models/index.js...');
const Company = require('./Company');
const Role = require('./Role');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const RolePermissionTVL = require('./RolePermissionTVL');
const RoleTVL = require('./RoleTVL');
const User = require('./User');
const Login = require('./Login');
const Employee = require('./Employee');
const Customer = require('./Customer');
const CorporateCustomer = require('./CorporateCustomer');
const CustomerContact = require('./CustomerContact');
const Station = require('./Station');
const Train = require('./Train');
const Booking = require('./Booking');
const Passenger = require('./Passenger');
const Pnr = require('./Pnr');
const Account = require('./Account');
const Payment = require('./Payment');
const PaymentAlloc = require('./PaymentAlloc');
const PaymentAllocTVL = require('./PaymentAllocTVL');
const Session = require('./Session');
const Audit = require('./Audit');
const Config = require('./Config');
const TravelPlan = require('./TravelPlan');
const BookingTVL = require('./BookingTVL');
const PaymentTVL = require('./PaymentTVL');
const EmployeeTVL = require('./EmployeeTVL');
const AccountTVL = require('./AccountTVL');
const UserTVL = require('./UserTVL');
const StationTVL = require('./StationTVL');
const TrainTVL = require('./TrainTVL');
const CustomerTVL = require('./CustomerTVL');
const LoginTVL = require('./LoginTVL');
const UserPermissionTVL = require('./UserPermissionTVL');
const Ledger = require('./Ledger');
const CustomerAdvance = require('./CustomerAdvance');
const CustomerAdvanceTVL = require('./CustomerAdvanceTVL');
const YearEndClosing = require('./YearEndClosing');
const YearEndClosingTVL = require('./YearEndClosingTVL');
const BillTVL = require('./BillTVL');
const PassengerTVL = require('./PassengerTVL');

// Set up associations
// Company associations
Company.hasMany(User, { foreignKey: 'us_coid', sourceKey: 'co_coid' });

// Role associations
Role.hasMany(User, { foreignKey: 'us_roid', sourceKey: 'fn_fnid' });
Role.hasMany(RolePermission, { foreignKey: 'rp_roid', sourceKey: 'fn_fnid' });

// Permission associations
Permission.hasMany(RolePermission, { foreignKey: 'rp_peid', sourceKey: 'op_opid' });

// User associations
User.belongsTo(Role, { foreignKey: 'us_roid', targetKey: 'fn_fnid' });
User.belongsTo(Company, { foreignKey: 'us_coid', targetKey: 'co_coid' });
User.hasOne(Login, { foreignKey: 'lg_usid', sourceKey: 'us_usid' });
User.hasOne(Employee, { foreignKey: 'em_usid', sourceKey: 'us_usid' });
User.hasOne(Customer, { foreignKey: 'cu_usid', sourceKey: 'us_usid' });
User.hasOne(CorporateCustomer, { foreignKey: 'cu_usid', sourceKey: 'us_usid' });

// Login associations
Login.belongsTo(User, { foreignKey: 'lg_usid', targetKey: 'us_usid' });

// Employee associations
Employee.belongsTo(User, { foreignKey: 'em_usid', targetKey: 'us_usid' });
Employee.belongsTo(User, { foreignKey: 'em_manager', targetKey: 'us_usid', as: 'employeeManager' });

// Customer associations
Customer.belongsTo(User, { foreignKey: 'cu_usid', targetKey: 'us_usid' });
Customer.hasMany(CustomerContact, { foreignKey: 'cc_usid', sourceKey: 'cu_usid' });
Customer.hasMany(Booking, { foreignKey: 'bk_usid', sourceKey: 'cu_usid' });
Customer.hasMany(Account, { foreignKey: 'ac_usid', sourceKey: 'cu_usid' });

// CorporateCustomer associations
CorporateCustomer.belongsTo(User, { foreignKey: 'cu_usid', targetKey: 'us_usid' });

// CustomerContact associations
CustomerContact.belongsTo(Customer, { foreignKey: 'cc_usid', targetKey: 'cu_usid' });

// Station associations
Station.hasMany(Booking, { foreignKey: 'bk_fromst', sourceKey: 'st_stid', as: 'originBookings' });
Station.hasMany(Booking, { foreignKey: 'bk_tost', sourceKey: 'st_stid', as: 'destinationBookings' });

// Train associations
Train.hasMany(Pnr, { foreignKey: 'pn_trid', sourceKey: 'tr_trid' });

// Booking associations
Booking.belongsTo(Customer, { foreignKey: 'bk_usid', targetKey: 'cu_usid' });
Booking.belongsTo(Employee, { foreignKey: 'bk_agent', targetKey: 'em_usid' });
Booking.belongsTo(Station, { foreignKey: 'bk_fromst', targetKey: 'st_stid', as: 'originStation' });
Booking.belongsTo(Station, { foreignKey: 'bk_tost', targetKey: 'st_stid', as: 'destinationStation' });
Booking.hasMany(Passenger, { foreignKey: 'ps_bkid', sourceKey: 'bk_bkid' });
Booking.hasMany(Pnr, { foreignKey: 'pn_bkid', sourceKey: 'bk_bkid' });
Booking.hasOne(Account, { foreignKey: 'ac_bkid', sourceKey: 'bk_bkid' });

// Passenger associations
Passenger.belongsTo(Booking, { foreignKey: 'ps_bkid', targetKey: 'bk_bkid' });

// Pnr associations
Pnr.belongsTo(Booking, { 
  foreignKey: 'pn_bkid', 
  targetKey: 'bk_bkid',
  as: 'pnrBooking'
});
Pnr.belongsTo(Train, { 
  foreignKey: 'pn_trid', 
  targetKey: 'tr_trid',
  as: 'pnrTrain'
});
Pnr.hasMany(PaymentAlloc, { 
  foreignKey: 'pa_pnid', 
  sourceKey: 'pn_pnid',
  as: 'allocations'
});
Pnr.hasMany(Ledger, { 
  foreignKey: 'lg_pnid', 
  sourceKey: 'pn_pnid'
});

// Account associations
Account.belongsTo(Booking, { 
  foreignKey: 'ac_bkid', 
  targetKey: 'bk_bkid',
  as: 'accountBooking'
});
Account.belongsTo(Customer, { 
  foreignKey: 'ac_usid', 
  targetKey: 'cu_usid',
  as: 'accountCustomer'
});
Account.hasMany(Payment, { 
  foreignKey: 'pt_acid', 
  sourceKey: 'ac_acid',
  as: 'accountPayments'
});

// Payment associations
Payment.belongsTo(Account, { 
  foreignKey: 'pt_acid', 
  targetKey: 'ac_acid',
  as: 'paymentAccount',
  required: false
});
Payment.belongsTo(Booking, { 
  foreignKey: 'pt_bkid', 
  targetKey: 'bk_bkid',
  as: 'paymentBooking',
  required: false
});

// PaymentAlloc associations (already defined in PaymentAlloc.js, but ensure they're set)
PaymentAlloc.belongsTo(Payment, { 
  foreignKey: 'pa_ptid', 
  targetKey: 'pt_ptid',
  as: 'payment'
});
PaymentAlloc.belongsTo(Pnr, { 
  foreignKey: 'pa_pnid', 
  targetKey: 'pn_pnid',
  as: 'pnr'
});

// Ledger associations
Ledger.belongsTo(Payment, { foreignKey: 'lg_ptid', targetKey: 'pt_ptid' });
Ledger.belongsTo(Pnr, { foreignKey: 'lg_pnid', targetKey: 'pn_pnid' });
Ledger.belongsTo(Account, { foreignKey: 'lg_acid', targetKey: 'ac_acid' });

// Session associations
Session.belongsTo(User, { foreignKey: 'ss_usid', targetKey: 'us_usid' });
Session.belongsTo(Company, { foreignKey: 'ss_coid', targetKey: 'co_coid' });

// TVL Associations
// CustomerTVL associations
// CustomerTVL association with UserTVL is defined in CustomerTVL.js

// EmployeeTVL associations
// EmployeeTVL association with UserTVL is defined in EmployeeTVL.js
EmployeeTVL.belongsTo(EmployeeTVL, { foreignKey: 'em_manager', targetKey: 'em_usid', as: 'manager' });

// UserTVL associations
UserTVL.belongsTo(RoleTVL, { foreignKey: 'us_roid', targetKey: 'fn_fnid', as: 'fnXfunction' });

// TrainTVL associations
TrainTVL.associate({ StationTVL });

module.exports = {
  Company,
  Role,
  Permission,
  RolePermission,
  RolePermissionTVL,
  RoleTVL,
  User,
  Login,
  Employee,
  Customer,
  CorporateCustomer,
  CustomerContact,
  Station,
  Train,
  Booking,
  Passenger,
  Pnr,
  Account,
  Payment,
  PaymentAlloc,
  // Export with table name alias for consistency
  pnXpnr: Pnr,  ptXpayment: PaymentTVL,
  paXpayalloc: PaymentAllocTVL,
  ptPayment: Payment,
  paPaymentAlloc: PaymentAlloc,
  billXbill: BillTVL,
  BillTVL,
  Session,
  Audit,
  Config,
  TravelPlan,
  EmployeeTVL,
  AccountTVL,
  UserTVL,
  StationTVL,
  TrainTVL,
  CustomerTVL,
  LoginTVL,
  BookingTVL,
  PaymentTVL,
  UserPermissionTVL,
  RolePermissionTVL,
  Ledger,
  CustomerAdvance,
  CustomerAdvanceTVL,
  YearEndClosing,
  YearEndClosingTVL,
  PassengerTVL
};