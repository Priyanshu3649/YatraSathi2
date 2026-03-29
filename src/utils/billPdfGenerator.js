'use strict';

const PDFDocument = require('pdfkit');

// ─── colour palette ───────────────────────────────────────────────────────────
const CLR = {
  primary:    '#4A2C0A',   // dark warm brown  (headings, borders)
  accent:     '#7B4A1E',   // medium brown      (section labels, kicker)
  light:      '#F5ECD7',   // parchment         (table header bg)
  muted:      '#9E7B5A',   // muted brown       (small labels)
  black:      '#1A1008',   // near-black        (body text)
  white:      '#FFFFFF',
  cancel:     '#8B1A1A',   // deep red          (cancelled watermark)
  line:       '#C9A97A',   // light brown       (dividers)
  tableAlt:   '#FAF4E8',   // light parchment   (alternate row)
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(value) {
  // format a number as Indian Rupee currency
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

function drawHRule(doc, x, y, width, color = CLR.line, thickness = 0.5) {
  doc.save().strokeColor(color).lineWidth(thickness)
     .moveTo(x, y).lineTo(x + width, y).stroke().restore();
}

function drawRect(doc, x, y, w, h, fillColor, strokeColor) {
  doc.save().rect(x, y, w, h);
  if (fillColor)  doc.fillColor(fillColor).fill();
  if (strokeColor) doc.strokeColor(strokeColor).lineWidth(0.5).stroke();
  doc.restore();
}

// Simple table renderer
function drawTable(doc, { x, y, colWidths, headers, rows, pageWidth }) {
  const rowH = 18;
  const headerH = 20;
  const totalW = colWidths.reduce((a, b) => a + b, 0);

  // Header row
  drawRect(doc, x, y, totalW, headerH, CLR.light, CLR.line);
  let cx = x + 4;
  headers.forEach((h, i) => {
    doc.font('Helvetica-Bold').fontSize(8).fillColor(CLR.primary)
       .text(h, cx, y + 5, { width: colWidths[i] - 8, lineBreak: false });
    cx += colWidths[i];
  });
  y += headerH;

  // Data rows
  rows.forEach((row, ri) => {
    const bg = ri % 2 === 1 ? CLR.tableAlt : CLR.white;
    drawRect(doc, x, y, totalW, rowH, bg, CLR.line);
    cx = x + 4;
    row.forEach((cell, i) => {
      doc.font('Helvetica').fontSize(8).fillColor(CLR.black)
         .text(String(cell ?? '-'), cx, y + 4, { width: colWidths[i] - 8, lineBreak: false });
      cx += colWidths[i];
    });
    y += rowH;
  });

  return y; // return new y position after table
}

// ─── main generator ──────────────────────────────────────────────────────────

/**
 * generateBillPDF(payload)
 * Accepts the same JSON returned by getBillPrintPayload() and streams a PDF buffer.
 *
 * @param {object} payload  - { company, bill, customer, booking, passengers, financials, cancellation, audit, jespr }
 * @returns {Promise<Buffer>}
 */
function generateBillPDF(payload) {
  return new Promise((resolve, reject) => {
    try {
      const { company, bill, customer, booking, passengers, financials, cancellation, audit, jespr } = payload;

      const doc = new PDFDocument({ size: 'A4', margin: 0, info: {
        Title: `Tax Invoice – ${bill.billNumber}`,
        Author: company.name,
        Subject: 'Tax Invoice',
      }});

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const M = 36;           // page margin
      const PW = 595.28;      // A4 width
      const PH = 841.89;      // A4 height
      const CW = PW - M * 2; // content width

      // ── CANCELLED WATERMARK ──────────────────────────────────────────────
      if (cancellation.isCancelled) {
        doc.save()
           .fontSize(80).fillColor(CLR.cancel).fillOpacity(0.08)
           .font('Helvetica-Bold')
           .translate(PW / 2, PH / 2)
           .rotate(-45)
           .text('CANCELLED', -200, -40, { lineBreak: false, characterSpacing: 10 })
           .restore();
      }

      let y = M;

      // ── TOP COLOUR BAR ───────────────────────────────────────────────────
      drawRect(doc, 0, 0, PW, 6, CLR.primary);
      y = 18;

      // ── HEADER: Company Info + Bill Meta ──────────────────────────────────
      // Left: company
      doc.font('Helvetica').fontSize(8).fillColor(CLR.accent)
         .text('TAX INVOICE', M, y, { characterSpacing: 2 });
      y += 12;

      doc.font('Helvetica-Bold').fontSize(16).fillColor(CLR.primary)
         .text(company.name, M, y);
      y += 20;

      doc.font('Helvetica').fontSize(8).fillColor(CLR.muted)
         .text(company.address, M, y, { width: 220 });
      y += doc.heightOfString(company.address, { width: 220, fontSize: 8 }) + 2;

      doc.text(`Tel: ${company.phone}   |   GSTIN: ${company.gst}`, M, y);
      y += 14;

      // Right: bill meta box
      const metaBoxX = PW - M - 180;
      const metaBoxY = 18;
      const metaBoxW = 180;
      const metaH    = 68;
      drawRect(doc, metaBoxX, metaBoxY, metaBoxW, metaH, CLR.light, CLR.line);

      const metaRows = [
        ['Bill No',  bill.billNumber],
        ['Bill ID',  String(bill.billId)],
        ['Date',     fmtDate(bill.date)],
        ['Status',   bill.status],
      ];
      let my = metaBoxY + 6;
      metaRows.forEach(([label, val]) => {
        doc.font('Helvetica').fontSize(7.5).fillColor(CLR.muted)
           .text(label, metaBoxX + 8, my, { continued: false });
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(CLR.primary)
           .text(val, metaBoxX + 70, my);
        my += 13;
      });

      // ── DIVIDER ───────────────────────────────────────────────────────────
      y = Math.max(y, metaBoxY + metaH) + 10;
      drawHRule(doc, M, y, CW, CLR.primary, 1.5);
      y += 8;

      // ── CUSTOMER + BOOKING ────────────────────────────────────────────────
      const halfW = (CW - 12) / 2;

      // Customer card
      drawRect(doc, M, y, halfW, 70, CLR.light, CLR.line);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(CLR.primary)
         .text('CUSTOMER', M + 8, y + 6);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(CLR.black)
         .text(customer.name, M + 8, y + 19, { width: halfW - 16 });
      doc.font('Helvetica').fontSize(8.5).fillColor(CLR.muted)
         .text(customer.phone, M + 8, y + 33);

      // Booking card
      const bx = M + halfW + 12;
      drawRect(doc, bx, y, halfW, 70, CLR.light, CLR.line);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(CLR.primary)
         .text('JOURNEY DETAILS', bx + 8, y + 6);
      doc.font('Helvetica').fontSize(8).fillColor(CLR.black);
      const bLines = [
        `Booking: ${booking.bookingNumber || booking.bookingId || 'N/A'}`,
        `Route:   ${booking.travelDetails || 'N/A'}`,
        `Date:    ${fmtDate(booking.journeyDate)}`,
        `Train: ${booking.trainNumber || 'N/A'}   Class: ${booking.reservationClass || 'N/A'}`,
        `PNR: ${booking.pnr || 'N/A'}`,
      ];
      bLines.forEach((line, i) => {
        doc.text(line, bx + 8, y + 19 + i * 10, { width: halfW - 16 });
      });

      y += 82;

      // ── PASSENGERS ────────────────────────────────────────────────────────
      doc.font('Helvetica-Bold').fontSize(9).fillColor(CLR.primary)
         .text('PASSENGERS', M, y);
      doc.font('Helvetica').fontSize(8).fillColor(CLR.muted)
         .text(`(${passengers.length} traveller${passengers.length !== 1 ? 's' : ''})`, M + 85, y + 1);
      y += 14;

      const passCols  = [24, 130, 32, 50, 40, 38, 48];
      const passHeads = ['#', 'Name', 'Age', 'Gender', 'Coach', 'Seat', 'Berth'];
      const passRows  = passengers.length > 0
        ? passengers.map((p, i) => [i + 1, p.name, p.age, p.gender, p.coach, p.seatNo, p.berth])
        : [['—', 'No passenger data', '', '', '', '', '']];

      y = drawTable(doc, { x: M, y, colWidths: passCols, headers: passHeads, rows: passRows, pageWidth: CW });
      y += 14;

      // ── CHARGES ───────────────────────────────────────────────────────────
      doc.font('Helvetica-Bold').fontSize(9).fillColor(CLR.primary).text('CHARGES', M, y);
      y += 14;

      const chargeRows = [
        ['Railway Fare (Base)',   fmt(financials.baseAmount)],
        ['Tax / GST',             fmt(financials.tax)],
        ['Total Bill Amount',     fmt(financials.total)],
        ['Amount Paid',           fmt(financials.paid)],
        ['Balance Due',           fmt(financials.balance)],
        ...(cancellation.isCancelled ? [
          ['Cancellation Charges', fmt(cancellation.charges)],
          ['Refund Amount',        fmt(cancellation.refundAmount)],
        ] : []),
      ];

      const chargeW = 260;
      const labelW  = 170;
      const valW    = chargeW - labelW;
      chargeRows.forEach((row, ri) => {
        const isTotalRow = row[0] === 'Total Bill Amount';
        const bg = isTotalRow ? CLR.light : (ri % 2 === 1 ? CLR.tableAlt : CLR.white);
        drawRect(doc, M, y, chargeW, 18, bg, CLR.line);
        doc.font(isTotalRow ? 'Helvetica-Bold' : 'Helvetica').fontSize(8)
           .fillColor(CLR.black)
           .text(row[0], M + 6, y + 5, { width: labelW - 12, lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(8)
           .fillColor(isTotalRow ? CLR.primary : CLR.black)
           .text(row[1], M + labelW, y + 5, { width: valW - 6, align: 'right', lineBreak: false });
        y += 18;
      });
      y += 14;

      // ── JESPR: Sales Entry ────────────────────────────────────────────────
      doc.font('Helvetica-Bold').fontSize(9).fillColor(CLR.primary).text('JESPR — ACCOUNTING ENTRIES', M, y);
      y += 5;
      drawHRule(doc, M, y, CW, CLR.accent, 0.5);
      y += 10;

      // Sales sub-section
      doc.font('Helvetica-Bold').fontSize(8).fillColor(CLR.accent).text('Sales Entry', M, y);
      y += 12;
      const salesDetail = [
        ['Entry No', jespr.sales.entryNo || 'N/A'],
        ['Date',     fmtDate(jespr.sales.date)],
        ['Account',  jespr.sales.account],
        ['Amount',   fmt(jespr.sales.amount)],
      ];
      salesDetail.forEach((row) => {
        doc.font('Helvetica').fontSize(8).fillColor(CLR.muted)
           .text(row[0] + ':', M, y, { continued: false });
        doc.font('Helvetica-Bold').fontSize(8).fillColor(CLR.black)
           .text(row[1], M + 70, y);
        y += 11;
      });
      doc.font('Helvetica').fontSize(7.5).fillColor(CLR.muted)
         .text(jespr.sales.narration || '', M, y, { width: CW });
      y += 14;

      // Receipts sub-section
      doc.font('Helvetica-Bold').fontSize(8).fillColor(CLR.accent).text('Receipts', M, y);
      y += 10;

      const rcCols  = [70, 60, 55, 100, 77];
      const rcHeads = ['Receipt No', 'Date', 'Mode', 'Reference', 'Amount'];
      const rcRows  = jespr.receipts.length > 0
        ? jespr.receipts.map(r => [r.receiptNo, fmtDate(r.date), r.mode, r.reference || '—', fmt(r.amount)])
        : [['—', '—', '—', 'No linked receipts', '—']];

      y = drawTable(doc, { x: M, y, colWidths: rcCols, headers: rcHeads, rows: rcRows, pageWidth: CW });
      y += 12;

      // Journal Entries sub-section
      doc.font('Helvetica-Bold').fontSize(8).fillColor(CLR.accent).text('Journal Entries', M, y);
      y += 10;

      const jeCols  = [70, 52, 110, 52, 78];
      const jeHeads = ['Entry No', 'Date', 'Account', 'Type', 'Amount'];
      const jeRows  = jespr.journal.length > 0
        ? jespr.journal.map(e => [e.entryNo, fmtDate(e.date), e.account, e.type, fmt(e.amount)])
        : [['—', '—', '—', 'No journal adjustments', '—']];

      y = drawTable(doc, { x: M, y, colWidths: jeCols, headers: jeHeads, rows: jeRows, pageWidth: CW });
      y += 14;

      // ── AUDIT TRAIL ───────────────────────────────────────────────────────
      doc.font('Helvetica-Bold').fontSize(9).fillColor(CLR.primary).text('AUDIT TRAIL', M, y);
      y += 14;

      const auditCols = [['Entered By', audit.enteredBy], ['Entered On', fmtDate(audit.enteredOn)],
                         ['Modified By', audit.modifiedBy || 'N/A'], ['Modified On', fmtDate(audit.modifiedOn)],
                         ['Closed By', audit.closedBy || 'N/A'], ['Closed On', fmtDate(audit.closedOn)]];
      const aColW = CW / 3;
      auditCols.forEach(([label, val], i) => {
        const ax = M + (i % 3) * aColW;
        const ay = y;
        if (i % 3 === 0 && i > 0) y += 20;
        drawRect(doc, ax, ay, aColW - 4, 18, i % 2 === 0 ? CLR.light : CLR.white, CLR.line);
        doc.font('Helvetica').fontSize(7).fillColor(CLR.muted)
           .text(label, ax + 5, ay + 3, { width: aColW - 14, lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(8).fillColor(CLR.black)
           .text(val, ax + 5, ay + 10, { width: aColW - 14, lineBreak: false });
      });
      y += 30;

      // ── SIGNATURE LINE ───────────────────────────────────────────────────
      const sigY = Math.min(y + 16, PH - 80);
      drawHRule(doc, M, sigY, 140, CLR.muted, 0.5);
      drawHRule(doc, PW - M - 140, sigY, 140, CLR.muted, 0.5);
      doc.font('Helvetica').fontSize(7.5).fillColor(CLR.muted)
         .text('Customer Signature', M, sigY + 4, { width: 140, align: 'center' })
         .text('Authorised Signatory', PW - M - 140, sigY + 4, { width: 140, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(CLR.primary)
         .text(company.name, PW - M - 140, sigY + 14, { width: 140, align: 'center' });

      // ── FOOTER ────────────────────────────────────────────────────────────
      drawRect(doc, 0, PH - 28, PW, 28, CLR.primary);
      doc.font('Helvetica').fontSize(7).fillColor('#EDD9B0')
         .text(
           `E. & O.E.  |  This is a computer-generated document and does not require a physical signature.  |  Generated: ${new Date().toLocaleString('en-IN')}`,
           M, PH - 18, { width: CW, align: 'center' }
         );

      // ── BOTTOM COLOUR ACCENT ──────────────────────────────────────────────
      // Already handled by footer rect above

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateBillPDF };
