/**
 * Bill numbering, cancellation and settlement verification.
 *
 *   node src/scripts/testBillNumbering.js
 *
 * Creates throwaway customer/bookings/bills/payments over HTTP, asserts the agreed
 * rules, then deletes the rows it created. Consumed bill numbers are NOT rolled
 * back — issued numbers are never reused.
 */
require('dotenv').config({ quiet: true });
const jwt = require('jsonwebtoken');
const { QueryTypes } = require('sequelize');
const {
  sequelizeTVL,
  BillTVL,
  BookingTVL,
  PassengerTVL,
  StationBoy,
  UserTVL,
  CustomerTVL
} = require('../models');

const BASE = process.env.LOCAL_TEST_API || 'http://127.0.0.1:5004';
const results = [];
let createdBillIds = [];
let createdBookingIds = [];
let createdPaymentIds = [];
let testCustomerUsid = null;

const FARE_PER_BILL = 4000;
const SB_INCENTIVE = 100;
const SERVICE_CHARGE = 250;
const BILL_TOTAL = FARE_PER_BILL + SB_INCENTIVE + SERVICE_CHARGE;
const FIFO_PAYMENT = 1200;

function check(name, passed, detail = '') {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function api(method, path, body, token) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { raw: text.slice(0, 300) };
  }
  return { status: response.status, json };
}

function today(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

// Validation failures come back as { error } from billing and { message } from payments.
function errMsg(response) {
  return `${response.json?.error || response.json?.message || ''}`;
}

function createBillBody(fixture, billDate) {
  return {
    bookingId: fixture.booking.bk_bkid,
    customerName: fixture.booking.bk_customername,
    phoneNumber: fixture.booking.bk_phonenumber,
    journeyDate: today(7),
    billDate,
    fromStation: 'NDLS',
    toStation: 'BCT',
    trainNumber: '12925',
    reservationClass: '3A',
    pnrNumbers: fixture.pnr,
    stationBoyId: fixture.stationBoyId,
    stationBoy: fixture.stationBoyName,
    railwayFare: FARE_PER_BILL,
    stationBoyIncentive: SB_INCENTIVE,
    serviceCharges: SERVICE_CHARGE,
    platformFees: 0,
    miscCharges: 0,
    deliveryCharges: 0,
    gst: 0,
    surcharge: 0,
    discount: 0,
    gstType: 'EXCLUSIVE',
    status: 'CNF'
  };
}

async function allocationsOf(paymentId) {
  return sequelizeTVL.query(`
    SELECT pa.bill_id, pa.allocated_amount, b.bl_booking_id, b.bl_billing_date
    FROM payment_allocations pa
    JOIN blXbilling b ON b.bl_id = pa.bill_id
    WHERE pa.payment_id = :paymentId
    ORDER BY pa.allocation_id ASC`, {
    replacements: { paymentId },
    type: QueryTypes.SELECT
  });
}

async function main() {
  const admin = await UserTVL.findOne({ where: { us_usertype: 'admin' } });
  if (!admin) throw new Error('No admin user found to sign the test token');
  const token = jwt.sign({ id: admin.us_usid }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '1h' });

  const stationBoy = await StationBoy.findOne({ where: { status: 'ACTIVE' } });
  if (!stationBoy) throw new Error('No active station boy for the test bills');

  const [legacyBaseline] = await sequelizeTVL.query(
    `SELECT COUNT(*) AS c FROM blXbilling WHERE bl_entry_no LIKE 'BILL-%'`, { type: QueryTypes.SELECT });
  const legacyBefore = Number(legacyBaseline.c);

  const stamp = Date.now().toString().slice(-7);
  testCustomerUsid = `TST${stamp}`;
  const testPhone = `9${stamp}`;

  // customer_ledger.customer_id has a real FK to cuXcustomer(cu_usid), which in
  // turn points at usXuser, so the fixture needs both rows.
  await UserTVL.create({
    us_usid: testCustomerUsid,
    us_email: `${testCustomerUsid.toLowerCase()}@test.local`,
    us_usname: testCustomerUsid.toLowerCase(),
    us_admin: 0,
    us_security: 0,
    us_limit: 0,
    us_active: 1,
    us_appadmin: 0,
    us_fname: 'Numbering Test',
    us_lname: `Test${stamp}`,
    us_phone: testPhone,
    us_usertype: 'customer',
    us_edtm: new Date(),
    us_eby: admin.us_usid,
    us_cdtm: new Date(),
    us_cby: admin.us_usid
  });
  await CustomerTVL.create({
    cu_cusid: `CU${stamp}`,
    cu_usid: testCustomerUsid,
    cu_custno: `TN${stamp}`,
    cu_custtype: 'INDIVIDUAL',
    cu_active: 1,
    entered_by: Number(admin.us_usid) || 1,
    entered_on: new Date()
  });

  // --- fixtures: 2 bookings, 4 passengers each, distinct PNRs -----------------
  const fixtures = [];
  for (let i = 0; i < 2; i += 1) {
    const pnr = `8${stamp}${i}`;
    const booking = await BookingTVL.create({
      bk_bkno: `TNB${stamp}${i}`,
      bk_usid: testCustomerUsid,
      bk_customername: 'Numbering Test',
      bk_phonenumber: testPhone,
      bk_fromst: 'NDLS',
      bk_tost: 'BCT',
      bk_trvldt: new Date(today(7)),
      bk_class: '3A',
      bk_status: 'PND',
      bk_pnr: pnr,
      bk_billed: 0,
      eby: admin.us_usid,
      edtm: new Date(),
      mby: admin.us_usid,
      mdtm: new Date()
    });
    createdBookingIds.push(Number(booking.bk_bkid));

    const passengerIds = [];
    for (let p = 0; p < 4; p += 1) {
      const passenger = await PassengerTVL.create({
        ps_bkid: booking.bk_bkid,
        ps_fname: `Pax${p}`,
        ps_lname: `Test${stamp}`,
        ps_age: 30,
        ps_gender: 'M',
        ps_active: 1,
        eby: admin.us_usid,
        edtm: new Date(),
        mby: admin.us_usid,
        mdtm: new Date()
      });
      passengerIds.push(Number(passenger.ps_psid));
    }
    fixtures.push({
      booking,
      passengerIds,
      pnr,
      stationBoyId: stationBoy.id,
      stationBoyName: stationBoy.name
    });
  }

  // --- Test 1: concurrent creation gives unique sequential numbers -----------
  // Booking 0 bills today, booking 1 the day before, so the older bill must win
  // any FIFO comparison made later.
  const responses = await Promise.all(
    fixtures.map((fixture, i) => api('POST', '/api/billing', createBillBody(fixture, i === 0 ? today(0) : today(-1)), token))
  );

  console.log('create statuses:', responses.map((r) => r.status).join(','));
  const firstError = responses.find((r) => r.status >= 400);
  if (firstError) {
    console.error('Bill creation failed:', JSON.stringify(firstError.json).slice(0, 600));
    throw new Error('bill creation failed');
  }

  const bills = await BillTVL.findAll({
    where: { bl_booking_id: fixtures.map((f) => f.booking.bk_bkid) },
    order: [['bl_id', 'ASC']]
  });
  createdBillIds = bills.map((b) => Number(b.bl_id));

  const entryNumbers = bills.map((b) => b.bl_entry_no);
  check('concurrent creates return unique bill numbers', new Set(entryNumbers).size === entryNumbers.length, entryNumbers.join(' , '));
  check('numbers use the AT/FY/sequence format', bills.every((b) => /^AT\/\d{4}-\d{2}\/\d+$/.test(b.bl_entry_no)), bills[0]?.bl_entry_no);
  check('sequential numbers are contiguous', (() => {
    const seq = bills.map((b) => parseInt(String(b.bl_entry_no).split('/').pop(), 10)).sort((a, z) => a - z);
    return seq.every((value, index) => index === 0 || value === seq[index - 1] + 1);
  })(), entryNumbers.join(' , '));
  check('new bills are typed R', bills.every((b) => b.bl_billing_type === 'R'));
  check('sequential documents carry no manual sub bill number', bills.every((b) => !b.bl_sub_bill_no));
  check('billed amount is fare + incentive + service charge',
    bills.every((b) => Math.abs(parseFloat(b.bl_total_amount) - BILL_TOTAL) < 0.01),
    bills.map((b) => b.bl_total_amount).join(' , '));

  const target = bills.find((b) => Number(b.bl_booking_id) === Number(fixtures[0].booking.bk_bkid));
  const otherBill = bills.find((b) => Number(b.bl_booking_id) === Number(fixtures[1].booking.bk_bkid));
  const targetPassengers = fixtures[0].passengerIds;

  // --- Test 2: partial cancellation keeps the bill number --------------------
  const cancelFirst = await api('POST', `/api/billing/${target.bl_id}/cancel`, {
    cancelledPassengers: targetPassengers.slice(0, 2),
    railwayCharges: 200,
    agentCharges: 50,
    reason: 'Two tickets cancelled by test'
  }, token);

  if (cancelFirst.status >= 400) {
    console.error('cancel failed:', JSON.stringify(cancelFirst.json).slice(0, 600));
    throw new Error('cancellation failed');
  }

  const originalAfter = await BillTVL.findByPk(target.bl_id);
  const docInfo = cancelFirst.json?.cancellationDocument || {};
  const doc1 = await BillTVL.findByPk(docInfo.billId);
  if (doc1) createdBillIds.push(Number(doc1.bl_id));

  const cancelledFare1 = Math.round(((FARE_PER_BILL / 4) * 2) * 100) / 100;
  const expectedRefund1 = cancelledFare1 - 250;

  check('cancellation document exists', Boolean(doc1), docInfo.entryNumber);
  check('cancellation keeps the same bill number as the reservation',
    doc1 && doc1.bl_bill_no === originalAfter.bl_bill_no, `${doc1?.bl_bill_no} vs ${originalAfter.bl_bill_no}`);
  check('cancellation entry number is derived and unique',
    doc1 && doc1.bl_entry_no !== originalAfter.bl_entry_no && /^AT\/\d{4}-\d{2}\/\d+-C1$/.test(doc1.bl_entry_no), doc1?.bl_entry_no);
  check('cancellation document is typed C', doc1 && doc1.bl_billing_type === 'C', doc1?.bl_billing_type);
  check('reservation bill number never changed', originalAfter.bl_entry_no === target.bl_entry_no, originalAfter.bl_entry_no);
  check('refund is railway fare share minus railway and agent charges',
    doc1 && Math.abs((parseFloat(doc1.refund_amount) || 0) - expectedRefund1) < 0.01,
    `refund=${doc1?.refund_amount} expected=${expectedRefund1}`);
  check('cancellation document reverses the cancelled fare only',
    doc1 && Math.abs((parseFloat(doc1.bl_railway_fare) || 0) + cancelledFare1) < 0.01,
    `bl_railway_fare=${doc1?.bl_railway_fare}`);
  check('cancellation document total is minus the refund',
    doc1 && Math.abs((parseFloat(doc1.bl_total_amount) || 0) + expectedRefund1) < 0.01,
    `total=${doc1?.bl_total_amount}`);
  check('service charge and station boy incentive are retained, not reversed',
    doc1 && Math.abs(parseFloat(doc1.bl_service_charge) || 0) < 0.01
    && Math.abs(parseFloat(doc1.bl_sb_incentive) || 0) < 0.01,
    `sc=${doc1?.bl_service_charge} sbi=${doc1?.bl_sb_incentive}`);
  check('issued reservation amounts stay untouched',
    Math.abs(parseFloat(originalAfter.bl_total_amount) - BILL_TOTAL) < 0.01
    && Math.abs(parseFloat(originalAfter.bl_railway_fare) - FARE_PER_BILL) < 0.01,
    `total=${originalAfter.bl_total_amount} fare=${originalAfter.bl_railway_fare}`);
  check('partial cancellation leaves the reservation open',
    originalAfter.is_cancelled === 0 && originalAfter.bl_status !== 'CANCELLED',
    `${originalAfter.bl_status} / is_cancelled=${originalAfter.is_cancelled}`);
  check('cancelled passengers come off the reservation roster',
    Array.isArray(originalAfter.bl_passenger_ids)
    && originalAfter.bl_passenger_ids.length === 2
    && !originalAfter.bl_passenger_ids.some((pid) => targetPassengers.slice(0, 2).includes(Number(pid))),
    JSON.stringify(originalAfter.bl_passenger_ids));
  check('cancellation reason and user are recorded',
    Boolean(originalAfter.cancellation_reason) && Boolean(originalAfter.cancelled_by),
    `${originalAfter.cancellation_reason} by ${originalAfter.cancelled_by}`);

  // --- Test 3: invalid cancellation attempts are rejected --------------------
  const repeat = await api('POST', `/api/billing/${target.bl_id}/cancel`, {
    cancelledPassengers: targetPassengers.slice(0, 2),
    railwayCharges: 200,
    agentCharges: 50,
    reason: 'Duplicate cancellation attempt'
  }, token);
  check('re-cancelling the same passenger is rejected',
    repeat.status === 400 && /already cancelled/i.test(errMsg(repeat)),
    `${repeat.status} ${errMsg(repeat).slice(0, 120)}`);

  const noReason = await api('POST', `/api/billing/${target.bl_id}/cancel`, {
    cancelledPassengers: targetPassengers.slice(2),
    railwayCharges: 0,
    agentCharges: 0
  }, token);
  check('cancellation without a reason is rejected',
    noReason.status === 400 && /reason is required/i.test(errMsg(noReason)),
    `${noReason.status} ${errMsg(noReason).slice(0, 120)}`);

  const overCharges = await api('POST', `/api/billing/${target.bl_id}/cancel`, {
    cancelledPassengers: targetPassengers.slice(2),
    railwayCharges: 1500,
    agentCharges: 700,
    reason: 'Charges exceed the refundable fare'
  }, token);
  check('cancellation charges above the refundable fare are rejected',
    overCharges.status === 400 && /cannot exceed the refundable railway fare/i.test(errMsg(overCharges)),
    `${overCharges.status} ${errMsg(overCharges).slice(0, 120)}`);

  const foreignPassenger = await api('POST', `/api/billing/${target.bl_id}/cancel`, {
    cancelledPassengers: fixtures[1].passengerIds.slice(0, 1),
    railwayCharges: 100,
    agentCharges: 0,
    reason: 'Passenger from another booking'
  }, token);
  check('cancelling a passenger who is not on the bill is rejected',
    foreignPassenger.status === 400 && /not on this bill/i.test(errMsg(foreignPassenger)),
    `${foreignPassenger.status} ${errMsg(foreignPassenger).slice(0, 120)}`);

  // --- Test 4: settlement — PNR first, then oldest pending -------------------
  // The target bill is still open with 2 tickets and is NEWER than otherBill; a
  // payment naming its PNR must settle it ahead of the older bill.
  const netTarget = Math.round((BILL_TOTAL - expectedRefund1) * 100) / 100;
  const paymentAmountA = netTarget - 500;

  const withPnr = await api('POST', '/api/employee/payments', {
    customerId: testCustomerUsid,
    amount: paymentAmountA,
    mode: 'UPI',
    refNo: `TESTUTR${stamp}A`,
    paymentDate: today(0),
    remarks: 'PNR specific settlement test',
    pnr: fixtures[0].pnr
  }, token);
  check('payment endpoint accepts a PNR reference', withPnr.status < 400, `${withPnr.status} ${JSON.stringify(withPnr.json).slice(0, 240)}`);

  const paymentAId = withPnr.json?.payment?.pt_ptid;
  if (paymentAId) createdPaymentIds.push(Number(paymentAId));

  if (paymentAId) {
    const allocsA = await allocationsOf(paymentAId);
    check('PNR payment settles the bill carrying that PNR',
      allocsA.length === 1 && Number(allocsA[0].bill_id) === Number(target.bl_id),
      JSON.stringify(allocsA));
    check('PNR payment wins over the older pending bill',
      !allocsA.some((a) => Number(a.bill_id) === Number(otherBill.bl_id)),
      `older bill ${otherBill.bl_id} untouched`);

    const afterA = await BillTVL.findByPk(target.bl_id);
    check('settled bill moves to PARTIALLY_PAID', afterA.payment_status === 'PARTIALLY_PAID', afterA.payment_status);

    const [paidRow] = await sequelizeTVL.query(
      'SELECT pt_allocatedamt, pt_unallocamt FROM ptXpayment WHERE pt_ptid = :id',
      { replacements: { id: paymentAId }, type: QueryTypes.SELECT }
    );
    check('payment totals track what was allocated',
      paidRow && Math.abs(parseFloat(paidRow.pt_allocatedamt) - paymentAmountA) < 0.01
      && Math.abs(parseFloat(paidRow.pt_unallocamt)) < 0.01,
      JSON.stringify(paidRow));

    // A payment without a PNR must settle the oldest pending bill first.
    const noPnr = await api('POST', '/api/employee/payments', {
      customerId: testCustomerUsid,
      amount: FIFO_PAYMENT,
      mode: 'CASH',
      refNo: `TESTUTR${stamp}B`,
      paymentDate: today(0),
      remarks: 'FIFO fallback settlement test'
    }, token);
    const paymentBId = noPnr.json?.payment?.pt_ptid;
    if (paymentBId) createdPaymentIds.push(Number(paymentBId));

    if (paymentBId) {
      const allocsB = await allocationsOf(paymentBId);
      check('payment without a PNR settles the oldest pending bill first',
        allocsB.length > 0 && Number(allocsB[0].bill_id) === Number(otherBill.bl_id),
        `settled=${allocsB.map((a) => `${a.bill_id}:${a.allocated_amount}`).join(',')}`);
    } else {
      check('second payment created for FIFO test', false, JSON.stringify(noPnr.json).slice(0, 240));
    }
  }

  // --- Test 5: remaining tickets cancel, then the reservation closes ---------
  const cancelSecond = await api('POST', `/api/billing/${target.bl_id}/cancel`, {
    cancelledPassengers: targetPassengers.slice(2),
    railwayCharges: 300,
    agentCharges: 60,
    reason: 'Remaining tickets cancelled'
  }, token);
  check('second cancellation event succeeds', cancelSecond.status === 200, `${cancelSecond.status} ${errMsg(cancelSecond).slice(0, 120)}`);

  const cDocs = await BillTVL.findAll({
    where: { bl_original_bill_id: target.bl_id, bl_billing_type: 'C' },
    order: [['bl_id', 'ASC']]
  });
  createdBillIds = [...new Set([...createdBillIds, ...cDocs.map((d) => Number(d.bl_id))])];
  const doc2 = cDocs[1];
  const cancelledFare2 = Math.round(((FARE_PER_BILL / 4) * 2) * 100) / 100;
  const expectedRefund2 = cancelledFare2 - 360;

  check('one cancellation document per cancellation event', cDocs.length === 2, `${cDocs.length} documents`);
  check('second document gets the next -C suffix', doc2 && /-C2$/.test(doc2.bl_entry_no), doc2?.bl_entry_no);
  check('second document shares the reservation bill number', doc2 && doc2.bl_bill_no === target.bl_bill_no, `${doc2?.bl_bill_no}`);
  check('second refund computed from fare only',
    doc2 && Math.abs((parseFloat(doc2.refund_amount) || 0) - expectedRefund2) < 0.01,
    `refund=${doc2?.refund_amount} expected=${expectedRefund2}`);

  const fullyCancelled = await BillTVL.findByPk(target.bl_id);
  check('reservation closes only when no passenger remains',
    fullyCancelled.is_cancelled === 1 && fullyCancelled.bl_status === 'CANCELLED',
    `${fullyCancelled.bl_status} / is_cancelled=${fullyCancelled.is_cancelled}`);
  check('reservation amounts still untouched after both cancellations',
    Math.abs(parseFloat(fullyCancelled.bl_total_amount) - BILL_TOTAL) < 0.01,
    `total=${fullyCancelled.bl_total_amount}`);
  check('refunds accumulate on the reservation',
    Math.abs((parseFloat(fullyCancelled.refund_amount) || 0) - (expectedRefund1 + expectedRefund2)) < 0.01,
    `refund_amount=${fullyCancelled.refund_amount}`);

  const afterClose = await api('POST', `/api/billing/${target.bl_id}/cancel`, {
    cancelledPassengers: targetPassengers.slice(2),
    railwayCharges: 100,
    agentCharges: 0,
    reason: 'Cancel an already closed bill'
  }, token);
  check('cancelling a closed reservation is rejected',
    afterClose.status === 400 && /already cancelled/i.test(errMsg(afterClose)),
    `${afterClose.status} ${errMsg(afterClose).slice(0, 120)}`);

  const onCDoc = await api('POST', `/api/billing/${doc2?.bl_id}/cancel`, {
    cancelledPassengers: targetPassengers.slice(2),
    railwayCharges: 100,
    agentCharges: 0,
    reason: 'Cancel a cancellation document'
  }, token);
  check('a cancellation document cannot itself be cancelled',
    onCDoc.status === 400 && /cannot be cancelled/i.test(errMsg(onCDoc)),
    `${onCDoc.status} ${errMsg(onCDoc).slice(0, 120)}`);

  // --- Test 6: bill numbers cannot be edited ---------------------------------
  const tamper = await api('PUT', `/api/billing/${otherBill.bl_id}`, {
    bl_entry_no: 'HACKED-001',
    billNumber: 'HACKED-001',
    bl_bill_no: 'HACKED-001',
    bl_sub_bill_no: 'HACKED-A',
    bl_billing_type: 'C',
    customerName: 'Renamed By Test'
  }, token);
  const afterTamper = await BillTVL.findByPk(otherBill.bl_id);
  check('PUT still edits ordinary bill fields',
    tamper.status < 400 && afterTamper.bl_customer_name === 'Renamed By Test',
    `${tamper.status} name=${afterTamper.bl_customer_name}`);
  check('PUT cannot overwrite the bill number',
    afterTamper.bl_entry_no === otherBill.bl_entry_no && afterTamper.bl_bill_no === otherBill.bl_bill_no,
    `entry=${afterTamper.bl_entry_no}`);
  check('PUT cannot overwrite the sub bill number',
    (afterTamper.bl_sub_bill_no || null) === (otherBill.bl_sub_bill_no || null),
    `sub=${afterTamper.bl_sub_bill_no}`);
  check('PUT cannot relabel a reservation as a cancellation',
    afterTamper.bl_billing_type === 'R', `type=${afterTamper.bl_billing_type}`);

  const editCancelled = await api('PUT', `/api/billing/${target.bl_id}`, { customerName: 'Should Not Stick' }, token);
  check('cancelled reservation cannot be edited',
    editCancelled.status === 400 && /cannot be edited/i.test(errMsg(editCancelled)),
    `${editCancelled.status} ${errMsg(editCancelled).slice(0, 120)}`);

  const reversedFare = cDocs.reduce((sum, d) => sum + Math.abs(parseFloat(d.bl_railway_fare) || 0), 0);
  check('cancelled documents never reverse more railway fare than was billed',
    Math.abs(reversedFare - FARE_PER_BILL) < 0.01, `reversed=${reversedFare} billed=${FARE_PER_BILL}`);

  // --- Test 7: ledger nets to issued minus refunds ---------------------------
  const ledgerRows = await sequelizeTVL.query(`
    SELECT entry_type, reference_type,
           COALESCE(SUM(debit_amount), 0) AS debit,
           COALESCE(SUM(credit_amount), 0) AS credit
    FROM customer_ledger
    WHERE customer_id = :customerId
    GROUP BY entry_type, reference_type`, {
    replacements: { customerId: testCustomerUsid },
    type: QueryTypes.SELECT
  });

  const sumBy = (predicate, column) => ledgerRows
    .filter(predicate)
    .reduce((sum, row) => sum + parseFloat(row[column] || 0), 0);

  const refundCredit = sumBy((r) => r.reference_type === 'BILL_CANCELLATION', 'credit');
  check('each cancellation event posted its refund to the customer ledger',
    Math.abs(refundCredit - (expectedRefund1 + expectedRefund2)) < 0.01,
    `credit=${refundCredit} expected=${expectedRefund1 + expectedRefund2}`);

  const billDebit = sumBy((r) => r.entry_type === 'BILL', 'debit');
  check('issued bills are debited to the ledger at full value',
    Math.abs(billDebit - BILL_TOTAL * 2) < 0.01, `debit=${billDebit} expected=${BILL_TOTAL * 2}`);

  const paymentCredit = sumBy((r) => r.entry_type === 'PAYMENT', 'credit');
  check('payments are credited to the ledger once',
    Math.abs(paymentCredit - (paymentAmountA + FIFO_PAYMENT)) < 0.01, `credit=${paymentCredit}`);

  const expectedNet = BILL_TOTAL * 2 - (expectedRefund1 + expectedRefund2) - paymentAmountA - FIFO_PAYMENT;
  check('ledger net receivable equals issued minus refunded minus paid',
    Math.abs((billDebit - refundCredit - paymentCredit) - expectedNet) < 0.01,
    `net=${billDebit - refundCredit - paymentCredit} expected=${expectedNet}`);

  const [refundCount] = await sequelizeTVL.query(`
    SELECT COUNT(*) AS c FROM customer_ledger
    WHERE customer_id = :customerId AND reference_type = 'BILL_CANCELLATION'`, {
    replacements: { customerId: testCustomerUsid }, type: QueryTypes.SELECT
  });
  check('no duplicate refund posting per cancellation event', Number(refundCount.c) === 2, `rows=${refundCount.c}`);

  // --- Test 8: legacy numbers untouched --------------------------------------
  const [legacyNow] = await sequelizeTVL.query(`
    SELECT COUNT(*) AS c FROM blXbilling WHERE bl_entry_no LIKE 'BILL-%'`, { type: QueryTypes.SELECT });
  check('historical BILL-* rows are neither deleted nor renumbered',
    Number(legacyNow.c) === legacyBefore, `before=${legacyBefore} after=${legacyNow.c}`);

  const seqRows = await sequelizeTVL.query('SELECT * FROM bill_number_sequences', { type: QueryTypes.SELECT });
  console.log('sequence rows:', JSON.stringify(seqRows));
}

async function cleanup() {
  try {
    if (createdPaymentIds.length) {
      await sequelizeTVL.query('DELETE FROM payment_allocations WHERE payment_id IN (:ids)', { replacements: { ids: createdPaymentIds } });
      await sequelizeTVL.query('DELETE FROM ptXpayment WHERE pt_ptid IN (:ids)', { replacements: { ids: createdPaymentIds } });
    }
    if (createdBookingIds.length) {
      // Pick up bills by booking as well, so an abort between bill creation and
      // bookkeeping cannot leave rows that block the booking delete.
      const runBills = await sequelizeTVL.query(
        'SELECT bl_id FROM blXbilling WHERE bl_booking_id IN (:ids)',
        { replacements: { ids: createdBookingIds }, type: QueryTypes.SELECT }
      );
      const allBillIds = [...new Set([...createdBillIds, ...runBills.map((b) => Number(b.bl_id))])];
      if (allBillIds.length) {
        await sequelizeTVL.query('DELETE FROM payment_allocations WHERE bill_id IN (:ids)', { replacements: { ids: allBillIds } });
        await sequelizeTVL.query('DELETE FROM blXbilling WHERE bl_id IN (:ids)', { replacements: { ids: allBillIds } });
      }
    } else if (createdBillIds.length) {
      await sequelizeTVL.query('DELETE FROM payment_allocations WHERE bill_id IN (:ids)', { replacements: { ids: createdBillIds } });
      await sequelizeTVL.query('DELETE FROM blXbilling WHERE bl_id IN (:ids)', { replacements: { ids: createdBillIds } });
    }
    if (testCustomerUsid) {
      await sequelizeTVL.query('DELETE FROM customer_ledger WHERE customer_id = :id', { replacements: { id: testCustomerUsid } });
      await sequelizeTVL.query('DELETE FROM cuXcustomer WHERE cu_usid = :id', { replacements: { id: testCustomerUsid } });
      await sequelizeTVL.query('DELETE FROM usXuser WHERE us_usid = :id', { replacements: { id: testCustomerUsid } });
    }
    if (createdBookingIds.length) {
      await sequelizeTVL.query('DELETE FROM psXpassenger WHERE ps_bkid IN (:ids)', { replacements: { ids: createdBookingIds } });
      await sequelizeTVL.query('DELETE FROM bkXbooking WHERE bk_bkid IN (:ids)', { replacements: { ids: createdBookingIds } });
    }
    console.log('cleanup done (issued bill numbers stay consumed)');
  } catch (error) {
    console.warn('cleanup warning:', error.message);
  }
}

(async () => {
  try {
    await main();
  } catch (error) {
    console.error('TEST RUN ERROR:', error.message);
    results.push({ name: 'test run', passed: false, detail: error.message });
  } finally {
    await cleanup();
    const failed = results.filter((r) => !r.passed);
    console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
    if (failed.length) {
      console.log('Failed checks:');
      failed.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
    }
    await sequelizeTVL.close();
    process.exit(failed.length ? 1 : 0);
  }
})();
