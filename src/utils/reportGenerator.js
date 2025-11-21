const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Generate PDF report
const generatePDFReport = async (data, reportType, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument();
      
      // Create output directory if it doesn't exist
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Pipe its output to a file
      const stream = doc.pipe(fs.createWriteStream(outputPath));
      
      // Add title
      doc.fontSize(20).text(`${reportType} Report`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();
      
      // Add report data
      if (data.summary) {
        doc.fontSize(16).text('Summary');
        doc.moveDown();
        
        Object.keys(data.summary).forEach(key => {
          doc.fontSize(12).text(`${key}: ${data.summary[key]}`);
        });
        doc.moveDown();
      }
      
      if (data.data && Array.isArray(data.data)) {
        doc.fontSize(16).text('Details');
        doc.moveDown();
        
        data.data.forEach((item, index) => {
          doc.fontSize(12).text(`${index + 1}. ${JSON.stringify(item)}`);
          doc.moveDown();
        });
      }
      
      // Finalize PDF file
      doc.end();
      
      stream.on('finish', () => {
        resolve(outputPath);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Generate Excel report
const generateExcelReport = async (data, reportType, outputPath) => {
  try {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    
    // Add summary worksheet
    if (data.summary) {
      const summarySheet = workbook.addWorksheet('Summary');
      
      // Add title
      summarySheet.addRow([`${reportType} Report`]);
      summarySheet.addRow([`Generated on: ${new Date().toLocaleString()}`]);
      summarySheet.addRow([]);
      
      // Add summary data
      Object.keys(data.summary).forEach(key => {
        summarySheet.addRow([key, data.summary[key]]);
      });
    }
    
    // Add data worksheet
    if (data.data && Array.isArray(data.data)) {
      const dataSheet = workbook.addWorksheet('Data');
      
      // Add headers if data is not empty
      if (data.data.length > 0) {
        const firstItem = data.data[0];
        const headers = Object.keys(firstItem);
        dataSheet.addRow(headers);
        
        // Add data rows
        data.data.forEach(item => {
          const row = headers.map(header => item[header] || '');
          dataSheet.addRow(row);
        });
      }
    }
    
    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save workbook
    await workbook.xlsx.writeFile(outputPath);
    
    return outputPath;
  } catch (error) {
    throw error;
  }
};

// Generate CSV report
const generateCSVReport = async (data, reportType, outputPath) => {
  try {
    let csvContent = '';
    
    // Add title
    csvContent += `${reportType} Report\n`;
    csvContent += `Generated on: ${new Date().toLocaleString()}\n\n`;
    
    // Add summary
    if (data.summary) {
      csvContent += 'Summary\n';
      Object.keys(data.summary).forEach(key => {
        csvContent += `${key},${data.summary[key]}\n`;
      });
      csvContent += '\n';
    }
    
    // Add data
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      csvContent += 'Data\n';
      
      // Add headers
      const firstItem = data.data[0];
      const headers = Object.keys(firstItem);
      csvContent += headers.join(',') + '\n';
      
      // Add data rows
      data.data.forEach(item => {
        const row = headers.map(header => {
          const value = item[header] || '';
          // Escape commas and quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvContent += row.join(',') + '\n';
      });
    }
    
    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write CSV file
    fs.writeFileSync(outputPath, csvContent);
    
    return outputPath;
  } catch (error) {
    throw error;
  }
};

// Generate report in specified format
const generateReport = async (data, reportType, format, filename) => {
  try {
    // Create reports directory if it doesn't exist
    const reportsDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const outputPath = path.join(reportsDir, `${filename}.${format}`);
    
    switch (format.toLowerCase()) {
      case 'pdf':
        return await generatePDFReport(data, reportType, outputPath);
      case 'xlsx':
        return await generateExcelReport(data, reportType, outputPath);
      case 'csv':
        return await generateCSVReport(data, reportType, outputPath);
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
  } catch (error) {
    throw error;
  }
};

module.exports = {
  generatePDFReport,
  generateExcelReport,
  generateCSVReport,
  generateReport
};