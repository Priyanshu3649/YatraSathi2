import React from 'react';

/**
 * Receipt Print Template Component
 * Professional payment receipt for printing and PDF generation
 * YatraSathi ERP System - Anmol Travels
 */
const ReceiptPrintTemplate = ({ receipt, customer, companyDetails }) => {
  if (!receipt) return null;

  // Default company details if not provided
  const company = companyDetails || {
    name: 'Anmol Travels',
    address: '123 Travel Street, Railway Station Road',
    city: 'New Delhi - 110001',
    phone: '+91-11-23456789',
    email: 'info@anmoltravels.com',
    gst: '07AABCA1234B1ZX'
  };

  // Calculate totals
  const amount = Number(receipt.rc_amount || receipt.amount || 0);

  // Convert amount to words
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                  'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero Rupees Only';
    
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

  const amountInWords = `${numberToWords(Math.floor(amount))} Rupees Only`;

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="receipt-print-template" style={styles.container}>
      {/* Company Header */}
      <div style={styles.header}>
        <h1 style={styles.companyName}>{company.name}</h1>
        <p style={styles.companyAddress}>{company.address}</p>
        <p style={styles.companyContact}>{company.city}</p>
        <p style={styles.companyContact}>Phone: {company.phone} | Email: {company.email}</p>
      </div>

      {/* Receipt Title */}
      <div style={styles.titleSection}>
        <h2 style={styles.receiptTitle}>PAYMENT RECEIPT</h2>
        <div style={styles.receiptDetails}>
          <div style={styles.receiptDetailRow}>
            <span><strong>Receipt No:</strong> {receipt.rc_receipt_no || receipt.receiptNo || 'N/A'}</span>
            <span><strong>Date:</strong> {formatDate(receipt.rc_date || receipt.date)}</span>
          </div>
        </div>
      </div>

      {/* Received From Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Received From</h3>
        <table style={styles.table}>
          <tbody>
            <tr>
              <td style={styles.tableLabel}>Name:</td>
              <td style={styles.tableValue}>{receipt.rc_customer_name || receipt.customerName || customer?.us_fname + ' ' + customer?.us_lname || 'N/A'}</td>
            </tr>
            <tr>
              <td style={styles.tableLabel}>Phone:</td>
              <td style={styles.tableValue}>{receipt.rc_customer_phone || receipt.phone || customer?.us_phone || 'N/A'}</td>
            </tr>
            <tr>
              <td style={styles.tableLabel}>Address:</td>
              <td style={styles.tableValue}>{receipt.rc_address || receipt.address || 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment Details */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Payment Details</h3>
        <table style={styles.table}>
          <tbody>
            <tr>
              <td style={styles.tableLabel}>Amount:</td>
              <td style={styles.amountValue}>₹{amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={styles.tableLabel}>Amount in Words:</td>
              <td style={styles.tableValue}>{amountInWords}</td>
            </tr>
            <tr>
              <td style={styles.tableLabel}>Payment Mode:</td>
              <td style={styles.tableValue}>{receipt.rc_payment_mode || receipt.paymentMode || 'Cash'}</td>
            </tr>
            <tr>
              <td style={styles.tableLabel}>Reference No:</td>
              <td style={styles.tableValue}>{receipt.rc_reference_no || receipt.referenceNo || 'N/A'}</td>
            </tr>
            <tr>
              <td style={styles.tableLabel}>Against Invoice:</td>
              <td style={styles.tableValue}>{receipt.rc_invoice_no || receipt.invoiceNo || 'N/A'}</td>
            </tr>
            {receipt.rc_narration || receipt.narration ? (
              <tr>
                <td style={styles.tableLabel}>Narration:</td>
                <td style={styles.tableValue}>{receipt.rc_narration || receipt.narration}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Signature Section */}
      <div style={styles.signatureSection}>
        <div style={styles.signatureBox}>
          <p>Received By</p>
          <div style={styles.signatureLine}></div>
          <p style={styles.signatureName}>Authorized Signatory</p>
          <p style={styles.signatureDate}>Date: ____________</p>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p>This is a computer-generated receipt.</p>
        <p>Generated on: {new Date().toLocaleString('en-IN')}</p>
      </div>
    </div>
  );
};

// Print styles
const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '30px',
    backgroundColor: '#fff',
    fontSize: '12px',
    lineHeight: 1.6
  },
  header: {
    textAlign: 'center',
    borderBottom: '2px solid #333',
    paddingBottom: '15px',
    marginBottom: '25px'
  },
  companyName: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 5px 0',
    color: '#1a237e'
  },
  companyAddress: {
    margin: '0',
    fontSize: '12px'
  },
  companyContact: {
    margin: '2px 0',
    fontSize: '11px'
  },
  titleSection: {
    marginBottom: '25px'
  },
  receiptTitle: {
    textAlign: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0 0 15px 0',
    textDecoration: 'underline',
    textTransform: 'uppercase'
  },
  receiptDetails: {
    marginTop: '10px'
  },
  receiptDetailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '5px'
  },
  section: {
    marginBottom: '25px'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    borderBottom: '1px solid #ccc',
    paddingBottom: '5px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableLabel: {
    padding: '8px',
    fontWeight: 'bold',
    width: '40%'
  },
  tableValue: {
    padding: '8px',
    width: '60%'
  },
  amountValue: {
    padding: '12px 8px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1a237e'
  },
  signatureSection: {
    marginTop: '40px',
    marginBottom: '30px'
  },
  signatureBox: {
    width: '250px',
    marginLeft: 'auto',
    textAlign: 'center'
  },
  signatureLine: {
    borderBottom: '1px solid #333',
    marginTop: '40px',
    marginBottom: '5px'
  },
  signatureName: {
    fontSize: '11px',
    margin: '2px 0'
  },
  signatureDate: {
    fontSize: '10px',
    color: '#666',
    margin: '2px 0'
  },
  footer: {
    textAlign: 'center',
    marginTop: '30px',
    paddingTop: '15px',
    borderTop: '1px solid #ccc',
    fontSize: '10px',
    color: '#666'
  }
};

export default ReceiptPrintTemplate;
