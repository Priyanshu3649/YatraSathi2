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
                <li><Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>Dashboard</Link></li>
                <li><Link to="/bookings" className={isActive('/bookings') ? 'active' : ''}>Bookings</Link></li>
                <li><Link to="/travel-plans" className={isActive('/travel-plans') ? 'active' : ''}>Travel Plans</Link></li>
                <li><Link to="/payments" className={isActive('/payments') ? 'active' : ''}>Payments</Link></li>
                {(user.us_usertype === 'admin' || user.us_usertype === 'employee') && (
                  <li><Link to="/reports" className={isActive('/reports') ? 'active' : ''}>Reports</Link></li>
                )}
                {user.us_usertype === 'admin' && (
                  <>
                    <li><Link to="/employees" className={isActive('/employees') ? 'active' : ''}>Employees</Link></li>
                    <li><Link to="/admin-dashboard" className={isActive('/admin-dashboard') ? 'active' : ''}>Admin Dashboard</Link></li>
                    <li><Link to="/vintage-admin" className={isActive('/vintage-admin') ? 'active' : ''}>Vintage Admin</Link></li>
                  </>
                )}
                <li><Link to="/sample-layout" className={isActive('/sample-layout') ? 'active' : ''}>Sample Layout</Link></li>
                <li><Link to="/profile" className={isActive('/profile') ? 'active' : ''}>Profile</Link></li>
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