import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  return (
    <header className="header panel" style={{ marginBottom: '0' }}>
      <div className="container">
        <Link to="/" className="logo">
          <h1>YatraSathi</h1>
        </Link>
        <nav className="navigation">
          <ul>
            <li><Link to="/" className={isActive('/') ? 'active' : ''}>Home</Link></li>
            {user && (
              <>
                {/* Customer Navigation */}
                {user.us_roid === 'CUS' && (
                  <>
                    <li><Link to="/customer/dashboard" className={isActive('/customer/dashboard') ? 'active' : ''}>Dashboard</Link></li>
                    <li><Link to="/customer/booking/new" className={isActive('/customer/booking/new') ? 'active' : ''}>Book Ticket</Link></li>
                    <li><Link to="/customer/bookings" className={isActive('/customer/bookings') ? 'active' : ''}>My Bookings</Link></li>
                    <li><Link to="/customer/bills-payments" className={isActive('/customer/bills-payments') ? 'active' : ''}>Bills</Link></li>
                    <li><Link to="/customer/profile" className={isActive('/customer/profile') ? 'active' : ''}>Profile</Link></li>
                  </>
                )}
                
                {/* Employee/Admin Navigation */}
                {(user.us_usertype === 'admin' || user.us_usertype === 'employee' || user.us_roid === 'ADM' || user.us_roid === 'AGT' || user.us_roid === 'ACC' || user.us_roid === 'HR' || user.us_roid === 'CC' || user.us_roid === 'MKT' || user.us_roid === 'MGT') && (
                  <>
                    <li><Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>Dashboard</Link></li>
                    <li><Link to="/bookings" className={isActive('/bookings') ? 'active' : ''}>Bookings</Link></li>
                    <li><Link to="/travel-plans" className={isActive('/travel-plans') ? 'active' : ''}>Travel Plans</Link></li>
                    <li><Link to="/payments" className={isActive('/payments') ? 'active' : ''}>Payments</Link></li>
                    <li><Link to="/billing" className={isActive('/billing') ? 'active' : ''}>Billing</Link></li>
                    <li className="dropdown">
                      <span className={isActive('/reports') ? 'active' : ''}>Reports ▼</span>
                      <ul className="dropdown-menu">
                        <li><Link to="/reports?tab=bookings">Booking Reports</Link></li>
                        <li><Link to="/reports?tab=customerAnalytics">Customer Analytics</Link></li>
                        <li><Link to="/reports?tab=employeePerformance">Employee Performance</Link></li>
                        <li><Link to="/reports?tab=financial">Financial Reports</Link></li>
                        <li><Link to="/reports?tab=corporateCustomers">Corporate Customers</Link></li>
                      </ul>
                    </li>
                  </>
                )}
                
                {/* Admin Only Navigation */}
                {(user.us_usertype === 'admin' || user.us_roid === 'ADM') && (
                  <>
                    <li><Link to="/admin-dashboard" className={isActive('/admin-dashboard') ? 'active' : ''}>Admin Panel</Link></li>
                  </>
                )}
                
                {/* Common for all logged in users */}
                {user.us_roid !== 'CUS' && (
                  <li><Link to="/profile" className={isActive('/profile') ? 'active' : ''}>Profile</Link></li>
                )}
                
                <li>
                  <button onClick={handleLogout} className="btn btn-primary" style={{ marginLeft: '10px' }}>
                    Logout
                  </button>
                </li>
              </>
            )}
            {!user && (
              <>
                <li><Link to="/login" className={isActive('/login') ? 'active' : ''}>Login</Link></li>
                <li><Link to="/register" className={isActive('/register') ? 'active' : ''}>Register</Link></li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;