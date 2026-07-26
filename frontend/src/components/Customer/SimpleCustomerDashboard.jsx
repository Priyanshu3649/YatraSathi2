import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/vintage-erp-theme.css';
import '../../styles/dynamic-admin-panel.css';

const SimpleCustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    totalBilled: 0,
    outstandingAmount: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const fy = localStorage.getItem('financialYear');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(fy ? { 'X-Financial-Year': fy } : {}),
      };

      const res = await fetch('/api/customer/dashboard', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const s = data.data.stats || {};
          const f = data.data.financialSummary || {};
          setStats({
            totalBookings: s.totalBookings || 0,
            pendingBookings: s.activeBookings || s.pendingBookings || 0,
            confirmedBookings: s.confirmedBookings || 0,
            totalBilled: f.totalBilled || 0,
            outstandingAmount: f.outstandingAmount || 0,
          });
        }
      }

      // Fetch recent bookings
      const bkRes = await fetch('/api/customer/bookings?limit=5', { headers });
      if (bkRes.ok) {
        const bkData = await bkRes.json();
        if (bkData.success) {
          setRecentBookings((bkData.data?.bookings || []).slice(0, 5));
        }
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (s) => {
    const map = { DRF: 'Draft', REQUESTED: 'Pending', PND: 'Pending', CNF: 'Confirmed', CAN: 'Cancelled', CLOSED: 'Closed' };
    return map[s] || s || '—';
  };

  const userName = user
    ? `${user.us_fname || ''} ${user.us_lname || ''}`.trim() || user.us_email || 'Customer'
    : 'Customer';

  if (loading) {
    return (
      <div className="erp-admin-container">
        <div className="erp-menu-bar">
          <div className="erp-menu-item">YatraSathi Customer Portal</div>
          <div className="erp-user-info">Loading…</div>
        </div>
        <div className="erp-main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>Loading dashboard…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="erp-admin-container">
      {/* ── Menu Bar ── */}
      <div className="erp-menu-bar">
        <div className="erp-menu-item active" onClick={() => navigate('/customer/dashboard')}>Dashboard</div>
        <div className="erp-menu-item" onClick={() => navigate('/customer/booking/new')}>New Booking</div>
        <div className="erp-menu-item" onClick={() => navigate('/customer/bookings')}>My Bookings</div>
        <div className="erp-menu-item" onClick={() => navigate('/customer/bills-payments')}>Bills & Payments</div>
        <div className="erp-menu-item" onClick={() => navigate('/customer/master-passengers')}>Passenger List</div>
        <div className="erp-menu-item" onClick={() => navigate('/customer/profile')}>Profile</div>
        <div className="erp-user-info">{userName.toUpperCase()} 👤</div>
      </div>

      {/* ── Toolbar ── */}
      <div className="erp-toolbar">
        <button className="erp-button" onClick={() => navigate('/customer/booking/new')}>
          + New Booking
        </button>
        <div className="erp-tool-separator" />
        <button className="erp-button" onClick={() => navigate('/customer/bookings')}>My Bookings</button>
        <button className="erp-button" onClick={() => navigate('/customer/bills-payments')}>Bills & Payments</button>
        <button className="erp-button" onClick={() => navigate('/customer/master-passengers')}>Passenger List</button>
        <div className="erp-tool-separator" />
        <button className="erp-button" onClick={fetchDashboard}>Refresh</button>
      </div>

      {/* ── Main Content ── */}
      <div className="erp-main-content" style={{ flexDirection: 'column', overflowY: 'auto', padding: '8px' }}>

        {/* ── Summary Stats ── */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Bookings', value: stats.totalBookings, color: '#4169E1' },
            { label: 'Pending', value: stats.pendingBookings, color: '#e67e22' },
            { label: 'Confirmed', value: stats.confirmedBookings, color: '#27ae60' },
            { label: 'Total Billed', value: `₹${parseFloat(stats.totalBilled || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#8e44ad' },
            { label: 'Outstanding', value: `₹${parseFloat(stats.outstandingAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#c0392b' },
          ].map((item) => (
            <div key={item.label} className="erp-panel" style={{ flex: '1 1 160px', minWidth: '140px' }}>
              <div className="erp-panel-header" style={{ backgroundColor: item.color, fontSize: '11px' }}>
                {item.label}
              </div>
              <div style={{ padding: '8px 12px', fontSize: '18px', fontWeight: 'bold', color: item.color, textAlign: 'center' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Recent Bookings ── */}
        <div className="erp-panel" style={{ marginBottom: '8px' }}>
          <div className="erp-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Recent Bookings</span>
            <button
              className="erp-button"
              style={{ fontSize: '10px', padding: '2px 8px', marginLeft: '8px' }}
              onClick={() => navigate('/customer/bookings')}
            >
              View All →
            </button>
          </div>
          {recentBookings.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#808080', fontSize: '12px' }}>
              No bookings yet.{' '}
              <span
                style={{ color: '#4169E1', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => navigate('/customer/booking/new')}
              >
                Create your first booking
              </span>
            </div>
          ) : (
            <div className="erp-grid-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <table className="erp-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>Date</th>
                    <th>Passengers</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((bk, i) => (
                    <tr
                      key={bk.bk_bkid}
                      className={i % 2 === 0 ? 'erp-row-even' : 'erp-row-odd'}
                      style={{ cursor: 'pointer' }}
                      onDoubleClick={() => navigate(`/customer/bookings/${bk.bk_bkid}`)}
                    >
                      <td>{bk.bk_fromst || bk.bk_from || '—'}</td>
                      <td>{bk.bk_tost || bk.bk_to || '—'}</td>
                      <td>{bk.bk_trvldt ? new Date(bk.bk_trvldt).toLocaleDateString('en-IN') : '—'}</td>
                      <td>{bk.bk_pax || bk.totalPassengers || 0}</td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '1px 6px',
                          backgroundColor: bk.bk_status === 'CNF' ? '#27ae60' : bk.bk_status === 'CAN' ? '#c0392b' : '#e67e22',
                          color: '#fff', fontSize: '10px', fontWeight: 'bold',
                        }}>
                          {getStatusLabel(bk.bk_status)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="erp-button"
                          style={{ fontSize: '10px', padding: '1px 6px' }}
                          onClick={() => navigate(`/customer/bookings/${bk.bk_bkid}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Quick Actions ── */}
        <div className="erp-panel">
          <div className="erp-panel-header">Quick Actions</div>
          <div style={{ display: 'flex', gap: '8px', padding: '8px', flexWrap: 'wrap' }}>
            {[
              { label: '+ New Booking', path: '/customer/booking/new', title: 'Submit a new travel booking request' },
              { label: 'My Bookings', path: '/customer/bookings', title: 'View and track your booking requests' },
              { label: 'Bills & Payments', path: '/customer/bills-payments', title: 'View bills and payment history' },
              { label: 'Passenger List', path: '/customer/master-passengers', title: 'Manage your saved passenger profiles' },
              { label: 'My Profile', path: '/customer/profile', title: 'Update your account details' },
            ].map((a) => (
              <button
                key={a.path}
                className="erp-button erp-primary-button"
                title={a.title}
                style={{ minWidth: '140px' }}
                onClick={() => navigate(a.path)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div className="erp-status-bar">
        <div className="erp-status-item">Customer Portal</div>
        <div className="erp-status-item">{userName}</div>
        <div className="erp-status-item">Bookings: {stats.totalBookings}</div>
        <div className="erp-status-panel">Ready</div>
      </div>
    </div>
  );
};

export default SimpleCustomerDashboard;
