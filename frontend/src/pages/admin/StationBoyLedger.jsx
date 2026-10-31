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

const todayISO = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const statusColors = {
  PENDING: { color: '#856404', background: '#fff3cd' },
  PARTIALLY_SETTLED: { color: '#0c5460', background: '#d1ecf1' },
  SETTLED: { color: '#155724', background: '#d4edda' },
  UNSETTLED: { color: '#721c24', background: '#f8d7da' },
  RECONCILED: { color: '#155724', background: '#d4edda' }
};

const StatusBadge = ({ status }) => {
  const palette = statusColors[status] || { color: '#333', background: '#eee' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '10px',
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
      ...palette
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

const summaryCardStyle = {
  border: '1px solid #b9b9b9',
  background: '#fafafa',
  padding: '10px 14px',
  minWidth: '150px'
};

const emptyPaymentForm = () => ({
  paymentDate: todayISO(),
  amount: '',
  paymentMode: 'Cash',
  referenceNumber: '',
  remarks: ''
});

const StationBoyLedger = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const defaults = getFinancialYearDates();

  const [filterFrom, setFilterFrom] = useState(defaults.fromDate);
  const [filterTo, setFilterTo] = useState(defaults.toDate);
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

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

    csvContent += "Date,Particulars,Reference,Railway Fare,Incentive,Total Payable,Payment,Status,Running Balance\n";

    csvContent += `"${filterFrom}","Opening Balance B/F","",0,0,0,0,"","${ledgerData.openingBalance.toFixed(2)}"\n`;

    ledgerData.entries.forEach(entry => {
      const status = entry.transactionType === 'PAYMENT'
        ? (entry.isReconciled ? 'RECONCILED' : entry.settlementStatus)
        : entry.settlementStatus;
      csvContent += `"${entry.date}","${entry.particulars}","${entry.reference || ''}",${entry.railwayFare || 0},${entry.incentive || 0},${entry.payable || 0},${entry.payment || 0},"${status || ''}","${entry.balance.toFixed(2)}"\n`;
    });

    csvContent += `\nTOTAL,,,${ledgerData.totals?.railwayFare || 0},${ledgerData.totals?.incentive || 0},${ledgerData.totals?.payable || 0},${ledgerData.totals?.payment || 0},,\n`;
    csvContent += `Closing Balance,,,,,,,,"${ledgerData.closingBalance.toFixed(2)}"\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `station_boy_ledger_${id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openPaymentModal = () => {
    const outstanding = ledgerData?.outstanding || 0;
    setPaymentForm({
      ...emptyPaymentForm(),
      amount: outstanding > 0 ? outstanding.toFixed(2) : ''
    });
    setPaymentError('');
    setSuccess('');
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentError('');
    setSuccess('');

    const amount = parseFloat(paymentForm.amount);
    if (!paymentForm.paymentDate) {
      setPaymentError('Payment date is required');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError('Payment amount must be greater than zero');
      return;
    }
    if (!paymentForm.paymentMode) {
      setPaymentError('Payment mode is required');
      return;
    }

    setPaymentSubmitting(true);
    try {
      const res = await stationBoyAPI.addPayment(id, {
        paymentDate: paymentForm.paymentDate,
        amount,
        paymentMode: paymentForm.paymentMode,
        referenceNumber: paymentForm.referenceNumber || undefined,
        remarks: paymentForm.remarks || undefined
      });

      const allocationText = (res.settlement?.allocations || [])
        .map((a) => `${a.billNo} (${formatCurrency(a.allocatedAmount)})`)
        .join(', ');

      setSuccess(
        allocationText
          ? `Payment recorded. Oldest pending bills settled first: ${allocationText}`
          : 'Payment recorded successfully'
      );
      setShowPaymentModal(false);
      await fetchLedger();
    } catch (err) {
      setPaymentError(err.message || 'Failed to record payment');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  if (loading && !ledgerData) {
    return <div className="vintage-loading">Loading Ledger registers...</div>;
  }

  if (error && !ledgerData) {
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

  const {
    openingBalance,
    entries = [],
    totals = { railwayFare: 0, incentive: 0, payable: 0, payment: 0 },
    closingBalance,
    outstanding = 0,
    stationBoy
  } = ledgerData || {
    openingBalance: 0,
    entries: [],
    totals: { railwayFare: 0, incentive: 0, payable: 0, payment: 0 },
    closingBalance: 0,
    outstanding: 0,
    stationBoy: { name: '', phone: '' }
  };

  return (
    <div className="vintage-ledger-wrapper" style={{ padding: '20px' }}>
      <div className="vintage-toolbar no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
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
          <button
            onClick={openPaymentModal}
            className="vintage-btn"
            style={{ background: '#1565c0', color: '#fff', border: 'none', fontWeight: 'bold' }}
            disabled={outstanding <= 0}
            title={outstanding > 0 ? 'Record a payment and settle the oldest pending bill first' : 'No pending payable'}
          >
            💰 Record Payment
          </button>
          <button onClick={handlePrint} className="vintage-btn">
            🖨️ Print Ledger
          </button>
          <button onClick={handleExportCSV} className="vintage-btn">
            📊 Export Excel (CSV)
          </button>
        </div>
      </div>

      {success && (
        <div className="erp-success-banner" style={{ marginBottom: '12px', padding: '10px 14px', background: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' }}>
          {success}
        </div>
      )}
      {error && ledgerData && (
        <div className="erp-error-banner" style={{ marginBottom: '12px', padding: '10px 14px', background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' }}>
          {error}
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px double #333', paddingBottom: '10px' }}>
        <h2 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase' }}>Statement of Account</h2>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#555' }}>Station Boy Ledger - YatraSathi ERP</h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'left', marginTop: '15px', fontSize: '12px' }}>
          <div>
            <strong>Name:</strong> {stationBoy?.name}<br />
            <strong>Phone:</strong> {stationBoy?.phone || '-'}<br />
            <strong>Payable Components:</strong> Net Railway Fare + Station Boy Incentive
          </div>
          <div style={{ textAlign: 'right' }}>
            <strong>Statement Period:</strong> {formatDate(filterFrom)} to {formatDate(filterTo)}<br />
            <strong>Closing Balance:</strong> <span style={{ fontWeight: 'bold' }}>{formatCurrency(closingBalance)}</span><br />
            <strong>Total Outstanding Payable:</strong> <span style={{ fontWeight: 'bold', color: '#b8860b' }}>{formatCurrency(outstanding)}</span>
          </div>
        </div>
      </div>

      <div className="no-print" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px', fontSize: '12px' }}>
        <div style={summaryCardStyle}>
          <div style={{ color: '#666', textTransform: 'uppercase', fontSize: '10px' }}>Railway Fare</div>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{formatCurrency(totals.railwayFare)}</div>
        </div>
        <div style={summaryCardStyle}>
          <div style={{ color: '#666', textTransform: 'uppercase', fontSize: '10px' }}>Incentive</div>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{formatCurrency(totals.incentive)}</div>
        </div>
        <div style={summaryCardStyle}>
          <div style={{ color: '#666', textTransform: 'uppercase', fontSize: '10px' }}>Total Payable</div>
          <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#155724' }}>{formatCurrency(totals.payable)}</div>
        </div>
        <div style={summaryCardStyle}>
          <div style={{ color: '#666', textTransform: 'uppercase', fontSize: '10px' }}>Paid This Period</div>
          <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#721c24' }}>{formatCurrency(totals.payment)}</div>
        </div>
        <div style={{ ...summaryCardStyle, background: '#fff8e1', borderColor: '#e0c36c' }}>
          <div style={{ color: '#666', textTransform: 'uppercase', fontSize: '10px' }}>Outstanding</div>
          <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#b8860b' }}>{formatCurrency(outstanding)}</div>
        </div>
      </div>

      <table className="vintage-table erp-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{ background: '#f2f2f2' }}>
            <th style={{ padding: '8px', border: '1px solid #999', width: '95px' }}>Date</th>
            <th style={{ padding: '8px', border: '1px solid #999' }}>Particulars</th>
            <th style={{ padding: '8px', border: '1px solid #999', width: '140px' }}>Reference</th>
            <th style={{ padding: '8px', border: '1px solid #999', textAlign: 'right', width: '115px' }}>Railway Fare</th>
            <th style={{ padding: '8px', border: '1px solid #999', textAlign: 'right', width: '105px' }}>Incentive</th>
            <th style={{ padding: '8px', border: '1px solid #999', textAlign: 'right', width: '115px' }}>Total Payable</th>
            <th style={{ padding: '8px', border: '1px solid #999', textAlign: 'right', width: '110px' }}>Payment</th>
            <th style={{ padding: '8px', border: '1px solid #999', textAlign: 'center', width: '125px' }}>Status</th>
            <th style={{ padding: '8px', border: '1px solid #999', textAlign: 'right', width: '125px' }}>Running Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ backgroundColor: '#fafafa' }}>
            <td style={{ padding: '8px', border: '1px solid #999' }}>{formatDate(filterFrom)}</td>
            <td style={{ padding: '8px', border: '1px solid #999', fontStyle: 'italic' }}>Opening Balance B/F</td>
            <td style={{ padding: '8px', border: '1px solid #999' }}>-</td>
            <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right' }}>-</td>
            <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right' }}>-</td>
            <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right' }}>-</td>
            <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right' }}>-</td>
            <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'center' }}>-</td>
            <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(openingBalance)}</td>
          </tr>

          {entries.length === 0 ? (
            <tr>
              <td colSpan="9" style={{ padding: '15px', textAlign: 'center', color: '#888' }}>No transactions recorded in this period.</td>
            </tr>
          ) : (
            entries.map((entry, index) => {
              const isPayment = entry.transactionType === 'PAYMENT';
              const displayStatus = isPayment
                ? (entry.isReconciled ? 'RECONCILED' : entry.settlementStatus)
                : entry.settlementStatus;

              return (
                <tr key={`${entry.transactionType}-${entry.id}-${index}`} style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={{ padding: '8px', border: '1px solid #999', verticalAlign: 'top' }}>{formatDate(entry.date)}</td>
                  <td style={{ padding: '8px', border: '1px solid #999', verticalAlign: 'top' }}>
                    <div>{entry.particulars}</div>
                    {!isPayment && (
                      <div style={{ fontSize: '10px', color: '#666', marginTop: '3px' }}>
                        Settled {formatCurrency(entry.settledAmount)} / Pending {formatCurrency(entry.pendingAmount)}
                      </div>
                    )}
                    {isPayment && entry.allocations?.length > 0 && (
                      <div style={{ fontSize: '10px', color: '#666', marginTop: '3px' }}>
                        Settled against: {entry.allocations.map((a) => `${a.billNo} (${formatCurrency(a.amount)})`).join(', ')}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #999', verticalAlign: 'top' }}>{entry.reference || '-'}</td>
                  <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right', verticalAlign: 'top' }}>
                    {entry.railwayFare > 0 ? formatCurrency(entry.railwayFare) : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right', verticalAlign: 'top' }}>
                    {entry.incentive > 0 ? formatCurrency(entry.incentive) : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right', verticalAlign: 'top', color: entry.payable > 0 ? '#155724' : '#333', fontWeight: entry.payable > 0 ? 'bold' : 'normal' }}>
                    {entry.payable > 0 ? formatCurrency(entry.payable) : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right', verticalAlign: 'top', color: entry.payment > 0 ? '#721c24' : '#333', fontWeight: entry.payment > 0 ? 'bold' : 'normal' }}>
                    {entry.payment > 0 ? formatCurrency(entry.payment) : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'center', verticalAlign: 'top' }}>
                    <StatusBadge status={displayStatus} />
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'top' }}>
                    {formatCurrency(entry.balance)}
                  </td>
                </tr>
              );
            })
          )}

          <tr style={{ background: '#f2f2f2', fontWeight: 'bold' }}>
            <td style={{ padding: '8px', border: '1px solid #999' }} colSpan="3">Total Periodic Payable &amp; Payments</td>
            <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right' }}>{formatCurrency(totals.railwayFare)}</td>
            <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right' }}>{formatCurrency(totals.incentive)}</td>
            <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right' }}>{formatCurrency(totals.payable)}</td>
            <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right' }}>{formatCurrency(totals.payment)}</td>
            <td style={{ padding: '8px', border: '1px solid #999' }}>-</td>
            <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right' }}>-</td>
          </tr>

          <tr style={{ background: '#e9ecef', fontWeight: 'bold' }}>
            <td style={{ padding: '8px', border: '1px solid #999' }} colSpan="8">Closing Balance Payable (Outstanding)</td>
            <td style={{ padding: '8px', border: '1px solid #999', textAlign: 'right', color: '#155724', fontSize: '13px' }}>
              {formatCurrency(closingBalance)}
            </td>
          </tr>
        </tbody>
      </table>

      {showPaymentModal && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !paymentSubmitting) setShowPaymentModal(false);
          }}
        >
          <div style={{ background: '#fff', width: '440px', maxWidth: '92vw', border: '2px solid #333', boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}>
            <div style={{ background: '#333', color: '#fff', padding: '10px 14px', fontWeight: 'bold', fontSize: '13px' }}>
              RECORD PAYMENT - {stationBoy?.name}
            </div>
            <form onSubmit={handlePaymentSubmit} style={{ padding: '16px', fontSize: '12px' }}>
              <div style={{ marginBottom: '10px', padding: '8px 10px', background: '#fff8e1', border: '1px solid #e0c36c' }}>
                Outstanding payable: <strong>{formatCurrency(outstanding)}</strong>
                <div style={{ fontSize: '10px', color: '#777', marginTop: '3px' }}>
                  Payments settle the oldest pending bill first.
                </div>
              </div>

              {paymentError && (
                <div style={{ marginBottom: '10px', padding: '8px', background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' }}>
                  {paymentError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  Payment Date *
                  <input
                    type="date"
                    className="erp-input"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))}
                    required
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  Amount (₹) *
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={outstanding}
                    className="erp-input"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  Payment Mode *
                  <select
                    className="erp-input"
                    value={paymentForm.paymentMode}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentMode: e.target.value }))}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="NEFT">NEFT</option>
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  Reference No.
                  <input
                    type="text"
                    className="erp-input"
                    value={paymentForm.referenceNumber}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, referenceNumber: e.target.value }))}
                    placeholder="UTR / Cheque no."
                  />
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
                Remarks
                <textarea
                  className="erp-input"
                  rows="2"
                  value={paymentForm.remarks}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Optional"
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="vintage-btn"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={paymentSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="vintage-btn"
                  style={{ background: '#1565c0', color: '#fff', border: 'none' }}
                  disabled={paymentSubmitting}
                >
                  {paymentSubmitting ? 'Saving...' : 'Record & Settle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationBoyLedger;
