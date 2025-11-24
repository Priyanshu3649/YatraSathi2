// Export all models
const Company = require('./Company');
const Role = require('./Role');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
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
const Session = require('./Session');
const Audit = require('./Audit');
const Config = require('./Config');
const TravelPlan = require('./TravelPlan');

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
Pnr.belongsTo(Booking, { foreignKey: 'pn_bkid', targetKey: 'bk_bkid' });
Pnr.belongsTo(Train, { foreignKey: 'pn_trid', targetKey: 'tr_trid' });
Pnr.hasMany(PaymentAlloc, { foreignKey: 'pa_pnid', sourceKey: 'pn_pnid' });

// Account associations
Account.belongsTo(Booking, { foreignKey: 'ac_bkid', targetKey: 'bk_bkid' });
Account.belongsTo(Customer, { foreignKey: 'ac_usid', targetKey: 'cu_usid' });
Account.hasMany(Payment, { foreignKey: 'pt_acid', sourceKey: 'ac_acid' });

// Payment associations
Payment.belongsTo(Account, { foreignKey: 'pt_acid', targetKey: 'ac_acid' });
Payment.belongsTo(Booking, { foreignKey: 'pt_bkid', targetKey: 'bk_bkid' });
Payment.hasMany(PaymentAlloc, { foreignKey: 'pa_ptid', sourceKey: 'pt_ptid' });

// PaymentAlloc associations
PaymentAlloc.belongsTo(Payment, { foreignKey: 'pa_ptid', targetKey: 'pt_ptid' });
PaymentAlloc.belongsTo(Pnr, { foreignKey: 'pa_pnid', targetKey: 'pn_pnid' });

// Session associations
Session.belongsTo(User, { foreignKey: 'ss_usid', targetKey: 'us_usid' });
Session.belongsTo(Company, { foreignKey: 'ss_coid', targetKey: 'co_coid' });

module.exports = {
  Company,
  Role,
  Permission,
  RolePermission,
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
  Session,
  Audit,
  Config,
  TravelPlan
};