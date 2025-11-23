const { connectDB } = require('../../config/db');
const { 
  Company, Role, Permission, RolePermission, Station, Train, User, Login, Employee, Customer, Booking, Passenger, Pnr, Account, Payment, PaymentAlloc, Session, Audit, Config, TravelPlan, CorporateCustomer, CustomerContact
} = require('../models');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    // Connect to database
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected successfully');

    // Clear existing data (in development) - disable foreign key checks for MySQL
    console.log('Clearing existing data...');
    const { sequelize } = require('../../config/db');
    
    // Disable foreign key checks for MySQL
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Delete all data from tables
    await PaymentAlloc.destroy({ where: {}, force: true });
    await Payment.destroy({ where: {}, force: true });
    await Account.destroy({ where: {}, force: true });
    await Pnr.destroy({ where: {}, force: true });
    await Passenger.destroy({ where: {}, force: true });
    await Booking.destroy({ where: {}, force: true });
    await TravelPlan.destroy({ where: {}, force: true });
    await CustomerContact.destroy({ where: {}, force: true });
    await CorporateCustomer.destroy({ where: {}, force: true });
    await Customer.destroy({ where: {}, force: true });
    await Employee.destroy({ where: {}, force: true });
    await Session.destroy({ where: {}, force: true });
    await Login.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await RolePermission.destroy({ where: {}, force: true });
    await Permission.destroy({ where: {}, force: true });
    await Role.destroy({ where: {}, force: true });
    await Train.destroy({ where: {}, force: true });
    await Station.destroy({ where: {}, force: true });
    await Company.destroy({ where: {}, force: true });
    await Audit.destroy({ where: {}, force: true });
    await Config.destroy({ where: {}, force: true });
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Existing data cleared');

    console.log('Creating sample company...');
    const company = await Company.create({
      co_coid: 'TRV',
      co_coshort: 'TravelCorp',
      co_codesc: 'Travel Corporation Ltd',
      co_city: 'Mumbai',
      co_state: 'Maharashtra',
      eby: 'ADMIN',
      mby: 'ADMIN'
    });

    console.log('Creating user roles...');
    const roles = await Role.bulkCreate([
      { ur_roid: 'ADM', ur_roshort: 'ADMIN', ur_rodesc: 'System Administrator', ur_dept: 'ADMIN', eby: 'SYSTEM', mby: 'SYSTEM' },
      { ur_roid: 'ACC', ur_roshort: 'ACCOUNTS', ur_rodesc: 'Accounts Team Member', ur_dept: 'ACCOUNTS', eby: 'ADMIN', mby: 'ADMIN' },
      { ur_roid: 'AGT', ur_roshort: 'AGENT', ur_rodesc: 'Booking Agent', ur_dept: 'AGENT', eby: 'ADMIN', mby: 'ADMIN' },
      { ur_roid: 'CCT', ur_roshort: 'CALLCENTER', ur_rodesc: 'Call Center Executive', ur_dept: 'CALL', eby: 'ADMIN', mby: 'ADMIN' },
      { ur_roid: 'MKT', ur_roshort: 'MARKETING', ur_rodesc: 'Marketing Executive', ur_dept: 'MARKETING', eby: 'ADMIN', mby: 'ADMIN' },
      { ur_roid: 'CUS', ur_roshort: 'CUSTOMER', ur_rodesc: 'Customer', ur_dept: 'CUSTOMER', eby: 'SYSTEM', mby: 'SYSTEM' }
    ]);

    console.log('Creating permissions...');
    const permissions = await Permission.bulkCreate([
      { pr_peid: 'USR', pr_peshort: 'USER_MGMT', pr_pedesc: 'User Management', pr_module: 'USER', eby: 'ADMIN', mby: 'ADMIN' },
      { pr_peid: 'BKG', pr_peshort: 'BOOKING_MGMT', pr_pedesc: 'Booking Management', pr_module: 'BOOKING', eby: 'ADMIN', mby: 'ADMIN' },
      { pr_peid: 'ACC', pr_peshort: 'ACCOUNTS_MGMT', pr_pedesc: 'Accounts Management', pr_module: 'ACCOUNTS', eby: 'ADMIN', mby: 'ADMIN' },
      { pr_peid: 'RPT', pr_peshort: 'REPORTS', pr_pedesc: 'Reports and Analytics', pr_module: 'REPORTS', eby: 'ADMIN', mby: 'ADMIN' },
      { pr_peid: 'CFG', pr_peshort: 'CONFIG', pr_pedesc: 'System Configuration', pr_module: 'ADMIN', eby: 'ADMIN', mby: 'ADMIN' }
    ]);

    console.log('Creating role-permission mappings...');
    // Create role permissions one by one to avoid SQLite composite key issues
    const rolePermissions = [];
    const rolePermissionData = [
      // Admin has all permissions
      { rp_roid: 'ADM', rp_peid: 'USR', rp_canview: 1, rp_canadd: 1, rp_canmod: 1, rp_candel: 1, eby: 'ADMIN', mby: 'ADMIN' },
      { rp_roid: 'ADM', rp_peid: 'BKG', rp_canview: 1, rp_canadd: 1, rp_canmod: 1, rp_candel: 1, eby: 'ADMIN', mby: 'ADMIN' },
      { rp_roid: 'ADM', rp_peid: 'ACC', rp_canview: 1, rp_canadd: 1, rp_canmod: 1, rp_candel: 1, eby: 'ADMIN', mby: 'ADMIN' },
      { rp_roid: 'ADM', rp_peid: 'RPT', rp_canview: 1, rp_canadd: 1, rp_canmod: 1, rp_candel: 1, eby: 'ADMIN', mby: 'ADMIN' },
      { rp_roid: 'ADM', rp_peid: 'CFG', rp_canview: 1, rp_canadd: 1, rp_canmod: 1, rp_candel: 1, eby: 'ADMIN', mby: 'ADMIN' }
    ];

    for (const data of rolePermissionData) {
      const rolePermission = await RolePermission.create(data);
      rolePermissions.push(rolePermission);
    }

    console.log('Creating sample stations...');
    const stations = await Station.bulkCreate([
      { st_stid: 'ST001', st_stcode: 'CSMT', st_stname: 'Chhatrapati Shivaji Maharaj Terminus', st_city: 'Mumbai', st_state: 'Maharashtra', eby: 'ADMIN', mby: 'ADMIN' },
      { st_stid: 'ST002', st_stcode: 'NDLS', st_stname: 'New Delhi', st_city: 'Delhi', st_state: 'Delhi', eby: 'ADMIN', mby: 'ADMIN' },
      { st_stid: 'ST003', st_stcode: 'BLR', st_stname: 'Bangalore City', st_city: 'Bangalore', st_state: 'Karnataka', eby: 'ADMIN', mby: 'ADMIN' },
      { st_stid: 'ST004', st_stcode: 'MAS', st_stname: 'Chennai Central', st_city: 'Chennai', st_state: 'Tamil Nadu', eby: 'ADMIN', mby: 'ADMIN' }
    ]);

    console.log('Creating sample trains...');
    const trains = await Train.bulkCreate([
      { tr_trid: 'TR001', tr_trno: '12951', tr_trname: 'Mumbai Rajdhani Express', tr_fromst: 'ST001', tr_tost: 'ST002', tr_deptime: '16:55:00', tr_arrtime: '08:35:00', eby: 'ADMIN', mby: 'ADMIN' },
      { tr_trid: 'TR002', tr_trno: '12629', tr_trname: 'Karnataka Express', tr_fromst: 'ST002', tr_tost: 'ST003', tr_deptime: '21:50:00', tr_arrtime: '21:15:00', eby: 'ADMIN', mby: 'ADMIN' }
    ]);

    console.log('Creating sample admin user...');
    // Create admin user
    const adminUser = await User.create({
      us_usid: 'ADM001',
      us_fname: 'Admin',
      us_lname: 'User',
      us_email: 'admin@example.com',
      us_phone: '9999999999',
      us_usertype: 'admin',
      us_roid: 'ADM',
      us_coid: 'TRV',
      us_active: 1,
      eby: 'SYSTEM',
      mby: 'SYSTEM'
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create login credentials
    await Login.create({
      lg_usid: adminUser.us_usid,
      lg_email: adminUser.us_email,
      lg_passwd: hashedPassword,
      lg_salt: salt,
      lg_active: 1,
      eby: 'SYSTEM',
      mby: 'SYSTEM'
    });

    console.log('Creating sample booking agent user...');
    // Create booking agent user
    const agentUser = await User.create({
      us_usid: 'EMP001',
      us_fname: 'Jane',
      us_lname: 'Smith',
      us_email: 'employee@example.com',
      us_phone: '7777777777',
      us_usertype: 'employee',
      us_roid: 'AGT',
      us_coid: 'TRV',
      us_active: 1,
      eby: 'SYSTEM',
      mby: 'SYSTEM'
    });

    // Hash password
    const agentSalt = await bcrypt.genSalt(10);
    const agentHashedPassword = await bcrypt.hash('employee123', agentSalt);

    // Create login credentials
    await Login.create({
      lg_usid: agentUser.us_usid,
      lg_email: agentUser.us_email,
      lg_passwd: agentHashedPassword,
      lg_salt: agentSalt,
      lg_active: 1,
      eby: 'SYSTEM',
      mby: 'SYSTEM'
    });

    // Create booking agent record
    await Employee.create({
      em_usid: agentUser.us_usid,
      em_empno: 'EMP001',
      em_designation: 'Booking Agent',
      em_dept: 'AGENT',
      em_address: '456 Employee Street',
      em_city: 'Mumbai',
      em_state: 'Maharashtra',
      em_pincode: '400002',
      eby: 'SYSTEM',
      mby: 'SYSTEM'
    });

    console.log('Creating sample accounts team user...');
    // Create accounts team user
    const accountsUser = await User.create({
      us_usid: 'ACC001',
      us_fname: 'Robert',
      us_lname: 'Johnson',
      us_email: 'accounts@example.com',
      us_phone: '6666666666',
      us_usertype: 'employee',
      us_roid: 'ACC',
      us_coid: 'TRV',
      us_active: 1,
      eby: 'SYSTEM',
      mby: 'SYSTEM'
    });

    // Hash password
    const accountsSalt = await bcrypt.genSalt(10);
    const accountsHashedPassword = await bcrypt.hash('accounts123', accountsSalt);

    // Create login credentials
    await Login.create({
      lg_usid: accountsUser.us_usid,
      lg_email: accountsUser.us_email,
      lg_passwd: accountsHashedPassword,
      lg_salt: accountsSalt,
      lg_active: 1,
      eby: 'SYSTEM',
      mby: 'SYSTEM'
    });

    // Create accounts team record
    await Employee.create({
      em_usid: accountsUser.us_usid,
      em_empno: 'ACC001',
      em_designation: 'Accounts Executive',
      em_dept: 'accounts',
      em_address: '789 Accounts Street',
      em_city: 'Mumbai',
      em_state: 'Maharashtra',
      em_pincode: '400003',
      eby: 'SYSTEM',
      mby: 'SYSTEM'
    });

    console.log('Creating sample customer user...');
    // Create customer user
    const customerUser = await User.create({
      us_usid: 'CUS001',
      us_fname: 'John',
      us_lname: 'Doe',
      us_email: 'customer@example.com',
      us_phone: '8888888888',
      us_usertype: 'customer',
      us_roid: 'CUS',
      us_coid: 'TRV',
      us_active: 1,
      eby: 'SYSTEM',
      mby: 'SYSTEM'
    });

    // Hash password
    const customerSalt = await bcrypt.genSalt(10);
    const customerHashedPassword = await bcrypt.hash('customer123', customerSalt);

    // Create login credentials
    await Login.create({
      lg_usid: customerUser.us_usid,
      lg_email: customerUser.us_email,
      lg_passwd: customerHashedPassword,
      lg_salt: customerSalt,
      lg_active: 1,
      eby: 'SYSTEM',
      mby: 'SYSTEM'
    });

    // Create customer record
    await Customer.create({
      cu_usid: customerUser.us_usid,
      cu_custno: 'CUST001',
      cu_custtype: 'INDIVIDUAL',
      cu_address: '123 Main Street',
      cu_city: 'Mumbai',
      cu_state: 'Maharashtra',
      cu_pincode: '400001',
      eby: 'SYSTEM',
      mby: 'SYSTEM'
    });

    // Create sample bookings
    console.log('Creating sample bookings...');
    const booking1 = await Booking.create({
      bk_bkno: 'BK2025001',
      bk_usid: 'CUS001',
      bk_fromst: 'ST001',
      bk_tost: 'ST002',
      bk_trvldt: new Date('2025-12-01'),
      bk_class: '3A',
      bk_quota: 'TATKAL',
      bk_berthpref: 'LB',
      bk_totalpass: 2,
      bk_status: 'CONFIRMED',
      bk_agent: 'EMP001',
      bk_priority: 'HIGH',
      bk_remarks: 'Business travel - confirmed booking',
      eby: 'EMP001',
      mby: 'EMP001'
    });

    const booking2 = await Booking.create({
      bk_bkno: 'BK2025002',
      bk_usid: 'CUS001',
      bk_fromst: 'ST002',
      bk_tost: 'ST003',
      bk_trvldt: new Date('2025-12-15'),
      bk_class: '2A',
      bk_quota: 'TATKAL',
      bk_berthpref: 'UB',
      bk_totalpass: 1,
      bk_status: 'PENDING',
      bk_agent: 'EMP001',
      bk_priority: 'NORMAL',
      bk_remarks: 'Waiting for confirmation',
      eby: 'EMP001',
      mby: 'EMP001'
    });

    const booking3 = await Booking.create({
      bk_bkno: 'BK2025003',
      bk_usid: 'CUS001',
      bk_fromst: 'ST001',
      bk_tost: 'ST002',
      bk_trvldt: new Date('2025-11-20'),
      bk_class: 'SL',
      bk_quota: 'GENERAL',
      bk_berthpref: 'MB',
      bk_totalpass: 3,
      bk_status: 'CANCELLED',
      bk_agent: 'EMP001',
      bk_priority: 'NORMAL',
      bk_remarks: 'Cancelled by customer',
      eby: 'EMP001',
      mby: 'EMP001'
    });

    const booking4 = await Booking.create({
      bk_bkno: 'BK2025004',
      bk_usid: 'CUS001',
      bk_fromst: 'ST003',
      bk_tost: 'ST004',
      bk_trvldt: new Date('2025-12-20'),
      bk_class: '1A',
      bk_quota: 'TATKAL',
      bk_berthpref: 'LB',
      bk_totalpass: 2,
      bk_status: 'CONFIRMED',
      bk_agent: 'EMP001',
      bk_priority: 'HIGH',
      bk_remarks: 'Premium booking',
      eby: 'EMP001',
      mby: 'EMP001'
    });

    // Create sample passengers
    console.log('Creating sample passengers...');
    await Passenger.create({
      ps_bkid: booking1.bk_bkid,
      ps_fname: 'John',
      ps_lname: 'Doe',
      ps_age: 35,
      ps_gender: 'M',
      ps_berthpref: 'LB',
      ps_berthalloc: 'LB',
      ps_seatno: '23',
      ps_coach: 'A1',
      eby: 'EMP001',
      mby: 'EMP001'
    });

    await Passenger.create({
      ps_bkid: booking1.bk_bkid,
      ps_fname: 'Jane',
      ps_lname: 'Doe',
      ps_age: 32,
      ps_gender: 'F',
      ps_berthpref: 'LB',
      ps_berthalloc: 'LB',
      ps_seatno: '24',
      ps_coach: 'A1',
      eby: 'EMP001',
      mby: 'EMP001'
    });

    await Passenger.create({
      ps_bkid: booking2.bk_bkid,
      ps_fname: 'John',
      ps_lname: 'Doe',
      ps_age: 35,
      ps_gender: 'M',
      ps_berthpref: 'UB',
      eby: 'EMP001',
      mby: 'EMP001'
    });

    await Passenger.create({
      ps_bkid: booking3.bk_bkid,
      ps_fname: 'Robert',
      ps_lname: 'Smith',
      ps_age: 45,
      ps_gender: 'M',
      ps_berthpref: 'MB',
      eby: 'EMP001',
      mby: 'EMP001'
    });

    await Passenger.create({
      ps_bkid: booking3.bk_bkid,
      ps_fname: 'Mary',
      ps_lname: 'Smith',
      ps_age: 42,
      ps_gender: 'F',
      ps_berthpref: 'LB',
      eby: 'EMP001',
      mby: 'EMP001'
    });

    await Passenger.create({
      ps_bkid: booking3.bk_bkid,
      ps_fname: 'Tommy',
      ps_lname: 'Smith',
      ps_age: 12,
      ps_gender: 'M',
      ps_berthpref: 'UB',
      eby: 'EMP001',
      mby: 'EMP001'
    });

    await Passenger.create({
      ps_bkid: booking4.bk_bkid,
      ps_fname: 'Sarah',
      ps_lname: 'Johnson',
      ps_age: 28,
      ps_gender: 'F',
      ps_berthpref: 'LB',
      ps_berthalloc: 'LB',
      ps_seatno: '15',
      ps_coach: 'B2',
      eby: 'EMP001',
      mby: 'EMP001'
    });

    await Passenger.create({
      ps_bkid: booking4.bk_bkid,
      ps_fname: 'Michael',
      ps_lname: 'Johnson',
      ps_age: 30,
      ps_gender: 'M',
      ps_berthpref: 'LB',
      ps_berthalloc: 'LB',
      ps_seatno: '16',
      ps_coach: 'B2',
      eby: 'EMP001',
      mby: 'EMP001'
    });

    // Create sample PNR records
    console.log('Creating sample PNR records...');
    await Pnr.create({
      pn_bkid: booking1.bk_bkid,
      pn_pnr: '1234567890',
      pn_trid: 'TR001',
      pn_trvldt: new Date('2025-12-01'),
      pn_class: '3A',
      pn_quota: 'TATKAL',
      pn_passengers: 2,
      pn_status: 'CNF',
      pn_bookdt: new Date('2025-11-20'),
      pn_bkgamt: 4500.00,
      pn_svcamt: 500.00,
      pn_totamt: 5000.00,
      eby: 'EMP001',
      mby: 'EMP001'
    });

    await Pnr.create({
      pn_bkid: booking2.bk_bkid,
      pn_pnr: '9876543210',
      pn_trid: 'TR002',
      pn_trvldt: new Date('2025-12-15'),
      pn_class: '2A',
      pn_quota: 'TATKAL',
      pn_passengers: 1,
      pn_status: 'WL',
      pn_bookdt: new Date('2025-11-21'),
      pn_bkgamt: 900.00,
      pn_svcamt: 100.00,
      pn_totamt: 1000.00,
      eby: 'EMP001',
      mby: 'EMP001'
    });

    await Pnr.create({
      pn_bkid: booking4.bk_bkid,
      pn_pnr: '5555666677',
      pn_trid: 'TR002',
      pn_trvldt: new Date('2025-12-20'),
      pn_class: '1A',
      pn_quota: 'TATKAL',
      pn_passengers: 2,
      pn_status: 'CNF',
      pn_bookdt: new Date('2025-11-22'),
      pn_chartdt: new Date('2025-12-19'),
      pn_bkgamt: 7200.00,
      pn_svcamt: 800.00,
      pn_totamt: 8000.00,
      eby: 'EMP001',
      mby: 'EMP001'
    });

    // Create sample accounts
    console.log('Creating sample accounts...');
    const account1 = await Account.create({
      ac_bkid: booking1.bk_bkid,
      ac_usid: 'CUS001',
      ac_totamt: 5000.00,
      ac_rcvdamt: 5000.00,
      ac_pendamt: 0.00,
      ac_duedt: new Date('2025-11-25'),
      ac_fyear: '2025-26',
      ac_status: 'PAID',
      eby: 'EMP001',
      mby: 'EMP001'
    });

    const account2 = await Account.create({
      ac_bkid: booking2.bk_bkid,
      ac_usid: 'CUS001',
      ac_totamt: 1000.00,
      ac_rcvdamt: 1000.00,
      ac_pendamt: 0.00,
      ac_duedt: new Date('2025-12-10'),
      ac_fyear: '2025-26',
      ac_status: 'PAID',
      eby: 'EMP001',
      mby: 'EMP001'
    });

    const account3 = await Account.create({
      ac_bkid: booking3.bk_bkid,
      ac_usid: 'CUS001',
      ac_totamt: 2400.00,
      ac_rcvdamt: 0.00,
      ac_pendamt: 2400.00,
      ac_duedt: new Date('2025-11-15'),
      ac_fyear: '2025-26',
      ac_status: 'REFUNDED',
      eby: 'EMP001',
      mby: 'EMP001'
    });

    const account4 = await Account.create({
      ac_bkid: booking4.bk_bkid,
      ac_usid: 'CUS001',
      ac_totamt: 8000.00,
      ac_rcvdamt: 8000.00,
      ac_pendamt: 0.00,
      ac_duedt: new Date('2025-12-15'),
      ac_fyear: '2025-26',
      ac_status: 'PAID',
      eby: 'EMP001',
      mby: 'EMP001'
    });

    // Create sample payments
    console.log('Creating sample payments...');
    await Payment.create({
      pt_acid: account1.ac_acid,
      pt_bkid: booking1.bk_bkid,
      pt_amount: 5000.00,
      pt_mode: 'ONLINE',
      pt_refno: 'TXN1234567890',
      pt_paydt: new Date('2025-11-20'),
      pt_rcvdt: new Date('2025-11-20'),
      pt_status: 'RECEIVED',
      pt_remarks: 'Full payment for confirmed booking',
      eby: 'EMP001',
      mby: 'EMP001'
    });

    await Payment.create({
      pt_acid: account2.ac_acid,
      pt_bkid: booking2.bk_bkid,
      pt_amount: 1000.00,
      pt_mode: 'CASH',
      pt_paydt: new Date('2025-11-21'),
      pt_rcvdt: new Date('2025-11-21'),
      pt_status: 'RECEIVED',
      pt_remarks: 'Advance payment',
      eby: 'EMP001',
      mby: 'EMP001'
    });

    await Payment.create({
      pt_acid: account3.ac_acid,
      pt_bkid: booking3.bk_bkid,
      pt_amount: 2400.00,
      pt_mode: 'ONLINE',
      pt_refno: 'TXN9876543210',
      pt_paydt: new Date('2025-11-18'),
      pt_rcvdt: new Date('2025-11-19'),
      pt_status: 'REFUNDED',
      pt_remarks: 'Refund for cancelled booking',
      eby: 'EMP001',
      mby: 'EMP001'
    });

    await Payment.create({
      pt_acid: account4.ac_acid,
      pt_bkid: booking4.bk_bkid,
      pt_amount: 8000.00,
      pt_mode: 'BANK_TRANSFER',
      pt_refno: 'NEFT202511220001',
      pt_paydt: new Date('2025-11-22'),
      pt_rcvdt: new Date('2025-11-22'),
      pt_status: 'RECEIVED',
      pt_remarks: 'Premium class booking payment',
      eby: 'EMP001',
      mby: 'EMP001'
    });

    // Create sample travel plans
    console.log('Creating sample travel plans...');
    await TravelPlan.create({
      tp_usid: 'CUS001',
      tp_title: 'Mumbai to Delhi Business Trip',
      tp_description: 'Annual business conference in Delhi',
      tp_destination: 'Delhi',
      tp_startdate: new Date('2025-12-01'),
      tp_enddate: new Date('2025-12-05'),
      tp_budget: 25000.00,
      tp_activities: JSON.stringify(['Conference', 'Client Meetings', 'Sightseeing']),
      tp_ispublic: 0,
      eby: 'CUS001',
      mby: 'CUS001'
    });

    await TravelPlan.create({
      tp_usid: 'CUS001',
      tp_title: 'Bangalore Tech Summit',
      tp_description: 'Attending tech summit and workshops',
      tp_destination: 'Bangalore',
      tp_startdate: new Date('2025-12-15'),
      tp_enddate: new Date('2025-12-18'),
      tp_budget: 18000.00,
      tp_activities: JSON.stringify(['Tech Summit', 'Workshops', 'Networking']),
      tp_ispublic: 1,
      eby: 'CUS001',
      mby: 'CUS001'
    });

    await TravelPlan.create({
      tp_usid: 'CUS001',
      tp_title: 'Chennai Holiday Trip',
      tp_description: 'Family vacation to Chennai beaches',
      tp_destination: 'Chennai',
      tp_startdate: new Date('2026-01-10'),
      tp_enddate: new Date('2026-01-15'),
      tp_budget: 30000.00,
      tp_activities: JSON.stringify(['Beach', 'Temple Visit', 'Shopping', 'Food Tour']),
      tp_ispublic: 0,
      eby: 'CUS001',
      mby: 'CUS001'
    });

    // Create sample corporate customer
    console.log('Creating sample corporate customer...');
    await CorporateCustomer.create({
      cu_usid: 'CUS001',
      cu_custno: 'CORP001',
      cu_company: 'Tech Solutions Pvt Ltd',
      cu_gst: '27AABCT1234A1Z5',
      cu_pan: 'AABCT1234A',
      cu_creditlmt: 100000.00,
      cu_creditused: 5000.00,
      cu_paymentterms: 'NET30',
      cu_status: 'ACTIVE',
      eby: 'SYSTEM',
      mby: 'SYSTEM'
    });

    // Create sample customer contacts
    console.log('Creating sample customer contacts...');
    await CustomerContact.create({
      cc_usid: 'CUS001',
      cc_fname: 'John',
      cc_lname: 'Doe',
      cc_email: 'customer@example.com',
      cc_phone: '8888888888',
      cc_designation: 'CEO',
      cc_isprimary: 1,
      cc_active: 1,
      eby: 'SYSTEM',
      mby: 'SYSTEM'
    });

    await CustomerContact.create({
      cc_usid: 'CUS001',
      cc_fname: 'Sarah',
      cc_lname: 'Williams',
      cc_email: 'sarah.williams@techsolutions.com',
      cc_phone: '9876543210',
      cc_designation: 'Travel Manager',
      cc_isprimary: 0,
      cc_active: 1,
      eby: 'SYSTEM',
      mby: 'SYSTEM'
    });

    await CustomerContact.create({
      cc_usid: 'CUS001',
      cc_fname: 'Michael',
      cc_lname: 'Brown',
      cc_email: 'michael.brown@techsolutions.com',
      cc_phone: '9123456789',
      cc_designation: 'Finance Manager',
      cc_isprimary: 0,
      cc_active: 1,
      eby: 'SYSTEM',
      mby: 'SYSTEM'
    });

    // Create payment allocations
    console.log('Creating payment allocations...');
    const pnr1 = await Pnr.findOne({ where: { pn_pnr: '1234567890' } });
    const pnr2 = await Pnr.findOne({ where: { pn_pnr: '9876543210' } });
    const pnr3 = await Pnr.findOne({ where: { pn_pnr: '5555666677' } });
    
    const payment1 = await Payment.findOne({ where: { pt_acid: account1.ac_acid } });
    const payment2 = await Payment.findOne({ where: { pt_acid: account2.ac_acid } });
    const payment4 = await Payment.findOne({ where: { pt_acid: account4.ac_acid } });

    if (pnr1 && payment1) {
      await PaymentAlloc.create({
        pa_ptid: payment1.pt_ptid,
        pa_pnid: pnr1.pn_pnid,
        pa_amount: 5000.00,
        eby: 'EMP001'
      });
    }

    if (pnr2 && payment2) {
      await PaymentAlloc.create({
        pa_ptid: payment2.pt_ptid,
        pa_pnid: pnr2.pn_pnid,
        pa_amount: 1000.00,
        eby: 'EMP001'
      });
    }

    if (pnr3 && payment4) {
      await PaymentAlloc.create({
        pa_ptid: payment4.pt_ptid,
        pa_pnid: pnr3.pn_pnid,
        pa_amount: 8000.00,
        eby: 'EMP001'
      });
    }

    console.log('\n✅ Database seeding completed successfully!\n');
    console.log('📊 Sample Data Created:');
    console.log('  - 4 Users (1 admin, 2 employees, 1 customer)');
    console.log('  - 6 Roles with permissions');
    console.log('  - 4 Railway stations');
    console.log('  - 2 Trains');
    console.log('  - 4 Bookings (2 confirmed, 1 pending, 1 cancelled)');
    console.log('  - 8 Passengers');
    console.log('  - 3 PNR records');
    console.log('  - 4 Accounts');
    console.log('  - 4 Payments (3 received, 1 refunded)');
    console.log('  - 3 Payment allocations');
    console.log('  - 3 Travel plans');
    console.log('  - 1 Corporate customer');
    console.log('  - 3 Customer contacts\n');
    
    console.log('🔐 Test Credentials:');
    console.log('  Admin:');
    console.log('    - Email: admin@example.com');
    console.log('    - Password: admin123');
    console.log('  Booking Agent:');
    console.log('    - Email: employee@example.com');
    console.log('    - Password: employee123');
    console.log('  Accounts:');
    console.log('    - Email: accounts@example.com');
    console.log('    - Password: accounts123');
    console.log('  Customer:');
    console.log('    - Email: customer@example.com');
    console.log('    - Password: customer123\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

seedDatabase();