import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/erp-auth-theme.css';

const CustomerLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          id: data.id,
          name: data.name,
          email: data.email,
          userType: data.us_usertype
        }));
        localStorage.setItem('sessionId', data.sessionId);

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