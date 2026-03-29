const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

/**
 * Exports report data to Excel
 * @param {string} reportType 
 * @param {Object} data - { columns, rows, summary }
 */
const exportToExcel = async (reportType, data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(reportType);

  // Add headers
  worksheet.addRow(data.columns);

  // Add rows
  data.rows.forEach(row => {
    worksheet.addRow(Object.values(row));
  });

  // Add summary
  worksheet.addRow([]);
  worksheet.addRow(["Summary"]);
  Object.entries(data.summary).forEach(([key, value]) => {
    worksheet.addRow([key, value]);
  });

  return await workbook.xlsx.writeBuffer();
};

/**
 * Exports report data to PDF
 * @param {string} reportType 
 * @param {Object} data - { columns, rows, summary }
 */
const exportToPDF = async (reportType, data) => {
  const doc = new PDFDocument();
  let buffers = [];
  
  doc.on('data', buffers.push.bind(buffers));
  
  // Header
  doc.fontSize(18).text(`${reportType} Report`, { align: 'center' });
  doc.moveDown();

  // Draw Table (simple version)
  doc.fontSize(10);
  data.rows.forEach((row, i) => {
    doc.text(JSON.stringify(row), { width: 500 });
  });

  doc.moveDown();
  doc.fontSize(12).text('Summary', { underline: true });
  Object.entries(data.summary).forEach(([key, value]) => {
    doc.text(`${key}: ${value}`);
  });

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
  });
};

module.exports = { exportToExcel, exportToPDF };