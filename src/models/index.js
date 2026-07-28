const { sequelize, sequelizeTVL } = require('../../config/db');

// Export all models
console.log('Loading models/index.js...');
const Company = require('./Company');
const CompanyTVL = require('./CompanyTVL');
const Role = require('./Role');
const ApplicationTVL = require('./ApplicationTVL');
const ModuleTVL = require('./ModuleTVL');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const RolePermissionTVL = require('./RolePermissionTVL');
const RoleTVL = require('./RoleTVL');
const CorporateCustomer = require('./CorporateCustomer');
const CustomerContact = require('./CustomerContact');
const Booking = require('./Booking');
const Passenger = require('./Passenger');
const Pnr = require('./Pnr');
const PaymentAlloc = require('./PaymentAlloc');
const PaymentAllocTVL = require('./PaymentAllocTVL');
const Session = require('./Session');
const StationBoyPayment = require('./StationBoyPayment');
const Config = require('./Config');
const ReportTemplate = require('./ReportTemplate');
const FinancialTransactionRef = require('./FinancialTransactionRef');
const Audit = require('./Audit');
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
const PermissionTVL = require('./PermissionTVL');
const Ledger = require('./Ledger');
const CustomerAdvanceTVL = require('./CustomerAdvanceTVL');
const YearEndClosingTVL = require('./YearEndClosingTVL');
const BillTVL = require('./BillTVL');
const BillingMaster = require('./BillingMaster');
const PassengerTVL = require('./PassengerTVL');
const MasterPassengerList = require('./MasterPassengerList');
const CustomerMasterPassenger = require('./CustomerMasterPassenger');
const MasterPassengerTVL = require('./MasterPassengerTVL');
const Contra = require('./Contra');
const Receipt = require('./Receipt');
const Journal = require('./Journal');
const ForensicAuditLog = require('./ForensicAuditLog');
const ServiceCharge = require('./ServiceCharge');
const ServiceChargeDefault = require('./ServiceChargeDefault');
const PaymentAllocation = require('./PaymentAllocation');
const CustomerLedger = require('./CustomerLedger');
const StationBoy = require('./StationBoy');

// Map legacy model variables to active TVL models for backwards-compatibility
const User = UserTVL;
const Login = LoginTVL;
const Employee = EmployeeTVL;
const Customer = CustomerTVL;
const Station = StationTVL;
const Train = TrainTVL;
const Account = AccountTVL;
const Payment = require('./Payment');
const CustomerAdvance = CustomerAdvanceTVL;
const YearEndClosing = YearEndClosingTVL;


// Set up associations
// Company associations
Company.hasMany(User, { foreignKey: 'us_coid', sourceKey: 'co_coid' });

// Role associations
Role.hasMany(User, { foreignKey: 'us_roid', sourceKey: 'fn_fnid' });
Role.hasMany(RolePermission, { foreignKey: 'rp_roid', sourceKey: 'fn_fnid' });

// Permission associations
Permission.hasMany(RolePermission, { foreignKey: 'rp_peid', sourceKey: 'op_opid' });

// User associations
User.belongsTo(Role, { foreignKey: 'us_roid', targetKey: 'fn_fnid', as: 'fnXfunction' });
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
Customer.hasMany(Booking, { foreignKey: 'bk_usid', sourceKey: 'cu_usid', as: 'bookings' });
Customer.hasMany(Account, { foreignKey: 'ac_usid', sourceKey: 'cu_usid' });
Customer.hasMany(ServiceCharge, { foreignKey: 'customer_id', sourceKey: 'cu_usid' });
Customer.hasMany(MasterPassengerTVL, { foreignKey: 'mp_usid', sourceKey: 'cu_usid', as: 'masterPassengers' });
ServiceCharge.belongsTo(Customer, { foreignKey: 'customer_id', targetKey: 'cu_usid' });
MasterPassengerTVL.belongsTo(Customer, { foreignKey: 'mp_usid', targetKey: 'cu_usid', as: 'customer' });

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
Booking.hasMany(PassengerTVL, { foreignKey: 'ps_bkid', sourceKey: 'bk_bkid' });
Booking.hasMany(Pnr, { foreignKey: 'pn_bkid', sourceKey: 'bk_bkid' });
Booking.hasOne(Account, { foreignKey: 'ac_bkid', sourceKey: 'bk_bkid' });

// Passenger associations
PassengerTVL.belongsTo(Booking, { foreignKey: 'ps_bkid', targetKey: 'bk_bkid' });
PassengerTVL.belongsTo(Booking, { foreignKey: 'ps_bkid', targetKey: 'bk_bkid', as: 'booking' });
Booking.hasMany(PassengerTVL, { foreignKey: 'ps_bkid', sourceKey: 'bk_bkid', as: 'passengers' });

// TVL Passenger associations
PassengerTVL.belongsTo(BookingTVL, { foreignKey: 'ps_bkid', targetKey: 'bk_bkid', as: 'bookingTVL' });
BookingTVL.hasMany(PassengerTVL, { foreignKey: 'ps_bkid', sourceKey: 'bk_bkid', as: 'passengers' });

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
Account.hasMany(PaymentTVL, { 
  foreignKey: 'pt_acid', 
  sourceKey: 'ac_acid',
  as: 'accountPayments'
});

// PaymentTVL associations
PaymentTVL.belongsTo(Account, { 
  foreignKey: 'pt_acid', 
  targetKey: 'ac_acid',
  as: 'paymentAccount',
  required: false
});
PaymentTVL.belongsTo(Booking, { 
  foreignKey: 'pt_bkid', 
  targetKey: 'bk_bkid',
  as: 'paymentBooking',
  required: false
});

// PaymentAlloc associations (already defined in PaymentAlloc.js, but ensure they're set)
PaymentAlloc.belongsTo(PaymentTVL, { 
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
Ledger.belongsTo(PaymentTVL, { foreignKey: 'lg_ptid', targetKey: 'pt_ptid' });
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

// TrainTVL associations
TrainTVL.associate({ StationTVL });

// ApplicationTVL and ModuleTVL associations
ApplicationTVL.hasMany(ModuleTVL, { foreignKey: 'mo_apid', sourceKey: 'ap_apid', as: 'modules' });
ModuleTVL.belongsTo(ApplicationTVL, { foreignKey: 'mo_apid', targetKey: 'ap_apid', as: 'application' });

BillTVL.belongsTo(BookingTVL, { foreignKey: 'bl_booking_id', targetKey: 'bk_bkid', as: 'booking' });
BookingTVL.hasOne(BillTVL, { foreignKey: 'bl_booking_id', sourceKey: 'bk_bkid', as: 'billing' });
console.log('✅ BillTVL associations defined');

// Payment, Contra, Receipt, and Journal associations
Payment.belongsTo(User, { foreignKey: 'py_created_by', targetKey: 'us_usid', as: 'creator' });
Payment.belongsTo(CustomerTVL, { foreignKey: 'py_cusid', targetKey: 'cu_cusid', as: 'customer' });
CustomerTVL.hasMany(Payment, { foreignKey: 'py_cusid', sourceKey: 'cu_cusid', as: 'payments' });
Contra.belongsTo(User, { foreignKey: 'ct_created_by', targetKey: 'us_usid', as: 'creator' });
Receipt.belongsTo(User, { foreignKey: 'rc_created_by', targetKey: 'us_usid', as: 'creator' });
Journal.belongsTo(User, { foreignKey: 'je_created_by', targetKey: 'us_usid', as: 'creator' });
console.log('✅ Payment, Contra, Receipt, and Journal associations defined');

// ForensicAuditLog associations
ForensicAuditLog.belongsTo(UserTVL, { foreignKey: 'changed_by', targetKey: 'us_usid', as: 'user' });

// CustomerLedger associations
CustomerLedger.belongsTo(CustomerTVL, { foreignKey: 'customer_id', targetKey: 'cu_usid', as: 'customer' });
CustomerTVL.hasMany(CustomerLedger, { foreignKey: 'customer_id', sourceKey: 'cu_usid', as: 'ledgerEntries' });

// PaymentAllocation associations
PaymentAllocation.belongsTo(PaymentTVL, { foreignKey: 'payment_id', targetKey: 'pt_ptid', as: 'payment' });
PaymentAllocation.belongsTo(BillTVL, { foreignKey: 'bill_id', targetKey: 'bl_id', as: 'bill' });
PaymentTVL.hasMany(PaymentAllocation, { foreignKey: 'payment_id', sourceKey: 'pt_ptid', as: 'allocations' });
BillTVL.hasMany(PaymentAllocation, { foreignKey: 'bill_id', sourceKey: 'bl_id', as: 'allocations' });

// Station Boy associations
StationBoy.hasMany(StationBoyPayment, { foreignKey: 'station_boy_id', as: 'payments' });
StationBoyPayment.belongsTo(StationBoy, { foreignKey: 'station_boy_id', as: 'stationBoy' });


module.exports = {
  FinancialTransactionRef,
  Company,
  CompanyTVL,
  Role,
  Permission,
  RolePermission,
  RolePermissionTVL,
  RoleTVL,
  sequelize,
  sequelizeTVL,
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
  ptPayment: PaymentTVL,
  paPaymentAlloc: PaymentAlloc,
  billXbill: BillTVL,
  BillTVL,
  BillingMaster,
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
  PassengerTVL,
  MasterPassengerList,
  MasterPassengerTVL,
  CustomerMasterPassenger,
  ReportTemplate,
  Contra,
  Receipt,
  Journal,
  PermissionTVL,
  ForensicAuditLog,
  ApplicationTVL,
  ModuleTVL,
  ServiceCharge,
  ServiceChargeDefault,
  PaymentAllocation,
  CustomerLedger,
  StationBoy,
  StationBoyPayment
};