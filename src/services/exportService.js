const ExcelJS = require('exceljs');
const tablePdfGenerator = require('../utils/tablePdfGenerator');

/**
 * Prettifies column names for display
 */
const prettify = (str) => {
  if (!str) return '';
  return str
    .replace(/^(ft_|bl_|bk_|cu_|em_|us_|total_|avg_)/, '')
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Exports report data to Excel
 * Supports recursive grouping
 */
const exportToExcel = async (reportType, data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(reportType);

  // Define Styles
  const headerStyle = { font: { bold: true }, fill: { type: 'pattern', pattern:'solid', fgColor: { argb: 'FFE0E0E0' } } };
  const groupStyle = { font: { bold: true, color: { argb: 'FF0000FF' } }, fill: { type: 'pattern', pattern:'solid', fgColor: { argb: 'FFF0F0FF' } } };
  const subtotalStyle = { font: { bold: true, italic: true }, fill: { type: 'pattern', pattern:'solid', fgColor: { argb: 'FFFFF0E0' } } };

  // Add headers
  const headers = data.columns.map(prettify);
  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell(cell => { cell.style = headerStyle; });

  // Recursive function to add grouped data
  const addGroupedData = (groupList, level = 0) => {
    groupList.forEach(group => {
      // Add Group Header
      const groupHeader = worksheet.addRow([`${"  ".repeat(level)}📁 ${prettify(group.groupKey)}: ${group.groupValue}`]);
      groupHeader.eachCell(cell => { cell.style = groupStyle; });
      worksheet.mergeCells(groupHeader.number, 1, groupHeader.number, data.columns.length);

      if (group.groups) {
        // Nested groups
        addGroupedData(group.groups, level + 1);
      } else if (group.rows) {
        // Leaf rows
        group.rows.forEach(row => {
          worksheet.addRow(data.columns.map(col => row[col]));
        });
      }

      // Add Sub-totals
      if (group.summary) {
        const subtotalRow = worksheet.addRow([`${"  ".repeat(level)}📊 Sub-total (${group.groupValue})`]);
        subtotalRow.eachCell(cell => { cell.style = subtotalStyle; });
        
        Object.entries(group.summary).forEach(([key, value]) => {
          worksheet.addRow([`${"  ".repeat(level + 1)}${prettify(key)}`, value]);
        });
      }
    });
  };

  if (data.groups && data.groups.length > 0) {
    addGroupedData(data.groups);
  } else if (data.rows) {
    data.rows.forEach(row => {
      worksheet.addRow(data.columns.map(col => row[col]));
    });
  }

  // Add Grand Summary
  worksheet.addRow([]);
  const grandHeader = worksheet.addRow(["GRAND SUMMARY"]);
  grandHeader.eachCell(cell => { cell.style = headerStyle; });
  
  if (data.summary) {
    Object.entries(data.summary).forEach(([key, value]) => {
      worksheet.addRow([prettify(key), value]);
    });
  }

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = 25;
  });

  return await workbook.xlsx.writeBuffer();
};

/**
 * Exports report data to PDF using the enhanced table generator
 */
const exportToPDF = async (reportType, data) => {
  // Transform JESPR internal groups to PDF-ready groups
  const transformGroups = (groupList, parentTitle = '') => {
    let pdfGroups = [];
    groupList.forEach(group => {
      const currentTitle = parentTitle ? `${parentTitle} > ${group.groupValue}` : group.groupValue;
      
      if (group.groups) {
        pdfGroups = [...pdfGroups, ...transformGroups(group.groups, currentTitle)];
      } else {
        pdfGroups.push({
          groupTitle: `${prettify(group.groupKey)}: ${currentTitle}`,
          columns: data.columns.map(col => ({ key: col, label: prettify(col) })),
          rows: group.rows || [],
          summary: group.summary
        });
      }
    });
    return pdfGroups;
  };

  if (data.groups && data.groups.length > 0) {
    const pdfGroups = transformGroups(data.groups);
    return await tablePdfGenerator.generateGroupedTablePDF({
      title: `${prettify(reportType)} Grouped Report`,
      subtitle: `Generated on ${new Date().toLocaleDateString()}`,
      groups: pdfGroups,
      summary: data.summary
    });
  }

  // Fallback to flat table structure
  const formattedColumns = (data.columns || []).map(col => ({
    key: col,
    label: prettify(col)
  }));

  return await tablePdfGenerator.generateTablePDF({
    title: `${prettify(reportType)} Report`,
    subtitle: `Generated on ${new Date().toLocaleDateString()}`,
    columns: formattedColumns,
    rows: data.rows || [],
    summary: data.summary
  });
};

module.exports = { exportToExcel, exportToPDF };