const { sequelizeTVL } = require('../../config/db');
const { 
  UserTVL, EmployeeTVL, BookingTVL, PaymentTVL, AccountTVL, Customer, StationTVL, LoginTVL, CustomerTVL, RoleTVL
} = require('../models');
const bcrypt = require('bcryptjs');

async function seedTVLDatabase() {
  try {
    // Authenticate TVL connection
    console.log('Connecting to TVL database...');
    await sequelizeTVL.authenticate();
    console.log('TVL database connected successfully');

    // Disable foreign key checks for seeding
    await sequelizeTVL.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Sync TVL models (create tables if they don't exist)
    console.log('Syncing TVL models...');
    await RoleTVL.sync({ alter: true });
    await UserTVL.sync({ alter: true });
    await EmployeeTVL.sync({ alter: true });
    await CustomerTVL.sync({ force: true }); // Force sync to recreate table with correct primary key
    await StationTVL.sync({ alter: true });
    await BookingTVL.sync({ alter: true });
    await AccountTVL.sync({ alter: true });
    await PaymentTVL.sync({ alter: true });
    await LoginTVL.sync({ alter: true });
    console.log('✅ TVL models synced');

    // Clear existing data in TVL tables (in reverse foreign key dependency order)
    console.log('Clearing existing TVL data...');
    await PaymentTVL.destroy({ where: {}, force: true });
    await AccountTVL.destroy({ where: {}, force: true });
    await BookingTVL.destroy({ where: {}, force: true });
    await StationTVL.destroy({ where: {}, force: true });
    await EmployeeTVL.destroy({ where: {}, force: true });
    await LoginTVL.destroy({ where: {}, force: true });
    await UserTVL.destroy({ where: {}, force: true });
    await RoleTVL.destroy({ where: {}, force: true });
    console.log('✅ Existing TVL data cleared');

    // Create roles
    console.log('Creating roles in TVL...');
    await RoleTVL.bulkCreate([
      { fn_fnid: 'ADM', fn_fnshort: 'Admin', fn_fndesc: 'Administrator' },
      { fn_fnid: 'AGT', fn_fnshort: 'Agent', fn_fndesc: 'Booking Agent' },
      { fn_fnid: 'EMP', fn_fnshort: 'Employee', fn_fndesc: 'Employee' }
    ]);

    // Create sample admin user in TVL
    console.log('Creating sample admin user in TVL...');
    const adminUser = await UserTVL.create({
      us_usid: 'ADM001',
      us_fname: 'Admin',
      us_lname: 'User',
      us_email: 'admin@example.com',
      us_phone: '9999999999',
      us_aadhaar: '123456789012',
      us_pan: 'ABCDE1234F',
      us_addr1: '123 Admin Street',
      us_city: 'Mumbai',
      us_state: 'Maharashtra',
      us_pin: '400001',
      us_usertype: 'admin',
      us_roid: 'ADM',
      us_coid: 'TRV',
      us_active: 1,
      us_appadmin: 1,
      us_security: 0,
      us_limit: 100000.00,
      us_edtm: new Date(),
      us_eby: 'SYSTEM',
      us_mdtm: new Date(),
      us_mby: 'SYSTEM'
    });
    
    // Create login credentials for admin user
    console.log('Creating login credentials for admin user...');
    const adminSalt = await bcrypt.genSalt(10);
    const adminHashedPassword = await bcrypt.hash('admin123', adminSalt);
    await LoginTVL.create({
      lg_usid: 'ADM001',
      lg_email: 'admin@example.com',
      lg_passwd: adminHashedPassword,
      lg_salt: adminSalt,
      lg_active: 1,
      lg_email_verified: 1,
      eby: 'SYSTEM',
      mby: 'SYSTEM'
    });

    // Create sample booking agent user in TVL
    console.log('Creating sample booking agent user in TVL...');
    const agentUser = await UserTVL.create({
      us_usid: 'EMP001',
      us_fname: 'Jane',
      us_lname: 'Smith',
      us_email: 'employee@example.com',
      us_phone: '7777777777',
      us_aadhaar: '234567890123',
      us_pan: 'BCDEF2345G',
      us_addr1: '456 Employee Street',
      us_city: 'Mumbai',
      us_state: 'Maharashtra',
      us_pin: '400002',
      us_usertype: 'employee',
      us_roid: 'AGT',
      us_coid: 'TRV',
      us_active: 1,
      us_appadmin: 0,
      us_security: 0,
      us_limit: 50000.00,
      us_edtm: new Date(),
      us_eby: 'SYSTEM',
      us_mdtm: new Date(),
      us_mby: 'SYSTEM'
    });
    
    // Create login credentials for booking agent user
    console.log('Creating login credentials for booking agent user...');
    const agentSalt = await bcrypt.genSalt(10);
    const agentHashedPassword = await bcrypt.hash('employee123', agentSalt);
    await LoginTVL.create({
      lg_usid: 'EMP001',
      lg_email: 'employee@example.com',
      lg_passwd: agentHashedPassword,
      lg_salt: agentSalt,
      lg_active: 1,
      lg_email_verified: 1,
      eby: 'SYSTEM',
      mby: 'SYSTEM'
    });

    // Create booking agent record
    await EmployeeTVL.create({
      em_usid: agentUser.us_usid,
      em_empno: 'EMP001',
      em_designation: 'Booking Agent',
      em_dept: 'AGENT',
      em_salary: 50000.00,
      em_joindt: new Date('2024-01-15'),
      em_manager: 'ADM001',
      em_status: 'ACTIVE',
      em_address: '456 Employee Street',
      em_city: 'Mumbai',
      em_state: 'Maharashtra',
      em_pincode: '400002',
      edtm: new Date(),
      eby: 'SYSTEM',
      mdtm: new Date(),
      mby: 'SYSTEM'
    });

    // Create sample accounts team user in TVL
    console.log('Creating sample accounts team user in TVL...');
    const accountsUser = await UserTVL.create({
      us_usid: 'ACC001',
      us_fname: 'Robert',
      us_lname: 'Johnson',
      us_email: 'accounts@example.com',
      us_phone: '6666666666',
      us_aadhaar: '345678901234',
      us_pan: 'CDEFG3456H',
      us_addr1: '789 Accounts Street',
      us_city: 'Mumbai',
      us_state: 'Maharashtra',
      us_pin: '400003',
      us_usertype: 'employee',
      us_roid: 'ACC',
      us_coid: 'TRV',
      us_active: 1,
      us_appadmin: 0,
      us_security: 0,
      us_limit: 75000.00,
      us_edtm: new Date(),
      us_eby: 'SYSTEM',
      us_mdtm: new Date(),
      us_mby: 'SYSTEM'
    });

    // Create accounts team record
    await EmployeeTVL.create({
      em_usid: accountsUser.us_usid,
      em_empno: 'ACC001',
      em_designation: 'Accounts Executive',
      em_dept: 'ACCOUNTS',
      em_salary: 45000.00,
      em_joindt: new Date('2024-02-01'),
      em_manager: 'ADM001',
      em_status: 'ACTIVE',
      em_address: '789 Accounts Street',
      em_city: 'Mumbai',
      em_state: 'Maharashtra',
      em_pincode: '400003',
      edtm: new Date(),
      eby: 'SYSTEM',
      mdtm: new Date(),
      mby: 'SYSTEM'
    });
    
    // Create login credentials for accounts user
    console.log('Creating login credentials for accounts user...');
    const accountsSalt = await bcrypt.genSalt(10);
    const accountsHashedPassword = await bcrypt.hash('accounts123', accountsSalt);
    await LoginTVL.create({
      lg_usid: 'ACC001',
      lg_email: 'accounts@example.com',
      lg_passwd: accountsHashedPassword,
      lg_salt: accountsSalt,
      lg_active: 1,
      lg_email_verified: 1,
      eby: 'SYSTEM',
      mby: 'SYSTEM'
    });

    // Create sample stations for TVL data
    console.log('Creating sample stations...');
    await StationTVL.bulkCreate([
      { st_stid: 'CSMT', st_stcode: 'CSMT', st_stname: 'Chhatrapati Shivaji Maharaj Terminus', st_city: 'Mumbai', st_state: 'Maharashtra', eby: 'SYSTEM', mby: 'SYSTEM' },
      { st_stid: 'NDLS', st_stcode: 'NDLS', st_stname: 'New Delhi', st_city: 'Delhi', st_state: 'Delhi', eby: 'SYSTEM', mby: 'SYSTEM' },
      { st_stid: 'BLR', st_stcode: 'BLR', st_stname: 'Bangalore City', st_city: 'Bangalore', st_state: 'Karnataka', eby: 'SYSTEM', mby: 'SYSTEM' },
      { st_stid: 'MAS', st_stcode: 'MAS', st_stname: 'Chennai Central', st_city: 'Chennai', st_state: 'Tamil Nadu', eby: 'SYSTEM', mby: 'SYSTEM' }
    ], { updateOnDuplicate: ['st_stname', 'st_city', 'st_state', 'mdtm', 'mby'] });
    
    // Create sample customer user in TVL
    console.log('Creating sample customer user in TVL...');
    const customerUser = await UserTVL.create({
      us_usid: 'CUS001',
      us_fname: 'John',
      us_lname: 'Doe',
      us_email: 'customer@example.com',
      us_phone: '8888888888',
      us_aadhaar: '456789012345',
      us_pan: 'DEFGH4567I',
      us_addr1: '123 Customer Street',
      us_city: 'Mumbai',
      us_state: 'Maharashtra',
      us_pin: '400001',
      us_usertype: 'customer',
      us_roid: 'CUS',
      us_coid: 'TRV',
      us_active: 1,
      us_appadmin: 0,
      us_security: 0,
      us_limit: 0.00,
      us_edtm: new Date(),
      us_eby: 'SYSTEM',
      us_mdtm: new Date(),
      us_mby: 'SYSTEM'
    });
    
    // Create login credentials for customer user
    console.log('Creating login credentials for customer user...');
    const customerSalt = await bcrypt.genSalt(10);
    const customerHashedPassword = await bcrypt.hash('customer123', customerSalt);
    await LoginTVL.create({
      lg_usid: 'CUS001',
      lg_email: 'customer@example.com',
      lg_passwd: customerHashedPassword,
      lg_salt: customerSalt,
      lg_active: 1,
      lg_email_verified: 1,
      eby: 'SYSTEM',
      mby: 'SYSTEM'
    });

    // Create customer record in cuXcustomer table
    await CustomerTVL.create({
      cu_cusid: 'CUS001',
      cu_usid: 'CUS001',
      cu_custno: 'CUST001',
      cu_custtype: 'INDIVIDUAL',
      cu_creditlimit: 10000.00,
      cu_creditdays: 30,
      cu_discount: 5.00,
      cu_active: 1,
      cu_panno: 'ABCDE1234F',
      edtm: new Date(),
      eby: 'SYSTEM',
      mdtm: new Date(),
      mby: 'SYSTEM'
    });

    // Create sample employees with Indian names in TVL
    console.log('Creating sample employees with Indian names in TVL...');
    const indianEmployeeData = [
      {
        id: 'EMP002',
        firstName: 'Rahul',
        lastName: 'Sharma',
        email: 'rahul.sharma@yatrasathi.com',
        phone: '9876543210',
        aadhaar: '567890123456',
        pan: 'FGHIJ5678K',
        address: '456 MG Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pin: '400002',
        designation: 'Senior Manager',
        department: 'HR',
        salary: 85000.00,
        joinDate: new Date('2023-06-15'),
        manager: 'ADM001'
      },
      {
        id: 'EMP003',
        firstName: 'Priya',
        lastName: 'Patel',
        email: 'priya.patel@yatrasathi.com',
        phone: '8765432109',
        aadhaar: '678901234567',
        pan: 'GHIJK6789L',
        address: '789 Connaught Place',
        city: 'New Delhi',
        state: 'Delhi',
        pin: '110001',
        designation: 'Marketing Executive',
        department: 'MARKETING',
        salary: 65000.00,
        joinDate: new Date('2023-08-20'),
        manager: 'ADM001'
      },
      {
        id: 'EMP004',
        firstName: 'Amit',
        lastName: 'Kumar',
        email: 'amit.kumar@yatrasathi.com',
        phone: '7654321098',
        aadhaar: '789012345678',
        pan: 'HIJKL7890M',
        address: '101 Brigade Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pin: '560025',
        designation: 'Software Engineer',
        department: 'IT',
        salary: 75000.00,
        joinDate: new Date('2024-01-10'),
        manager: 'ADM001'
      },
      {
        id: 'EMP005',
        firstName: 'Sunita',
        lastName: 'Reddy',
        email: 'sunita.reddy@yatrasathi.com',
        phone: '6543210987',
        aadhaar: '890123456789',
        pan: 'IJKLM8901N',
        address: '202 T Nagar',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pin: '600017',
        designation: 'Operations Manager',
        department: 'OPERATIONS',
        salary: 80000.00,
        joinDate: new Date('2023-11-05'),
        manager: 'ADM001'
      },
      {
        id: 'EMP006',
        firstName: 'Vikram',
        lastName: 'Singh',
        email: 'vikram.singh@yatrasathi.com',
        phone: '5432109876',
        aadhaar: '901234567890',
        pan: 'JKLMN9012O',
        address: '303 Civil Lines',
        city: 'Kolkata',
        state: 'West Bengal',
        pin: '700013',
        designation: 'Finance Analyst',
        department: 'ACCOUNTS',
        salary: 60000.00,
        joinDate: new Date('2024-03-15'),
        manager: 'ACC001'
      }
    ];

    for (const empData of indianEmployeeData) {
      // Create user record
      const empUser = await UserTVL.create({
        us_usid: empData.id,
        us_fname: empData.firstName,
        us_lname: empData.lastName,
        us_email: empData.email,
        us_phone: empData.phone,
        us_aadhaar: empData.aadhaar,
        us_pan: empData.pan,
        us_addr1: empData.address,
        us_city: empData.city,
        us_state: empData.state,
        us_pin: empData.pin,
        us_usertype: 'employee',
        us_roid: 'EMP',
        us_coid: 'TRV',
        us_active: 1,
        us_appadmin: 0,
        us_security: 0,
        us_limit: 50000.00,
        us_edtm: new Date(),
        us_eby: 'SYSTEM',
        us_mdtm: new Date(),
        us_mby: 'SYSTEM'
      });

      // Create login credentials
      const empSalt = await bcrypt.genSalt(10);
      const empHashedPassword = await bcrypt.hash('employee123', empSalt);
      await LoginTVL.create({
        lg_usid: empData.id,
        lg_email: empData.email,
        lg_passwd: empHashedPassword,
        lg_salt: empSalt,
        lg_active: 1,
        lg_email_verified: 1,
        eby: 'SYSTEM',
        mby: 'SYSTEM'
      });

      // Create employee record in emXemployee table
      await EmployeeTVL.create({
        em_usid: empData.id,
        em_empno: empData.id,
        em_designation: empData.designation,
        em_dept: empData.department,
        em_salary: empData.salary,
        em_joindt: empData.joinDate,
        em_manager: empData.manager,
        em_status: 'ACTIVE',
        em_address: empData.address,
        em_city: empData.city,
        em_state: empData.state,
        em_pincode: empData.pin,
        edtm: new Date(),
        eby: 'SYSTEM',
        mdtm: new Date(),
        mby: 'SYSTEM'
      });
    }

    // Create sample customers with Indian names in TVL
    console.log('Creating sample customers with Indian names in TVL...');
    const indianCustomerData = [
      {
        id: 'CUS002',
        firstName: 'Ankit',
        lastName: 'Gupta',
        email: 'ankit.gupta@example.com',
        phone: '9123456789',
        aadhaar: '112233445566',
        pan: 'MNOPQ1234P',
        address: '505 Nehru Place',
        city: 'New Delhi',
        state: 'Delhi',
        pin: '110019',
        customerNumber: 'CUST002',
        customerType: 'INDIVIDUAL',
        creditLimit: 15000.00,
        creditDays: 45,
        discount: 7.50
      },
      {
        id: 'CUS003',
        firstName: 'Priyanka',
        lastName: 'Nair',
        email: 'priyanka.nair@example.com',
        phone: '8234567890',
        aadhaar: '223344556677',
        pan: 'OPQRS2345Q',
        address: '606 MG Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pin: '560001',
        customerNumber: 'CUST003',
        customerType: 'INDIVIDUAL',
        creditLimit: 12000.00,
        creditDays: 30,
        discount: 5.00
      },
      {
        id: 'CUS004',
        firstName: 'Rajesh',
        lastName: 'Mehta',
        email: 'rajesh.mehta@example.com',
        phone: '7345678901',
        aadhaar: '334455667788',
        pan: 'PQRST3456R',
        address: '707 Anna Nagar',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pin: '600040',
        customerNumber: 'CUST004',
        customerType: 'CORPORATE',
        creditLimit: 25000.00,
        creditDays: 60,
        discount: 10.00
      },
      {
        id: 'CUS005',
        firstName: 'Deepika',
        lastName: 'Yadav',
        email: 'deepika.yadav@example.com',
        phone: '6456789012',
        aadhaar: '445566778899',
        pan: 'QRSTU4567S',
        address: '808 Park Street',
        city: 'Kolkata',
        state: 'West Bengal',
        pin: '700016',
        customerNumber: 'CUST005',
        customerType: 'INDIVIDUAL',
        creditLimit: 8000.00,
        creditDays: 30,
        discount: 3.00
      },
      {
        id: 'CUS006',
        firstName: 'Suresh',
        lastName: 'Iyer',
        email: 'suresh.iyer@example.com',
        phone: '5567890123',
        aadhaar: '556677889900',
        pan: 'RSTUV5678T',
        address: '909 Banjara Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        pin: '500034',
        customerNumber: 'CUST006',
        customerType: 'INDIVIDUAL',
        creditLimit: 20000.00,
        creditDays: 45,
        discount: 8.00
      }
    ];

    for (const custData of indianCustomerData) {
      // Create user record
      const custUser = await UserTVL.create({
        us_usid: custData.id,
        us_fname: custData.firstName,
        us_lname: custData.lastName,
        us_email: custData.email,
        us_phone: custData.phone,
        us_aadhaar: custData.aadhaar,
        us_pan: custData.pan,
        us_addr1: custData.address,
        us_city: custData.city,
        us_state: custData.state,
        us_pin: custData.pin,
        us_usertype: 'customer',
        us_roid: 'CUS',
        us_coid: 'TRV',
        us_active: 1,
        us_appadmin: 0,
        us_security: 0,
        us_limit: 0.00,
        us_edtm: new Date(),
        us_eby: 'SYSTEM',
        us_mdtm: new Date(),
        us_mby: 'SYSTEM'
      });

      // Create login credentials
      const custSalt = await bcrypt.genSalt(10);
      const custHashedPassword = await bcrypt.hash('customer123', custSalt);
      await LoginTVL.create({
        lg_usid: custData.id,
        lg_email: custData.email,
        lg_passwd: custHashedPassword,
        lg_salt: custSalt,
        lg_active: 1,
        lg_email_verified: 1,
        eby: 'SYSTEM',
        mby: 'SYSTEM'
      });

      // Create customer record in cuXcustomer table
      await CustomerTVL.create({
        cu_cusid: custData.id,
        cu_usid: custData.id,
        cu_custno: custData.customerNumber,
        cu_custtype: custData.customerType,
        cu_creditlimit: custData.creditLimit,
        cu_creditdays: custData.creditDays,
        cu_discount: custData.discount,
        cu_active: 1,
        cu_panno: custData.pan,
        edtm: new Date(),
        eby: 'SYSTEM',
        mdtm: new Date(),
        mby: 'SYSTEM'
      });
    }

    // Create sample bookings in TVL
    console.log('Creating sample bookings in TVL...');
    const booking1 = await BookingTVL.create({
      bk_bkid: 1,
      bk_bkno: 'BK2025001',
      bk_usid: 'CUS001',
      bk_fromst: 'CSMT',
      bk_tost: 'NDLS',
      bk_trvldt: new Date('2025-12-01'),
      bk_class: '3A',
      bk_quota: 'TATKAL',
      bk_berthpref: 'LB',
      bk_totalpass: 2,
      bk_reqdt: new Date('2025-11-20'),
      bk_status: 'CONFIRMED',
      bk_agent: 'EMP001',
      bk_priority: 'HIGH',
      bk_remarks: 'Business travel - confirmed booking',
      edtm: new Date(),
      eby: 'EMP001',
      mdtm: new Date(),
      mby: 'EMP001'
    });

    const booking2 = await BookingTVL.create({
      bk_bkid: 2,
      bk_bkno: 'BK2025002',
      bk_usid: 'CUS001',
      bk_fromst: 'NDLS',
      bk_tost: 'BLR',
      bk_trvldt: new Date('2025-12-15'),
      bk_class: '2A',
      bk_quota: 'TATKAL',
      bk_berthpref: 'UB',
      bk_totalpass: 1,
      bk_reqdt: new Date('2025-11-21'),
      bk_status: 'PENDING',
      bk_agent: 'EMP001',
      bk_priority: 'NORMAL',
      bk_remarks: 'Waiting for confirmation',
      edtm: new Date(),
      eby: 'EMP001',
      mdtm: new Date(),
      mby: 'EMP001'
    });

    const booking3 = await BookingTVL.create({
      bk_bkid: 3,
      bk_bkno: 'BK2025003',
      bk_usid: 'CUS001',
      bk_fromst: 'CSMT',
      bk_tost: 'NDLS',
      bk_trvldt: new Date('2025-11-20'),
      bk_class: 'SL',
      bk_quota: 'GENERAL',
      bk_berthpref: 'MB',
      bk_totalpass: 3,
      bk_reqdt: new Date('2025-11-15'),
      bk_status: 'CANCELLED',
      bk_agent: 'EMP001',
      bk_priority: 'NORMAL',
      bk_remarks: 'Cancelled by customer',
      edtm: new Date(),
      eby: 'EMP001',
      mdtm: new Date(),
      mby: 'EMP001'
    });

    // Create sample accounts in TVL
    console.log('Creating sample accounts in TVL...');
    const account1 = await AccountTVL.create({
      ac_bkid: 1,
      ac_usid: 'CUS001',
      ac_totamt: 5000.00,
      ac_rcvdamt: 5000.00,
      ac_pendamt: 0.00,
      ac_duedt: new Date('2025-11-25'),
      ac_fyear: '2025-26',
      ac_status: 'PAID',
      edtm: new Date(),
      eby: 'EMP001',
      mdtm: new Date(),
      mby: 'EMP001'
    });

    const account2 = await AccountTVL.create({
      ac_bkid: 2,
      ac_usid: 'CUS001',
      ac_totamt: 1000.00,
      ac_rcvdamt: 1000.00,
      ac_pendamt: 0.00,
      ac_duedt: new Date('2025-12-10'),
      ac_fyear: '2025-26',
      ac_status: 'PAID',
      edtm: new Date(),
      eby: 'EMP001',
      mdtm: new Date(),
      mby: 'EMP001'
    });

    const account3 = await AccountTVL.create({
      ac_bkid: 3,
      ac_usid: 'CUS001',
      ac_totamt: 2400.00,
      ac_rcvdamt: 0.00,
      ac_pendamt: 2400.00,
      ac_duedt: new Date('2025-11-15'),
      ac_fyear: '2025-26',
      ac_status: 'REFUNDED',
      edtm: new Date(),
      eby: 'EMP001',
      mdtm: new Date(),
      mby: 'EMP001'
    });

    // Create sample payments in TVL
    console.log('Creating sample payments in TVL...');
    await PaymentTVL.create({
      pt_acid: 1,  // Use the actual auto-incremented account ID
      pt_bkid: 1,
      pt_custid: 1,
      pt_totalamt: 5000.00,
      pt_amount: 5000.00,
      pt_mode: 'ONLINE',
      pt_refno: 'TXN1234567890',
      pt_paydt: new Date('2025-11-20'),
      pt_rcvdt: new Date('2025-11-20'),
      pt_status: 'RECEIVED',
      pt_remarks: 'Full payment for confirmed booking',
      pt_finyear: '2025-26',
      pt_period: '2025-11',
      edtm: new Date(),
      eby: 'EMP001',
      mdtm: new Date(),
      mby: 'EMP001'
    });

    await PaymentTVL.create({
      pt_acid: 2,  // Use the actual auto-incremented account ID
      pt_bkid: 2,
      pt_custid: 1,
      pt_totalamt: 1000.00,
      pt_amount: 1000.00,
      pt_mode: 'CASH',
      pt_paydt: new Date('2025-11-21'),
      pt_rcvdt: new Date('2025-11-21'),
      pt_status: 'RECEIVED',
      pt_remarks: 'Advance payment',
      pt_finyear: '2025-26',
      pt_period: '2025-11',
      edtm: new Date(),
      eby: 'EMP001',
      mdtm: new Date(),
      mby: 'EMP001'
    });

    await PaymentTVL.create({
      pt_acid: 3,  // Use the actual auto-incremented account ID
      pt_bkid: 3,
      pt_custid: 1,
      pt_totalamt: 2400.00,
      pt_amount: 2400.00,
      pt_mode: 'ONLINE',
      pt_refno: 'TXN9876543210',
      pt_paydt: new Date('2025-11-18'),
      pt_rcvdt: new Date('2025-11-19'),
      pt_status: 'REFUNDED',
      pt_remarks: 'Refund for cancelled booking',
      pt_finyear: '2025-26',
      pt_period: '2025-11',
      edtm: new Date(),
      eby: 'EMP001',
      mdtm: new Date(),
      mby: 'EMP001'
    });

    console.log('\n✅ TVL Database seeding completed successfully!\n');
    console.log('📊 Sample TVL Data Created:');
    console.log('  - 12 Users (1 admin, 6 employees, 5 customers) in TVL');
    console.log('  - 3 Bookings (1 confirmed, 1 pending, 1 cancelled) in TVL');
    console.log('  - 3 Accounts in TVL');
    console.log('  - 3 Payments (2 received, 1 refunded) in TVL');
    console.log('  - 6 Employee records in emXemployee table');
    console.log('  - 5 Customer records in cuXcustomer table\n');
    
    // Re-enable foreign key checks
    await sequelizeTVL.query('SET FOREIGN_KEY_CHECKS = 1');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ TVL Seeding failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

seedTVLDatabase();