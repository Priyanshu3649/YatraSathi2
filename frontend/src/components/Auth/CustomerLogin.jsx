import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { sessionAPI } from '../../services/api';
import '../../styles/erp-auth-theme.css';

const CustomerLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, selectFinancialYear } = useAuth();

  // Keyboard navigation
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const submitRef = useRef(null);
  const fields = [emailRef, passwordRef, submitRef];

  const focusField = useCallback((index) => {
    const ref = fields[index];
    if (ref?.current) ref.current.focus();
  }, []);

  useEffect(() => { focusField(0); }, [focusField]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.target === submitRef.current || e.target === passwordRef.current) {
        // Trigger form submit
        const form = e.target.closest('form');
        if (form) form.requestSubmit();
      } else {
        const idx = fields.findIndex(r => r.current === e.target);
        if (idx >= 0 && idx < fields.length - 1) focusField(idx + 1);
      }
    }
  }, [focusField]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const pickCurrentFY = (fyList, serverCurrentFY) => {
    if (serverCurrentFY && fyList.find(f => f.fy_name === serverCurrentFY)) {
      return serverCurrentFY;
    }
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const startYear = month >= 4 ? year : year - 1;
    const endYear = (startYear + 1) % 100;
    const label = `${startYear}-${String(endYear).padStart(2, '0')}`;
    const match = fyList.find(f => f.fy_name === label);
    if (match) return match.fy_name;
    return fyList[fyList.length - 1]?.fy_name || null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        const token = data.token || data.data?.token;
        const rawUser = data.user || data.data?.user || data;
        
        const userObject = {
          us_usid: rawUser.id || rawUser.us_usid || data.id,
          us_fname: rawUser.name || rawUser.us_fname || data.name || 'Customer',
          us_email: rawUser.email || rawUser.us_email || data.email,
          us_phone: rawUser.phone || rawUser.us_phone || '',
          us_usertype: rawUser.us_usertype || 'customer',
          us_roid: rawUser.role || rawUser.us_roid || 'CUS',
          userType: 'customer',
          role: 'CUS'
        };

        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userObject));
        if (data.sessionId || data.data?.sessionId) {
          localStorage.setItem('sessionId', data.sessionId || data.data?.sessionId);
        }

        // Fetch available FYs and auto-select current FY
        try {
          const fyRes = await sessionAPI.getAvailableYears();
          const fyList = (fyRes.success && fyRes.data?.length > 0) ? fyRes.data : [];
          const chosenFY = pickCurrentFY(fyList, fyRes.currentFY);

          if (chosenFY) {
            await sessionAPI.selectYear(chosenFY);
            localStorage.setItem('financialYear', chosenFY);
            if (typeof selectFinancialYear === 'function') selectFinancialYear(chosenFY);
          }
        } catch (fyErr) {
          console.warn('FY selection during customer login fallback:', fyErr.message);
        }

        if (typeof login === 'function') {
          login(token, userObject);
        }

        // Redirect to customer dashboard
        navigate('/customer/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="erp-auth-container">
      <div className="erp-auth-card">
        {/* Title Bar */}
        <div className="erp-auth-title-bar">
          <div className="erp-auth-system-icon">🎫</div>
          <div className="erp-auth-title-text">Customer Authentication System</div>
          <button className="erp-auth-close-button">×</button>
        </div>

        {/* Menu Bar */}
        <div className="erp-auth-menu-bar">
          <div className="erp-auth-menu-item">File</div>
          <div className="erp-auth-menu-item">Edit</div>
          <div className="erp-auth-menu-item">View</div>
          <div className="erp-auth-menu-item">Booking</div>
          <div className="erp-auth-menu-item">Help</div>
        </div>

        {/* Main Content */}
        <div className="erp-auth-content">
          {/* Logo Section */}
          <div className="erp-auth-logo">
            <div className="erp-auth-logo-icon">CUS</div>
          </div>

          {/* Header */}
          <div className="erp-auth-header">
            <h2>Customer Login</h2>
            <p>Access your travel bookings and plans</p>
          </div>

          {/* Form Panel */}
          <div className="erp-auth-form-panel">
            <div className="erp-auth-form-header">Login Credentials</div>

            <form onSubmit={handleSubmit} className="erp-auth-form">
              {error && (
                <div className="erp-auth-message erp-auth-error-message">
                  {error}
                </div>
              )}

              <div className="erp-auth-form-group">
                <label htmlFor="email" className="erp-auth-form-label required">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  ref={emailRef}
                  value={formData.email}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  required
                  placeholder="Enter your email"
                  disabled={loading}
                  className="erp-auth-form-input"
                />
              </div>

              <div className="erp-auth-form-group">
                <label htmlFor="password" className="erp-auth-form-label required">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  ref={passwordRef}
                  value={formData.password}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  required
                  placeholder="Enter your password"
                  disabled={loading}
                  className="erp-auth-form-input"
                />
              </div>

              <div className="erp-auth-form-group" style={{ marginTop: '20px' }}>
                <button 
                  ref={submitRef}
                  type="submit" 
                  onKeyDown={handleKeyDown}
                  className="erp-auth-button erp-auth-button-primary"
                  disabled={loading}
                  style={{ width: '100%' }}
                >
                  {loading ? (
                    <span className="erp-auth-loading">Signing In...</span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>
            </form>

            <div className="erp-auth-footer">
              <p>
                <a href="/forgot-password">Forgot your password?</a>
              </p>
              <p>
                Don't have an account? <a href="/register">Sign up here</a>
              </p>
              <p>
                Employee? <a href="/login">Login here</a>
              </p>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="erp-auth-status-bar">
          <div className="erp-auth-status-item">Customer Portal</div>
          <div className="erp-auth-status-item">Version 1.0</div>
          <div className="erp-auth-status-panel">Ready</div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;