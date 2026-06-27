'use strict';

const PDFDocument = require('pdfkit');

// ─── colour palette ───────────────────────────────────────────────────────────
const CLR = {
  primary:    '#2C3E50',
  accent:     '#1A5276',
  light:      '#F8F9F9',
  muted:      '#7F8C8D',
  black:      '#2C3E50',
  white:      '#FFFFFF',
  line:       '#BDC3C7',
  tableAlt:   '#FAFAFA',
  debit:      '#C0392B',
  credit:     '#27AE60',
  headerBg:   '#2C3E50',
  summaryBg:  '#EBF5FB',
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(value) {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(value) {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return '-';
  if (n === 0) return '-';
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function truncate(str, maxLen) {
  if (!str) return '-';
  const s = String(str);
  return s.length > maxLen ? s.substring(0, maxLen - 1) + '…' : s;
}

// ─── column definitions ─────────────────────────────────────────────────────

const COLS = [
  { key: 'date',        label: 'Date',        width: 58,  align: 'left'  },
  { key: 'particular',  label: 'Particulars',  width: 180, align: 'left'  },
  { key: 'reference',   label: 'Reference',    width: 90,  align: 'left'  },
  { key: 'debit',       label: 'Debit (Dr)',   width: 65,  align: 'right' },
  { key: 'credit',      label: 'Credit (Cr)',  width: 65,  align: 'right' },
  { key: 'balance',     label: 'Balance',      width: 65,  align: 'right' },
];

const TOTAL_W = COLS.reduce((s, c) => s + c.width, 0); // 523
const ROW_H = 13;
const HEADER_H = 16;
const M = 36;
const PW = 595.28;
const PH = 841.89;

// ─── PDF generator ──────────────────────────────────────────────────────────

async function generateLedgerPDF(payload) {
  const { customer, entries, openingBalance, closingBalance, totals, summary, period } = payload;

  const doc = new PDFDocument({ size: 'A4', margin: M });
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  let y = M;

  // ── Header ──────────────────────────────────────────────────────────────
  // Company title
  doc.fontSize(16).font('Helvetica-Bold').fillColor(CLR.primary)
     .text('CUSTOMER LEDGER STATEMENT', M, y, { width: TOTAL_W, align: 'center' });
  y += 22;

  // Thin double rule
  doc.save().strokeColor(CLR.primary).lineWidth(1.5)
     .moveTo(M, y).lineTo(M + TOTAL_W, y).stroke().restore();
  y += 3;
  doc.save().strokeColor(CLR.primary).lineWidth(0.5)
     .moveTo(M, y).lineTo(M + TOTAL_W, y).stroke().restore();
  y += 8;

  // Customer info (two-column compact layout)
  const infoFontSize = 8;
  const leftX = M;
  const rightX = M + TOTAL_W / 2 + 10;
  const infoW = TOTAL_W / 2 - 10;

  doc.fontSize(infoFontSize).font('Helvetica-Bold').fillColor(CLR.primary);
  doc.text(`Account Name: `, leftX, y, { continued: true, width: infoW });
  doc.font('Helvetica').fillColor(CLR.black).text(customer?.name || 'Unknown');
  
  doc.font('Helvetica-Bold').fillColor(CLR.primary);
  doc.text(`Statement Period: `, rightX, y, { continued: true, width: infoW });
  doc.font('Helvetica').fillColor(CLR.black).text(`${fmtDate(period?.from)} — ${fmtDate(period?.to)}`);
  y += 12;

  doc.font('Helvetica-Bold').fillColor(CLR.primary);
  doc.text(`Phone: `, leftX, y, { continued: true, width: infoW });
  doc.font('Helvetica').fillColor(CLR.black).text(customer?.phone || '-');

  doc.font('Helvetica-Bold').fillColor(CLR.primary);
  doc.text(`Opening Balance: `, rightX, y, { continued: true, width: infoW });
  doc.font('Helvetica').fillColor(CLR.black);
  const obVal = parseFloat(openingBalance) || 0;
  const obText = obVal === 0 ? '0.00' : `${fmt(Math.abs(obVal))} ${obVal > 0 ? 'Dr' : 'Cr'}`;
  doc.text(obText);
  y += 12;

  if (customer?.company) {
    doc.font('Helvetica-Bold').fillColor(CLR.primary);
    doc.text(`Company: `, leftX, y, { continued: true, width: infoW });
    doc.font('Helvetica').fillColor(CLR.black).text(customer.company);
    y += 12;
  }

  if (customer?.customerType) {
    doc.font('Helvetica-Bold').fillColor(CLR.primary);
    doc.text(`Type: `, leftX, y, { continued: true, width: infoW });
    doc.font('Helvetica').fillColor(CLR.black).text(customer.customerType);
    y += 12;
  }

  y += 4;

  // ── Table Header ────────────────────────────────────────────────────────
  const drawTableHeader = () => {
    // Background
    doc.save().rect(M, y, TOTAL_W, HEADER_H).fillColor(CLR.headerBg).fill().restore();

    let cx = M;
    COLS.forEach(col => {
      doc.fontSize(7).font('Helvetica-Bold').fillColor(CLR.white);
      const textY = y + 4;
      if (col.align === 'right') {
        doc.text(col.label, cx + 2, textY, { width: col.width - 4, align: 'right', lineBreak: false });
      } else {
        doc.text(col.label, cx + 3, textY, { width: col.width - 6, lineBreak: false });
      }
      cx += col.width;
    });
    y += HEADER_H;
  };

  drawTableHeader();

  // ── Summary cards (compact) ─────────────────────────────────────────────
  // Show before table if data exists
  const summaryY = y;

  // ── Table Rows ──────────────────────────────────────────────────────────
  const pageBottom = PH - M - 55; // Reserve space for page footer

  let totalDebit = 0;
  let totalCredit = 0;

  const drawRow = (entry, isOpening = false) => {
    // Check if we need a new page
    if (y + ROW_H > pageBottom) {
      // Page footer
      drawPageFooter(doc, y);
      doc.addPage();
      y = M;
      drawTableHeader();
    }

    const bg = isOpening ? CLR.summaryBg : (Math.floor((y - summaryY) / ROW_H) % 2 === 1 ? CLR.tableAlt : CLR.white);

    // Row background
    doc.save().rect(M, y, TOTAL_W, ROW_H).fillColor(bg).fill().restore();

    // Cell borders (light)
    doc.save().rect(M, y, TOTAL_W, ROW_H).strokeColor(CLR.line).lineWidth(0.25).stroke().restore();

    let cx = M;
    const rowVals = [
      fmtDate(entry.date),
      truncate(entry.particular, 35),
      truncate(entry.reference, 18),
      fmtShort(entry.debit),
      fmtShort(entry.credit),
      (() => {
        const bal = parseFloat(entry.balance) || 0;
        if (bal === 0 && !isOpening) return '-';
        const type = bal > 0 ? 'Dr' : bal < 0 ? 'Cr' : '';
        return `${fmt(Math.abs(bal))} ${type}`.trim();
      })()
    ];

    const debitVal = parseFloat(entry.debit) || 0;
    const creditVal = parseFloat(entry.credit) || 0;
    if (!isOpening) {
      totalDebit += debitVal;
      totalCredit += creditVal;
    }

    rowVals.forEach((val, i) => {
      const col = COLS[i];
      doc.fontSize(7).font('Helvetica');

      // Color for debit/credit/balance
      if (i === 3 && debitVal > 0) doc.fillColor(CLR.debit);       // Debit column
      else if (i === 4 && creditVal > 0) doc.fillColor(CLR.credit); // Credit column
      else if (i === 5) {
        const bal = parseFloat(entry.balance) || 0;
        doc.fillColor(bal > 0 ? CLR.debit : bal < 0 ? CLR.credit : CLR.black);
      } else {
        doc.fillColor(CLR.black);
      }

      const textY = y + 3;
      if (col.align === 'right') {
        doc.text(String(val), cx + 2, textY, { width: col.width - 4, align: 'right', lineBreak: false });
      } else {
        doc.text(String(val), cx + 3, textY, { width: col.width - 6, lineBreak: false });
      }
      cx += col.width;
    });

    y += ROW_H;
  };

  // Opening balance row (always drawn as the first transaction)
  drawRow({
    date: period?.from || '',
    particular: 'Opening Balance',
    reference: '-',
    debit: obVal > 0 ? obVal : 0,
    credit: obVal < 0 ? Math.abs(obVal) : 0,
    balance: obVal
  }, true);

  // Entry rows (filtering out the initial opening balance entry to avoid duplicates)
  (entries || [])
    .filter(entry => entry.particular !== 'Opening Balance')
    .forEach(entry => drawRow(entry));

  // ── Summary Row (at bottom of last page) ────────────────────────────────
  y += 4;

  // Divider line
  doc.save().strokeColor(CLR.primary).lineWidth(1)
     .moveTo(M, y).lineTo(M + TOTAL_W, y).stroke().restore();
  y += 2;

  // Summary background
  doc.save().rect(M, y, TOTAL_W, ROW_H + 6).fillColor(CLR.summaryBg).fill().restore();
  doc.save().rect(M, y, TOTAL_W, ROW_H + 6).strokeColor(CLR.primary).lineWidth(0.75).stroke().restore();

  const netBalance = obVal + totalDebit - totalCredit;
  const netBalanceText = netBalance === 0 ? '0.00' : `${fmt(Math.abs(netBalance))} ${netBalance > 0 ? 'Dr' : 'Cr'}`;

  const summaryRowVals = [
    '',                                                    // Date
    'TOTALS',                                              // Particulars
    '',                                                    // Reference
    fmt(totalDebit),                                       // Total Debit
    fmt(totalCredit),                                      // Total Credit
    netBalanceText                                         // Net Balance
  ];

  let cx = M;
  summaryRowVals.forEach((val, i) => {
    const col = COLS[i];
    const textY = y + 4;

    if (i === 1) {
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(CLR.primary);
    } else if (i === 3) {
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(CLR.debit);
    } else if (i === 4) {
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(CLR.credit);
    } else if (i === 5) {
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(netBalance > 0 ? CLR.debit : netBalance < 0 ? CLR.credit : CLR.primary);
    } else {
      doc.fontSize(7).font('Helvetica').fillColor(CLR.black);
    }

    if (col.align === 'right') {
      doc.text(String(val), cx + 2, textY, { width: col.width - 4, align: 'right', lineBreak: false });
    } else {
      doc.text(String(val), cx + 3, textY, { width: col.width - 6, lineBreak: false });
    }
    cx += col.width;
  });

  y += ROW_H + 12;

  // ── Footer ──────────────────────────────────────────────────────────────
  doc.fontSize(6).font('Helvetica').fillColor(CLR.muted)
     .text('This is a computer-generated ledger statement and does not require a physical signature.',
       M, PH - M - 8, { width: TOTAL_W, align: 'center' });

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  });
}

function drawPageFooter(doc, y) {
  doc.fontSize(6).font('Helvetica').fillColor(CLR.muted)
     .text('Continued on next page...', M, PH - M - 8, { width: TOTAL_W, align: 'center' });
}

module.exports = { generateLedgerPDF };
