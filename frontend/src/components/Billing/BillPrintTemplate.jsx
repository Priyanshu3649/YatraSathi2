import React from 'react';

/**
 * Bill Print Template Component
 * Professional bill document for printing and PDF generation
 * YatraSathi ERP System - Anmol Travels
 */
const BillPrintTemplate = ({ bill, booking, passengers, companyDetails }) => {
  if (!bill) return null;

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
  const railwayFare = Number(bill.bl_railway_fare) || 0;
  const serviceCharge = Number(bill.bl_service_charge) || 0;
  const platformFee = Number(bill.bl_platform_fee) || 0;
  const miscCharges = Number(bill.bl_misc_charges) || 0;
  const deliveryCharge = Number(bill.bl_delivery_charge) || 0;
  const gst = Number(bill.bl_gst) || 0;
  const surcharge = Number(bill.bl_surcharge) || 0;
  const discount = Number(bill.bl_discount) || 0;
  const totalAmount = Number(bill.bl_total_amount) || 0;

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

  const amountInWords = `${numberToWords(Math.floor(totalAmount))} Rupees Only`;

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
    <div className="bill-print-template" style={styles.container}>
      {/* Company Header */}
      <div style={styles.header}>
        <h1 style={styles.companyName}>{company.name}</h1>
        <p style={styles.companyAddress}>{company.address}</p>
        <p style={styles.companyContact}>{company.city}</p>
        <p style={styles.companyContact}>Phone: {company.phone} | Email: {company.email}</p>
        <p style={styles.companyContact}>GSTIN: {company.gst}</p>
      </div>

      {/* Bill Title */}
      <div style={styles.titleSection}>
        <h2 style={styles.billTitle}>TAX INVOICE</h2>
        <div style={styles.billDetails}>
          <div style={styles.billDetailRow}>
            <span><strong>Bill No:</strong> {bill.bl_bill_no || 'N/A'}</span>
            <span><strong>Date:</strong> {formatDate(bill.bl_billing_date)}</span>
          </div>
          <div style={styles.billDetailRow}>
            <span><strong>Booking ID:</strong> {bill.bl_booking_id || 'N/A'}</span>
            <span><strong>Journey Date:</strong> {formatDate(bill.bl_journey_date)}</span>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Customer Details</h3>
        <table style={styles.table}>
          <tbody>
            <tr>
              <td style={styles.tableLabel}>Name:</td>
              <td style={styles.tableValue}>{bill.bl_customer_name || 'N/A'}</td>
              <td style={styles.tableLabel}>Phone:</td>
              <td style={styles.tableValue}>{bill.bl_customer_phone || 'N/A'}</td>
            </tr>
            <tr>
              <td style={styles.tableLabel}>From:</td>
              <td style={styles.tableValue}>{bill.bl_from_station || 'N/A'}</td>
              <td style={styles.tableLabel}>To:</td>
              <td style={styles.tableValue}>{bill.bl_to_station || 'N/A'}</td>
            </tr>
            <tr>
              <td style={styles.tableLabel}>Train No:</td>
              <td style={styles.tableValue}>{bill.bl_train_no || 'N/A'}</td>
              <td style={styles.tableLabel}>Class:</td>
              <td style={styles.tableValue}>{bill.bl_class || 'N/A'}</td>
            </tr>
            <tr>
              <td style={styles.tableLabel}>PNR:</td>
              <td style={styles.tableValue} colSpan="3">{bill.bl_pnr || 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Passenger Details */}
      {passengers && passengers.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Passenger Details</h3>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.tableHeaderCell}>#</th>
                <th style={styles.tableHeaderCell}>Name</th>
                <th style={styles.tableHeaderCell}>Age</th>
                <th style={styles.tableHeaderCell}>Gender</th>
                <th style={styles.tableHeaderCell}>Berth Preference</th>
                <th style={styles.tableHeaderCell}>Berth Allocated</th>
              </tr>
            </thead>
            <tbody>
              {passengers.map((passenger, idx) => (
                <tr key={idx} style={styles.tableRow}>
                  <td style={styles.tableCell}>{idx + 1}</td>
                  <td style={styles.tableCell}>{passenger.ps_fname || passenger.name || 'N/A'}</td>
                  <td style={styles.tableCell}>{passenger.ps_age || passenger.age || 'N/A'}</td>
                  <td style={styles.tableCell}>{passenger.ps_gender || passenger.gender || 'N/A'}</td>
                  <td style={styles.tableCell}>{passenger.ps_berthpref || passenger.berthPreference || 'N/A'}</td>
                  <td style={styles.tableCell}>{passenger.ps_berthalloc || passenger.berthAllocated || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Fare Breakdown */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Fare Details</h3>
        <table style={styles.table}>
          <tbody>
            <tr>
              <td style={styles.tableLabel}>Railway Fare:</td>
              <td style={styles.tableValue} align="right">₹{railwayFare.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={styles.tableLabel}>Service Charge:</td>
              <td style={styles.tableValue} align="right">₹{serviceCharge.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={styles.tableLabel}>Platform Fee:</td>
              <td style={styles.tableValue} align="right">₹{platformFee.toFixed(2)}</td>
            </tr>
            {miscCharges > 0 && (
              <tr>
                <td style={styles.tableLabel}>Miscellaneous Charges:</td>
                <td style={styles.tableValue} align="right">₹{miscCharges.toFixed(2)}</td>
              </tr>
            )}
            {deliveryCharge > 0 && (
              <tr>
                <td style={styles.tableLabel}>Delivery Charges:</td>
                <td style={styles.tableValue} align="right">₹{deliveryCharge.toFixed(2)}</td>
              </tr>
            )}
            {surcharge > 0 && (
              <tr>
                <td style={styles.tableLabel}>Surcharge:</td>
                <td style={styles.tableValue} align="right">₹{surcharge.toFixed(2)}</td>
              </tr>
            )}
            <tr>
              <td style={styles.tableLabel}>GST ({bill.bl_gst_type || 'EXCLUSIVE'}):</td>
              <td style={styles.tableValue} align="right">₹{gst.toFixed(2)}</td>
            </tr>
            {discount > 0 && (
              <tr>
                <td style={styles.tableLabel}>Discount:</td>
                <td style={{...styles.tableValue, textAlign: 'right', color: '#d32f2f'}}>-₹{discount.toFixed(2)}</td>
              </tr>
            )}
            <tr style={styles.totalRow}>
              <td style={styles.totalLabel}><strong>TOTAL AMOUNT:</strong></td>
              <td style={styles.totalValue} align="right"><strong>₹{totalAmount.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Amount in Words */}
      <div style={styles.amountWords}>
        <strong>Amount in Words:</strong> {amountInWords}
      </div>

      {/* Payment Status */}
      <div style={styles.section}>
        <div style={styles.statusSection}>
          <span style={styles.statusLabel}>Payment Status:</span>
          <span style={{
            ...styles.statusBadge,
            backgroundColor: bill.bl_status === 'PAID' ? '#4caf50' : 
                             bill.bl_status === 'FINAL' ? '#ff9800' : '#2196f3'
          }}>
            {bill.bl_status || 'DRAFT'}
          </span>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Terms & Conditions</h3>
        <ul style={styles.termsList}>
          <li>Tickets are subject to railway rules and regulations.</li>
          <li>Cancellation charges will be as per railway guidelines.</li>
          <li>This is a computer-generated invoice and does not require a signature.</li>
          <li>Please carry a valid ID proof during travel.</li>
        </ul>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p>This is a computer-generated invoice.</p>
        <p>Generated on: {new Date().toLocaleString('en-IN')}</p>
      </div>
    </div>
  );
};

// Print styles
const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#fff',
    fontSize: '12px',
    lineHeight: 1.5
  },
  header: {
    textAlign: 'center',
    borderBottom: '2px solid #333',
    paddingBottom: '15px',
    marginBottom: '20px'
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
    marginBottom: '20px'
  },
  billTitle: {
    textAlign: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0 0 15px 0',
    textDecoration: 'underline',
    textTransform: 'uppercase'
  },
  billDetails: {
    marginTop: '10px'
  },
  billDetailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '5px'
  },
  section: {
    marginBottom: '20px'
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
    borderCollapse: 'collapse',
    marginBottom: '10px'
  },
  tableHeader: {
    backgroundColor: '#f5f5f5'
  },
  tableHeaderCell: {
    padding: '8px',
    textAlign: 'left',
    fontWeight: 'bold',
    borderBottom: '1px solid #ddd'
  },
  tableRow: {
    borderBottom: '1px solid #eee'
  },
  tableCell: {
    padding: '8px'
  },
  tableLabel: {
    padding: '8px',
    fontWeight: 'bold',
    width: '30%'
  },
  tableValue: {
    padding: '8px',
    width: '20%'
  },
  totalRow: {
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold'
  },
  totalLabel: {
    padding: '12px 8px',
    fontWeight: 'bold'
  },
  totalValue: {
    padding: '12px 8px',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  amountWords: {
    textAlign: 'center',
    padding: '15px',
    backgroundColor: '#fff3e0',
    border: '1px solid #ff9800',
    borderRadius: '4px',
    marginBottom: '20px',
    fontStyle: 'italic'
  },
  statusSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  statusLabel: {
    fontWeight: 'bold'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '4px',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '12px'
  },
  termsList: {
    margin: '0',
    paddingLeft: '20px',
    fontSize: '11px',
    color: '#666'
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

export default BillPrintTemplate;
