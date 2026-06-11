import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerDetailsAPI } from '../services/api';
import PaginationControls from '../components/common/PaginationControls';

const TABS = ['Overview', 'Bookings', 'Bills', 'Receipts', 'Payments', 'Ledger'];

const formatCurrency = (val) => {
  const num = parseFloat(val || 0);
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const StatusBadge = ({ status }) => {
  const colors = {
    CONFIRMED: '#2e7d32', CNF: '#2e7d32', COMPLETED: '#1565c0', CMP: '#1565c0',
    PENDING: '#ef6c00', PND: '#ef6c00', DRF: '#ef6c00',
    CANCELLED: '#c62828', CAN: '#c62828',
    FULLY_PAID: '#2e7d32', PAID: '#2e7d32',
    PARTIALLY_PAID: '#ef6c00', UNPAID: '#c62828',
    ACTIVE: '#2e7d32', RECEIVED: '#2e7d32', REVERSED: '#c62828'
  };
  const color = colors[status] || '#616161';
  return (
    <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: '#fff', backgroundColor: color, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
};

const StatCard = ({ label, value, color = '#1565c0', subtitle }) => (
  <div style={{ background: '#fff', borderRadius: 8, padding: '16px 20px', borderLeft: `4px solid ${color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', minWidth: 140 }}>
    <div style={{ fontSize: 11, color: '#757575', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    {subtitle && <div style={{ fontSize: 11, color: '#9e9e9e', marginTop: 2 }}>{subtitle}</div>}
  </div>
);

const CustomerDetails = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  // Paginated tab data
  const [bookings, setBookings] = useState({ data: [], pagination: { total: 0, page: 1, pages: 0 } });
  const [bills, setBills] = useState({ data: [], pagination: { total: 0, page: 1, pages: 0 } });
  const [receipts, setReceipts] = useState({ data: [], pagination: { total: 0, page: 1, pages: 0 } });
  const [payments, setPayments] = useState({ data: [], pagination: { total: 0, page: 1, pages: 0 } });
  const [ledger, setLedger] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await customerDetailsAPI.getSummary(customerId);
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const fetchBookings = useCallback(async (page = 1) => {
    setTabLoading(true);
    try {
      const res = await customerDetailsAPI.getBookings(customerId, { page, limit: 20 });
      setBookings({ data: res.data || [], pagination: res.pagination || { total: 0, page: 1, pages: 0 } });
    } catch (err) { console.error(err); }
    finally { setTabLoading(false); }
  }, [customerId]);

  const fetchBills = useCallback(async (page = 1) => {
    setTabLoading(true);
    try {
      const res = await customerDetailsAPI.getBills(customerId, { page, limit: 20 });
      setBills({ data: res.data || [], pagination: res.pagination || { total: 0, page: 1, pages: 0 } });
    } catch (err) { console.error(err); }
    finally { setTabLoading(false); }
  }, [customerId]);

  const fetchPayments = useCallback(async (page = 1) => {
    setTabLoading(true);
    try {
      const res = await customerDetailsAPI.getPayments(customerId, { page, limit: 20 });
      setPayments({ data: res.data || [], pagination: res.pagination || { total: 0, page: 1, pages: 0 } });
    } catch (err) { console.error(err); }
    finally { setTabLoading(false); }
  }, [customerId]);

  const fetchReceipts = useCallback(async (page = 1) => {
    setTabLoading(true);
    try {
      const res = await customerDetailsAPI.getReceipts(customerId, { page, limit: 20 });
      setReceipts({ data: res.data || [], pagination: res.pagination || { total: 0, page: 1, pages: 0 } });
    } catch (err) { console.error(err); }
    finally { setTabLoading(false); }
  }, [customerId]);

  const fetchLedger = useCallback(async () => {
    setTabLoading(true);
    try {
      const res = await customerDetailsAPI.getLedger(customerId);
      setLedger(res.data || []);
    } catch (err) { console.error(err); }
    finally { setTabLoading(false); }
  }, [customerId]);

  useEffect(() => {
    if (activeTab === 'Bookings' && bookings.data.length === 0 && bookings.pagination.total === 0) fetchBookings();
    if (activeTab === 'Bills' && bills.data.length === 0 && bills.pagination.total === 0) fetchBills();
    if (activeTab === 'Receipts' && receipts.data.length === 0 && receipts.pagination.total === 0) fetchReceipts();
    if (activeTab === 'Payments' && payments.data.length === 0 && payments.pagination.total === 0) fetchPayments();
    if (activeTab === 'Ledger' && ledger.length === 0) fetchLedger();
  }, [activeTab]);

  const handleExport = () => { window.print(); };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 40, height: 40, border: '4px solid #e0e0e0', borderTopColor: '#1565c0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#757575' }}>Loading customer details...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h3 style={{ color: '#c62828' }}>Failed to load customer</h3>
        <p>{error}</p>
        <button onClick={fetchSummary} style={{ padding: '8px 24px', background: '#1565c0', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  const { customer, bookingStats, billingStats, paymentStats, financialSummary, recentBookings, recentBills, recentPayments, recentReceipts } = data;
  const creditUtil = customer.creditLimit > 0 ? ((financialSummary.outstandingAmount / customer.creditLimit) * 100).toFixed(1) : 0;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px' }}>
      {/* Back button */}
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#1565c0', cursor: 'pointer', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
        ← Back to Customer List
      </button>

      {/* ═══ PROFILE CARD ═══ */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1565c0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 700 }}>
              {(customer.name || 'C')[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{customer.name || 'Unknown'}</h2>
              <div style={{ color: '#757575', fontSize: 13, marginTop: 2 }}>
                {customer.customerId} • {customer.customerType} {customer.company ? `• ${customer.company}` : ''}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleExport} style={{ padding: '6px 16px', background: '#fff', border: '1px solid #bdbdbd', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Export</button>
            <button onClick={() => navigate(`/audit?module=CUSTOMER&recordId=${customer.id}`)} style={{ padding: '6px 16px', background: '#fff', border: '1px solid #bdbdbd', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Audit Log</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px 24px', marginTop: 20, fontSize: 13 }}>
          <div><span style={{ color: '#9e9e9e' }}>Email:</span> {customer.email || '-'}</div>
          <div><span style={{ color: '#9e9e9e' }}>Phone:</span> {customer.phone || '-'}</div>
          <div><span style={{ color: '#9e9e9e' }}>GST:</span> {customer.gstNumber || '-'}</div>
          <div><span style={{ color: '#9e9e9e' }}>PAN:</span> {customer.panNumber || '-'}</div>
          <div><span style={{ color: '#9e9e9e' }}>Address:</span> {[customer.address, customer.city, customer.state, customer.pin].filter(Boolean).join(', ') || '-'}</div>
          <div><span style={{ color: '#9e9e9e' }}>Credit Limit:</span> {formatCurrency(customer.creditLimit)}</div>
          <div><span style={{ color: '#9e9e9e' }}>Status:</span> <StatusBadge status={customer.active ? 'ACTIVE' : 'INACTIVE'} /></div>
          <div><span style={{ color: '#9e9e9e' }}>Registered:</span> {formatDate(customer.createdAt)}</div>
        </div>
      </div>

      {/* ═══ FINANCIAL SUMMARY ═══ */}
      <div style={{ background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)', borderRadius: 10, padding: 24, color: '#fff', marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Financial Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          <div><div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase' }}>Total Billed</div><div style={{ fontSize: 22, fontWeight: 700 }}>{formatCurrency(financialSummary.totalBilled)}</div></div>
          <div><div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase' }}>Total Received</div><div style={{ fontSize: 22, fontWeight: 700 }}>{formatCurrency(financialSummary.totalReceived)}</div></div>
          <div><div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase' }}>Outstanding</div><div style={{ fontSize: 22, fontWeight: 700, color: financialSummary.outstandingAmount > 0 ? '#ff8a80' : '#b9f6ca' }}>{formatCurrency(financialSummary.outstandingAmount)}</div></div>
          <div><div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase' }}>Advance</div><div style={{ fontSize: 22, fontWeight: 700, color: '#b9f6ca' }}>{formatCurrency(financialSummary.advanceAmount)}</div></div>
          <div><div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase' }}>Credit Utilization</div><div style={{ fontSize: 22, fontWeight: 700 }}>{creditUtil}%</div></div>
          <div><div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase' }}>Last Bill</div><div style={{ fontSize: 15, fontWeight: 500 }}>{formatDate(financialSummary.lastBillDate)}</div></div>
          <div><div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase' }}>Last Payment</div><div style={{ fontSize: 15, fontWeight: 500 }}>{formatDate(financialSummary.lastPaymentDate)}</div></div>
        </div>
      </div>

      {/* ═══ TAB NAVIGATION ═══ */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e0e0e0', marginBottom: 20, overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 24px', border: 'none', borderBottom: activeTab === tab ? '3px solid #1565c0' : '3px solid transparent',
            background: 'none', cursor: 'pointer', fontWeight: activeTab === tab ? 700 : 400,
            color: activeTab === tab ? '#1565c0' : '#757575', fontSize: 14, whiteSpace: 'nowrap'
          }}>{tab}</button>
        ))}
      </div>

      {tabLoading && <div style={{ textAlign: 'center', padding: 20, color: '#757575' }}>Loading...</div>}

      {/* ═══ OVERVIEW TAB ═══ */}
      {activeTab === 'Overview' && !tabLoading && (
        <div>
          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
            <StatCard label="Total Bookings" value={bookingStats.total} color="#1565c0" />
            <StatCard label="Confirmed" value={bookingStats.confirmed} color="#2e7d32" />
            <StatCard label="Pending" value={bookingStats.pending} color="#ef6c00" />
            <StatCard label="Cancelled" value={bookingStats.cancelled} color="#c62828" />
            <StatCard label="Total Bills" value={billingStats.total} color="#1565c0" subtitle={formatCurrency(billingStats.totalAmount)} />
            <StatCard label="Unpaid Bills" value={billingStats.unpaid} color="#c62828" />
            <StatCard label="Total Payments" value={paymentStats.count} color="#2e7d32" subtitle={formatCurrency(paymentStats.totalReceived)} />
          </div>

          {/* Recent Bookings */}
          <div style={{ background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Recent Bookings</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: '#f5f5f5' }}>
                  <th style={th}>ID</th><th style={th}>Date</th><th style={th}>From</th><th style={th}>To</th><th style={th}>Pax</th><th style={th}>Status</th><th style={th}>Billing</th>
                </tr></thead>
                <tbody>
                  {(recentBookings || []).length === 0 ? <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: '#9e9e9e' }}>No bookings</td></tr> :
                    recentBookings.map(b => (
                      <tr key={b.id} style={{ cursor: 'pointer' }}>
                        <td style={td} onClick={() => navigate('/billing', { state: { bookingId: b.id, mode: 'view' } })}>{b.id}</td><td style={td} onClick={() => navigate('/billing', { state: { bookingId: b.id, mode: 'view' } })}>{formatDate(b.date)}</td><td style={td} onClick={() => navigate('/billing', { state: { bookingId: b.id, mode: 'view' } })}>{b.from}</td><td style={td} onClick={() => navigate('/billing', { state: { bookingId: b.id, mode: 'view' } })}>{b.to}</td><td style={td} onClick={() => navigate('/billing', { state: { bookingId: b.id, mode: 'view' } })}>{b.passengers}</td><td style={td} onClick={() => navigate('/billing', { state: { bookingId: b.id, mode: 'view' } })}><StatusBadge status={b.status} /></td>
                        <td style={td}>{b.hasBilling ? <span style={{ color: '#2e7d32', fontSize: 11, fontWeight: 600 }}>Billed</span> : <span style={{ color: '#9e9e9e', fontSize: 11 }}>Pending</span>}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Bills */}
          <div style={{ background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Recent Bills</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: '#f5f5f5' }}>
                  <th style={th}>Bill #</th><th style={th}>Date</th><th style={th}>Amount</th><th style={th}>Allocated</th><th style={th}>Balance</th><th style={th}>Status</th>
                </tr></thead>
                <tbody>
                  {(recentBills || []).length === 0 ? <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: '#9e9e9e' }}>No bills</td></tr> :
                    recentBills.map(b => (
                      <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/billing', { state: { bookingId: b.bookingId, mode: 'view' } })}>
                        <td style={td}>{b.billNo}</td><td style={td}>{formatDate(b.date)}</td><td style={td}>{formatCurrency(b.amount)}</td><td style={td}>{formatCurrency(b.allocated)}</td><td style={td}>{formatCurrency(b.balance)}</td><td style={td}><StatusBadge status={b.paymentStatus} /></td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Payments */}
          <div style={{ background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Recent Payments</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: '#f5f5f5' }}>
                  <th style={th}>ID</th><th style={th}>Date</th><th style={th}>Mode</th><th style={th}>Amount</th><th style={th}>Allocated</th><th style={th}>Status</th>
                </tr></thead>
                <tbody>
                  {(recentPayments || []).length === 0 ? <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: '#9e9e9e' }}>No payments</td></tr> :
                    recentPayments.map(p => (
                      <tr key={p.id}>
                        <td style={td}>{p.id}</td><td style={td}>{formatDate(p.date)}</td><td style={td}>{p.mode}</td><td style={td}>{formatCurrency(p.amount)}</td><td style={td}>{formatCurrency(p.allocated)}</td><td style={td}><StatusBadge status={p.status} /></td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Receipts */}
          <div style={{ background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Recent Receipts</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: '#f5f5f5' }}>
                  <th style={th}>Receipt #</th><th style={th}>Date</th><th style={th}>Customer</th><th style={th}>Mode</th><th style={th}>Amount</th><th style={th}>Ref</th>
                </tr></thead>
                <tbody>
                  {(recentReceipts || []).length === 0 ? <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: '#9e9e9e' }}>No receipts</td></tr> :
                    recentReceipts.map(r => (
                      <tr key={r.id}>
                        <td style={td}>{r.entryNo}</td><td style={td}>{formatDate(r.date)}</td><td style={td}>{r.customerName}</td><td style={td}>{r.paymentMode}</td><td style={td}>{formatCurrency(r.amount)}</td><td style={td}>{r.refNumber || '-'}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ BOOKINGS TAB ═══ */}
      {activeTab === 'Bookings' && !tabLoading && (
        <div style={{ background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: 14 }}>All Bookings ({bookings.pagination.total})</h4>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#f5f5f5' }}>
                <th style={th}>ID</th><th style={th}>Date</th><th style={th}>From</th><th style={th}>To</th><th style={th}>Passengers</th><th style={th}>Status</th><th style={th}>Billing</th><th style={th}>Created</th>
              </tr></thead>
              <tbody>
                {bookings.data.length === 0 ? <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: '#9e9e9e' }}>No bookings found</td></tr> :
                  bookings.data.map(b => (
                    <tr key={b.id} style={{ cursor: 'pointer' }}>
                      <td style={td} onClick={() => navigate('/billing', { state: { bookingId: b.id, mode: 'view' } })}>{b.id}</td><td style={td} onClick={() => navigate('/billing', { state: { bookingId: b.id, mode: 'view' } })}>{formatDate(b.date)}</td><td style={td} onClick={() => navigate('/billing', { state: { bookingId: b.id, mode: 'view' } })}>{b.from}</td><td style={td} onClick={() => navigate('/billing', { state: { bookingId: b.id, mode: 'view' } })}>{b.to}</td><td style={td} onClick={() => navigate('/billing', { state: { bookingId: b.id, mode: 'view' } })}>{b.passengers}</td><td style={td} onClick={() => navigate('/billing', { state: { bookingId: b.id, mode: 'view' } })}><StatusBadge status={b.status} /></td>
                      <td style={td}>{b.hasBilling ? <button style={{ background: '#1565c0', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: 3, cursor: 'pointer', fontSize: 11 }} onClick={() => navigate('/billing', { state: { bookingId: b.id, mode: 'view' } })}>View Bill</button> : <span style={{ color: '#9e9e9e', fontSize: 11 }}>No bill</span>}</td>
                      <td style={td}>{formatDate(b.createdAt)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
          {bookings.pagination.pages > 1 && (
            <PaginationControls
              currentPage={bookings.pagination.page}
              totalPages={bookings.pagination.pages}
              totalRecords={bookings.pagination.total}
              onPageChange={(p) => fetchBookings(p)}
            />
          )}
        </div>
      )}

      {/* ═══ BILLS TAB ═══ */}
      {activeTab === 'Bills' && !tabLoading && (
        <div style={{ background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: 14 }}>All Bills ({bills.pagination.total})</h4>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#f5f5f5' }}>
                <th style={th}>Bill #</th><th style={th}>Date</th><th style={th}>Amount</th><th style={th}>Allocated</th><th style={th}>Balance</th><th style={th}>Payment Status</th><th style={th}>Bill Status</th>
              </tr></thead>
              <tbody>
                {bills.data.length === 0 ? <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: '#9e9e9e' }}>No bills found</td></tr> :
                  bills.data.map(b => (
                    <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/billing', { state: { bookingId: b.bookingId, mode: 'view' } })}>
                      <td style={td}>{b.billNo}</td><td style={td}>{formatDate(b.date)}</td><td style={td}>{formatCurrency(b.amount)}</td><td style={td}>{formatCurrency(b.allocated)}</td><td style={td}>{formatCurrency(b.balance)}</td><td style={td}><StatusBadge status={b.paymentStatus} /></td><td style={td}><StatusBadge status={b.status} /></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
          {bills.pagination.pages > 1 && (
            <PaginationControls
              currentPage={bills.pagination.page}
              totalPages={bills.pagination.pages}
              totalRecords={bills.pagination.total}
              onPageChange={(p) => fetchBills(p)}
            />
          )}
        </div>
      )}

      {/* ═══ RECEIPTS TAB ═══ */}
      {activeTab === 'Receipts' && !tabLoading && (
        <div style={{ background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: 14 }}>All Receipts ({receipts.pagination.total})</h4>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#f5f5f5' }}>
                <th style={th}>Receipt #</th><th style={th}>Date</th><th style={th}>Customer</th><th style={th}>Phone</th><th style={th}>Mode</th><th style={th}>Amount</th><th style={th}>Ref</th><th style={th}>Narration</th>
              </tr></thead>
              <tbody>
                {receipts.data.length === 0 ? <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: '#9e9e9e' }}>No receipts found</td></tr> :
                  receipts.data.map(r => (
                    <tr key={r.id}>
                      <td style={td}>{r.entryNo}</td><td style={td}>{formatDate(r.date)}</td><td style={td}>{r.customerName}</td><td style={td}>{r.phone || '-'}</td><td style={td}>{r.paymentMode}</td><td style={td}>{formatCurrency(r.amount)}</td><td style={td}>{r.refNumber || '-'}</td><td style={{ ...td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.narration}>{r.narration || '-'}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
          {receipts.pagination.pages > 1 && (
            <PaginationControls
              currentPage={receipts.pagination.page}
              totalPages={receipts.pagination.pages}
              totalRecords={receipts.pagination.total}
              onPageChange={(p) => fetchReceipts(p)}
            />
          )}
        </div>
      )}

      {/* ═══ PAYMENTS TAB ═══ */}
      {activeTab === 'Payments' && !tabLoading && (
        <div>
          {/* Payment method breakdown */}
          {(paymentStats.byMethod || []).length > 0 && (
            <div style={{ background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Payment Method Breakdown</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {paymentStats.byMethod.map((m, i) => (
                  <div key={i} style={{ background: '#f5f5f5', borderRadius: 6, padding: 12 }}>
                    <div style={{ fontSize: 12, color: '#757575', textTransform: 'uppercase' }}>{m.method}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1565c0' }}>{formatCurrency(m.amount)}</div>
                    <div style={{ fontSize: 11, color: '#9e9e9e' }}>{m.cnt} payments</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: 14 }}>All Payments ({payments.pagination.total})</h4>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: '#f5f5f5' }}>
                  <th style={th}>ID</th><th style={th}>Date</th><th style={th}>Mode</th><th style={th}>Amount</th><th style={th}>Allocated</th><th style={th}>Unallocated</th><th style={th}>Status</th><th style={th}>Created By</th>
                </tr></thead>
                <tbody>
                  {payments.data.length === 0 ? <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: '#9e9e9e' }}>No payments found</td></tr> :
                    payments.data.map(p => (
                      <tr key={p.id}>
                        <td style={td}>{p.id}</td><td style={td}>{formatDate(p.date)}</td><td style={td}>{p.mode}</td><td style={td}>{formatCurrency(p.amount)}</td><td style={td}>{formatCurrency(p.allocated)}</td><td style={td}>{formatCurrency(p.unallocated)}</td><td style={td}><StatusBadge status={p.status} /></td><td style={td}>{p.createdBy || '-'}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
            {payments.pagination.pages > 1 && (
              <PaginationControls
                currentPage={payments.pagination.page}
                totalPages={payments.pagination.pages}
                totalRecords={payments.pagination.total}
                onPageChange={(p) => fetchPayments(p)}
              />
            )}
          </div>
        </div>
      )}

      {/* ═══ LEDGER TAB ═══ */}
      {activeTab === 'Ledger' && !tabLoading && (
        <div style={{ background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Customer Ledger ({ledger.length} entries)</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#f5f5f5' }}>
                <th style={th}>Date</th><th style={th}>Type</th><th style={th}>Reference</th><th style={th} align="right">Debit</th><th style={th} align="right">Credit</th><th style={th} align="right">Balance</th><th style={th}>Remarks</th>
              </tr></thead>
              <tbody>
                {ledger.length === 0 ? <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: '#9e9e9e' }}>No ledger entries</td></tr> :
                  ledger.map(e => (
                    <tr key={e.id}>
                      <td style={td}>{formatDate(e.date)}</td>
                      <td style={td}><StatusBadge status={e.type} /></td>
                      <td style={td}>{e.referenceType}-{e.referenceId}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{e.debit > 0 ? formatCurrency(e.debit) : '-'}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{e.credit > 0 ? formatCurrency(e.credit) : '-'}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: e.balance > 0 ? '#c62828' : e.balance < 0 ? '#2e7d32' : '#616161' }}>{formatCurrency(Math.abs(e.balance))}{e.balance > 0 ? ' Dr' : e.balance < 0 ? ' Cr' : ''}</td>
                      <td style={{ ...td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.remarks}>{e.remarks || '-'}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          button, .pagination-controls { display: none !important; }
          body { font-size: 11px; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const th = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#424242', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' };
const td = { padding: '10px 12px', borderBottom: '1px solid #f0f0f0', color: '#424242' };

export default CustomerDetails;
