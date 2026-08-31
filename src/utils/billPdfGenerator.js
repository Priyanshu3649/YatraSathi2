'use strict';

const PDFDocument = require('pdfkit');

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(value) {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return '0.00';
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
 * Generate PDF for a Single Bill / Credit Note matching the exact sample layout
 */
async function generateBillPDF(payload) {
  const { company = {}, bill = {}, customer = {}, booking = {}, passengers = [], financials = {}, gst = {}, cancellation = {} } = payload;

  const doc = new PDFDocument({ size: 'A4', margin: 36 });
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  const M = 36;
  const PW = 595.28;
  const PH = 841.89;
  const CW = PW - M * 2;

  const isCancel = Boolean(cancellation.isCancelled || bill.is_cancelled || bill.bl_status === 'CAN' || bill.status === 'CAN');

  const agencyName = (company.name || 'ANMOL TRAVELS').toUpperCase();
  const agencyAddress = company.address && company.address !== 'Address unavailable'
    ? company.address
    : '3173/32 Beadon Pura Karolbagh, Delhi-110005';
  const panNo = company.pan || 'BAZPC3421R';
  const gstinNo = company.gst && company.gst !== 'N/A' ? company.gst : '07BAZPC3421R2Z2';
  const stateCode = company.stateCode || '07';
  const stateName = (company.state || 'DELHI').toUpperCase();
  const sacCode = company.sacCode || '998555';

  let y = M;

  // ── Document Header (Centered) ──
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#000000')
     .text(isCancel ? 'CREDIT NOTE' : 'TAX INVOICE', M, y, { width: CW, align: 'center', underline: true });
  y += 18;

  doc.font('Helvetica-Bold').fontSize(15).fillColor('#000000')
     .text(agencyName, M, y, { width: CW, align: 'center' });
  y += 18;

  doc.font('Helvetica').fontSize(9).fillColor('#000000')
     .text(agencyAddress, M, y, { width: CW, align: 'center' });
  y += 13;

  doc.text(`PAN NO:${panNo}/GSTIN: ${gstinNo}`, M, y, { width: CW, align: 'center' });
  y += 13;

  doc.text(`STATE CODE: ${stateCode}(${stateName})L/SAC CODE:${sacCode}`, M, y, { width: CW, align: 'center' });
  y += 18;

  hRule(doc, M, y, CW, 0.8);
  y += 8;

  // ── Two Column Meta Section ──
  const col1X = M;
  const col2X = M + 310;
  const metaStartY = y;

  // Left Column: Customer Details
  const custName = (customer.name || bill.bl_customer_name || 'CUSTOMER').toUpperCase();
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000')
     .text(`M/S ${custName}`, col1X, y, { width: 290 });
  y += 12;

  const custAddr = customer.address && customer.address !== 'Address unavailable'
    ? customer.address
    : (customer.city ? `${customer.city}, ${customer.state || ''}` : 'NEW DELHI-110005 INDIA');
  doc.font('Helvetica').fontSize(8).fillColor('#000000')
     .text(custAddr, col1X, y, { width: 290 });
  y += (custAddr.length > 40 ? 20 : 12);

  const custStateCode = customer.stateCode || '07';
  const custState = (customer.state || 'DELHI').toUpperCase();
  doc.text(`STATE CODE:${custStateCode}(${custState})`, col1X, y);
  y += 11;

  doc.text(`GSTIN:${customer.gstNo || 'Unregistered'}`, col1X, y);
  y += 11;

  const custPhone = customer.phone || bill.bl_customer_phone || '';
  if (custPhone) {
    doc.text(`PH.${custPhone}`, col1X, y);
    y += 11;
  }

  // Right Column: Bill Meta
  let ry = metaStartY;
  const billNumLabel = isCancel ? 'CREDIT NO.' : 'BILL NO.';
  const billNoVal = bill.billNumber || bill.bl_entry_no || bill.bl_bill_no || `BILL-${bill.bl_id}`;
  const billDateVal = fmtDate(bill.date || bill.bl_billing_date || bill.bl_date || new Date());
  const orderByVal = (booking.stationBoy || bill.stationBoy || 'STAFF').toUpperCase();
  const posVal = (customer.state || bill.placeOfSupply || 'DELHI').toUpperCase();

  const rightLines = [
    [billNumLabel, `: ${billNoVal}${isCancel ? ' (C)' : ''}`],
    ['DATE', `: ${billDateVal}`],
    ['ORDER BY', `: ${orderByVal}`]
  ];

  if (isCancel) {
    rightLines.push(['Agnst B.No.', `: ${bill.bl_original_bill_no || bill.originalBillNo || '-'}`]);
  }

  rightLines.push(['POS', `: ${posVal}`]);
  rightLines.push(['Doc No.', `: ${bill.specialId || '-'}`]);

  rightLines.forEach(([lbl, val]) => {
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000')
       .text(lbl, col2X, ry, { width: 90 })
       .text(val, col2X + 90, ry, { width: 120 });
    ry += 12;
  });

  y = Math.max(y + 6, ry + 6);
  hRule(doc, M, y, CW, 0.8);
  y += 8;

  // ── Passenger Details & Ticket Particulars Grid ──
  const paxStartY = y;
  const paxTableW = 270;
  const tktX = M + paxTableW + 10;
  const tktW = CW - paxTableW - 10;

  // Left: Passengers Table
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000')
     .text('SNO', col1X, y, { width: 25 })
     .text('PASSENGER NAME', col1X + 25, y, { width: 155 })
     .text('SEX', col1X + 185, y, { width: 35 })
     .text('AGE', col1X + 225, y, { width: 35 });
  y += 12;
  hRule(doc, col1X, y, paxTableW, 0.4);
  y += 5;

  const paxList = passengers.length > 0
    ? passengers
    : [{ name: bill.bl_customer_name || 'Passenger 1', age: '41', gender: 'M' }];

  paxList.slice(0, 6).forEach((p, idx) => {
    doc.font('Helvetica').fontSize(7.5).fillColor('#000000')
       .text(String(idx + 1), col1X, y, { width: 25 })
       .text((p.name || '-').toUpperCase(), col1X + 25, y, { width: 155, ellipsis: true })
       .text((p.gender || 'M').toUpperCase().substring(0, 1), col1X + 185, y, { width: 35 })
       .text(String(p.age || 'N/A'), col1X + 225, y, { width: 35 });
    y += 12;
  });

  // Right: Ticket Particulars
  let ty = paxStartY;
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000')
     .text('TICKET PARTICULARS', tktX, ty, { width: tktW });
  ty += 12;
  hRule(doc, tktX, ty, tktW, 0.4);
  ty += 5;

  const fromStn = (booking.fromStation || bill.bl_from_station || '').toUpperCase();
  const toStn = (booking.toStation || bill.bl_to_station || '').toUpperCase();
  const sectorStr = fromStn && toStn ? `${fromStn}-${toStn}` : (fromStn || toStn || '-');
  const jDateStr = fmtDate(booking.journeyDate || bill.bl_journey_date);
  const trainNoStr = booking.trainNumber || bill.bl_train_no || '-';
  const classStr = (booking.reservationClass || bill.bl_class || '3A').toUpperCase();
  const pnrStr = booking.pnr || bill.bl_pnr || '-';
  const statusStr = (bill.bl_pnrStatus || 'CNF').toUpperCase();

  const ticketLines = [
    ['SECTOR', `: ${sectorStr}`],
    ['JOURNEY DATE', `: ${jDateStr}`],
    ['TRAIN NO', `: ${trainNoStr}`],
    ['CLASS', `: ${classStr}`],
    ['P.N.R. NO.', `: ${pnrStr}`],
    ['STATUS', `: ${statusStr}`]
  ];

  ticketLines.forEach(([lbl, val]) => {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000')
       .text(lbl, tktX, ty, { width: 85 })
       .text(val, tktX + 85, ty, { width: tktW - 85 });
    ty += 11;
  });

  y = Math.max(y + 10, ty + 10);
  hRule(doc, M, y, CW, 0.8);
  y += 8;

  // ── Financials & Bill Amount Detail ──
  const finX = PW - M - 240;
  const finW = 240;

  const fareAmt = Number(financials.railwayFare || bill.bl_railway_fare || 0);
  const srvCharge = Number(financials.serviceCharges || bill.bl_service_charge || 0);
  const cancelCharge = Number(financials.cancellationCharges || bill.total_cancel_charges || 0);
  const gstAmt = Number(financials.gst || gst.igst || gst.cgst * 2 || bill.bl_gst || 0);
  const roundOff = 0.00;
  const totalAmt = Number(financials.total || bill.bl_total_amount || 0);

  const amountRows = [];
  if (fareAmt > 0) amountRows.push(['RAILWAY FARE', `: ${fmt(fareAmt)}`]);
  if (isCancel && cancelCharge > 0) amountRows.push(['RAIL CANCL.', `: ${fmt(cancelCharge)}`]);
  if (srvCharge > 0) amountRows.push(['SERV.CHARGE', `: ${fmt(srvCharge)}`]);
  if (gstAmt > 0) amountRows.push(['IGST 18%', `: ${fmt(gstAmt)}`]);
  amountRows.push(['ROUND_OFF', `: ${fmt(roundOff)}`]);

  amountRows.forEach(([lbl, val]) => {
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000')
       .text(lbl, finX, y, { width: 120 })
       .text(val, finX + 120, y, { width: 120, align: 'right' });
    y += 12;
  });

  hRule(doc, finX, y, finW, 0.5);
  y += 5;

  const netLabel = isCancel ? 'NET CR. IN A/C' : 'NET DR IN A/C';
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000')
     .text(netLabel, finX, y, { width: 120 })
     .text(`: ${fmt(totalAmt)}`, finX + 120, y, { width: 120, align: 'right' });
  y += 18;

  hRule(doc, M, y, CW, 0.8);
  y += 8;

  // ── Total in Words ──
  const words = (financials.amountInWords || 'ZERO').toUpperCase();
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000')
     .text(`TOTAL INDIAN RS. ${words}`, M, y, { width: CW });
  y += 18;

  hRule(doc, M, y, CW, 0.8);
  y += 10;

  // ── Signatures & Terms & Conditions ──
  doc.font('Helvetica').fontSize(7.5).fillColor('#000000')
     .text('E & O.E. (Subject to Delhi Jurisdiction)', M, y)
     .text(`for ${agencyName}`, PW - M - 160, y, { width: 160, align: 'right' });
  y += 24;

  doc.font('Helvetica').fontSize(7.5).fillColor('#000000')
     .text('Auth. Signatory', PW - M - 160, y, { width: 160, align: 'right' });
  y += 14;

  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000').text('TERMS & CONDITIONS :', M, y);
  y += 10;

  const terms = [
    'Printed official Receipt must be obtained against any cash payment of Bill.',
    `All cheques should be drawn in favour of '${agencyName}' and crossed 'A/c Payee Only'`,
    'In case of Cheque Bounce will charge Rs.500/- Bank Charges',
    'Interest @ 24% per annum will be charged on all outstanding Bills after due date.',
    'Kindly check all ticket details carefully to avoid un-necessary complications.',
    'We are not responsible for any type of loss after the delivery of Ticket.'
  ];

  terms.forEach(t => {
    doc.font('Helvetica').fontSize(6.5).fillColor('#000000').text(t, M, y, { width: CW });
    y += 9;
  });

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  });
}

module.exports = { generateBillPDF };
