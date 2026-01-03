import React, { useState } from 'react';
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
                  value={formData.email}
                  onChange={handleChange}
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
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  disabled={loading}
                  className="erp-auth-form-input"
                />
              </div>

              <div className="erp-auth-form-group" style={{ marginTop: '20px' }}>
                <button 
                  type="submit" 
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
                <a href="/auth/forgot-password">Forgot your password?</a>
              </p>
              <p>
                Don't have an account? <a href="/auth/register">Sign up here</a>
              </p>
              <p>
                Employee? <a href="/auth/employee-login">Login here</a>
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