import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { stationBoyAPI } from '../../services/api';

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

const StationBoyLedger = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
      const res = await stationBoyAPI.getLedger(id, { fromDate: filterFrom, toDate: filterTo });
      if (res && res.success) {
        setLedgerData(res);
      } else {
        setError(res.message || 'Failed to load ledger records');
      }
    } catch (err) {
      console.error('Ledger fetch error:', err);
      setError(err.message || 'Network error retrieving registers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchLedger();
    }
  }, [id, filterFrom, filterTo]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!ledgerData) return;
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Station Boy Ledger Statement\n";
    csvContent += `Station Boy Name,${ledgerData.stationBoy?.name || ''}\n`;
    csvContent += `Phone,${ledgerData.stationBoy?.phone || ''}\n`;
    csvContent += `Period,${filterFrom} to ${filterTo}\n\n`;
    
    // Headers
    csvContent += "Date,Particulars,Reference,Debit (Incentive),Credit (Paid),Running Balance\n";
    
    // Opening balance
    csvContent += `"${filterFrom}","Opening Balance Balance B/F","",0,0,"${ledgerData.openingBalance.toFixed(2)}"\n`;

    // Entries
    ledgerData.entries.forEach(entry => {
      csvContent += `"${entry.date}","${entry.particulars}","${entry.reference || ''}",${entry.incentive || 0},${entry.payment || 0},"${entry.balance.toFixed(2)}"\n`;
    });
    
    // Totals
    csvContent += `\nTOTAL,,${ledgerData.totals?.incentive || 0},${ledgerData.totals?.payment || 0}\n`;
    csvContent += `Closing Balance,,,,,"${ledgerData.closingBalance.toFixed(2)}"\n`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `station_boy_ledger_${id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="vintage-loading">Loading Ledger registers...</div>;
  }

  if (error) {
    return (
      <div className="vintage-error" style={{ margin: '20px', padding: '20px', border: '1px solid #c00' }}>
        <h3>Ledger System Error</h3>
        <p>{error}</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchLedger} className="vintage-btn">Retry Lookup</button>
          <button onClick={() => navigate('/admin/station-boys')} className="vintage-btn">Back to List</button>
        </div>
      </div>
    );
  }

  const { openingBalance, entries, totals, closingBalance, stationBoy } = ledgerData || {
    openingBalance: 0,
    entries: [],
    totals: { incentive: 0, payment: 0 },
    closingBalance: 0,
    stationBoy: { name: '', phone: '' }
  };

  return (
    <div className="vintage-ledger-wrapper" style={{ padding: '20px' }}>
      {/* Date Filter & Toolbar Section */}
      <div className="vintage-toolbar no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => navigate('/admin/station-boys')} className="vintage-btn" style={{ background: '#6c757d', color: 'white', border: 'none' }}>
            ⬅️ Back to Registry
          </button>
          <div className="vintage-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: 'bold' }}>From Date:</label>
            <input 
              type="date" 
              value={filterFrom} 
              onChange={(e) => setFilterFrom(e.target.value)} 
              className="vintage-date-input erp-input"
            />
          </div>
          <div className="vintage-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: 'bold' }}>To Date:</label>
            <input 
              type="date" 
              value={filterTo} 
              onChange={(e) => setFilterTo(e.target.value)} 
              className="vintage-date-input erp-input"
            />
          </div>
        </div>
        <div className="vintage-btn-group" style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handlePrint} className="vintage-btn">
            🖨️ Print Ledger
          </button>
          <button onClick={handleExportCSV} className="vintage-btn">
            📊 Export Excel (CSV)
          </button>
        </div>
      </div>

      {/* Header section representing the Statement title */}
      <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px double #333', paddingBottom: '10px' }}>
        <h2 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase' }}>Statement of Account</h2>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#555' }}>Station Boy Ledger - YatraSathi ERP</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'left', marginTop: '15px', fontSize: '12px' }}>
          <div>
            <strong>Name:</strong> {stationBoy?.name}<br />
            <strong>Phone:</strong> {stationBoy?.phone || '-'}<br />
          </div>
          <div style={{ textAlign: 'right' }}>
            <strong>Statement Period:</strong> {formatDate(filterFrom)} to {formatDate(filterTo)}<br />
            <strong>Closing Balance:</strong> <span style={{ fontWeight: 'bold' }}>{formatCurrency(closingBalance)}</span>
          </div>
        </div>
      </div>

      <table className="vintage-table erp-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{ background: '#f2f2f2' }}>
            <th style={{ padding: '8px', border: '1px solid #999', width: '100px' }}>Date</th>
            <th style={{ padding: '8px', border: '1px solid #999' }}>Particulars</th>
            <th style={{ padding: '8px', border: '1px solid #999', width: '120px' }}>Reference</th>
            <th style={{ padding: '8px', border: '1px solid #999', textAlign: 'right', width: '120px' }}>Debit (Incentive)</th>
            <th style={{ padding: '8px', border: '1px solid #999', textAlign: 'right', width: '120px' }}>Credit (Paid)</th>
            <th style={{ padding: '8px', border: '1px solid #999', textAlign: 'right', width: '130px' }}>Running Balance</th>
          </tr>
        </thead>
        <tbody>
          {/* Opening balance B/F row */}
          <tr style={{ backgroundColor: '#fafafa' }}>
            <td style={{ padding: '8px', border: '1px solid #999' }}>{formatDate(filterFrom)}</td>
            <td style={{ padding: '8px', border: '1px solid #999', fontStyle: 'italic' }}>Opening Balance Balance B/F</td>
            <td style={{ padding: '8px', border: '1px solid #999' }}>-</td>
            <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right' }}>-</td>
            <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right' }}>-</td>
            <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(openingBalance)}</td>
          </tr>

          {entries.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ padding: '15px', textAlign: 'center', color: '#888' }}>No transactions recorded in this period.</td>
            </tr>
          ) : (
            entries.map((entry, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #ccc' }}>
                <td style={{ padding: '8px', border: '1px solid #999' }}>{formatDate(entry.date)}</td>
                <td style={{ padding: '8px', border: '1px solid #999' }}>{entry.particulars}</td>
                <td style={{ padding: '8px', border: '1px solid #999' }}>{entry.reference || '-'}</td>
                <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right', color: entry.incentive > 0 ? '#155724' : '#333' }}>
                  {entry.incentive > 0 ? formatCurrency(entry.incentive) : '-'}
                </td>
                <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right', color: entry.payment > 0 ? '#721c24' : '#333' }}>
                  {entry.payment > 0 ? formatCurrency(entry.payment) : '-'}
                </td>
                <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right', fontWeight: 'bold' }}>
                  {formatCurrency(entry.balance)}
                </td>
              </tr>
            ))
          )}

          {/* Totals Row */}
          <tr style={{ background: '#f2f2f2', fontWeight: 'bold' }}>
            <td style={{ padding: '8px', border: '1px solid #999' }} colSpan="3">Total Periodic Incentives & Payments</td>
            <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right' }}>{formatCurrency(totals.incentive)}</td>
            <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right' }}>{formatCurrency(totals.payment)}</td>
            <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right' }}>-</td>
          </tr>

          {/* Closing balance row */}
          <tr style={{ background: '#e9ecef', fontWeight: 'bold' }}>
            <td style={{ padding: '8px', border: '1px solid #999' }} colSpan="5">Closing Balance Payable (Outstanding)</td>
            <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right', color: '#155724', fontSize: '13px' }}>
              {formatCurrency(closingBalance)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default StationBoyLedger;
