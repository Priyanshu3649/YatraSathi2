import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DynamicSidebar from './DynamicSidebar';
import AgentDashboard from './dashboards/AgentDashboard';
import AccountsDashboard from './dashboards/AccountsDashboard';
import HRDashboard from './dashboards/HRDashboard';
import CallCenterDashboard from './dashboards/CallCenterDashboard';
import MarketingDashboard from './dashboards/MarketingDashboard';
import ManagementDashboard from './dashboards/ManagementDashboard';
import '../../styles/employee-dashboard.css';

const EmployeeDashboard = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [navigation, setNavigation] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user info from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserInfo(user);
      
      // Set default navigation based on role
      const defaultNavigation = getDefaultNavigation(user.role);
      setNavigation(defaultNavigation);
    }
    setLoading(false);
  }, []);

  const getDefaultNavigation = (role) => {
    const navigationMap = {
      'AGT': [
        { name: 'Dashboard', path: '/employee/agent', icon: 'dashboard' },
        { name: 'My Bookings', path: '/employee/agent/bookings', icon: 'bookings' },
        { name: 'New Booking', path: '/employee/agent/new-booking', icon: 'add' },
        { name: 'Customer Search', path: '/employee/agent/customers', icon: 'search' }
      ],
      'ACC': [
        { name: 'Dashboard', path: '/employee/accounts', icon: 'dashboard' },
        { name: 'Payments', path: '/employee/accounts/payments', icon: 'payment' },
        { name: 'Aging Report', path: '/employee/accounts/aging', icon: 'report' },
        { name: 'Reconciliation', path: '/employee/accounts/reconciliation', icon: 'balance' }
      ],
      'HR': [
        { name: 'Dashboard', path: '/employee/hr', icon: 'dashboard' },
        { name: 'Employee Roster', path: '/employee/hr/roster', icon: 'people' },
        { name: 'Attendance', path: '/employee/hr/attendance', icon: 'calendar' },
        { name: 'Reports', path: '/employee/hr/reports', icon: 'report' }
      ],
      'CC': [
        { name: 'Dashboard', path: '/employee/callcenter', icon: 'dashboard' },
        { name: 'Open Tickets', path: '/employee/callcenter/tickets', icon: 'support' },
        { name: 'Customer Lookup', path: '/employee/callcenter/lookup', icon: 'search' },
        { name: 'Knowledge Base', path: '/employee/callcenter/kb', icon: 'book' }
      ],
      'MKT': [
        { name: 'Dashboard', path: '/employee/marketing', icon: 'dashboard' },
        { name: 'Corporate Clients', path: '/employee/marketing/clients', icon: 'business' },
        { name: 'Campaigns', path: '/employee/marketing/campaigns', icon: 'megaphone' },
        { name: 'Analytics', path: '/employee/marketing/analytics', icon: 'chart' }
      ],
      'MGT': [
        { name: 'Dashboard', path: '/employee/management', icon: 'dashboard' },
        { name: 'Financial Reports', path: '/employee/management/financial', icon: 'money' },
        { name: 'Performance', path: '/employee/management/performance', icon: 'trending' },
        { name: 'Analytics', path: '/employee/management/analytics', icon: 'chart' },
        { name: 'Admin Panel', path: '/admin', icon: 'settings' }
      ]
    };
    
    return navigationMap[role] || [];
  };

  const getDefaultRoute = () => {
    if (!userInfo) return '/employee/dashboard';
    
    const routeMap = {
      'AGT': '/employee/agent',
      'ACC': '/employee/accounts', 
      'HR': '/employee/hr',
      'CC': '/employee/callcenter',
      'MKT': '/employee/marketing',
      'MGT': '/employee/management'
    };
    
    return routeMap[userInfo.role] || '/employee/dashboard';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="employee-dashboard-container">
      <DynamicSidebar navigation={navigation} userInfo={userInfo} />
      
      <div className="dashboard-content">
        <Routes>
          <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
          <Route path="/agent" element={<AgentDashboard />} />
          <Route path="/accounts" element={<AccountsDashboard />} />
          <Route path="/hr" element={<HRDashboard />} />
          <Route path="/callcenter" element={<CallCenterDashboard />} />
          <Route path="/marketing" element={<MarketingDashboard />} />
          <Route path="/management" element={<ManagementDashboard />} />
        </Routes>
      </div>
    </div>
  );
};

export default EmployeeDashboard;