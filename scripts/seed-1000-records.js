#!/usr/bin/env node
/**
 * Seed 4 core transactional tables with exactly 1000 records each.
 * bkXbooking → blXbilling → acXaccount → ptXpayment
 * usXuser → rcXreceipt
 * All FK relationships preserved. Rollback on error.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const TARGET = 1000;

// ── helpers ──
const pad = (n, l = 3) => String(n).padStart(l, '0');
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const randDec = (a, b, d = 2) => +(a + Math.random() * (b - a)).toFixed(d);
const phone = () => `${pick(['98','99','70','78','85','88','97','96'])}${rand(10000000, 99999999)}`;
const pastDate = (daysBack = 365) => {
  const d = new Date(); d.setDate(d.getDate() - rand(1, daysBack));
  return d.toISOString().slice(0, 19).replace('T', ' ');
};
const futureDate = (daysFwd = 180) => {
  const d = new Date(); d.setDate(d.getDate() + rand(1, daysFwd));
  return d.toISOString().slice(0, 19).replace('T', ' ');
};
const dateOnly = (dt) => dt.slice(0, 10);

const NAMES = ['Amit Sharma','Priya Patel','Rahul Kumar','Sunita Singh','Vikash Gupta',
  'Neha Verma','Arun Joshi','Pooja Mishra','Sanjay Tiwari','Kavita Reddy',
  'Rajesh Nair','Divya Iyer','Manoj Pandey','Sunita Rao','Karan Mehta',
  'Anita Desai','Suresh Bhat','Meena Kulkarni','Arun Saxena','Rina Chakraborty',
  'Vikas Agarwal','Suman Lata','Dinesh Chopra','Poonam Das','Gaurav Malhotra',
  'Shweta Bajaj','Nitin Kapoor','Asha Rani','Deepak Jain','Rekha Gowda'];

const STATION_CITIES = {
  NDLS:'New Delhi',CSMT:'Mumbai',HWH:'Kolkata',MAS:'Chennai',SBC:'Bengaluru',
  SC:'Hyderabad',BPL:'Bhopal',JP:'Jaipur',LKO:'Lucknow',PNBE:'Patna',
  NGP:'Nagpur',PUNE:'Pune',ADI:'Ahmedabad',BBS:'Bhubaneswar',CDG:'Chandigarh',
  CBE:'Coimbatore',DDN:'Dehradun',ERS:'Kochi',INDB:'Indore',VSKP:'Visakhapatnam'
};
const REAL_STATIONS = Object.keys(STATION_CITIES);

const CLASSES = ['SL','3A','2A','1A','CC','EC','2S','GN'];
const QUOTAS = ['GN','TQ','LD','SS','PH','DF'];
const STATUSES = ['DRF','CNF','CAN','PND','PAD','FNL'];
const MODES = ['Cash','Bank','Cheque','Online'];
const PT_MODES = ['Cash','UPI','NEFT','RTGS','Card','Cheque'];
const BILL_STATUSES = ['DRAFT','CONFIRMED','PAID','PENDING','FINAL','CNF'];
const PY_STATUSES = ['PENDING','VERIFIED','CLEARED','PROCESSED'];

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Pri@2005',
    database: process.env.DB_NAME_TVL || 'TVL_001'
  });

  try {
    // ── Step 1: Fetch FK reference data ──
    const [users] = await conn.query('SELECT us_usid FROM usXuser');
    const userIds = users.map(r => r.us_usid);
    const [stations] = await conn.query('SELECT st_stcode FROM stXstation');
    const stCodes = stations.map(r => r.st_stcode);
    const realStations = stCodes.filter(s => REAL_STATIONS.includes(s));

    console.log(`Reference data: ${userIds.length} users, ${stCodes.length} stations (${realStations.length} real)`);
    if (userIds.length < 1) throw new Error('No users found');
    if (stCodes.length < 2) throw new Error('Insufficient stations');

    // ── Step 2: Clear target tables in reverse dependency order ──
    console.log('\n─── Clearing target tables (reverse FK order) ───');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('TRUNCATE TABLE rcXreceipt');
    await conn.query('TRUNCATE TABLE ptXpayment');
    await conn.query('TRUNCATE TABLE acXaccount');
    await conn.query('TRUNCATE TABLE blXbilling');
    await conn.query('TRUNCATE TABLE bkXbooking');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('  All 5 tables truncated (including acXaccount intermediary)');

    await conn.query('START TRANSACTION');
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // ══════════════════════════════════════════════════════════════
    // ── STEP 3: SEED bkXbooking (1000 records) ──
    // ══════════════════════════════════════════════════════════════
    console.log('\n─── Seeding bkXbooking ───');
    const bookingIds = [];
    const batchSize = 100;

    for (let batch = 0; batch < TARGET / batchSize; batch++) {
      const rows = [];
      for (let i = 0; i < batchSize; i++) {
        const idx = batch * batchSize + i + 1;
        const bkid = idx;
        const bkno = `BK${pad(idx, 5)}`;
        const usid = pick(userIds);
        const fromSt = pick(stCodes);
        let toSt = pick(stCodes);
        while (toSt === fromSt) toSt = pick(stCodes);
        const trvldt = futureDate(180);
        const cls = pick(CLASSES);
        const quota = pick(QUOTAS);
        const totalpass = rand(1, 6);
        const reqdt = pastDate(30);
        const status = pick(STATUSES);
        const agent = pick(userIds);
        const pnr = `PNR${pad(idx, 8)}`;
        const billed = rand(0, 1);
        const custName = pick(NAMES);
        const custPhone = phone();
        const remarks = `Booking ${idx} for ${custName}`;
        const priority = pick(['NORMAL', 'HIGH', 'URGENT', 'TATKAL']);
        const berthpref = pick(['LB','MB','UB','SL','SU','WS','CB','NB','NONE']);
        const closed = Math.random() > 0.7;

        rows.push([
          bkid, bkno, usid, custPhone, custName, fromSt, toSt, trvldt,
          cls, quota, berthpref, totalpass, reqdt, status, agent,
          priority, remarks, pnr, billed,
          now, usid, now, null,    // edtm, eby, mdtm, mby
          idx, now, null, null,    // entered_by/on, modified_by/on
          closed ? idx : null, closed ? now : null,  // closed_by/on
          closed ? 'CLOSED' : 'OPEN'  // status enum
        ]);
      }
      await conn.query(
        `INSERT INTO bkXbooking (bk_bkid, bk_bkno, bk_usid, bk_phonenumber, bk_customername,
          bk_fromst, bk_tost, bk_trvldt, bk_class, bk_quota, bk_berthpref, bk_totalpass,
          bk_reqdt, bk_status, bk_agent, bk_priority, bk_remarks, bk_pnr, bk_billed,
          edtm, eby, mdtm, mby, entered_by, entered_on, modified_by, modified_on,
          closed_by, closed_on, status)
         VALUES ?`, [rows]);
      bookingIds.push(...rows.map(r => r[0]));
      process.stdout.write(`\r  Bookings: ${(batch + 1) * batchSize}/${TARGET}`);
    }
    console.log(` ✓`);

    // ══════════════════════════════════════════════════════════════
    // ── STEP 4: SEED blXbilling (1000 records, 1:1 with bookings) ──
    // ══════════════════════════════════════════════════════════════
    console.log('\n─── Seeding blXbilling ───');
    for (let batch = 0; batch < TARGET / batchSize; batch++) {
      const rows = [];
      for (let i = 0; i < batchSize; i++) {
        const idx = batch * batchSize + i + 1;
        const bkid = bookingIds[idx - 1];
        const entryNo = `BLEN${pad(idx, 5)}`;
        const billNo = `BILL${pad(idx, 5)}`;
        const subBillNo = `SB${pad(idx, 4)}`;
        const billingDate = dateOnly(pastDate(30));
        const journeyDate = dateOnly(futureDate(180));
        const custName = pick(NAMES);
        const custPhone = phone();
        const stationBoy = pick(userIds);
        const fromSt = pick(stCodes);
        let toSt = pick(stCodes); while (toSt === fromSt) toSt = pick(stCodes);
        const trainNo = `${rand(10000, 99999)}`;
        const cls = pick(CLASSES);
        const pnr = `PNR${pad(idx, 8)}`;
        const seats = rand(1, 6);
        const railFare = randDec(500, 6000);
        const sbIncentive = randDec(10, 200);
        const gst = +(railFare * 0.05).toFixed(2);
        const miscChg = randDec(0, 50);
        const platFee = randDec(0, 40);
        const srvcChg = randDec(10, 100);
        const delChg = randDec(0, 30);
        const surChg = randDec(0, 50);
        const discount = randDec(0, 100);
        const gstType = pick(['INCLUSIVE','EXCLUSIVE','C']);
        const totalAmt = +(railFare + sbIncentive + gst + miscChg + platFee + srvcChg + delChg + surChg - discount).toFixed(2);
        const isSplit = 0;
        const parentBillId = null;
        const createdBy = pick(userIds);
        const bookingNo = `BK${pad(idx, 5)}`;
        const blStatus = pick(['DRAFT','CONFIRMED','PAID','PENDING','FINAL','CNF']);
        const payStatus = pick(['UNPAID','PARTIALLY_PAID','FULLY_PAID']);
        const isCancelled = blStatus === 'CANCELLED' ? 1 : 0;
        const status = pick(['OPEN','OPEN','CLOSED']);
        const closed = status === 'CLOSED';

        rows.push([
          entryNo, billNo, subBillNo, bkid, billingDate, journeyDate,
          custName, custPhone, stationBoy, fromSt, toSt, trainNo, cls, pnr,
          seats, railFare, sbIncentive, gst, miscChg, platFee, srvcChg,
          delChg, surChg, discount, gstType, totalAmt, isSplit, parentBillId,
          idx, now,           // bl_created_by (int), bl_created_at
          idx, now, null, null, closed ? idx : null, closed ? now : null, status,
          0, 0, 0, 0, 0, payStatus, isCancelled,
          null, null, null, null, blStatus, null, billingDate, bookingNo
        ]);
      }
      await conn.query(
        `INSERT INTO blXbilling (bl_entry_no, bl_bill_no, bl_sub_bill_no, bl_booking_id,
          bl_billing_date, bl_journey_date, bl_customer_name, bl_customer_phone,
          bl_station_boy, bl_from_station, bl_to_station, bl_train_no, bl_class, bl_pnr,
          bl_seats_reserved, bl_railway_fare, bl_sb_incentive, bl_gst, bl_misc_charges,
          bl_platform_fee, bl_service_charge, bl_delivery_charge, bl_surcharge,
          bl_discount, bl_gst_type, bl_total_amount, bl_is_split, bl_parent_bill_id,
          bl_created_by, bl_created_at,
          entered_by, entered_on, modified_by, modified_on, closed_by, closed_on, status,
          bl_railway_cancellation_charge, bl_agent_cancellation_charge,
          bl_station_boy_cancellation_charge, total_cancel_charges, refund_amount,
          payment_status, is_cancelled, cancellation_date, cancelled_on, cancelled_by,
          bl_cancellation_remarks, bl_status, bl_modified_at, bl_bill_date, bl_booking_no)
         VALUES ?`, [rows]);
      process.stdout.write(`\r  Bills: ${(batch + 1) * batchSize}/${TARGET}`);
    }
    console.log(` ✓`);

    // ══════════════════════════════════════════════════════════════
    // ── STEP 5: SEED acXaccount (1000 records, 1:1 with bookings) ──
    // ══════════════════════════════════════════════════════════════
    console.log('\n─── Seeding acXaccount (intermediary for payments) ───');
    const accountIds = [];
    for (let batch = 0; batch < TARGET / batchSize; batch++) {
      const rows = [];
      for (let i = 0; i < batchSize; i++) {
        const idx = batch * batchSize + i + 1;
        const bkid = bookingIds[idx - 1];
        const usid = pick(userIds);
        const totAmt = randDec(1000, 15000);
        const rcvdAmt = randDec(0, totAmt);
        const pendAmt = +(totAmt - rcvdAmt).toFixed(2);
        const year = rand(2024, 2026);
        const fyear = `${year}-${String(year + 1).slice(2)}`;
        const status = pendAmt <= 0 ? 'PAID' : pendAmt < totAmt ? 'PARTIAL' : 'PENDING';

        rows.push([
          bkid, usid, totAmt, rcvdAmt, pendAmt,
          futureDate(60), fyear, status,
          now, usid, now, null
        ]);
      }
      await conn.query(
        `INSERT INTO acXaccount (ac_bkid, ac_usid, ac_totamt, ac_rcvdamt, ac_pendamt,
          ac_duedt, ac_fyear, ac_status, edtm, eby, mdtm, mby)
         VALUES ?`, [rows]);
      // Get auto-generated IDs
      const startId = (await conn.query('SELECT LAST_INSERT_ID() as id'))[0][0].id;
      for (let j = 0; j < rows.length; j++) accountIds.push(startId + j);
      process.stdout.write(`\r  Accounts: ${(batch + 1) * batchSize}/${TARGET}`);
    }
    console.log(` ✓`);

    // ══════════════════════════════════════════════════════════════
    // ── STEP 6: SEED ptXpayment (1000 records) ──
    // ══════════════════════════════════════════════════════════════
    console.log('\n─── Seeding ptXpayment ───');
    for (let batch = 0; batch < TARGET / batchSize; batch++) {
      const rows = [];
      for (let i = 0; i < batchSize; i++) {
        const idx = batch * batchSize + i + 1;
        const acctIdx = ((idx - 1) % accountIds.length);
        const acid = accountIds[acctIdx];
        const bkid = bookingIds[acctIdx]; // same index = same booking as account
        const usid = pick(userIds);
        const totalAmt = randDec(500, 10000);
        const amt = randDec(100, totalAmt);
        const allocAmt = randDec(0, amt);
        const unallocAmt = +(amt - allocAmt).toFixed(2);
        const paydt = pastDate(180);
        const rcvdt = Math.random() > 0.2 ? paydt : null;
        const mode = pick(PT_MODES);
        const refno = mode === 'Cash' ? null : `REF${pad(idx, 8)}`;
        const status = pick(PY_STATUSES);
        const verStatus = pick(['PENDING','VERIFIED','APPROVED','REJECTED']);
        const year = new Date(paydt).getFullYear();
        const month = String(new Date(paydt).getMonth() + 1).padStart(2, '0');
        const finyear = `${year}-${String(year + 1).slice(2)}`;
        const period = `${year}-${month}`;
        const remarks = `Payment ${idx} via ${mode}`;

        rows.push([
          idx, rand(1000, 9999), totalAmt, amt, status, verStatus, remarks,
          acid, mode, refno, paydt, rcvdt,
          allocAmt, unallocAmt, finyear, period, 0,
          now, usid, now, null,
          bkid, usid
        ]);
      }
      await conn.query(
        `INSERT INTO ptXpayment (pt_ptid, pt_custid, pt_totalamt, pt_amount, pt_status,
          pt_verification_status, pt_remarks, pt_acid, pt_mode, pt_refno,
          pt_paydt, pt_rcvdt, pt_allocatedamt, pt_unallocamt, pt_finyear,
          pt_period, pt_locked, edtm, eby, mdtm, mby, pt_bkid, py_created_by)
         VALUES ?`, [rows]);
      process.stdout.write(`\r  Payments: ${(batch + 1) * batchSize}/${TARGET}`);
    }
    console.log(` ✓`);

    // ══════════════════════════════════════════════════════════════
    // ── STEP 7: SEED rcXreceipt (1000 records) ──
    // ══════════════════════════════════════════════════════════════
    console.log('\n─── Seeding rcXreceipt ───');
    for (let batch = 0; batch < TARGET / batchSize; batch++) {
      const rows = [];
      for (let i = 0; i < batchSize; i++) {
        const idx = batch * batchSize + i + 1;
        const entryNo = `RC-${pad(idx, 6)}`;
        const rcDate = dateOnly(pastDate(365));
        const custName = pick(NAMES);
        const custPhone = phone();
        const amt = randDec(200, 12000);
        const mode = pick(MODES);
        const refNum = mode === 'Cash' ? null : `TXN${pad(idx, 8)}`;
        const bankAcct = (mode === 'Bank' || mode === 'Cheque') ? `ACC${pad(rand(1000, 9999), 6)}` : null;
        const narration = `Receipt for booking - ${custName} - ${mode}`;
        const createdBy = pick(userIds);
        const status = pick(['Active', 'Active', 'Active', 'Inactive']);

        rows.push([
          entryNo, rcDate, custName, custPhone, amt,
          mode, refNum, bankAcct, narration, createdBy, status,
          now, createdBy, now, null,
          idx, now, null, null,
          Math.random() > 0.8 ? 'CLOSED' : 'OPEN',
          now, now
        ]);
      }
      await conn.query(
        `INSERT INTO rcXreceipt (rc_entry_no, rc_date, rc_customer_name,
          rc_customer_phone, rc_amount, rc_payment_mode, rc_ref_number,
          rc_bank_account, rc_narration, rc_created_by, rc_status,
          edtm, eby, mdtm, mby, entered_by, entered_on, modified_by,
          modified_on, status, createdAt, updatedAt)
         VALUES ?`, [rows]);
      process.stdout.write(`\r  Receipts: ${(batch + 1) * batchSize}/${TARGET}`);
    }
    console.log(` ✓`);

    await conn.query('COMMIT');
    console.log('\n✅ Transaction committed');

    // ══════════════════════════════════════════════════════════════
    // ── STEP 8: VALIDATION ──
    // ══════════════════════════════════════════════════════════════
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  POST-SEEDING VALIDATION');
    console.log('═══════════════════════════════════════════════════\n');

    // Row counts
    console.log('── Row Counts ──');
    for (const tbl of ['bkXbooking', 'blXbilling', 'acXaccount', 'ptXpayment', 'rcXreceipt']) {
      const [r] = await conn.query(`SELECT COUNT(*) as cnt FROM \`${tbl}\``);
      const cnt = r[0].cnt;
      console.log(`  ${tbl.padEnd(15)} ${String(cnt).padStart(5)} ${cnt === TARGET ? '✓' : '✗ (expected ' + TARGET + ')'}`);
    }

    // FK integrity checks
    console.log('\n── FK Integrity Checks ──');
    const checks = [
      ['blXbilling → bkXbooking',
        'SELECT COUNT(*) as orphans FROM blXbilling LEFT JOIN bkXbooking ON bl_booking_id = bk_bkid WHERE bk_bkid IS NULL'],
      ['acXaccount → bkXbooking',
        'SELECT COUNT(*) as orphans FROM acXaccount LEFT JOIN bkXbooking ON ac_bkid = bk_bkid WHERE bk_bkid IS NULL'],
      ['acXaccount → usXuser',
        'SELECT COUNT(*) as orphans FROM acXaccount LEFT JOIN usXuser ON ac_usid = us_usid WHERE us_usid IS NULL'],
      ['ptXpayment → acXaccount',
        'SELECT COUNT(*) as orphans FROM ptXpayment LEFT JOIN acXaccount ON pt_acid = ac_acid WHERE ac_acid IS NULL'],
      ['ptXpayment → bkXbooking',
        'SELECT COUNT(*) as orphans FROM ptXpayment LEFT JOIN bkXbooking ON pt_bkid = bk_bkid WHERE bk_bkid IS NULL'],
      ['ptXpayment → usXuser',
        'SELECT COUNT(*) as orphans FROM ptXpayment LEFT JOIN usXuser ON py_created_by = us_usid WHERE us_usid IS NULL'],
      ['rcXreceipt → usXuser',
        'SELECT COUNT(*) as orphans FROM rcXreceipt LEFT JOIN usXuser ON rc_created_by = us_usid WHERE us_usid IS NULL'],
    ];

    let allClean = true;
    for (const [label, sql] of checks) {
      const [r] = await conn.query(sql);
      const orphans = r[0].orphans;
      const ok = orphans === 0;
      if (!ok) allClean = false;
      console.log(`  ${label.padEnd(30)} orphans: ${orphans} ${ok ? '✓' : '✗'}`);
    }

    // Entity relationship validation
    console.log('\n── Entity Relationship Validation ──');

    // Every bill has a valid booking
    const [billBk] = await conn.query(
      'SELECT COUNT(DISTINCT bl_booking_id) as linked FROM blXbilling');
    console.log(`  Bills linked to bookings: ${billBk[0].linked}/${TARGET}`);

    // Every payment has valid account + booking
    const [payAcct] = await conn.query(
      'SELECT COUNT(DISTINCT pt_acid) as linkedAccts FROM ptXpayment');
    const [payBk] = await conn.query(
      'SELECT COUNT(DISTINCT pt_bkid) as linkedBks FROM ptXpayment');
    console.log(`  Payments linked to accounts: ${payAcct[0].linkedAccts} distinct accounts`);
    console.log(`  Payments linked to bookings: ${payBk[0].linkedBks} distinct bookings`);

    // Financial consistency: total paid ≤ total amount
    const [finCheck] = await conn.query(
      `SELECT COUNT(*) as inconsistent FROM ptXpayment WHERE pt_allocatedamt > pt_amount`);
    console.log(`  Financial consistency (alloc ≤ amount): ${finCheck[0].inconsistent === 0 ? '✓' : '✗ ' + finCheck[0].inconsistent + ' violations'}`);

    // Booking → bill 1:1 mapping
    const [bkToBill] = await conn.query(
      'SELECT COUNT(*) as dupes FROM blXbilling GROUP BY bl_booking_id HAVING COUNT(*) > 1');
    console.log(`  Booking-Bill 1:1 mapping: ${bkToBill.length === 0 ? '✓ no duplicates' : '✗ ' + bkToBill.length + ' dupes'}`);

    // Unique constraints
    const [bkUnique] = await conn.query(
      'SELECT COUNT(*) as dupes FROM bkXbooking GROUP BY bk_bkno HAVING COUNT(*) > 1');
    const [rcUnique] = await conn.query(
      'SELECT COUNT(*) as dupes FROM rcXreceipt GROUP BY rc_entry_no HAVING COUNT(*) > 1');
    console.log(`  Unique bk_bkno: ${bkUnique.length === 0 ? '✓' : '✗'}`);
    console.log(`  Unique rc_entry_no: ${rcUnique.length === 0 ? '✓' : '✗'}`);

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`  RESULT: ${allClean ? '✅ ALL FK CHECKS PASSED' : '❌ SOME FK CHECKS FAILED'}`);
    console.log('═══════════════════════════════════════════════════');

  } catch (err) {
    await conn.query('ROLLBACK').catch(() => {});
    console.error('\n❌ ROLLBACK:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();
