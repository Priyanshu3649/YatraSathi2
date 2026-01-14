import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import '../styles/erp-auth-theme.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

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
      let data;
      
      // Try employee login first (for admins and employees)
      try {
        data = await authAPI.employeeLogin(formData.email, formData.password);
      } catch (employeeError) {
        // If employee login fails, try customer login
        try {
          data = await authAPI.customerLogin(formData.email, formData.password);
        } catch (customerError) {
          // Both failed, throw the customer error
          throw customerError;
        }
      }

      if (data.success) {
        // Create user object with all necessary fields
        const userObject = {
          us_usid: data.data.user.id,
          us_fname: data.data.user.name,
          us_email: data.data.user.email,
          us_usertype: data.data.user.us_usertype,
          us_roid: data.data.user.role,
          department: data.data.user.department
        };
        
        // Update auth context
        login(data.data.token, userObject);
        
        // Store session ID in localStorage if present
        if (data.data.sessionId) {
          localStorage.setItem('sessionId', data.data.sessionId);
        }

        // Redirect based on role
        const role = data.data.user.role;
        
        if (role === 'ADM') {
          navigate('/admin-dashboard');
        } else if (['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT'].includes(role)) {
          // Navigate to role-specific employee dashboard
          switch (role) {
            case 'AGT':
              navigate('/employee/agent');
              break;
            case 'ACC':
              navigate('/employee/accounts');
              break;
            case 'HR':
              navigate('/employee/hr');
              break;
            case 'CC':
              navigate('/employee/callcenter');
              break;
            case 'MKT':
              navigate('/employee/marketing');
              break;
            case 'MGT':
              navigate('/employee/management');
              break;
            default:
              navigate('/employee/dashboard');
          }
        } else {
          // Default to customer dashboard
          navigate('/customer/dashboard');
        }
      } else {
        setError(data.error?.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="erp-auth-container">
      <div className="erp-auth-card">
        {/* Title Bar */}
        <div className="erp-auth-title-bar">
          <div className="erp-auth-system-icon">🔐</div>
          <div className="erp-auth-title-text">Unified Authentication System</div>
          <button className="erp-auth-close-button">×</button>
        </div>

        {/* Menu Bar */}
        <div className="erp-auth-menu-bar">
          <div className="erp-auth-menu-item">File</div>
          <div className="erp-auth-menu-item">Edit</div>
          <div className="erp-auth-menu-item">View</div>
          <div className="erp-auth-menu-item">Tools</div>
          <div className="erp-auth-menu-item">Help</div>
        </div>

        {/* Main Content */}
        <div className="erp-auth-content">
          {/* Logo Section */}
          <div className="erp-auth-logo">
            <div className="erp-auth-logo-icon">YATRA</div>
          </div>

          {/* Header */}
          <div className="erp-auth-header">
            <h2>Unified Login Portal</h2>
            <p>Access your account with our vintage authentication system</p>
          </div>

          {/* Form Panel */}
          <div className="erp-auth-form-panel">
            <div className="erp-auth-form-header">Authentication Credentials</div>

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
                  placeholder="Enter your email address"
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
                    <span className="erp-auth-loading">Authenticating...</span>
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
                Need an account? <a href="/register">Register here</a>
              </p>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="erp-auth-status-bar">
          <div className="erp-auth-status-item">Unified Portal</div>
          <div className="erp-auth-status-item">Version 1.0</div>
          <div className="erp-auth-status-panel">Ready</div>
        </div>
      </div>
    </div>
  );
};

export default Login;