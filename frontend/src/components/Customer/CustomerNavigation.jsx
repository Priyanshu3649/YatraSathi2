import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const CustomerNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/customer/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/customer/bookings', label: 'My Requests', icon: '📋' },
    { path: '/customer/bills-payments', label: 'My Payments', icon: '💰' },
    { path: '/customer/profile', label: 'My Profile', icon: '👤' }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  return (
    <nav className="customer-navigation">
      <div className="nav-brand">
        <h3>YatraSathi</h3>
        <p>Customer Portal</p>
      </div>
      
      <ul className="nav-menu">
        {navItems.map((item) => (
          <li key={item.path} className="nav-item">
            <button
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
      
      <div className="nav-footer">
        <button className="nav-logout" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default CustomerNavigation;