'use strict';

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

// ─── colour palette ───────────────────────────────────────────────────────────
const CLR = {
  primary:   '#1A237E',  // Deep navy
  accent:    '#6A1B9A',  // Purple
  light:     '#F5F5F5',
  muted:     '#757575',
  black:     '#212121',
  white:     '#FFFFFF',
  divider:   '#BDBDBD',
  headerBg:  '#E8EAF6',
  altRow:    '#FAFAFA',
  green:     '#2E7D32',
  separator: '#7986CB',
};

const M  = 36;          // margin
const PW = 595.28;      // A4 width
const PH = 841.89;      // A4 height
const CW = PW - M * 2; // content width

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmt(value) {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return '₹0.00';
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(value) {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function hRule(doc, x, y, width, color = CLR.divider, lw = 0.5) {
  doc.save().strokeColor(color).lineWidth(lw)
     .moveTo(x, y).lineTo(x + width, y).stroke().restore();
}

function fillRect(doc, x, y, w, h, fill, stroke) {
  doc.save().rect(x, y, w, h);
  if (fill)   doc.fillColor(fill).fill();
  if (stroke) doc.strokeColor(stroke).lineWidth(0.5).stroke();
  doc.restore();
}

/**
 * Ensures there is enough space on the page. If not, adds a new page.
 * Returns the updated Y coordinate.
 */
function checkPageSpace(doc, y, requiredSpace) {
  if (y + requiredSpace > PH - M - 40) { // 40 is bottom margin for footer
    doc.addPage();
    return M;
  }
  return y;
}

/**
 * Draw a simple table; returns the new y position below the table.
 */
function drawTable(doc, { x, y, colWidths, headers, rows, rowH = 16, headerH = 18 }) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);

  y = checkPageSpace(doc, y, headerH + (rows.length * rowH) + 10);

  // Header row
  fillRect(doc, x, y, totalW, headerH, CLR.headerBg, CLR.divider);
  let cx = x;
  headers.forEach((h, i) => {
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(CLR.primary)
       .text(h, cx + 3, y + 5, { width: colWidths[i] - 6, ellipsis: true });
    cx += colWidths[i];
  });
  y += headerH;

  // Data rows
  rows.forEach((row, ri) => {
    const bg = ri % 2 === 1 ? CLR.altRow : CLR.white;
    fillRect(doc, x, y, totalW, rowH, bg, CLR.divider);
    cx = x;
    row.forEach((cell, ci) => {
      const cellStr = cell !== null && cell !== undefined ? String(cell) : '-';
      doc.fontSize(7).font('Helvetica').fillColor(CLR.black)
         .text(cellStr, cx + 3, y + 4, { width: colWidths[ci] - 6, ellipsis: true });
      cx += colWidths[ci];
    });
    y += rowH;
  });

  // Bottom border
  hRule(doc, x, y, totalW, CLR.divider, 0.8);
  return y;
}

/**
 * Draw the global header and customer details (once per consolidated document)
 */
function drawConsolidatedHeader(doc, payloads) {
  let y = M;
  const first = payloads[0];
  const { company, customer } = first;

  // ── Page watermark ──
  doc.save()
     .fontSize(55).fillColor(CLR.muted).fillOpacity(0.04)
     .font('Helvetica-Bold')
     .translate(PW / 2, PH / 2)
     .rotate(-45)
     .text('ANMOL TRAVELS', -240, -40, { characterSpacing: 4 })
     .restore();

  // ── Merge indicator badge ──
  fillRect(doc, M, y, CW, 16, CLR.headerBg, CLR.separator);
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(CLR.separator)
     .text(`CONSOLIDATED INVOICE  •  Contains ${payloads.length} bills  •  Generated: ${fmtDate(new Date())}`,
           M + 4, y + 4, { width: CW - 8 });
  y += 22;

  // ── Company name ──
  doc.fontSize(18).font('Helvetica-Bold').fillColor(CLR.primary)
     .text(company.name || 'Anmol Travels', M, y);
  y += 22;
  doc.fontSize(8.5).font('Helvetica').fillColor(CLR.black)
     .text(company.address || '', M, y, { width: 300 });
  y += 14;
  if (company.phone) {
    doc.text(`Phone: ${company.phone}  |  GSTIN: ${company.gst}`, M, y);
    y += 14;
  }

  // ── CONSOLIDATED INVOICE label ──
  const superBillNo = `CB-${Date.now().toString().slice(-7)}`;
  const boxX = PW - M - 160;
  fillRect(doc, boxX, y - 45, 160, 50, CLR.light, CLR.divider);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(CLR.accent)
     .text('CONSOLIDATED BILLING', boxX + 5, y - 35, { width: 150, align: 'center' });
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(CLR.primary)
     .text(`Super Bill No: ${superBillNo}`, boxX + 5, y - 18, { width: 150, align: 'center' });

  y += 12;
  hRule(doc, M, y, CW, CLR.divider);
  y += 10;

  // ── Customer Details ──
  doc.fontSize(9).font('Helvetica-Bold').fillColor(CLR.primary).text('Bill To (Customer Details)', M, y);
  y += 12;
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(CLR.black).text(customer.name || '-', M, y);
  y += 11;
  doc.fontSize(8).font('Helvetica').fillColor(CLR.muted).text(customer.address || '-', M, y, { width: 280 });
  y += 12;
  doc.text(`Phone: ${customer.phone || '-'}  |  GSTIN: ${customer.gstNo || 'Unregistered'}  |  State: ${customer.state || '-'}`, M, y);
  y += 18;

  hRule(doc, M, y, CW, CLR.divider, 1.5);
  y += 15;

  return y;
}

/**
 * Draw a single bill section in the continuous flow
 */
function drawContinuousBillSection(doc, { payload, billIndex, y }) {
  const { bill, booking, passengers, financials, gst } = payload;
  
  y = checkPageSpace(doc, y, 120); // ensure space for header + journey

  // ── Bill Subheader ──
  fillRect(doc, M, y, CW, 18, CLR.primary, CLR.primary);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(CLR.white)
     .text(`${billIndex}. Invoice No: ${bill.billNumber || bill.bl_entry_no || '-'}  |  Date: ${fmtDate(bill.date || bill.bl_billing_date)}`, M + 6, y + 5);
  y += 24;

  // ── Journey / Booking Summary ──
  const journeyDetails = [
    ['Journey', booking.travelDetails || '-'],
    ['Journey Date', fmtDate(booking.journeyDate)],
    ['Train No.', booking.trainNumber || '-'],
    ['PNR No.', booking.pnr || '-'],
    ['Seats', `${booking.seatsAlloted || '-'} seat(s)`],
    ['Station Boy', booking.stationBoy || '-'],
  ];

  const jColW = CW / 2 - 10;
  const col1 = journeyDetails.slice(0, 3);
  const col2 = journeyDetails.slice(3);
  col1.forEach(([lbl, val], i) => {
    const ry = y + i * 12;
    doc.fontSize(7.5).font('Helvetica').fillColor(CLR.muted).text(`${lbl}:`, M, ry, { width: 70 });
    doc.font('Helvetica-Bold').fillColor(CLR.black).text(val, M + 72, ry, { width: jColW - 72 });
  });
  col2.forEach(([lbl, val], i) => {
    const ry = y + i * 12;
    const cx = M + jColW + 20;
    doc.fontSize(7.5).font('Helvetica').fillColor(CLR.muted).text(`${lbl}:`, cx, ry, { width: 70 });
    doc.font('Helvetica-Bold').fillColor(CLR.black).text(val, cx + 72, ry, { width: jColW - 72 });
  });
  y += 42;

  // ── Passenger Details ──
  doc.fontSize(8).font('Helvetica-Bold').fillColor(CLR.primary)
     .text(`Passengers (${passengers.length})`, M, y);
  y += 10;

  if (passengers.length > 0) {
    const paxColW = [25, 145, 65, 55, 55, 60, 118.28];
    const paxHeaders = ['#', 'Full Name', 'Age / Gender', 'Coach', 'Seat/Berth', 'ID Type', 'ID Number'];
    const paxRows = passengers.map((p, i) => [
      i + 1,
      p.name || '-',
      `${p.age || '-'} / ${p.gender || '-'}`,
      p.coach || '-',
      p.seatNo !== '-' ? p.seatNo : (p.berth || '-'),
      p.idType || '-',
      p.idNumber || '-',
    ]);
    y = drawTable(doc, { x: M, y, colWidths: paxColW, headers: paxHeaders, rows: paxRows, rowH: 13, headerH: 14 });
  } else {
    doc.fontSize(8).font('Helvetica').fillColor(CLR.muted).text('No passenger records found.', M, y);
    y += 14;
  }
  y += 8;

  // ── Financial Breakdown ──
  doc.fontSize(8).font('Helvetica-Bold').fillColor(CLR.primary).text('Charges Breakdown', M, y);
  y += 10;

  const chargeColW = [210, 80, 80, 70, 83.28];
  const chargeHeaders = ['Description', 'SAC/HSN', 'Taxable Value', 'GST %', 'Amount'];
  const chargeRows = [];
  if (financials.railwayFare > 0)
    chargeRows.push(['Railway Fare (Train Reservation)', '998511', fmt(financials.railwayFare), 'Nil', fmt(financials.railwayFare)]);
  if (financials.serviceCharges > 0)
    chargeRows.push(['Service Charges', '998551', fmt(financials.serviceCharges), '18%', fmt(financials.serviceCharges * 1.18)]);
  if (financials.sbIncentive > 0)
    chargeRows.push(['Station Boy / Delivery Incentive', '998551', fmt(financials.sbIncentive), 'Nil', fmt(financials.sbIncentive)]);
  const misc = (financials.platformFees || 0) + (financials.miscCharges || 0) + (financials.deliveryCharges || 0);
  if (misc > 0)
    chargeRows.push(['Platform / Porter / Misc Charges', '998551', fmt(misc), 'Nil', fmt(misc)]);
  if (financials.cancellationCharges > 0)
    chargeRows.push(['Cancellation Charges', '998551', fmt(financials.cancellationCharges), 'Nil', fmt(financials.cancellationCharges)]);
  if (chargeRows.length === 0)
    chargeRows.push(['(No individual charge lines)', '-', '-', '-', fmt(financials.total)]);

  y = drawTable(doc, { x: M, y, colWidths: chargeColW, headers: chargeHeaders, rows: chargeRows, rowH: 13, headerH: 14 });
  y += 8;

  // ── Bill Total (right-aligned) ──
  const totX = PW - M - 200;
  y = checkPageSpace(doc, y, 90);
  
  const taxRows = [
    ['Subtotal (before tax)', fmt((financials.railwayFare || 0) + (financials.serviceCharges || 0) + (financials.sbIncentive || 0) + misc)],
    ...(gst.isIntraState
      ? [['CGST (9%)', fmt(gst.cgst)], ['SGST (9%)', fmt(gst.sgst)]]
      : [['IGST (18%)', fmt(gst.igst)]]),
    ['Surcharge', fmt(financials.surcharge || 0)],
    ['Discount', `- ${fmt(financials.discount || 0)}`],
    [`Bill ${billIndex} Total`, fmt(financials.total)],
  ];

  let ty = y;
  taxRows.forEach((row, i) => {
    const isTotal = i === taxRows.length - 1;
    if (isTotal) {
      fillRect(doc, totX, ty, 200, 16, CLR.headerBg, CLR.divider);
    }
    doc.fontSize(isTotal ? 8 : 7.5)
       .font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
       .fillColor(isTotal ? CLR.black : CLR.black)
       .text(row[0], totX + 4, ty + 4, { width: 120 })
       .text(row[1], totX + 125, ty + 4, { width: 70, align: 'right' });
    ty += 14;
  });
  
  y = ty + 14;
  return y;
}

/**
 * Generates a unified consolidated PDF for multiple bills in a continuous flow.
 * @param {Array} payloads - Array of bill print payloads
 * @returns {Promise<Buffer>}
 */
async function generateMergedBillsPDF(payloads) {
  const doc = new PDFDocument({ size: 'A4', margin: M, autoFirstPage: true });
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  if (!payloads || payloads.length === 0) {
    doc.end();
    return Buffer.concat(buffers);
  }

  // Draw header once
  let y = drawConsolidatedHeader(doc, payloads);
  
  let grandTotal = 0;

  // Draw each bill sequentially
  for (let i = 0; i < payloads.length; i++) {
    y = drawContinuousBillSection(doc, { payload: payloads[i], billIndex: i + 1, y });
    grandTotal += (payloads[i].financials?.total || 0);
  }

  // ── GRAND TOTAL SECTION ──
  y = checkPageSpace(doc, y, 120);
  
  y += 15;
  fillRect(doc, M, y, CW, 30, CLR.primary, CLR.primary);
  doc.fontSize(14).font('Helvetica-Bold').fillColor(CLR.white)
     .text('CONSOLIDATED GRAND TOTAL:', M + 15, y + 8, { width: 300 })
     .text(fmt(grandTotal), PW - M - 200, y + 8, { width: 185, align: 'right' });
  
  y += 45;

  // ── QR Code (UPI Pay) & Signature ──
  const qrY = y;
  try {
    const firstPayload = payloads[0];
    const upiQr = await QRCode.toBuffer(firstPayload.upi?.upiString || 'https://anmoltravels.in');
    doc.image(upiQr, M, qrY, { width: 70 });
    doc.fontSize(7).fillColor(CLR.muted).text('Scan to Pay (UPI)', M, qrY + 74, { width: 70, align: 'center' });
  } catch (_) { /* skip if QR fails */ }

  const sigX = PW - M - 140;
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(CLR.primary)
     .text('For Anmol Travels', sigX, qrY, { align: 'right', width: 140 });
  doc.fontSize(7).font('Helvetica').fillColor(CLR.muted)
     .text('Authorized Signatory', sigX, qrY + 38, { align: 'right', width: 140 });

  // Add event for page additions to add footer
  const drawFooter = () => {
    const origBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.fontSize(7).font('Helvetica').fillColor(CLR.muted)
       .text('E. & O.E. | Computer-generated document — does not require a physical signature.',
             M, PH - 25, { width: CW, align: 'center', lineBreak: false });
    doc.page.margins.bottom = origBottom;
  };

  // Add event for page additions to add footer
  doc.on('pageAdded', drawFooter);
  
  // Draw footer on current page
  drawFooter();

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  });
}

module.exports = { generateMergedBillsPDF };
