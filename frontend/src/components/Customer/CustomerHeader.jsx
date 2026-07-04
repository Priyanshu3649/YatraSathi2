import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { sessionAPI } from '../../services/api';
import '../../styles/header.css';

const CustomerHeader = () => {
  const { 
    user, 
    logout, 
    selectedFinancialYear, 
    selectFinancialYear, 
    availableFinancialYears, 
    setAvailableFinancialYears 
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && availableFinancialYears.length === 0) {
      sessionAPI.getAvailableYears()
        .then(res => {
          if (res.success) {
            setAvailableFinancialYears(res.data);
          }
        })
        .catch(err => console.error('Failed to fetch years in CustomerHeader:', err));
    }
  }, [user, availableFinancialYears.length, setAvailableFinancialYears]);

  const handleSwitchFY = async (fy) => {
    try {
      const res = await sessionAPI.selectYear(fy);
      if (res.success) {
        selectFinancialYear(fy);
        // Force full page reload to clear cached page states
        window.location.reload();
      }
    } catch (err) {
      alert(err.message || 'Failed to switch financial year');
    }
  };

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
            {user && selectedFinancialYear && (
              <li style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
                <span style={{ marginRight: '5px', fontWeight: 'bold', fontSize: '11px', color: '#000' }}>Session:</span>
                <select
                  value={selectedFinancialYear}
                  onChange={(e) => handleSwitchFY(e.target.value)}
                  className="form-control"
                  style={{ 
                    width: '90px', 
                    height: '22px', 
                    fontSize: '11px',
                    padding: '0 2px',
                    backgroundColor: '#fff',
                    border: '1px solid #000',
                    boxShadow: '1px 1px 0px #808080 inset',
                    color: '#000'
                  }}
                >
                  {availableFinancialYears.map(fy => (
                    <option key={fy.fy_id} value={fy.fy_name}>{fy.fy_name}</option>
                  ))}
                </select>
              </li>
            )}
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