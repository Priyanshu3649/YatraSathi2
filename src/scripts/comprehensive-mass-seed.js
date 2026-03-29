const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { faker } = require('@faker-js/faker');
const { sequelize } = require('../models/baseModel');

const RECORD_COUNT = 600;

const seedMassData = async () => {
  try {
    console.log(`🌱 Starting comprehensive mass seeding with ${RECORD_COUNT} records each...`);

    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Clear tables
    console.log('Clearing target tables...');
    await sequelize.query('TRUNCATE TABLE blXbilling');
    await sequelize.query('TRUNCATE TABLE ptXpayment');
    await sequelize.query('TRUNCATE TABLE rcXreceipt');
    await sequelize.query('TRUNCATE TABLE ctXcontra');
    await sequelize.query('TRUNCATE TABLE jeXjournal');
    await sequelize.query('TRUNCATE TABLE bkXbooking');
    await sequelize.query('TRUNCATE TABLE acAccount');

    // Fetch required base data
    const [users] = await sequelize.query("SELECT us_usid, us_fname, us_lname, us_phone FROM usUser WHERE us_usertype = 'customer'");
    const [agents] = await sequelize.query("SELECT us_usid FROM usUser WHERE us_usertype = 'employee'");
    const [stations] = await sequelize.query("SELECT st_stid FROM stStation");

    if (users.length === 0 || agents.length === 0 || stations.length === 0) {
      throw new Error('Insufficient base data (users, agents, or stations). Please run base seeding first.');
    }

    // 2. Seed Bookings
    console.log('Seeding Bookings...');
    for (let i = 0; i < RECORD_COUNT; i++) {
      const user = faker.helpers.arrayElement(users);
      const agent = faker.helpers.arrayElement(agents);
      const fromSt = faker.helpers.arrayElement(stations);
      const toSt = faker.helpers.arrayElement(stations.filter(s => s.st_stid !== fromSt.st_stid));
      
      await sequelize.query(`
        INSERT INTO bkXbooking (bk_bkno, bk_usid, bk_fromst, bk_tost, bk_trvldt, bk_class, bk_status, bk_agent, eby, edtm, mdtm)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          `BK-${String(i).padStart(10, '0')}`,
          user.us_usid,
          fromSt.st_stid,
          toSt.st_stid,
          faker.date.future(),
          '3A',
          'CONFIRMED',
          agent.us_usid,
          'SYSTEM'
        ]
      });
    }

    const [allBookings] = await sequelize.query("SELECT bk_bkid, bk_bkno, bk_usid, bk_fromst, bk_tost, bk_trvldt, bk_class FROM bkXbooking");

    // 3. Seed Accounts
    console.log('Seeding Accounts...');
    for (const booking of allBookings) {
      await sequelize.query(`
        INSERT INTO acAccount (ac_bkid, ac_usid, ac_totamt, ac_rcvdamt, ac_pendamt, ac_status, eby, edtm, mdtm)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          booking.bk_bkid,
          booking.bk_usid,
          2000.00,
          0.00,
          2000.00,
          'PENDING',
          'SYSTEM'
        ]
      });
    }

    const [allAccounts] = await sequelize.query("SELECT ac_acid, ac_bkid, ac_usid FROM acAccount");

    // 4. Seed Booking Billing (blXbilling)
    console.log('Seeding Booking Billing (blXbilling)...');
    for (let i = 0; i < RECORD_COUNT; i++) {
      const booking = faker.helpers.arrayElement(allBookings);
      const user = users.find(u => u.us_usid === booking.bk_usid);
      
      await sequelize.query(`
        INSERT INTO blXbilling (bl_entry_no, bl_bill_no, bl_booking_id, bl_billing_date, bl_journey_date, bl_customer_name, bl_customer_phone, bl_from_station, bl_to_station, bl_class, bl_railway_fare, bl_gst, bl_total_amount, bl_status, entered_by)
        VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, {
        replacements: [
          `BL-${String(i).padStart(10, '0')}`,
          `BILL-${String(i).padStart(6, '0')}`,
          booking.bk_bkid,
          booking.bk_trvldt,
          `${user.us_fname} ${user.us_lname || ''}`,
          user.us_phone,
          booking.bk_fromst,
          booking.bk_tost,
          booking.bk_class,
          1500.00,
          270.00,
          1770.00,
          'CONFIRMED',
          1 // dummy user id for entered_by
        ]
      });
    }

    // 5. Seed Payment Type 1: ptXpayment
    console.log('Seeding Payments (ptXpayment)...');
    for (let i = 0; i < RECORD_COUNT; i++) {
      const account = faker.helpers.arrayElement(allAccounts);
      await sequelize.query(`
        INSERT INTO ptXpayment (pt_custid, pt_totalamt, pt_amount, pt_status, pt_acid, pt_mode, pt_paydt, pt_finyear, pt_period, eby, edtm, mdtm)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          1, // dummy customer id for pt_custid
          2000.00,
          2000.00,
          'RECEIVED',
          account.ac_acid,
          'UPI',
          '2023-2024',
          '2024-03',
          'SYSTEM'
        ]
      });
    }

    // 6. Seed Payment Type 2: rcXreceipt
    console.log('Seeding Receipts (rcXreceipt)...');
    for (let i = 0; i < RECORD_COUNT; i++) {
      const user = faker.helpers.arrayElement(users);
      await sequelize.query(`
        INSERT INTO rcXreceipt (rc_entry_no, rc_date, rc_customer_name, rc_customer_phone, rc_amount, rc_payment_mode, rc_created_by, rc_status, eby, edtm, mdtm, createdAt, updatedAt, entered_by)
        VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW(), NOW(), ?)
      `, {
        replacements: [
          `RC-${String(i).padStart(10, '0')}`,
          `${user.us_fname} ${user.us_lname || ''}`,
          user.us_phone,
          1000.00,
          'Cash',
          'SYSTEM',
          'Active',
          'SYSTEM',
          1
        ]
      });
    }

    // 7. Seed Payment Type 3: ctXcontra
    console.log('Seeding Contras (ctXcontra)...');
    for (let i = 0; i < RECORD_COUNT; i++) {
      await sequelize.query(`
        INSERT INTO ctXcontra (ct_entry_no, ct_date, ct_from_account, ct_to_account, ct_amount, ct_created_by, ct_status, eby, edtm, mdtm, createdAt, updatedAt)
        VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW(), NOW())
      `, {
        replacements: [
          `CT-${String(i).padStart(10, '0')}`,
          'CASH',
          'BANK',
          5000.00,
          'SYSTEM',
          'Active',
          'SYSTEM'
        ]
      });
    }

    // 8. Seed Payment Type 4: jeXjournal
    console.log('Seeding Journals (jeXjournal)...');
    for (let i = 0; i < RECORD_COUNT; i++) {
      await sequelize.query(`
        INSERT INTO jeXjournal (je_entry_no, je_date, je_account, je_entry_type, je_amount, je_voucher_type, je_created_by, je_status, eby, edtm, mdtm, createdAt, updatedAt)
        VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW(), NOW())
      `, {
        replacements: [
          `JE-${String(i).padStart(10, '0')}`,
          'OFFICE EXPENSE',
          i % 2 === 0 ? 'Debit' : 'Credit',
          200.00,
          'Journal',
          'SYSTEM',
          'Active',
          'SYSTEM'
        ]
      });
    }

    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n🎉 Comprehensive mass seeding completed successfully!');
    
    // Post-insert validation
    console.log('\n📊 POST-INSERT VALIDATION:');
    const [counts] = await sequelize.query(`
      SELECT 'blXbilling' as table_name, count(*) as row_count FROM blXbilling
      UNION ALL SELECT 'ptXpayment', count(*) FROM ptXpayment
      UNION ALL SELECT 'rcXreceipt', count(*) FROM rcXreceipt
      UNION ALL SELECT 'ctXcontra', count(*) FROM ctXcontra
      UNION ALL SELECT 'jeXjournal', count(*) FROM jeXjournal
    `);
    console.table(counts);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error during comprehensive mass seeding:', error);
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    process.exit(1);
  }
};

seedMassData();
