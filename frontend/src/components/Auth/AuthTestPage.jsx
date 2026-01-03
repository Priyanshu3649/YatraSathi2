import React, { useState } from 'react';
import '../../styles/erp-auth-theme.css';

const AuthTestPage = () => {
  const [activeDemo, setActiveDemo] = useState('employee');
  const [formData, setFormData] = useState({
    email: 'test@example.com',
    password: 'password123'
  });
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 2000);
  };

  const toggleError = () => {
    setShowError(!showError);
    if (showSuccess) setShowSuccess(false);
  };

  const toggleSuccess = () => {
    setShowSuccess(!showSuccess);
    if (showError) setShowError(false);
  };

  const renderEmployeeLogin = () => (
    <div className="erp-auth-container">
      <div className="erp-auth-card">
        {/* Title Bar */}
        <div className="erp-auth-title-bar">
          <div className="erp-auth-system-icon">👤</div>
          <div className="erp-auth-title-text">Employee Authentication System</div>
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
            <div className="erp-auth-logo-icon">EMP</div>
          </div>

          {/* Header */}
          <div className="erp-auth-header">
            <h2>Employee Login</h2>
            <p>Access your employee dashboard and management tools</p>
          </div>

          {/* Form Panel */}
          <div className="erp-auth-form-panel">
            <div className="erp-auth-form-header">Login Credentials</div>

            <form onSubmit={handleSubmit} className="erp-auth-form">
              {showError && (
                <div className="erp-auth-message erp-auth-error-message">
                  Invalid email or password. Please try again.
                </div>
              )}

              {showSuccess && (
                <div className="erp-auth-message erp-auth-success-message">
                  Login successful! Redirecting to dashboard...
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
                  placeholder="Enter your work email"
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
                <a href="#forgot">Forgot your password?</a>
              </p>
              <p>
                Customer? <a href="#customer">Login here</a>
              </p>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="erp-auth-status-bar">
          <div className="erp-auth-status-item">Employee Portal</div>
          <div className="erp-auth-status-item">Version 1.0</div>
          <div className="erp-auth-status-panel">Ready</div>
        </div>
      </div>
    </div>
  );

  const renderCustomerLogin = () => (
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
              {showError && (
                <div className="erp-auth-message erp-auth-error-message">
                  Invalid email or password. Please try again.
                </div>
              )}

              {showSuccess && (
                <div className="erp-auth-message erp-auth-success-message">
                  Login successful! Redirecting to dashboard...
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
                <a href="#forgot">Forgot your password?</a>
              </p>
              <p>
                Don't have an account? <a href="#register">Sign up here</a>
              </p>
              <p>
                Employee? <a href="#employee">Login here</a>
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

  return (
    <div style={{ padding: '20px', background: '#f0f0f0', minHeight: '100vh' }}>
      {/* Test Controls */}
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        marginBottom: '20px', 
        border: '1px solid #ccc',
        borderRadius: '4px'
      }}>
        <h2>ERP Authentication Theme Test Page</h2>
        <p>Use the controls below to test different states and components:</p>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ marginRight: '10px' }}>Demo Type:</label>
          <button 
            onClick={() => setActiveDemo('employee')}
            style={{ 
              marginRight: '10px', 
              padding: '5px 10px',
              background: activeDemo === 'employee' ? '#4169E1' : '#f0f0f0',
              color: activeDemo === 'employee' ? 'white' : 'black',
              border: '1px solid #ccc'
            }}
          >
            Employee Login
          </button>
          <button 
            onClick={() => setActiveDemo('customer')}
            style={{ 
              padding: '5px 10px',
              background: activeDemo === 'customer' ? '#4169E1' : '#f0f0f0',
              color: activeDemo === 'customer' ? 'white' : 'black',
              border: '1px solid #ccc'
            }}
          >
            Customer Login
          </button>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ marginRight: '10px' }}>Test States:</label>
          <button 
            onClick={toggleError}
            style={{ 
              marginRight: '10px', 
              padding: '5px 10px',
              background: showError ? '#cc0000' : '#f0f0f0',
              color: showError ? 'white' : 'black',
              border: '1px solid #ccc'
            }}
          >
            Toggle Error
          </button>
          <button 
            onClick={toggleSuccess}
            style={{ 
              marginRight: '10px', 
              padding: '5px 10px',
              background: showSuccess ? '#008000' : '#f0f0f0',
              color: showSuccess ? 'white' : 'black',
              border: '1px solid #ccc'
            }}
          >
            Toggle Success
          </button>
          <button 
            onClick={() => setLoading(!loading)}
            style={{ 
              padding: '5px 10px',
              background: loading ? '#ff8800' : '#f0f0f0',
              color: loading ? 'white' : 'black',
              border: '1px solid #ccc'
            }}
          >
            Toggle Loading
          </button>
        </div>

        <div>
          <strong>Current State:</strong> 
          {loading && ' Loading'} 
          {showError && ' Error'} 
          {showSuccess && ' Success'}
          {!loading && !showError && !showSuccess && ' Normal'}
        </div>
      </div>

      {/* Demo Component */}
      {activeDemo === 'employee' ? renderEmployeeLogin() : renderCustomerLogin()}
    </div>
  );
};

export default AuthTestPage;