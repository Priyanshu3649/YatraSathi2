'use strict';

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

// ─── colour palette ───────────────────────────────────────────────────────────
const CLR = {
  primary:    '#2C3E50',   // Professional dark blue/charcoal
  accent:     '#8E44AD',   // Professional purple
  light:      '#F4F6F7',   // Light gray bg
  muted:      '#7F8C8D',   // Muted gray
  black:      '#2C3E50',   // Body text
  white:      '#FFFFFF',
  cancel:     '#E74C3C',   // Red for cancellation
  line:       '#BDC3C7',   // Border color
  tableAlt:   '#FBFCFC',   // Alt row
};

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
function drawTable(doc, { x, y, colWidths, headers, rows }) {
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

async function generateBillPDF(payload) {
  const { company, bill, customer, booking, passengers, financials, gst, upi, signature, irn, cancellation, audit, jespr } = payload;

  const doc = new PDFDocument({ size: 'A4', margin: 36 });
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  const M = 36;
  const PW = 595.28;
  const PH = 841.89;
  const CW = PW - M * 2;

  // Watermark (Cancelled)
  if (cancellation.isCancelled) {
    doc.save()
       .fontSize(80).fillColor(CLR.cancel).fillOpacity(0.05)
       .font('Helvetica-Bold')
       .translate(PW/2, PH/2)
       .rotate(-45)
       .text('CANCELLED', -250, -40, { characterSpacing: 10 })
       .restore();
  } else {
    doc.save()
       .fontSize(60).fillColor(CLR.muted).fillOpacity(0.04)
       .font('Helvetica-Bold')
       .translate(PW/2, PH/2)
       .rotate(-45)
       .text('ANMOL TRAVELS', -250, -40, { characterSpacing: 5 })
       .restore();
  }

  let y = M;

  // Header: Logo Placeholder & Company Info
  doc.fontSize(20).font('Helvetica-Bold').fillColor(CLR.primary).text(company.name, M, y);
  y += 24;
  doc.fontSize(10).font('Helvetica').fillColor(CLR.black).text(company.address, M, y, { width: 300 });
  y += 24;
  doc.fontSize(10).text(`GSTIN: ${company.gst} | State: ${company.state} (${company.stateCode})`, M, y);
  y += 18;

  const headerRightX = PW - M - 150;
  doc.fontSize(22).font('Helvetica-Bold').fillColor(CLR.accent).text('TAX INVOICE', headerRightX, M, { align: 'right' });
  
  // Invoice Details Box
  y += 10;
  const invBoxY = y;
  drawRect(doc, headerRightX, y, 150, 70, CLR.light, CLR.line);
  let iy = y + 8;
  const labelX = headerRightX + 5;
  const valueX = headerRightX + 65;
  doc.fontSize(8).font('Helvetica').fillColor(CLR.muted).text('Invoice No:', labelX, iy);
  doc.font('Helvetica-Bold').fillColor(CLR.primary).text(bill.billNumber, valueX, iy);
  iy += 12;
  doc.font('Helvetica').fillColor(CLR.muted).text('Date:', labelX, iy);
  doc.font('Helvetica-Bold').fillColor(CLR.primary).text(fmtDate(bill.date), valueX, iy);
  iy += 12;
  doc.font('Helvetica').fillColor(CLR.muted).text('Place of Supply:', labelX, iy);
  doc.font('Helvetica-Bold').fillColor(CLR.primary).text(bill.placeOfSupply, valueX, iy);
  iy += 12;
  doc.font('Helvetica').fillColor(CLR.muted).text('Reverse Charge:', labelX, iy);
  doc.font('Helvetica-Bold').fillColor(CLR.primary).text(bill.reverseCharge, valueX, iy);

  y = Math.max(y + 80, iy + 20);

  // Customer Details
  drawHRule(doc, M, y, CW, CLR.line);
  y += 10;
  doc.fontSize(10).font('Helvetica-Bold').fillColor(CLR.primary).text('Bill To (Customer Details)', M, y);
  y += 14;
  doc.fontSize(9).font('Helvetica-Bold').text(customer.name, M, y);
  y += 12;
  doc.font('Helvetica').text(customer.address, M, y, { width: 250 });
  y += 24;
  doc.text(`GSTIN: ${customer.gstNo} | State: ${customer.state}`, M, y);
  y += 20;

  // Booking Details Summary (Above Table)
  doc.fontSize(10).font('Helvetica-Bold').fillColor(CLR.primary).text('Service Details', M, y);
  y += 14;
  
  // Build professional service rows
  const serviceHeads = ['Description', 'SAC/HSN', 'Taxable Val', 'GST', 'Total'];
  const serviceRows = [];
  
  // 1. Railway Fare
  if (financials.railwayFare > 0) {
    serviceRows.push(['Railway Fare (Train Reservation)', '998511', fmt(financials.railwayFare), '-', fmt(financials.railwayFare)]);
  }
  
  // 2. Service Charges
  if (financials.serviceCharges > 0) {
    serviceRows.push(['Service Charges', '998551', fmt(financials.serviceCharges), '18%', fmt(financials.serviceCharges * 1.18)]);
  }

  // 3. Station Boy Incentive
  if (financials.sbIncentive > 0) {
    serviceRows.push(['Station Boy Incentive (Delivery)', '998551', fmt(financials.sbIncentive), '-', fmt(financials.sbIncentive)]);
  }

  // 4. Platform Fees / Others
  const misc = (financials.platformFees || 0) + (financials.miscCharges || 0) + (financials.deliveryCharges || 0);
  if (misc > 0) {
    serviceRows.push(['Misc / Platform / Porter Charges', '998551', fmt(misc), '-', fmt(misc)]);
  }

  // 5. Booking Info Summary
  doc.fontSize(8).font('Helvetica').fillColor(CLR.muted).text(`Journey: ${booking.travelDetails} | Date: ${fmtDate(booking.journeyDate)} | Train: ${booking.trainNumber || '-'}`, M, y - 10);

  y = drawTable(doc, { x: M, y, colWidths: [200, 80, 80, 70, 93.28], headers: serviceHeads, rows: serviceRows });
  y += 15;

  // Passenger Table
  doc.fontSize(9).font('Helvetica-Bold').fillColor(CLR.primary).text('Passengers', M, y);
  y += 12;
  const passHeads = ['#', 'Name', 'Age/Gender', 'Coach/Seat', 'PNR'];
  const passRows = passengers.map((p, i) => [i + 1, p.name, `${p.age}/${p.gender}`, `${p.coach}/${p.seatNo}`, booking.pnr || '-']);
  y = drawTable(doc, { x: M, y, colWidths: [30, 180, 100, 100, 113.28], headers: passHeads, rows: passRows });
  y += 20;

  // Tax Breakdown & Totals (Right Aligned Column)
  const totalX = PW - M - 200;
  const rowH = 15;
  let ty = y;

  const taxRows = [
    ['Subtotal (Taxable)', fmt(financials.railwayFare + financials.serviceCharges + financials.sbIncentive + (financials.platformFees || 0) + (financials.miscCharges || 0))],
    ...(gst.isIntraState ? [
      [`CGST (9%)`, fmt(gst.cgst)],
      [`SGST (9%)`, fmt(gst.sgst)]
    ] : [
      [`IGST (18%)`, fmt(gst.igst)]
    ]),
    ['Surcharges / Fees', fmt(financials.surcharge || 0)],
    ['Discounts', fmt(financials.discount || 0)],
    ['Grand Total', fmt(financials.total)]
  ];

  taxRows.forEach((row, i) => {
    const isTotal = i === taxRows.length - 1;
    if (isTotal) drawHRule(doc, totalX, ty, 200, CLR.primary, 1);
    doc.fontSize(isTotal ? 10 : 9).font(isTotal ? 'Helvetica-Bold' : 'Helvetica').fillColor(CLR.primary);
    doc.text(row[0], totalX, ty + 4, { width: 120 });
    doc.text(row[1], totalX + 120, ty + 4, { width: 80, align: 'right' });
    ty += rowH + 4;
  });

  // Amount in Words (Left Aligned)
  doc.fontSize(9).font('Helvetica').fillColor(CLR.muted).text('Amount in Words:', M, y);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(CLR.primary).text(financials.amountInWords, M, y + 12, { width: 300 });

  y = Math.max(ty + 20, y + 50);

  // QR Codes Section
  const qrY = y;
  try {
    const upiQrData = await QRCode.toBuffer(upi.upiString);
    doc.image(upiQrData, M, qrY, { width: 80 });
    doc.fontSize(8).fillColor(CLR.muted).text('Scan to Pay (UPI)', M, qrY + 85, { width: 80, align: 'center' });
    
    // For GST verification QR, use a summary string
    const gstQrString = `GSTIN:${company.gst},Inv:${bill.billNumber},Amt:${financials.total},Date:${bill.date}`;
    const gstQrData = await QRCode.toBuffer(gstQrString);
    doc.image(gstQrData, M + 100, qrY, { width: 80 });
    doc.fontSize(8).fillColor(CLR.muted).text('GST Invoice Verification', M + 100, qrY + 85, { width: 80, align: 'center' });
  } catch (err) {
    console.error('QR Gen error', err);
  }

  // Signature Section (Right)
  const sigX = PW - M - 150;
  doc.fontSize(9).font('Helvetica-Bold').fillColor(CLR.primary).text('For Anmol Travels', sigX, qrY, { align: 'right', width: 150 });
  y += 50;
  doc.fontSize(8).font('Helvetica').fillColor(CLR.muted).text('Authorized Signatory', sigX, qrY + 85, { align: 'right', width: 150 });
  
  if (signature.hash) {
    doc.fontSize(6).fillColor(CLR.muted).text(`Digitally Signed Hash: ${signature.hash.substring(0, 32)}...`, sigX, qrY + 95, { align: 'right', width: 150 });
    doc.text(`Signed On: ${fmtDate(signature.signedOn)}`, sigX, qrY + 105, { align: 'right', width: 150 });
  }

  y = qrY + 120;

  // JESPR Summary Section
  drawHRule(doc, M, y, CW, CLR.line);
  y += 10;
  doc.fontSize(10).font('Helvetica-Bold').fillColor(CLR.primary).text('JESPR Summary (Accounting Context)', M, y);
  y += 14;
  doc.fontSize(8).font('Helvetica').fillColor(CLR.muted).text('Sales Entry:', M, y);
  doc.font('Helvetica-Bold').text(jespr.sales.entryNo, M + 60, y);
  y += 12;
  doc.font('Helvetica').text('Linked Receipts:', M, y);
  const rcList = jespr.receipts.map(r => `${r.receiptNo} (${fmt(r.amount)})`).join(', ') || 'None';
  doc.font('Helvetica').text(rcList, M + 80, y, { width: 440 });
  y += 20;

  // IRN Section (If exists)
  if (irn.irn) {
    drawRect(doc, M, y, CW, 40, CLR.light, CLR.line);
    let irny = y + 8;
    doc.fontSize(8).font('Helvetica-Bold').fillColor(CLR.accent).text('E-Invoice (IRN) Details', M + 10, irny);
    irny += 12;
    doc.font('Helvetica').fillColor(CLR.black).text(`IRN: ${irn.irn}`, M + 10, irny);
    doc.text(`Ack No: ${irn.ackNo} | Date: ${irn.ackDate}`, M + 10, irny + 10);
    y += 50;
  }

  // Footer
  doc.fontSize(8).font('Helvetica').fillColor(CLR.muted).text('E. & O.E. | This is a computer-generated invoice and does not require a physical signature.', M, PH - 50, { width: CW, align: 'center' });
  
  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  });
}

module.exports = { generateBillPDF };
