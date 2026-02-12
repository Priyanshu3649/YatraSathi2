const fs = require('fs');
const path = require('path');
const Excel = require('excel4node');
const PDFDocument = require('pdfkit');
const ReportQueryEngine = require('./reportQueryEngine');
const ReportAudit = require('./reportAudit');

/**
 * Export Service
 * 
 * Provides export capabilities for reports in multiple formats:
 * - PDF: Portable Document Format for professional documents
 * - Excel: Spreadsheet format for data analysis
 * - CSV: Comma-separated values for data interchange
 */
class ExportService {
  constructor() {
    this.queryEngine = new ReportQueryEngine();
    this.auditService = new ReportAudit();
    this.exportFormats = {
      PDF: 'pdf',
      EXCEL: 'xlsx',
      CSV: 'csv'
    };
  }

  /**
   * Generate PDF export of report data
   * @param {Object} reportData - Report data to export
   * @param {Object} template - Report template configuration
   * @param {Object} options - Export options
   * @returns {Buffer} PDF buffer
   */
  async generatePDF(reportData, template, options = {}) {
    try {
      const doc = new PDFDocument({
        margin: 50,
        layout: options.orientation || 'portrait'
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {});

      // Add header
      this.addPDFHeader(doc, template, options);

      // Add content based on report type
      if (template.type === 'financial') {
        await this.addFinancialReportContent(doc, reportData, options);
      } else if (template.type === 'time-period') {
        await this.addTimePeriodReportContent(doc, reportData, options);
      } else {
        await this.addGenericReportContent(doc, reportData, options);
      }

      // Add footer
      this.addPDFFooter(doc, options);

      doc.end();

      const pdfBuffer = Buffer.concat(buffers);
      
      // Log export activity
      await this.auditService.logExportActivity(
        options.userId || 'system',
        template.name || 'Unknown Template',
        'pdf',
        options.ip || 'localhost'
      );

      return pdfBuffer;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`Failed to generate PDF export: ${error.message}`);
    }
  }

  /**
   * Generate Excel export of report data
   * @param {Object} reportData - Report data to export
   * @param {Object} template - Report template configuration
   * @param {Object} options - Export options
   * @returns {Buffer} Excel buffer
   */
  async generateExcel(reportData, template, options = {}) {
    try {
      const workbook = new Excel.Workbook();
      const worksheet = workbook.addWorksheet(template.name || 'Report');

      // Add metadata
      worksheet.properties.defaultRowHeight = 20;

      // Add header
      this.addExcelHeader(worksheet, template, options);

      // Add data based on report type
      if (template.type === 'financial') {
        await this.addFinancialReportExcelContent(worksheet, reportData, options);
      } else if (template.type === 'time-period') {
        await this.addTimePeriodReportExcelContent(worksheet, reportData, options);
      } else {
        await this.addGenericReportExcelContent(worksheet, reportData, options);
      }

      // Auto-fit columns
      this.autoFitExcelColumns(worksheet, reportData.data || []);

      // Generate buffer
      const buffer = await workbook.writeToBuffer();

      // Log export activity
      await this.auditService.logExportActivity(
        options.userId || 'system',
        template.name || 'Unknown Template',
        'excel',
        options.ip || 'localhost'
      );

      return buffer;
    } catch (error) {
      console.error('Excel generation error:', error);
      throw new Error(`Failed to generate Excel export: ${error.message}`);
    }
  }

  /**
   * Generate CSV export of report data
   * @param {Object} reportData - Report data to export
   * @param {Object} template - Report template configuration
   * @param {Object} options - Export options
   * @returns {string} CSV content
   */
  async generateCSV(reportData, template, options = {}) {
    try {
      let csvContent = '';

      // Add header row with column names
      if (reportData.data && reportData.data.length > 0) {
        const headers = Object.keys(reportData.data[0]);
        csvContent += headers.join(',') + '\n';

        // Add data rows
        reportData.data.forEach(row => {
          const values = headers.map(header => {
            let value = row[header];
            if (value === null || value === undefined) value = '';
            if (typeof value === 'string') {
              // Escape commas and quotes in string values
              value = '"' + value.toString().replace(/"/g, '""') + '"';
            }
            return value;
          });
          csvContent += values.join(',') + '\n';
        });
      }

      // Log export activity
      await this.auditService.logExportActivity(
        options.userId || 'system',
        template.name || 'Unknown Template',
        'csv',
        options.ip || 'localhost'
      );

      return csvContent;
    } catch (error) {
      console.error('CSV generation error:', error);
      throw new Error(`Failed to generate CSV export: ${error.message}`);
    }
  }

  /**
   * Add PDF header
   */
  addPDFHeader(doc, template, options) {
    doc.fontSize(16).text(template.name || 'Report', 50, 50, {
      align: 'center',
      underline: true
    });

    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, 50, 80);
    
    if (template.description) {
      doc.text(`Description: ${template.description}`, 50, 100);
    }

    // Move down for content
    doc.moveDown(3);
  }

  /**
   * Add PDF footer
   */
  addPDFFooter(doc, options) {
    const height = doc.page.height;
    doc.fontSize(8)
       .text(`Page ${doc.bufferedPageRange().start + 1}`, 50, height - 30)
       .text('Generated by YatraSathi Reporting System', 50, height - 20);
  }

  /**
   * Add generic report content to PDF
   */
  async addGenericReportContent(doc, reportData, options) {
    if (reportData.data && reportData.data.length > 0) {
      const headers = Object.keys(reportData.data[0]);
      
      // Draw table header
      let yPosition = doc.y;
      headers.forEach((header, index) => {
        const x = 50 + (index * 100);
        doc.rect(x, yPosition, 100, 20).stroke();
        doc.text(header, x + 5, yPosition + 5);
      });

      yPosition += 20;

      // Draw table rows
      reportData.data.slice(0, options.maxRows || 100).forEach((row, rowIndex) => {
        if (rowIndex >= (options.maxRows || 100)) return; // Limit rows
        
        headers.forEach((header, colIndex) => {
          const x = 50 + (colIndex * 100);
          doc.rect(x, yPosition, 100, 20).stroke();
          doc.text(String(row[header] || ''), x + 5, yPosition + 5);
        });
        yPosition += 20;

        // Add page break if needed
        if (yPosition > doc.page.height - 100) {
          doc.addPage();
          yPosition = 50;
        }
      });
    }
  }

  /**
   * Add financial report content to PDF
   */
  async addFinancialReportContent(doc, reportData, options) {
    // Add financial summary if available
    if (reportData.dashboard) {
      doc.fontSize(12).text('Financial Dashboard Summary', { underline: true });
      doc.moveDown(0.5);

      const kpiItems = Object.entries(reportData.dashboard.kpis);
      kpiItems.forEach(([key, value]) => {
        doc.text(`${key.replace(/([A-Z])/g, ' $1').toUpperCase()}: ${value}`);
      });
      doc.moveDown(1);
    }

    // Add detailed financial data
    if (reportData.revenueSources) {
      doc.fontSize(12).text('Revenue Sources', { underline: true });
      doc.moveDown(0.5);
      
      Object.entries(reportData.revenueSources).forEach(([source, amount]) => {
        doc.text(`${source}: ₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
      });
      doc.moveDown(1);
    }

    // Add the main data table
    await this.addGenericReportContent(doc, reportData, options);
  }

  /**
   * Add time period report content to PDF
   */
  async addTimePeriodReportContent(doc, reportData, options) {
    // Add period information
    if (reportData.period) {
      doc.fontSize(12).text('Report Period', { underline: true });
      doc.moveDown(0.5);
      
      Object.entries(reportData.period).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`);
      });
      doc.moveDown(1);
    }

    // Add aggregates if available
    if (reportData.aggregates) {
      doc.fontSize(12).text('Aggregates', { underline: true });
      doc.moveDown(0.5);
      
      Object.entries(reportData.aggregates).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`);
      });
      doc.moveDown(1);
    }

    // Add the main data table
    await this.addGenericReportContent(doc, reportData, options);
  }

  /**
   * Add Excel header
   */
  addExcelHeader(worksheet, template, options) {
    // Title row
    worksheet.cell(1, 1).string(template.name || 'Report').style({
      font: { size: 16, bold: true },
      alignment: { horizontal: 'center' }
    });
    
    // Merge cells for title
    worksheet.row(1).setHeight(30);
    if (template.name) {
      worksheet.mergeCells(1, 1, 1, 10);
    }

    // Generated date
    worksheet.cell(2, 1).string(`Generated on: ${new Date().toLocaleString()}`).style({
      font: { size: 10 }
    });

    if (template.description) {
      worksheet.cell(3, 1).string(`Description: ${template.description}`).style({
        font: { size: 10 }
      });
    }
  }

  /**
   * Add generic report content to Excel
   */
  async addGenericReportExcelContent(worksheet, reportData, options) {
    let startRow = 5; // Leave space for header

    if (reportData.data && reportData.data.length > 0) {
      const headers = Object.keys(reportData.data[0]);

      // Add headers
      headers.forEach((header, index) => {
        worksheet.cell(startRow, index + 1)
          .string(header)
          .style({
            font: { bold: true },
            fill: { type: 'pattern', pattern: 'solid', fgColor: 'lightgray' }
          });
      });

      startRow++;

      // Add data rows
      reportData.data.slice(0, options.maxRows || 10000).forEach((row, rowIndex) => {
        headers.forEach((header, colIndex) => {
          const value = row[header];
          if (value === null || value === undefined) {
            worksheet.cell(startRow + rowIndex, colIndex + 1).string('');
          } else if (typeof value === 'number') {
            worksheet.cell(startRow + rowIndex, colIndex + 1).number(value);
          } else if (value instanceof Date) {
            worksheet.cell(startRow + rowIndex, colIndex + 1).date(value).style({
              numberFormat: 'mm/dd/yyyy'
            });
          } else {
            worksheet.cell(startRow + rowIndex, colIndex + 1).string(String(value));
          }
        });
      });
    }
  }

  /**
   * Add financial report content to Excel
   */
  async addFinancialReportExcelContent(worksheet, reportData, options) {
    let currentRow = 5;

    // Add financial summary if available
    if (reportData.dashboard) {
      worksheet.cell(currentRow, 1).string('Financial Dashboard Summary').style({
        font: { bold: true, size: 12 }
      });
      currentRow++;

      Object.entries(reportData.dashboard.kpis).forEach(([key, value]) => {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').toUpperCase();
        worksheet.cell(currentRow, 1).string(formattedKey);
        worksheet.cell(currentRow, 2).number(Number(value)).style({
          numberFormat: '#,##0.00'
        });
        currentRow++;
      });
      currentRow++; // Extra space
    }

    // Add revenue sources
    if (reportData.revenueSources) {
      worksheet.cell(currentRow, 1).string('Revenue Sources').style({
        font: { bold: true, size: 12 }
      });
      currentRow++;

      Object.entries(reportData.revenueSources).forEach(([source, amount]) => {
        worksheet.cell(currentRow, 1).string(source);
        worksheet.cell(currentRow, 2).number(Number(amount)).style({
          numberFormat: '#,##0.00'
        });
        currentRow++;
      });
      currentRow++; // Extra space
    }

    // Add main data table
    await this.addGenericReportExcelContent(worksheet, reportData, options);
  }

  /**
   * Add time period report content to Excel
   */
  async addTimePeriodReportExcelContent(worksheet, reportData, options) {
    let currentRow = 5;

    // Add period information
    if (reportData.period) {
      worksheet.cell(currentRow, 1).string('Report Period').style({
        font: { bold: true, size: 12 }
      });
      currentRow++;

      Object.entries(reportData.period).forEach(([key, value]) => {
        worksheet.cell(currentRow, 1).string(key);
        worksheet.cell(currentRow, 2).string(String(value));
        currentRow++;
      });
      currentRow++; // Extra space
    }

    // Add aggregates
    if (reportData.aggregates) {
      worksheet.cell(currentRow, 1).string('Aggregates').style({
        font: { bold: true, size: 12 }
      });
      currentRow++;

      Object.entries(reportData.aggregates).forEach(([key, value]) => {
        worksheet.cell(currentRow, 1).string(key);
        worksheet.cell(currentRow, 2).number(Number(value)).style({
          numberFormat: '#,##0.00'
        });
        currentRow++;
      });
      currentRow++; // Extra space
    }

    // Add main data table
    await this.addGenericReportExcelContent(worksheet, reportData, options);
  }

  /**
   * Auto-fit Excel columns based on content
   */
  autoFitExcelColumns(worksheet, data) {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    headers.forEach((header, index) => {
      const col = worksheet.column(index + 1);
      
      // Calculate max width needed for this column
      let maxWidth = header.length;
      data.forEach(row => {
        const cellWidth = String(row[header] || '').length;
        if (cellWidth > maxWidth) maxWidth = cellWidth;
      });
      
      // Set column width with a reasonable maximum
      col.setWidth(Math.min(maxWidth + 2, 50));
    });
  }

  /**
   * Export report with specified format
   * @param {Object} queryConfig - Report query configuration
   * @param {string} format - Export format (pdf, xlsx, csv)
   * @param {Object} userContext - User context
   * @param {Object} options - Export options
   * @returns {Buffer|string} Exported content
   */
  async exportReport(queryConfig, format, userContext, options = {}) {
    try {
      // First, execute the report query to get data
      const reportData = await this.queryEngine.executeQuery(queryConfig, userContext);

      // Create template from query config
      const template = {
        name: options.templateName || `Export_${new Date().toISOString().slice(0, 10)}`,
        type: queryConfig.reportType,
        description: options.description || 'Exported Report',
        config: queryConfig
      };

      // Add user context to options
      options.userId = userContext.us_usid;
      options.ip = options.ip || 'localhost';

      // Generate export based on format
      switch (format.toLowerCase()) {
        case 'pdf':
          return await this.generatePDF(reportData, template, options);
        case 'xlsx':
        case 'xls':
          return await this.generateExcel(reportData, template, options);
        case 'csv':
          return await this.generateCSV(reportData, template, options);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Report export error:', error);
      throw new Error(`Failed to export report: ${error.message}`);
    }
  }

  /**
   * Batch export multiple reports
   * @param {Array} exportRequests - Array of export request objects
   * @param {Object} userContext - User context
   * @returns {Array} Array of export results
   */
  async batchExport(exportRequests, userContext) {
    try {
      const results = [];

      for (const request of exportRequests) {
        const { queryConfig, format, options = {} } = request;
        
        try {
          const exportedData = await this.exportReport(
            queryConfig, 
            format, 
            userContext, 
            { ...options, batch: true }
          );

          results.push({
            success: true,
            format,
            data: exportedData,
            filename: this.generateFileName(request.options?.templateName || 'batch_report', format)
          });
        } catch (error) {
          results.push({
            success: false,
            format,
            error: error.message,
            queryConfig
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Batch export error:', error);
      throw new Error(`Failed to perform batch export: ${error.message}`);
    }
  }

  /**
   * Generate appropriate filename for export
   */
  generateFileName(baseName, format) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${cleanBaseName}_${timestamp}.${format}`;
  }

  /**
   * Stream export for large datasets
   * @param {Object} queryConfig - Report query configuration
   * @param {string} format - Export format
   * @param {Object} userContext - User context
   * @param {Object} options - Export options
   * @returns {Stream} Readable stream of export data
   */
  async streamExport(queryConfig, format, userContext, options = {}) {
    try {
      // For now, return the standard export as streaming implementation
      // would require more complex handling
      return await this.exportReport(queryConfig, format, userContext, options);
    } catch (error) {
      console.error('Stream export error:', error);
      throw new Error(`Failed to stream export: ${error.message}`);
    }
  }
}

module.exports = ExportService;