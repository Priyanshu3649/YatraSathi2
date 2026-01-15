import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/header.css';

const CustomerHeader = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
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
        <Link to="/customer/dashboard" className="logo">
          <h1>YatraSathi</h1>
        </Link>
        <nav className="navigation">
          <ul>
            <li><Link to="/customer/dashboard" className={isActive('/customer/dashboard') ? 'active' : ''}>Dashboard</Link></li>
            <li><Link to="/customer/booking/new" className={isActive('/customer/booking/new') ? 'active' : ''}>Book Ticket</Link></li>
            <li><Link to="/customer/bookings" className={isActive('/customer/bookings') ? 'active' : ''}>My Bookings</Link></li>
            <li><Link to="/customer/bills-payments" className={isActive('/customer/bills-payments') ? 'active' : ''}>Bills</Link></li>
            <li><Link to="/customer/master-passengers" className={isActive('/customer/master-passengers') ? 'active' : ''}>Passenger List</Link></li>
            <li><Link to="/customer/profile" className={isActive('/customer/profile') ? 'active' : ''}>Profile</Link></li>
            <li>
              <button onClick={handleLogout} className="btn btn-primary" style={{ marginLeft: '10px' }}>
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default CustomerHeader;