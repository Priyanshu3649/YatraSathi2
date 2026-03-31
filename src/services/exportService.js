const ExcelJS = require('exceljs');
const tablePdfGenerator = require('../utils/tablePdfGenerator');

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
  if (data.summary) {
    Object.entries(data.summary).forEach(([key, value]) => {
      worksheet.addRow([key, value]);
    });
  }

  return await workbook.xlsx.writeBuffer();
};

/**
 * Exports report data to PDF using the enhanced table generator
 * Supports both flat and grouped data structures
 * @param {string} reportType 
 * @param {Object} data - { columns, rows, summary } OR { title, groups: [...] }
 */
const exportToPDF = async (reportType, data) => {
  // If data already follows the grouped structure, use the specific generator
  if (data.groups) {
    return await tablePdfGenerator.generateGroupedTablePDF({
      title: data.title || `${reportType} Grouped Report`,
      subtitle: data.subtitle || `Exported on ${new Date().toLocaleDateString()}`,
      groups: data.groups,
      summary: data.summary
    });
  }

  // Fallback to flat table structure
  const formattedColumns = (data.columns || []).map(col => {
    if (typeof col === 'string') {
      return { key: col.toLowerCase(), label: col };
    }
    return col;
  });

  return await tablePdfGenerator.generateTablePDF({
    title: `${reportType} Report`,
    subtitle: `Exported on ${new Date().toLocaleDateString()}`,
    columns: formattedColumns,
    rows: data.rows || [],
    summary: data.summary
  });
};

module.exports = { exportToExcel, exportToPDF };