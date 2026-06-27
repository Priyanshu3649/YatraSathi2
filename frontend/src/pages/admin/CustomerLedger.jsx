import React, { useState, useEffect } from 'react';

const formatCurrency = (val) => {
  const num = parseFloat(val || 0);
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const getFinancialYearDates = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed (April is 3)
  const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  return {
    fromDate: `${startYear}-04-01`,
    toDate: `${startYear + 1}-03-31`
  };
};

const CustomerLedger = ({ customerId, customer }) => {
  const defaults = getFinancialYearDates();
  const [filterFrom, setFilterFrom] = useState(defaults.fromDate);
  const [filterTo, setFilterTo] = useState(defaults.toDate);
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLedger = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customers/${encodeURIComponent(customerId)}/ledger?fromDate=${filterFrom}&toDate=${filterTo}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setLedgerData(data);
      } else {
        setError(data.error?.message || 'Failed to load ledger data');
      }
    } catch (err) {
      console.error('Ledger fetch error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchLedger();
    }
  }, [customerId, filterFrom, filterTo]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/customers/${encodeURIComponent(customerId)}/ledger/pdf?fromDate=${filterFrom}&toDate=${filterTo}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ledger_${customerId}_${filterFrom}_${filterTo}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export error:', err);
      setError('Failed to export PDF. Please try again.');
    }
  };

  const handleExportCSV = () => {
    if (!ledgerData) return;
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Customer Ledger Statement\n";
    csvContent += `Customer Name,${ledgerData.customer?.name || ''}\n`;
    csvContent += `Phone,${ledgerData.customer?.phone || ''}\n`;
    csvContent += `Company,${ledgerData.customer?.company || ''}\n`;
    csvContent += `Period,${filterFrom} to ${filterTo}\n\n`;
    
    // Headers
    csvContent += "Date,Particulars,Reference,Debit,Credit,Balance\n";
    
    // Entries
    ledgerData.entries.forEach(entry => {
      const balanceType = entry.balance > 0 ? "Dr" : entry.balance < 0 ? "Cr" : "";
      const formattedBalance = `${Math.abs(entry.balance).toFixed(2)} ${balanceType}`.trim();
      csvContent += `"${entry.date}","${entry.particular}","${entry.reference || ''}",${entry.debit || 0},${entry.credit || 0},"${formattedBalance}"\n`;
    });
    
    // Totals
    csvContent += `\nTOTAL,,${ledgerData.totals?.debit || 0},${ledgerData.totals?.credit || 0}\n`;
    const finalBalType = ledgerData.closingBalance > 0 ? "Dr" : ledgerData.closingBalance < 0 ? "Cr" : "";
    csvContent += `Closing Balance,,,,,"${Math.abs(ledgerData.closingBalance).toFixed(2)} ${finalBalType}"\n`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customer_ledger_${customerId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="vintage-loading">Loading Ledger registers...</div>;
  }

  if (error) {
    return (
      <div className="vintage-error">
        <h3>Ledger System Error</h3>
        <p>{error}</p>
        <button onClick={fetchLedger} className="vintage-btn">Retry Register Lookup</button>
      </div>
    );
  }

  const { openingBalance, entries, totals, closingBalance, summary } = ledgerData || {
    openingBalance: 0,
    entries: [],
    totals: { debit: 0, credit: 0 },
    closingBalance: 0,
    summary: { totalBilled: 0, totalReceived: 0, outstandingAmount: 0, advanceAmount: 0 }
  };

  return (
    <div className="vintage-ledger-wrapper">
      {/* Date Filter & Toolbar Section */}
      <div className="vintage-toolbar no-print">
        <div className="vintage-filter-group">
          <label>From Date:</label>
          <input 
            type="date" 
            value={filterFrom} 
            onChange={(e) => setFilterFrom(e.target.value)} 
            className="vintage-date-input"
          />
        </div>
        <div className="vintage-filter-group">
          <label>To Date:</label>
          <input 
            type="date" 
            value={filterTo} 
            onChange={(e) => setFilterTo(e.target.value)} 
            className="vintage-date-input"
          />
        </div>
        <div className="vintage-btn-group">
          <button onClick={handlePrint} className="vintage-btn">
            🖨️ Print Ledger
          </button>
          <button onClick={handleExportPDF} className="vintage-btn">
            📄 Export PDF
          </button>
          <button onClick={handleExportCSV} className="vintage-btn">
            📊 Export Excel (CSV)
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      {(summary?.totalBilled > 0 || summary?.totalReceived > 0 || summary?.outstandingAmount > 0 || summary?.advanceAmount > 0) && (
        <div className="vintage-summary-cards no-print">
          <div className="summary-card">
            <span className="card-label">Total Billed</span>
            <span className="card-value debit-color">{formatCurrency(summary.totalBilled)}</span>
          </div>
          <div className="summary-card">
            <span className="card-label">Total Received</span>
            <span className="card-value credit-color">{formatCurrency(summary.totalReceived)}</span>
          </div>
          <div className="summary-card">
            <span className="card-label">Outstanding</span>
            <span className={`card-value ${summary.outstandingAmount > 0 ? 'debit-color' : ''}`}>{formatCurrency(summary.outstandingAmount)}</span>
          </div>
          <div className="summary-card">
            <span className="card-label">Advance</span>
            <span className={`card-value ${summary.advanceAmount > 0 ? 'credit-color' : ''}`}>{formatCurrency(summary.advanceAmount)}</span>
          </div>
        </div>
      )}

      {/* Main Vintage Account Book Sheet */}
      <div className="vintage-ledger-sheet" id="vintage-ledger-printable">
        {/* Decorative double red line header borders typical of ledger registers */}
        <div className="vintage-red-line-top"></div>
        
        <div className="vintage-ledger-header">
          <div className="vintage-ledger-title">Customer Ledger Book</div>
          <div className="vintage-meta-grid">
            <div className="vintage-meta-column">
              <div><strong>Account Name:</strong> {ledgerData.customer?.name || customer?.name}</div>
              <div><strong>Phone Number:</strong> {ledgerData.customer?.phone || customer?.phone || '-'}</div>
              <div><strong>Company Name:</strong> {ledgerData.customer?.company || customer?.company || '-'}</div>
            </div>
            <div className="vintage-meta-column text-right">
              <div><strong>Statement Period:</strong> {formatDate(filterFrom)} to {formatDate(filterTo)}</div>
              <div><strong>Opening Balance:</strong> {formatCurrency(Math.abs(openingBalance))} {openingBalance > 0 ? 'Dr' : openingBalance < 0 ? 'Cr' : ''}</div>
              {ledgerData.customer?.creditLimit > 0 && <div><strong>Credit Limit:</strong> {formatCurrency(ledgerData.customer.creditLimit)}</div>}
              {ledgerData.customer?.creditDays > 0 && <div><strong>Credit Days:</strong> {ledgerData.customer.creditDays}</div>}
              {ledgerData.customer?.customerType && <div><strong>Customer Type:</strong> {ledgerData.customer.customerType}</div>}
            </div>
          </div>
        </div>

        {/* Vintage Ledger Table */}
        <table className="vintage-table">
          <thead>
            <tr>
              <th className="vintage-th-date">Date</th>
              <th className="vintage-th-particulars">Particulars</th>
              <th className="vintage-th-ref">Reference</th>
              <th className="vintage-th-amount">Debit (Dr)</th>
              <th className="vintage-th-amount">Credit (Cr)</th>
              <th className="vintage-th-amount">Balance</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="vintage-td-empty">No transactions found in this ledger period</td>
              </tr>
            ) : (
              entries.map((entry, index) => {
                const balanceVal = parseFloat(entry.balance) || 0;
                const balanceType = balanceVal > 0 ? 'Dr' : balanceVal < 0 ? 'Cr' : '';
                return (
                  <tr key={index} className={entry.particular === 'Opening Balance' ? 'vintage-row-opening' : ''}>
                    <td className="vintage-td-date">{formatDate(entry.date)}</td>
                    <td className="vintage-td-particulars">{entry.particular}</td>
                    <td className="vintage-td-ref">{entry.reference || '-'}</td>
                    <td className="vintage-td-amount">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                    </td>
                    <td className="vintage-td-amount">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                    </td>
                    <td className={`vintage-td-amount vintage-td-balance ${balanceVal > 0 ? 'debit' : balanceVal < 0 ? 'credit' : ''}`}>
                      {formatCurrency(Math.abs(balanceVal))} {balanceType}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer Summary Card block */}
        <div className="vintage-ledger-footer">
          <div className="vintage-footer-divider"></div>
          <div className="vintage-footer-summary-grid">
            <div className="vintage-footer-stat">
              <span className="vintage-footer-label">Total Debit:</span>
              <span className="vintage-footer-value">{formatCurrency(totals.debit)}</span>
            </div>
            <div className="vintage-footer-stat">
              <span className="vintage-footer-label">Total Credit:</span>
              <span className="vintage-footer-value">{formatCurrency(totals.credit)}</span>
            </div>
            <div className="vintage-footer-stat closing">
              <span className="vintage-footer-label">Closing Balance:</span>
              <span className={`vintage-footer-value ${closingBalance > 0 ? 'debit' : closingBalance < 0 ? 'credit' : ''}`}>
                {formatCurrency(Math.abs(closingBalance))} {closingBalance > 0 ? 'Dr (Outstanding)' : closingBalance < 0 ? 'Cr (Advance)' : ''}
              </span>
            </div>
          </div>
        </div>
        <div className="vintage-red-line-bottom"></div>
      </div>

      <style jsx="true">{`
        .vintage-ledger-wrapper {
          font-family: Georgia, serif;
          color: #3e2723;
          margin-top: 15px;
        }

        .vintage-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #faf6eb;
          border: 1px solid #8b7355;
          border-radius: 4px;
          padding: 12px 20px;
          margin-bottom: 20px;
          gap: 15px;
          flex-wrap: wrap;
        }

        .vintage-filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: bold;
        }

        .vintage-date-input {
          font-family: Georgia, serif;
          border: 1px solid #8b7355;
          background-color: #ffffff;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 13px;
          color: #3e2723;
        }

        .vintage-btn-group {
          display: flex;
          gap: 10px;
        }

        .vintage-btn {
          font-family: Georgia, serif;
          font-weight: bold;
          background-color: #e5dcc6;
          border: 1px solid #8b7355;
          color: #5d4037;
          padding: 6px 14px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s ease;
        }

        .vintage-btn:hover {
          background-color: #d7cbb0;
          color: #3e2723;
        }

        .vintage-summary-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }

        .summary-card {
          background-color: #f5ecd7;
          border: 1px solid #8b7355;
          border-radius: 4px;
          padding: 14px 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .card-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #5d4037;
          font-weight: bold;
        }

        .card-value {
          font-size: 20px;
          font-weight: bold;
          color: #3e2723;
        }

        .debit-color {
          color: #b71c1c;
        }

        .credit-color {
          color: #1b5e20;
        }

        @media (max-width: 768px) {
          .vintage-summary-cards {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .vintage-loading {
          padding: 40px;
          text-align: center;
          font-style: italic;
          color: #8b7355;
          font-size: 16px;
        }

        .vintage-error {
          padding: 30px;
          background-color: #fdf2f2;
          border: 1px solid #ecb2b2;
          color: #c62828;
          border-radius: 4px;
          text-align: center;
        }

        .vintage-ledger-sheet {
          background-color: #f5ecd7;
          border: 1px solid #8b7355;
          border-radius: 4px;
          padding: 30px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          position: relative;
        }

        .vintage-red-line-top {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          border-bottom: 2px solid #b71c1c;
          margin: 0 10px;
        }

        .vintage-red-line-bottom {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 6px;
          border-top: 2px solid #b71c1c;
          margin: 0 10px;
        }

        .vintage-ledger-header {
          border-bottom: 3px double #8b7355;
          padding-bottom: 20px;
          margin-bottom: 25px;
        }

        .vintage-ledger-title {
          font-size: 32px;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #5d4037;
          margin-bottom: 20px;
          text-shadow: 0 1px 1px #fff;
        }

        .vintage-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          font-size: 15px;
        }

        .vintage-meta-column {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .text-right {
          text-align: right;
        }

        .vintage-table {
          width: 100%;
          border-collapse: collapse;
          background-color: #faf6eb;
          border: 1px solid #8b7355;
        }

        .vintage-table th {
          background-color: #e5dcc6;
          border: 1px solid #8b7355;
          color: #5d4037;
          padding: 10px 12px;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: bold;
        }

        .vintage-table td {
          border: 1px solid #8b7355;
          padding: 8px 12px;
          font-size: 14px;
          color: #2c1a17;
        }

        .vintage-table tbody tr:nth-child(even) {
          background-color: #fcfaf2;
        }

        .vintage-row-opening {
          font-weight: bold;
          background-color: #e5dcc6 !important;
          color: #3e2723;
        }

        .vintage-th-date { width: 15%; text-align: left; }
        .vintage-th-particulars { width: 40%; text-align: left; }
        .vintage-th-ref { width: 15%; text-align: left; }
        .vintage-th-amount { width: 10%; text-align: right; }

        .vintage-td-date { font-weight: bold; }
        .vintage-td-particulars { font-style: normal; }
        .vintage-td-ref { font-family: monospace; font-size: 13px; }
        .vintage-td-amount { text-align: right; }
        
        .vintage-td-balance {
          font-weight: bold;
        }

        .vintage-td-balance.debit {
          color: #b71c1c; /* Red color for Debit outstanding in traditional Indian ledger style */
        }

        .vintage-td-balance.credit {
          color: #1b5e20; /* Green color for Credit advance */
        }

        .vintage-td-empty {
          text-align: center;
          font-style: italic;
          color: #8b7355;
          padding: 30px !important;
        }

        .vintage-ledger-footer {
          margin-top: 30px;
          position: relative;
        }

        .vintage-footer-divider {
          border-top: 3px double #8b7355;
          margin-bottom: 15px;
        }

        .vintage-footer-summary-grid {
          display: flex;
          justify-content: flex-end;
          gap: 40px;
          font-size: 16px;
          font-weight: bold;
          flex-wrap: wrap;
        }

        .vintage-footer-stat {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .vintage-footer-label {
          color: #5d4037;
        }

        .vintage-footer-value {
          font-size: 18px;
        }

        .vintage-footer-value.debit {
          color: #b71c1c;
        }

        .vintage-footer-value.credit {
          color: #1b5e20;
        }

        .vintage-footer-stat.closing {
          border-left: 2px solid #8b7355;
          padding-left: 20px;
        }

        @media print {
          body * {
            visibility: hidden;
          }
          #vintage-ledger-printable, #vintage-ledger-printable * {
            visibility: visible;
          }
          #vintage-ledger-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            box-shadow: none;
            background: #ffffff !important;
          }
          .vintage-table, .vintage-table td, .vintage-table th {
            border-color: #000000 !important;
          }
          .vintage-red-line-top, .vintage-red-line-bottom {
            border-color: #000000 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerLedger;
