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

    // Clear existing data (in development) - delete in correct order to avoid foreign key constraints
    console.log('Clearing existing data...');
    // Delete child tables first
    await PaymentAlloc.destroy({ where: {}, truncate: true });
    await Payment.destroy({ where: {}, truncate: true });
    await Account.destroy({ where: {}, truncate: true });
    await Pnr.destroy({ where: {}, truncate: true });
    await Passenger.destroy({ where: {}, truncate: true });
    await Booking.destroy({ where: {}, truncate: true });
    await TravelPlan.destroy({ where: {}, truncate: true });
    await CustomerContact.destroy({ where: {}, truncate: true });
    await CorporateCustomer.destroy({ where: {}, truncate: true });
    await Customer.destroy({ where: {}, truncate: true });
    await Employee.destroy({ where: {}, truncate: true });
    await Session.destroy({ where: {}, truncate: true });
    await Login.destroy({ where: {}, truncate: true });
    await User.destroy({ where: {}, truncate: true });
    await RolePermission.destroy({ where: {}, truncate: true });
    await Permission.destroy({ where: {}, truncate: true });
    await Role.destroy({ where: {}, truncate: true });
    await Train.destroy({ where: {}, truncate: true });
    await Station.destroy({ where: {}, truncate: true });
    await Company.destroy({ where: {}, truncate: true });
    await Audit.destroy({ where: {}, truncate: true });
    await Config.destroy({ where: {}, truncate: true });

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

    console.log('Database seeding completed successfully!');
    console.log('Admin user created:');
    console.log('- Email: admin@example.com');
    console.log('- Password: admin123');
    console.log('Booking agent user created:');
    console.log('- Email: employee@example.com');
    console.log('- Password: employee123');
    console.log('Accounts team user created:');
    console.log('- Email: accounts@example.com');
    console.log('- Password: accounts123');
    console.log('Customer user created:');
    console.log('- Email: customer@example.com');
    console.log('- Password: customer123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

seedDatabase();