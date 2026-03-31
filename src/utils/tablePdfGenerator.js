const PDFDocument = require('pdfkit');

/**
 * Enhanced PDF Table Generator
 * Provides professional table drawing capabilities for pdfkit, including grouping.
 */
class TablePdfGenerator {
  constructor(options = {}) {
    this.options = {
      margin: 50,
      fontSize: 10,
      headerFontSize: 11,
      groupTitleFontSize: 14,
      rowHeight: 20,
      headerHeight: 25,
      ...options
    };
  }

  /**
   * Generates a professional table-based PDF
   * @param {Object} data - { title, subtitle, columns, rows, summary }
   * @returns {Promise<Buffer>} PDF Buffer
   */
  async generateTablePDF(data) {
    return this.generateGroupedTablePDF({
      title: data.title,
      subtitle: data.subtitle,
      groups: [{
        columns: data.columns,
        rows: data.rows,
        summary: data.summary
      }]
    });
  }

  /**
   * Generates a professional PDF with grouped tables
   * @param {Object} data - { title, subtitle, groups: [{ groupTitle, columns, rows, summary }] }
   * @returns {Promise<Buffer>} PDF Buffer
   */
  async generateGroupedTablePDF(data) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: this.options.margin, size: 'A4', layout: 'landscape' });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));

        // 1. Header & Title (First Page)
        doc.fillColor('#333333').fontSize(20).text(data.title, { align: 'center' });
        if (data.subtitle) {
          doc.fontSize(12).text(data.subtitle, { align: 'center' });
        }
        doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
        doc.moveDown(2);

        const tableWidth = doc.page.width - (this.options.margin * 2);
        const startX = this.options.margin;
        let currentY = doc.y;

        // Shared function to draw a row
        const drawRow = (rowData, columns, colWidth, isHeader = false) => {
          const height = isHeader ? this.options.headerHeight : this.options.rowHeight;
          
          // Check for page break
          if (currentY + height > doc.page.height - this.options.margin) {
            doc.addPage({ layout: 'landscape' });
            currentY = this.options.margin;
            // Redraw header on new page
            if (!isHeader) {
              drawRow(columns.map(c => c.label), columns, colWidth, true);
            }
          }

          // Background
          if (isHeader) {
            doc.rect(startX, currentY, tableWidth, height).fill('#f2f2f2').stroke('#cccccc');
            doc.fillColor('#000000').font('Helvetica-Bold');
          } else {
            doc.rect(startX, currentY, tableWidth, height).stroke('#eeeeee');
            doc.fillColor('#444444').font('Helvetica');
          }

          // Cells
          rowData.forEach((cell, i) => {
            const x = startX + (i * colWidth);
            doc.text(String(cell || ''), x + 5, currentY + (height / 4), {
              width: colWidth - 10,
              height: height - 5,
              ellipsis: true
            });
          });

          currentY += height;
        };

        // 2. Iterate through Groups
        data.groups.forEach((group, gIdx) => {
          // Check if group title fits or needs a new page
          if (group.groupTitle) {
            if (currentY + 40 > doc.page.height - this.options.margin) {
              doc.addPage({ layout: 'landscape' });
              currentY = this.options.margin;
            }
            doc.moveDown();
            doc.fillColor('#000000').font('Helvetica-Bold').fontSize(this.options.groupTitleFontSize);
            doc.text(group.groupTitle, startX);
            doc.moveDown(0.5);
            currentY = doc.y;
          }

          const colWidth = tableWidth / group.columns.length;

          // Draw Group Header
          drawRow(group.columns.map(c => c.label), group.columns, colWidth, true);

          // Draw Group Rows
          group.rows.forEach(row => {
            const rowData = group.columns.map(col => {
              const val = row[col.key];
              if (val === true) return 'Yes';
              if (val === false) return 'No';
              if (val instanceof Date) return val.toLocaleDateString();
              return val;
            });
            drawRow(rowData, group.columns, colWidth);
          });

          // Draw Group Summary
          if (group.summary) {
            doc.fillColor('#333333').font('Helvetica-Bold').fontSize(10);
            const summaryText = Object.entries(group.summary)
              .map(([k, v]) => `${k}: ${v}`).join(' | ');
            doc.text(summaryText, startX + 5, currentY + 5);
            currentY += 25;
            doc.moveDown();
          }
        });

        // 3. Overall Summary (at the very end)
        if (data.summary) {
          doc.addPage({ layout: 'landscape' });
          doc.fillColor('#000000').font('Helvetica-Bold').fontSize(16).text('Grand Summary', this.options.margin, this.options.margin);
          doc.moveDown();
          doc.font('Helvetica').fontSize(12);
          Object.entries(data.summary).forEach(([key, value]) => {
            doc.text(`${key}: ${value}`);
          });
        }

        // 4. Footer (Page Numbers)
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).text(`Page ${i + 1} of ${range.count}`, 
            startX, doc.page.height - 30, { align: 'center', width: tableWidth });
        }

        doc.end();
        doc.on('end', () => resolve(Buffer.concat(buffers)));
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new TablePdfGenerator();
