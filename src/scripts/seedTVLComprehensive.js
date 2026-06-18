const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const {
  sequelizeTVL,
  CompanyTVL,
  RoleTVL,
  ApplicationTVL,
  ModuleTVL,
  PermissionTVL,
  RolePermissionTVL,
  UserTVL,
  LoginTVL,
  EmployeeTVL,
  CustomerTVL,
  StationTVL,
  TrainTVL,
  BookingTVL,
  PassengerTVL,
  AccountTVL,
  PaymentTVL,
  YearEndClosingTVL
} = require('../models');

// Utility for generating random data
const random = {
  int: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  float: (min, max) => Math.random() * (max - min) + min,
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  date: (start, end) => {
    const s = start || new Date(2020, 0, 1);
    const e = end || new Date();
    return new Date(s.getTime() + Math.random() * (e.getTime() - s.getTime()));
  },
  string: (length, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(random.int(0, chars.length - 1));
    }
    return result;
  }
};

// Indian names and cities
const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Ananya', 'Diya', 'Ishita', 'Aarohi'];
const lastNames = ['Sharma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Das', 'Iyer', 'Menon', 'Bose', 'Mehta'];
const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur'];
const bookingStatuses = ['DRF', 'CNF', 'CAN', 'PND'];

// Seeding report
const report = {
  tables: [],
  startTime: new Date(),
  endTime: null,
  overallPass: true
};

async function seedTVLComprehensive() {
  console.log('🚀 Starting comprehensive TVL database seeding...');

  let connection;
  try {
    // 1. Drop and recreate database to ensure clean start
    console.log('📡 Connecting to MySQL server...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    console.log('✅ Connected to MySQL server');

    const dbName = process.env.DB_NAME_TVL || 'TVL_001';
    console.log(`🗄️  Dropping database ${dbName}...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    console.log(`🗄️  Creating database ${dbName}...`);
    await connection.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.end();
    connection = null;

    // 2. Sync all models to create tables
    console.log('🔄 Syncing TVL models...');
    await sequelizeTVL.sync({ force: true });
    console.log('✅ All tables created');

    // --------------------------
    // 1. CompanyTVL
    // --------------------------
    console.log('\n📦 Seeding CompanyTVL...');
    const companies = [];
    for (let i = 1; i <= 100; i++) {
      companies.push({
        co_coid: `CO${String(i).padStart(3, '0')}`,
        co_coshort: `COMP${i}`,
        co_codesc: `Company ${i}`,
        co_active: 1,
        co_edtm: new Date(),
        co_eby: 'SEEDER',
        co_mdtm: new Date(),
        co_mby: 'SEEDER'
      });
    }
    const createdCompanies = await CompanyTVL.bulkCreate(companies);
    report.tables.push({ name: 'CompanyTVL', rows: createdCompanies.length, pass: createdCompanies.length >= 100 });

    // --------------------------
    // 2. RoleTVL
    // --------------------------
    console.log('\n📦 Seeding RoleTVL...');
    const roles = [];
    for (let i = 1; i <= 150; i++) {
      roles.push({
        fn_fnid: `R${String(i).padStart(3, '0')}`,
        fn_fnshort: `ROLE${i}`,
        fn_fndesc: `Role ${i}`,
        fn_active: 1,
        fn_edtm: new Date(),
        fn_eby: 'SEEDER',
        fn_mdtm: new Date(),
        fn_mby: 'SEEDER'
      });
    }
    const createdRoles = await RoleTVL.bulkCreate(roles);
    report.tables.push({ name: 'RoleTVL', rows: createdRoles.length, pass: createdRoles.length >= 100 });

    // --------------------------
    // 3. ApplicationTVL
    // --------------------------
    console.log('\n📦 Seeding ApplicationTVL...');
    const applications = [];
    for (let i = 1; i <= 100; i++) {
      applications.push({
        ap_apid: `APP${String(i).padStart(1, '0')}`,
        ap_apshort: `APP${i}`,
        ap_apdesc: `Application ${i}`,
        ap_active: 1,
        ap_edtm: new Date(),
        ap_eby: 'SEEDER',
        ap_mdtm: new Date(),
        ap_mby: 'SEEDER'
      });
    }
    const createdApps = await ApplicationTVL.bulkCreate(applications);
    report.tables.push({ name: 'ApplicationTVL', rows: createdApps.length, pass: createdApps.length >= 100 });

    // --------------------------
    // 4. ModuleTVL
    // --------------------------
    console.log('\n📦 Seeding ModuleTVL...');
    const modules = [];
    for (let i = 1; i <= 150; i++) {
      modules.push({
        mo_apid: random.pick(applications).ap_apid,
        mo_moid: `MOD${String(i).padStart(1, '0')}`,
        mo_moshort: `MOD${i}`,
        mo_modesc: `Module ${i}`,
        mo_active: 1,
        mo_edtm: new Date(),
        mo_eby: 'SEEDER',
        mo_mdtm: new Date(),
        mo_mby: 'SEEDER'
      });
    }
    const createdModules = await ModuleTVL.bulkCreate(modules);
    report.tables.push({ name: 'ModuleTVL', rows: createdModules.length, pass: createdModules.length >= 100 });

    // --------------------------
    // 5. UserTVL, LoginTVL, EmployeeTVL, CustomerTVL
    // --------------------------
    console.log('\n📦 Seeding UserTVL, LoginTVL, EmployeeTVL, CustomerTVL...');
    const users = [];
    const logins = [];
    const employees = [];
    const customers = [];
    const salt = await bcrypt.genSalt(10);
    for (let i = 1; i <= 200; i++) {
      const userType = i <= 50 ? 'admin' : (i <= 100 ? 'employee' : 'customer');
      const prefix = userType === 'admin' ? 'ADM' : (userType === 'employee' ? 'EMP' : 'CUS');
      const userId = `${prefix}${String(i).padStart(4, '0')}`;
      const firstName = random.pick(firstNames);
      const lastName = random.pick(lastNames);

      // Add to users array
      users.push({
        us_usid: userId,
        us_fname: firstName,
        us_lname: lastName,
        us_email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
        us_phone: `+91${random.int(9000000000, 9999999999)}`,
        us_usertype: userType,
        us_roid: random.pick(roles).fn_fnid,
        us_coid: random.pick(companies).co_coid,
        us_active: 1,
        us_edtm: new Date(),
        us_eby: 'SEEDER',
        us_mdtm: new Date(),
        us_mby: 'SEEDER'
      });

      // Add to logins array
      logins.push({
        lg_usid: userId,
        lg_email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
        lg_passwd: await bcrypt.hash('password123', salt),
        lg_active: 1,
        lg_email_verified: 1,
        lg_edtm: new Date(),
        lg_eby: 'SEEDER',
        lg_mdtm: new Date(),
        lg_mby: 'SEEDER'
      });

      // Add to employees or customers array
      if (userType === 'admin' || userType === 'employee') {
        employees.push({
          em_usid: userId,
          em_empno: `EMP${String(i).padStart(4, '0')}`,
          em_dept: random.pick(['Sales', 'Marketing', 'Operations', 'Finance', 'Support']),
          em_desg: random.pick(['Executive', 'Senior Executive', 'Manager', 'Assistant Manager', 'Director']),
          em_status: 'ACTIVE',
          em_edtm: new Date(),
          em_eby: 'SEEDER',
          em_mdtm: new Date(),
          em_mby: 'SEEDER'
        });
      } else {
        customers.push({
          cu_usid: userId,
          cu_customerno: `CUS${String(i).padStart(4, '0')}`,
          cu_type: random.pick(['Individual', 'Corporate']),
          cu_creditlimit: random.float(10000, 500000),
          cu_status: 'ACTIVE',
          cu_edtm: new Date(),
          cu_eby: 'SEEDER',
          cu_mdtm: new Date(),
          cu_mby: 'SEEDER'
        });
      }
    }
    const createdUsers = await UserTVL.bulkCreate(users);
    report.tables.push({ name: 'UserTVL', rows: createdUsers.length, pass: createdUsers.length >= 100 });

    const createdLogins = await LoginTVL.bulkCreate(logins);
    report.tables.push({ name: 'LoginTVL', rows: createdLogins.length, pass: createdLogins.length >= 100 });

    const createdEmployees = await EmployeeTVL.bulkCreate(employees);
    report.tables.push({ name: 'EmployeeTVL', rows: createdEmployees.length, pass: createdEmployees.length >= 100 });

    const createdCustomers = await CustomerTVL.bulkCreate(customers);
    report.tables.push({ name: 'CustomerTVL', rows: createdCustomers.length, pass: createdCustomers.length >= 100 });

    // --------------------------
    // 6. StationTVL
    // --------------------------
    console.log('\n📦 Seeding StationTVL...');
    const stations = [];
    for (let i = 1; i <= 150; i++) {
      stations.push({
        st_stid: `ST${String(i).padStart(3, '0')}`,
        st_stname: `${random.pick(cities)} Station ${i}`,
        st_city: random.pick(cities),
        st_active: 1,
        st_edtm: new Date(),
        st_eby: 'SEEDER',
        st_mdtm: new Date(),
        st_mby: 'SEEDER'
      });
    }
    const createdStations = await StationTVL.bulkCreate(stations);
    report.tables.push({ name: 'StationTVL', rows: createdStations.length, pass: createdStations.length >= 100 });

    // --------------------------
    // 7. TrainTVL
    // --------------------------
    console.log('\n📦 Seeding TrainTVL...');
    const trains = [];
    for (let i = 1; i <= 120; i++) {
      const fromSt = random.pick(stations);
      let toSt = random.pick(stations);
      while (toSt.st_stid === fromSt.st_stid) {
        toSt = random.pick(stations);
      }
      trains.push({
        tr_trid: `TR${String(i).padStart(4, '0')}`,
        tr_trname: `Express ${i}`,
        tr_fromst: fromSt.st_stid,
        tr_tost: toSt.st_stid,
        tr_active: 1,
        tr_edtm: new Date(),
        tr_eby: 'SEEDER',
        tr_mdtm: new Date(),
        tr_mby: 'SEEDER'
      });
    }
    const createdTrains = await TrainTVL.bulkCreate(trains);
    report.tables.push({ name: 'TrainTVL', rows: createdTrains.length, pass: createdTrains.length >= 100 });

    // --------------------------
    // 8. BookingTVL
    // --------------------------
    console.log('\n📦 Seeding BookingTVL...');
    const bookings = [];
    for (let i = 1; i <= 200; i++) {
      const fromSt = random.pick(stations);
      let toSt = random.pick(stations);
      while (toSt.st_stid === fromSt.st_stid) {
        toSt = random.pick(stations);
      }
      bookings.push({
        bk_bkid: i,
        bk_bkno: `BK${String(i).padStart(6, '0')}`,
        bk_usid: random.pick(customers).cu_usid,
        bk_fromst: fromSt.st_stid,
        bk_tost: toSt.st_stid,
        bk_trvldt: random.date(),
        bk_class: random.pick(['1A', '2A', '3A', 'SL']),
        bk_status: random.pick(bookingStatuses),
        bk_edtm: new Date(),
        bk_eby: random.pick(employees).em_usid,
        bk_mdtm: new Date(),
        bk_mby: random.pick(employees).em_usid
      });
    }
    const createdBookings = await BookingTVL.bulkCreate(bookings);
    report.tables.push({ name: 'BookingTVL', rows: createdBookings.length, pass: createdBookings.length >= 100 });

    // --------------------------
    // 9. PassengerTVL
    // --------------------------
    console.log('\n📦 Seeding PassengerTVL...');
    const passengers = [];
    for (let i = 1; i <= 400; i++) {
      passengers.push({
        ps_psid: i,
        ps_bkid: random.pick(bookings).bk_bkid,
        ps_name: `${random.pick(firstNames)} ${random.pick(lastNames)}`,
        ps_age: random.int(1, 80),
        ps_gender: random.pick(['M', 'F']),
        ps_edtm: new Date(),
        ps_eby: 'SEEDER',
        ps_mdtm: new Date(),
        ps_mby: 'SEEDER'
      });
    }
    const createdPassengers = await PassengerTVL.bulkCreate(passengers);
    report.tables.push({ name: 'PassengerTVL', rows: createdPassengers.length, pass: createdPassengers.length >= 100 });

    // --------------------------
    // 10. AccountTVL
    // --------------------------
    console.log('\n📦 Seeding AccountTVL...');
    const accounts = [];
    for (let i = 1; i <= 150; i++) {
      accounts.push({
        ac_acid: i,
        ac_bkid: random.pick(bookings).bk_bkid,
        ac_usid: random.pick(customers).cu_usid,
        ac_amount: random.float(1000, 50000),
        ac_type: random.pick(['DEBIT', 'CREDIT']),
        ac_status: random.pick(['PENDING', 'PAID', 'CANCELLED']),
        ac_edtm: new Date(),
        ac_eby: 'SEEDER',
        ac_mdtm: new Date(),
        ac_mby: 'SEEDER'
      });
    }
    const createdAccounts = await AccountTVL.bulkCreate(accounts);
    report.tables.push({ name: 'AccountTVL', rows: createdAccounts.length, pass: createdAccounts.length >= 100 });

    // --------------------------
    // 11. PaymentTVL
    // --------------------------
    console.log('\n📦 Seeding PaymentTVL...');
    const payments = [];
    for (let i = 1; i <= 180; i++) {
      payments.push({
        pt_ptid: i,
        pt_bkid: random.pick(bookings).bk_bkid,
        pt_acid: random.pick(accounts).ac_acid,
        pt_amount: random.float(1000, 50000),
        pt_status: random.pick(['PAID', 'PENDING', 'FAILED']),
        pt_paydt: random.date(),
        pt_edtm: new Date(),
        pt_eby: 'SEEDER',
        pt_mdtm: new Date(),
        pt_mby: 'SEEDER'
      });
    }
    const createdPayments = await PaymentTVL.bulkCreate(payments);
    report.tables.push({ name: 'PaymentTVL', rows: createdPayments.length, pass: createdPayments.length >= 100 });

    // --------------------------
    // 12. YearEndClosingTVL
    // --------------------------
    console.log('\n📦 Seeding YearEndClosingTVL...');
    const yearEndClosings = [];
    for (let i = 1; i <= 110; i++) {
      yearEndClosings.push({
        ye_yeid: i,
        ye_year: 2020 + i,
        ye_status: i <= 5 ? 'COMPLETED' : 'PENDING',
        ye_edtm: new Date(),
        ye_eby: 'SEEDER',
        ye_mdtm: new Date(),
        ye_mby: 'SEEDER'
      });
    }
    const createdYearEndClosings = await YearEndClosingTVL.bulkCreate(yearEndClosings);
    report.tables.push({ name: 'YearEndClosingTVL', rows: createdYearEndClosings.length, pass: createdYearEndClosings.length >= 100 });

    // --------------------------
    // Post-seeding validation
    // --------------------------
    console.log('\n🔍 Starting post-seeding validation...');
    const modelMap = {
      CompanyTVL,
      RoleTVL,
      ApplicationTVL,
      ModuleTVL,
      UserTVL,
      LoginTVL,
      EmployeeTVL,
      CustomerTVL,
      StationTVL,
      TrainTVL,
      BookingTVL,
      PassengerTVL,
      AccountTVL,
      PaymentTVL,
      YearEndClosingTVL
    };
    for (const tableReport of report.tables) {
      const model = modelMap[tableReport.name];
      if (model) {
        const count = await model.count();
        tableReport.rows = count;
        tableReport.pass = count >= 100;
        if (!tableReport.pass) {
          report.overallPass = false;
        }
        console.log(`✅ ${tableReport.name}: ${count} rows (100+ required: ${tableReport.pass ? 'PASS' : 'FAIL'})`);
      }
    }

    report.endTime = new Date();
    console.log('\n🎉 Seeding complete! Final report:');
    console.log(JSON.stringify(report, null, 2));

  } catch (error) {
    console.error('\n❌ Seeding failed!');
    console.error(error);
    if (error.stack) console.error(error.stack);
    report.overallPass = false;
  } finally {
    if (connection) await connection.end();
    await sequelizeTVL.close();
  }
}

seedTVLComprehensive();
