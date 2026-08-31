'use strict';

const PDFDocument = require('pdfkit');

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(value) {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n) || n === 0) return '0.00';
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function fmtShortDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

function hRule(doc, x, y, width, thickness = 0.5) {
  doc.save()
     .strokeColor('#000000')
     .lineWidth(thickness)
     .moveTo(x, y)
     .lineTo(x + width, y)
     .stroke()
     .restore();
}

/**
 * Format particulars in one compact line:
 * e.g. "R KAVITA T X 1 NDLS-CNB,27/10,22426T,CC,(RADHE)"
 */
function buildParticularsLine(payload) {
  const { bill = {}, booking = {}, passengers = [], cancellation = {} } = payload;
  const isCancel = Boolean(cancellation?.isCancelled || bill.is_cancelled || bill.bl_status === 'CAN' || bill.status === 'CAN');
  const typePrefix = isCancel ? 'C' : 'R';

  const paxCount = passengers.length > 0 ? passengers.length : (bill.bl_seatsAlloted || booking.seatsReserved || 1);
  const firstPaxName = (passengers[0]?.name || bill.bl_customer_name || 'PAX').toUpperCase();

  const fromStn = (booking.fromStation || bill.bl_from_station || '').toUpperCase();
  const toStn = (booking.toStation || bill.bl_to_station || '').toUpperCase();
  const sector = fromStn && toStn ? `${fromStn}-${toStn}` : (fromStn || toStn || '');

  const jDate = fmtShortDate(booking.journeyDate || bill.bl_journey_date || bill.bl_date);
  const rawTrain = booking.trainNumber || bill.bl_train_no || '';
  const trainNo = rawTrain ? `${rawTrain}T` : '';
  const travelClass = (booking.reservationClass || bill.bl_class || '3A').toUpperCase();

  const remarks = booking.stationBoy || bill.stationBoy || bill.bl_station_boy || bill.remarks || bill.bl_remarks || '';
  const remarksTag = remarks ? `,(${remarks})` : '';

  const details = [sector, jDate, trainNo, travelClass].filter(Boolean).join(',');

  return `${typePrefix} ${firstPaxName} X ${paxCount} ${details}${remarksTag}`;
}

/**
 * Generates the Merged Bills Statement of Outstanding Account PDF matching reference
 * Shows: Date, Bill no, Particulars, Amount
 * In case of advance, adds an extra row with 'Adv payment' in particulars and -ve amount.
 * @param {Array} payloads - Array of bill print payloads
 * @returns {Promise<Buffer>}
 */
async function generateMergedBillsPDF(payloads) {
  const M = 40;
  const PW = 595.28; // A4
  const PH = 841.89;
  const CW = PW - M * 2;

  const doc = new PDFDocument({ size: 'A4', margin: M, autoFirstPage: true });
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  if (!payloads || payloads.length === 0) {
    doc.end();
    return Buffer.concat(buffers);
  }

  const firstPayload = payloads[0] || {};
  const { company = {}, customer = {} } = firstPayload;

  const agencyName = (company.name || 'AMOLAK TRAVELS').toUpperCase();
  const agencyAddress = company.address && company.address !== 'Address unavailable'
    ? company.address
    : '3173 / 32, BEADON PURA KAROL BAGH, DELHI-110005';

  const todayStr = fmtDate(new Date());
  const stmtNo = Math.floor(1000 + Math.random() * 9000);

  let y = M;

  // ── Company Header (Centered) ──
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#000000')
     .text(agencyName, M, y, { width: CW, align: 'center' });
  y += 18;

  doc.font('Helvetica').fontSize(9.5).fillColor('#000000')
     .text(agencyAddress, M, y, { width: CW, align: 'center' });
  y += 24;

  // ── Document Title ──
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000')
     .text('STATEMENT OF OUTSTANDING ACCOUNT', M, y, { width: CW, align: 'center', underline: true });
  y += 22;

  // ── Two Column Info Block ──
  const col1X = M;
  const col2X = M + 280;
  const infoStartY = y;

  // Left: Customer To
  doc.font('Helvetica').fontSize(8.5).fillColor('#000000')
     .text('To,', col1X, y);
  y += 12;

  const custName = (customer.name || firstPayload.bill?.bl_customer_name || 'BAPA NAGAR OFFICE TKT A/C').toUpperCase();
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000')
     .text(custName, col1X + 15, y, { width: 250 });
  y += 12;

  const custAddr = customer.address && customer.address !== 'Address unavailable'
    ? customer.address
    : (customer.city ? `${customer.city}, ${customer.state || ''}` : 'BAPA NAGAR, KAROL BAGH, NEW DELHI-110005');
  doc.font('Helvetica').fontSize(8).fillColor('#000000')
     .text(custAddr, col1X + 15, y, { width: 250 });
  y += (custAddr.length > 35 ? 20 : 12);

  const phoneStr = customer.phone || firstPayload.bill?.bl_customer_phone || '';
  if (phoneStr) {
    doc.text(phoneStr, col1X + 15, y, { width: 250 });
    y += 12;
  }

  // Right: Statement Meta
  let ry = infoStartY + 12;
  const metaLines = [
    ['STATEMENT NO.', `: ${stmtNo}`],
    ['DATE', `: ${todayStr}`],
    ['PREPARED BY', `: ${(firstPayload.audit?.enteredBy || 'AMIT KUMAR').toUpperCase()}`],
    ['PAYMENT TERM', ': '],
    ['BILL DUE DAY', ': ']
  ];

  metaLines.forEach(([lbl, val]) => {
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000')
       .text(lbl, col2X, ry, { width: 95 })
       .text(val, col2X + 95, ry, { width: 140 });
    ry += 12;
  });

  y = Math.max(y + 10, ry + 10);

  // ── Salutation & Introduction Text ──
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000').text('Kind Attention :', M, y);
  y += 14;

  doc.font('Helvetica').fontSize(8).fillColor('#000000')
     .text('Dear Sir(s),', M, y);
  y += 10;

  doc.text(`We give herebelow the details of your Outstanding account as per our books as on ${todayStr}. Please make the payment as per statement as early as possible.`, M, y, { width: CW });
  y += 20;

  // ── Table Header (Date, Bill no, Particulars, Amount) ──
  const colW = {
    date: 75,
    billNo: 70,
    particulars: 285,
    amount: 85
  };

  const xDate = M;
  const xBill = xDate + colW.date;
  const xPart = xBill + colW.billNo;
  const xAmt = xPart + colW.particulars;

  hRule(doc, M, y, CW, 0.8);
  y += 4;

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000')
     .text('Date', xDate, y, { width: colW.date })
     .text('Bill no', xBill, y, { width: colW.billNo })
     .text('Particulars', xPart, y, { width: colW.particulars })
     .text('Amount', xAmt, y, { width: colW.amount, align: 'right' });
  y += 12;

  hRule(doc, M, y, CW, 0.8);
  y += 6;

  // ── Table Rows ──
  let netTotalAmount = 0;

  payloads.forEach((p) => {
    const bill = p.bill || {};
    const financials = p.financials || {};
    const cancellation = p.cancellation || {};
    const advance = p.advance || {};

    const isCancel = Boolean(cancellation.isCancelled || bill.is_cancelled || bill.bl_status === 'CAN' || bill.status === 'CAN');
    const billDate = fmtDate(bill.date || bill.bl_billing_date || bill.bl_date);
    const billNo = bill.billNumber || bill.bl_entry_no || bill.bl_bill_no || `B-${bill.bl_id}`;
    const rawBillAmount = Number(financials.total || bill.bl_total_amount || 0);
    const billAmount = isCancel ? -rawBillAmount : rawBillAmount;

    netTotalAmount += billAmount;

    const particularsText = buildParticularsLine(p);

    // 1. Bill Row
    doc.font('Helvetica').fontSize(8).fillColor('#000000')
       .text(billDate, xDate, y, { width: colW.date, lineBreak: false })
       .text(billNo, xBill, y, { width: colW.billNo, lineBreak: false })
       .text(particularsText, xPart, y, { width: colW.particulars - 5, lineBreak: false, ellipsis: true })
       .text(fmt(billAmount), xAmt, y, { width: colW.amount, align: 'right' });

    y += 14;

    // 2. Advance Row (if advance payment exists)
    const advAmount = Number(advance.advanceAmount || bill.bl_advance_amount || 0);
    if (advAmount > 0) {
      netTotalAmount -= advAmount;

      const advRef = advance.paymentReference || advance.paymentMode || bill.bl_payment_reference || '';
      const advParticulars = `Adv payment${advRef ? ` (${advRef})` : ''}`;

      doc.font('Helvetica').fontSize(8).fillColor('#000000')
         .text(billDate, xDate, y, { width: colW.date, lineBreak: false })
         .text('', xBill, y, { width: colW.billNo, lineBreak: false })
         .text(advParticulars, xPart, y, { width: colW.particulars - 5, lineBreak: false, ellipsis: true })
         .text(`-${fmt(advAmount)}`, xAmt, y, { width: colW.amount, align: 'right' });

      y += 14;
    }

    // Page break handling
    if (y > PH - M - 100) {
      doc.addPage();
      y = M;
    }
  });

  // ── Summary Totals ──
  y += 4;
  hRule(doc, M, y, CW, 0.8);
  y += 5;

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000')
     .text('Total', xDate, y, { width: 150 })
     .text(fmt(netTotalAmount), xAmt, y, { width: colW.amount, align: 'right' });
  y += 14;

  const balanceType = netTotalAmount >= 0 ? 'Dr' : 'Cr';
  const absBalance = Math.abs(netTotalAmount);

  doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000')
     .text(`BALANCE :    ${fmt(absBalance)} ${balanceType}`, xDate, y, { width: 250 });
  y += 16;

  hRule(doc, M, y, CW, 0.8);
  y += 24;

  // ── Signatures & Confirmation ──
  const signCol1X = M;
  const signCol2X = PW - M - 180;

  doc.font('Helvetica').fontSize(8).fillColor('#000000')
     .text('E. & O. E.', signCol1X, y)
     .text('Yours faithfully', signCol2X, y, { width: 180, align: 'right' });
  y += 14;

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000')
     .text(agencyName, signCol2X, y, { width: 180, align: 'right' });
  y += 10;

  doc.font('Helvetica').fontSize(7.5).fillColor('#000000')
     .text('We do hereby confirm the correctness of', signCol1X, y)
     .text('the above account', signCol1X, y + 10);

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  });
}

module.exports = { generateMergedBillsPDF };
