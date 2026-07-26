import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AgentDashboard from './dashboards/AgentDashboard';
import AccountsDashboard from './dashboards/AccountsDashboard';
import HRDashboard from './dashboards/HRDashboard';
import CallCenterDashboard from './dashboards/CallCenterDashboard';
import MarketingDashboard from './dashboards/MarketingDashboard';
import ManagementDashboard from './dashboards/ManagementDashboard';
import '../../styles/vintage-erp-theme.css';
import '../../styles/dynamic-admin-panel.css';

const NAV_MAP = {
  AGT: [
    { label: 'Dashboard', path: '/employee/agent' },
    { label: 'My Bookings', path: '/employee/agent/bookings' },
    { label: 'New Booking', path: '/employee/agent/new-booking' },
    { label: 'Customer Search', path: '/employee/agent/customers' },
  ],
  ACC: [
    { label: 'Dashboard', path: '/employee/accounts' },
    { label: 'Payments', path: '/employee/accounts/payments' },
    { label: 'Aging Report', path: '/employee/accounts/aging' },
    { label: 'Reconciliation', path: '/employee/accounts/reconciliation' },
  ],
  HR: [
    { label: 'Dashboard', path: '/employee/hr' },
    { label: 'Employee Roster', path: '/employee/hr/roster' },
    { label: 'Attendance', path: '/employee/hr/attendance' },
    { label: 'Reports', path: '/employee/hr/reports' },
  ],
  CC: [
    { label: 'Dashboard', path: '/employee/callcenter' },
    { label: 'Open Tickets', path: '/employee/callcenter/tickets' },
    { label: 'Customer Lookup', path: '/employee/callcenter/lookup' },
    { label: 'Knowledge Base', path: '/employee/callcenter/kb' },
  ],
  MKT: [
    { label: 'Dashboard', path: '/employee/marketing' },
    { label: 'Corporate Clients', path: '/employee/marketing/clients' },
    { label: 'Campaigns', path: '/employee/marketing/campaigns' },
    { label: 'Analytics', path: '/employee/marketing/analytics' },
  ],
  MGT: [
    { label: 'Dashboard', path: '/employee/management' },
    { label: 'Financial Reports', path: '/employee/management/financial' },
    { label: 'Performance', path: '/employee/management/performance' },
    { label: 'Analytics', path: '/employee/management/analytics' },
    { label: 'Admin Panel', path: '/admin-dashboard' },
  ],
};

const ROLE_LABELS = {
  AGT: 'Travel Agent', ACC: 'Accounts', HR: 'Human Resources',
  CC: 'Call Centre', MKT: 'Marketing', MGT: 'Management',
};

const DEFAULT_ROUTE = {
  AGT: '/employee/agent', ACC: '/employee/accounts', HR: '/employee/hr',
  CC: '/employee/callcenter', MKT: '/employee/marketing', MGT: '/employee/management',
};

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  const role = user.us_roid || 'AGT';
  const navItems = NAV_MAP[role] || NAV_MAP.AGT;
  const defaultRoute = DEFAULT_ROUTE[role] || '/employee/agent';
  const userName = `${user.us_fname || ''} ${user.us_lname || ''}`.trim() || user.us_email || 'Employee';
  const roleLabel = ROLE_LABELS[role] || role;

  const handleLogout = async () => {
    try { await logout(); } catch (_) {}
    navigate('/login');
  };

  return (
    <div className="erp-admin-container">
      {/* ── Menu Bar ── */}
      <div className="erp-menu-bar">
        <div className="erp-menu-item" style={{ fontWeight: 'bold', letterSpacing: '1px' }}>
          YatraSathi — Employee Portal
        </div>
        {navItems.map(item => (
          <div
            key={item.path}
            className={`erp-menu-item ${location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </div>
        ))}
        <div className="erp-user-info">{userName.toUpperCase()} [{role}]</div>
      </div>

      {/* ── Toolbar ── */}
      <div className="erp-toolbar">
        <button className="erp-button" onClick={() => navigate(defaultRoute)}>🏠 Home</button>
        <div className="erp-tool-separator" />
        {navItems.slice(0, 4).map(item => (
          <button key={item.path} className="erp-button" onClick={() => navigate(item.path)}>
            {item.label}
          </button>
        ))}
        <div className="erp-tool-separator" />
        <button className="erp-button" style={{ color: '#c0392b' }} onClick={handleLogout}>Logout</button>
      </div>

      {/* ── Main Content (sidebar + content) ── */}
      <div className="erp-main-content">
        {/* Left nav sidebar */}
        <div className="erp-nav-sidebar">
          <div className="erp-nav-section">
            <div className="erp-nav-item" style={{ fontWeight: 'bold', color: '#4169E1', cursor: 'default' }}>
              {roleLabel}
            </div>
            {navItems.map(item => (
              <div
                key={item.path}
                className={`erp-nav-item sub-item ${location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </div>
            ))}
          </div>
          <div className="erp-nav-section" style={{ marginTop: 'auto' }}>
            <div className="erp-nav-item sub-item" onClick={() => navigate('/admin-dashboard')}>
              Admin Panel
            </div>
            <div className="erp-nav-item sub-item" onClick={() => navigate('/profile')}>
              My Profile
            </div>
            <div className="erp-nav-item sub-item" style={{ color: '#c0392b' }} onClick={handleLogout}>
              Logout
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="erp-center-content" style={{ overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Navigate to={defaultRoute} replace />} />
            <Route path="/agent" element={<AgentDashboard />} />
            <Route path="/accounts" element={<AccountsDashboard />} />
            <Route path="/hr" element={<HRDashboard />} />
            <Route path="/callcenter" element={<CallCenterDashboard />} />
            <Route path="/marketing" element={<MarketingDashboard />} />
            <Route path="/management" element={<ManagementDashboard />} />
          </Routes>
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div className="erp-status-bar">
        <div className="erp-status-item">Employee Portal</div>
        <div className="erp-status-item">{roleLabel}</div>
        <div className="erp-status-item">{userName}</div>
        <div className="erp-status-panel">Ready</div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
