const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');
const { 
  Company, 
  Role, 
  Permission, 
  User, 
  Login, 
  Employee, 
  Customer, 
  Station, 
  Train, 
  Booking, 
  PassengerTVL, 
  Pnr, 
  Account, 
  PaymentTVL,
  CorporateCustomer,
  CustomerContact,
  Audit,
  Config,
  TravelPlan,
  Ledger,
  CustomerAdvance,
  BillTVL,
  BillingMaster,
  MasterPassengerList,
  CustomerMasterPassenger,
  ReportTemplate,
  Contra,
  Receipt,
  Journal
} = require('../models');

const RECORD_COUNT = 200;

const seedMassData = async () => {
  try {
    console.log(`🌱 Starting mass seeding for all tables with ${RECORD_COUNT} records each...`);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('demo123', salt);

    // 1. Companies
    console.log('Seeding Companies...');
    const companies = [];
    for (let i = 0; i < RECORD_COUNT; i++) {
      companies.push({
        co_coid: faker.string.alphanumeric(3).toUpperCase(),
        co_coshort: faker.company.name().substring(0, 15).toUpperCase().replace(/[^A-Z0-9]/g, '') + i,
        co_codesc: faker.company.catchPhrase().substring(0, 100),
        co_addr1: faker.location.streetAddress(),
        co_city: faker.location.city(),
        co_state: faker.location.state(),
        co_pin: faker.location.zipCode('######'),
        co_phone: faker.phone.number().substring(0, 15),
        co_email: faker.internet.email(),
        co_active: 1,
        eby: 'SYSTEM',
        mby: 'SYSTEM'
      });
    }
    await Company.bulkCreate(companies, { ignoreDuplicates: true });
    const allCompanies = await Company.findAll();
    console.log(`✅ Seeded ${allCompanies.length} Companies`);

    // 2. Roles
    console.log('Seeding Roles...');
    const roles = [];
    for (let i = 0; i < RECORD_COUNT; i++) {
      roles.push({
        fn_fnid: faker.string.alphanumeric(3).toUpperCase(),
        fn_fnshort: faker.person.jobTitle().substring(0, 30).toUpperCase().replace(/[^A-Z0-9]/g, '') + i,
        fn_fndesc: faker.person.jobDescriptor().substring(0, 60),
        fn_active: 1,
        fn_eby: 'SYSTEM',
        fn_mby: 'SYSTEM'
      });
    }
    await Role.bulkCreate(roles, { ignoreDuplicates: true });
    const allRoles = await Role.findAll();
    console.log(`✅ Seeded ${allRoles.length} Roles`);

    // 3. Permissions
    console.log('Seeding Permissions...');
    const permissions = [];
    for (let i = 0; i < RECORD_COUNT; i++) {
      permissions.push({
        op_apid: faker.string.alphanumeric(4).toUpperCase(),
        op_moid: faker.string.alphanumeric(4).toUpperCase(),
        op_opid: faker.string.alphanumeric(4).toUpperCase(),
        op_opshort: faker.commerce.productName().substring(0, 30).toUpperCase() + i,
        op_opdesc: faker.commerce.productDescription().substring(0, 60),
        op_active: 1,
        op_eby: 'SYSTEM',
        op_mby: 'SYSTEM'
      });
    }
    await Permission.bulkCreate(permissions, { ignoreDuplicates: true });
    const allPermissions = await Permission.findAll();
    console.log(`✅ Seeded ${allPermissions.length} Permissions`);

    // 4. Stations
    console.log('Seeding Stations...');
    const stations = [];
    for (let i = 0; i < RECORD_COUNT; i++) {
      stations.push({
        st_stid: faker.string.alphanumeric(10).toUpperCase(),
        st_stcode: faker.string.alpha(4).toUpperCase() + i,
        st_stname: faker.location.city() + ' Central ' + i,
        st_city: faker.location.city(),
        st_state: faker.location.state(),
        st_active: 1,
        eby: 'SYSTEM',
        mby: 'SYSTEM'
      });
    }
    await Station.bulkCreate(stations, { ignoreDuplicates: true });
    const allStations = await Station.findAll();
    console.log(`✅ Seeded ${allStations.length} Stations`);

    // 5. Trains
    console.log('Seeding Trains...');
    const trains = [];
    for (let i = 0; i < RECORD_COUNT; i++) {
      const fromSt = faker.helpers.arrayElement(allStations);
      const toSt = faker.helpers.arrayElement(allStations.filter(s => s.st_stid !== fromSt.st_stid));
      trains.push({
        tr_trid: faker.string.alphanumeric(10).toUpperCase(),
        tr_trno: faker.string.numeric(5) + i,
        tr_trname: faker.company.name().substring(0, 100),
        tr_fromst: fromSt.st_stid,
        tr_tost: toSt.st_stid,
        tr_deptime: '10:00:00',
        tr_arrtime: '18:00:00',
        tr_active: 1,
        eby: 'SYSTEM',
        mby: 'SYSTEM'
      });
    }
    await Train.bulkCreate(trains, { ignoreDuplicates: true });
    const allTrains = await Train.findAll();
    console.log(`✅ Seeded ${allTrains.length} Trains`);

    // 6. Users, Logins, Employees, and Customers
    console.log('Seeding Users, Logins, Employees, and Customers...');
    const users = [];
    const logins = [];
    const employees = [];
    const customers = [];

    for (let i = 0; i < RECORD_COUNT * 2; i++) {
      const usid = `USER${String(i).padStart(5, '0')}`;
      const isEmployee = i < RECORD_COUNT;
      const role = faker.helpers.arrayElement(allRoles);
      const company = faker.helpers.arrayElement(allCompanies);

      users.push({
        us_usid: usid,
        us_fname: faker.person.firstName(),
        us_lname: faker.person.lastName(),
        us_email: faker.internet.email().substring(0, 80) + i,
        us_phone: faker.phone.number().substring(0, 10) + i,
        us_usertype: isEmployee ? 'employee' : 'customer',
        us_roid: role.fn_fnid,
        us_coid: company.co_coid,
        us_active: 1,
        eby: 'SYSTEM',
        mby: 'SYSTEM'
      });

      logins.push({
        lg_usid: usid,
        lg_email: users[users.length - 1].us_email,
        lg_passwd: hashedPassword,
        lg_salt: salt,
        lg_active: 1,
        eby: 'SYSTEM',
        mby: 'SYSTEM'
      });

      if (isEmployee) {
        employees.push({
          em_usid: usid,
          em_empno: `E${String(i).padStart(5, '0')}`,
          em_dept: faker.commerce.department(),
          em_salary: faker.number.int({ min: 20000, max: 100000 }),
          em_joindt: faker.date.past(),
          em_status: 'ACTIVE',
          eby: 'SYSTEM',
          mby: 'SYSTEM'
        });
      } else {
        customers.push({
          cu_usid: usid,
          cu_custno: `C${String(i - RECORD_COUNT).padStart(5, '0')}`,
          cu_custtype: faker.helpers.arrayElement(['INDIVIDUAL', 'CORPORATE']),
          cu_creditlmt: faker.number.int({ min: 10000, max: 500000 }),
          cu_status: 'ACTIVE',
          eby: 'SYSTEM',
          mby: 'SYSTEM'
        });
      }
    }

    await User.bulkCreate(users, { ignoreDuplicates: true });
    await Login.bulkCreate(logins, { ignoreDuplicates: true });
    await Employee.bulkCreate(employees, { ignoreDuplicates: true });
    await Customer.bulkCreate(customers, { ignoreDuplicates: true });
    
    const allEmployees = await Employee.findAll();
    const allCustomers = await Customer.findAll();
    console.log(`✅ Seeded ${users.length} Users, Logins, ${allEmployees.length} Employees, and ${allCustomers.length} Customers`);

    // 7. Bookings
    console.log('Seeding Bookings...');
    const bookings = [];
    for (let i = 0; i < RECORD_COUNT; i++) {
      const customer = faker.helpers.arrayElement(allCustomers);
      const agent = faker.helpers.arrayElement(allEmployees);
      const fromSt = faker.helpers.arrayElement(allStations);
      const toSt = faker.helpers.arrayElement(allStations.filter(s => s.st_stid !== fromSt.st_stid));
      
      bookings.push({
        bk_bkid: `BK${String(i).padStart(7, '0')}`,
        bk_usid: customer.cu_usid,
        bk_agent: agent.em_usid,
        bk_fromst: fromSt.st_stid,
        bk_tost: toSt.st_stid,
        bk_date: faker.date.soon(),
        bk_status: faker.helpers.arrayElement(['PENDING', 'CONFIRMED', 'CANCELLED']),
        bk_amount: faker.number.int({ min: 500, max: 5000 }),
        eby: 'SYSTEM',
        mby: 'SYSTEM'
      });
    }
    await Booking.bulkCreate(bookings, { ignoreDuplicates: true });
    const allBookings = await Booking.findAll();
    console.log(`✅ Seeded ${allBookings.length} Bookings`);

    // 8. Passengers (TVL)
    console.log('Seeding Passengers...');
    const passengers = [];
    for (let i = 0; i < RECORD_COUNT; i++) {
      const booking = faker.helpers.arrayElement(allBookings);
      passengers.push({
        ps_psid: `PS${String(i).padStart(7, '0')}`,
        ps_bkid: booking.bk_bkid,
        ps_fname: faker.person.firstName(),
        ps_lname: faker.person.lastName(),
        ps_age: faker.number.int({ min: 5, max: 80 }),
        ps_gender: faker.helpers.arrayElement(['M', 'F', 'O']),
        eby: 'SYSTEM',
        mby: 'SYSTEM'
      });
    }
    await PassengerTVL.bulkCreate(passengers, { ignoreDuplicates: true });
    console.log(`✅ Seeded ${passengers.length} Passengers`);

    // 9. PNRs
    console.log('Seeding PNRs...');
    const pnrs = [];
    for (let i = 0; i < RECORD_COUNT; i++) {
      const booking = faker.helpers.arrayElement(allBookings);
      const train = faker.helpers.arrayElement(allTrains);
      pnrs.push({
        pn_pnid: `PN${String(i).padStart(7, '0')}`,
        pn_bkid: booking.bk_bkid,
        pn_trid: train.tr_trid,
        pn_pnrno: faker.string.numeric(10),
        pn_status: faker.helpers.arrayElement(['CNF', 'WL', 'RAC']),
        eby: 'SYSTEM',
        mby: 'SYSTEM'
      });
    }
    await Pnr.bulkCreate(pnrs, { ignoreDuplicates: true });
    console.log(`✅ Seeded ${pnrs.length} PNRs`);

    // 10. Accounts
    console.log('Seeding Accounts...');
    const accounts = [];
    for (let i = 0; i < RECORD_COUNT; i++) {
      const booking = faker.helpers.arrayElement(allBookings);
      accounts.push({
        ac_acid: `AC${String(i).padStart(7, '0')}`,
        ac_bkid: booking.bk_bkid,
        ac_usid: booking.bk_usid,
        ac_type: faker.helpers.arrayElement(['BOOKING', 'CANCELLATION', 'REFUND']),
        ac_amount: booking.bk_amount,
        ac_status: 'OPEN',
        eby: 'SYSTEM',
        mby: 'SYSTEM'
      });
    }
    await Account.bulkCreate(accounts, { ignoreDuplicates: true });
    const allAccounts = await Account.findAll();
    console.log(`✅ Seeded ${allAccounts.length} Accounts`);

    // 11. Payments
    console.log('Seeding Payments...');
    const payments = [];
    for (let i = 0; i < RECORD_COUNT; i++) {
      const account = faker.helpers.arrayElement(allAccounts);
      payments.push({
        pt_ptid: `PT${String(i).padStart(7, '0')}`,
        pt_acid: account.ac_acid,
        pt_bkid: account.ac_bkid,
        pt_amount: account.ac_amount,
        pt_method: faker.helpers.arrayElement(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER']),
        pt_date: new Date(),
        pt_status: 'COMPLETED',
        eby: 'SYSTEM',
        mby: 'SYSTEM'
      });
    }
    await PaymentTVL.bulkCreate(payments, { ignoreDuplicates: true });
    console.log(`✅ Seeded ${payments.length} Payments`);

    // 12. Travel Plans
    console.log('Seeding Travel Plans...');
    const travelPlans = [];
    for (let i = 0; i < RECORD_COUNT; i++) {
      const user = faker.helpers.arrayElement(users);
      travelPlans.push({
        tp_tpid: `TP${String(i).padStart(7, '0')}`,
        tp_usid: user.us_usid,
        tp_title: faker.travel.destination() + ' Trip',
        tp_desc: faker.lorem.sentence(),
        tp_startdt: faker.date.future(),
        tp_enddt: faker.date.future(),
        tp_status: 'PLANNED',
        eby: 'SYSTEM',
        mby: 'SYSTEM'
      });
    }
    await TravelPlan.bulkCreate(travelPlans, { ignoreDuplicates: true });
    console.log(`✅ Seeded ${travelPlans.length} Travel Plans`);

    // 13. Audits
    console.log('Seeding Audits...');
    const audits = [];
    for (let i = 0; i < RECORD_COUNT; i++) {
      const user = faker.helpers.arrayElement(users);
      audits.push({
        ad_adid: `AD${String(i).padStart(7, '0')}`,
        ad_usid: user.us_usid,
        ad_action: faker.helpers.arrayElement(['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE']),
        ad_table: faker.helpers.arrayElement(['usUser', 'bkBooking', 'ptPayment']),
        ad_recid: faker.string.alphanumeric(10),
        ad_oldval: JSON.stringify({ status: 'OLD' }),
        ad_newval: JSON.stringify({ status: 'NEW' }),
        eby: 'SYSTEM',
        mby: 'SYSTEM'
      });
    }
    await Audit.bulkCreate(audits, { ignoreDuplicates: true });
    console.log(`✅ Seeded ${audits.length} Audits`);

    // 14. Configs
    console.log('Seeding Configs...');
    const configs = [];
    for (let i = 0; i < RECORD_COUNT; i++) {
      configs.push({
        cf_cfid: `CF${String(i).padStart(7, '0')}`,
        cf_key: faker.string.alphanumeric(10).toUpperCase() + i,
        cf_val: faker.string.alphanumeric(20),
        cf_desc: faker.lorem.sentence(),
        cf_active: 1,
        eby: 'SYSTEM',
        mby: 'SYSTEM'
      });
    }
    await Config.bulkCreate(configs, { ignoreDuplicates: true });
    console.log(`✅ Seeded ${configs.length} Configs`);

    console.log('\n🎉 Mass seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during mass seeding:', error);
    process.exit(1);
  }
};

seedMassData();

