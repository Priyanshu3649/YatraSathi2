/**
 * Print Utility for YatraSathi ERP
 * Handles print and PDF generation for bills, receipts, reports
 */

/**
 * Print a React component
 * @param {React Component} component - React component to print
 * @param {string} title - Document title
 */
export const printComponent = (component, title = 'YatraSathi Document') => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to print documents');
    return;
  }

  // Write HTML content
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @media print {
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.5;
              color: #000;
            }
            
            .bill-print-template {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            
            th, td {
              padding: 8px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            
            .total-row {
              font-weight: bold;
              font-size: 14px;
              background-color: #f5f5f5;
            }
            
            .amount-words {
              text-align: center;
              padding: 15px;
              background-color: #fff3e0;
              border: 1px solid #ff9800;
              margin: 15px 0;
              font-style: italic;
            }
            
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 4px;
              color: white;
              font-weight: bold;
            }
            
            .status-paid {
              background-color: #4caf50;
            }
            
            .status-final {
              background-color: #ff9800;
            }
            
            .status-draft {
              background-color: #2196f3;
            }
            
            .status-cancelled {
              background-color: #f44336;
            }
            
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #ccc;
              font-size: 10px;
              color: #666;
            }
            
            .section-title {
              font-size: 14px;
              font-weight: bold;
              margin: 20px 0 10px 0;
              border-bottom: 1px solid #ccc;
              padding-bottom: 5px;
            }
            
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            
            .company-name {
              font-size: 24px;
              font-weight: bold;
              margin: 0 0 5px 0;
              color: #1a237e;
            }
            
            .bill-title {
              text-align: center;
              font-size: 20px;
              font-weight: bold;
              margin: 0 0 15px 0;
              text-decoration: underline;
            }
            
            @page {
              size: A4;
              margin: 20mm;
            }
          }
        </style>
      </head>
      <body>
        ${component}
      </body>
    </html>
  `);

  printWindow.document.close();
  
  // Wait for content to load
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
};

/**
 * Download component as PDF
 * @param {React Component} component - Component to save as PDF
 * @param {string} filename - Filename for the PDF
 */
export const downloadAsPDF = async (component, filename = 'document.pdf') => {
  // Create a canvas from the component
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // For now, we'll use print to PDF
  // In production, you'd use a library like jsPDF or html2canvas
  printComponent(component, filename.replace('.pdf', ''));
};

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @returns {string} Formatted amount
 */
export const formatCurrency = (amount) => {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount) || 0;
  }
  return `₹${amount.toFixed(2)}`;
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Convert number to words (Indian numbering system)
 * @param {number} num - Number to convert
 * @returns {string} Number in words
 */
export const numberToWords = (num) => {
  if (num === 0) return 'Zero Rupees Only';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convertHundreds = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertHundreds(n % 100) : '');
  };
  
  if (num < 1000) return convertHundreds(num);
  if (num < 100000) return convertHundreds(Math.floor(num / 1000)) + ' Thousand ' + convertHundreds(num % 1000);
  if (num < 10000000) return convertHundreds(Math.floor(num / 100000)) + ' Lakh ' + convertHundreds(num % 100000);
  return convertHundreds(Math.floor(num / 10000000)) + ' Crore ' + convertHundreds(num % 10000000);
};

/**
 * Get CSS class for status badge
 * @param {string} status - Status value
 * @returns {string} CSS class name
 */
export const getStatusBadgeClass = (status) => {
  const statusMap = {
    'PAID': 'status-paid',
    'FINAL': 'status-final',
    'DRAFT': 'status-draft',
    'CANCELLED': 'status-cancelled',
    'CONFIRMED': 'status-paid',
    'PENDING': 'status-draft'
  };
  return statusMap[status?.toUpperCase()] || 'status-draft';
};

export default {
  printComponent,
  downloadAsPDF,
  formatCurrency,
  formatDate,
  numberToWords,
  getStatusBadgeClass
};
