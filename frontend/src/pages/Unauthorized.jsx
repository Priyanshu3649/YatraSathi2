import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/vintage-erp-theme.css';

const Unauthorized = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  const handleGoHome = () => {
    navigate('/'); // Go to home page
  };

  return (
    <div className="erp-auth-container">
      <div className="erp-auth-card">
        {/* Title Bar */}
        <div className="erp-auth-title-bar">
          <div className="erp-auth-system-icon">🔒</div>
          <div className="erp-auth-title-text">Access Control System</div>
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
            <div className="erp-auth-logo-icon">⚠️</div>
          </div>

          {/* Header */}
          <div className="erp-auth-header">
            <h2>Access Denied</h2>
            <p>You don't have permission to access this resource</p>
          </div>

          {/* Error Panel */}
          <div className="erp-auth-form-panel">
            <div className="erp-auth-form-header">Authorization Error</div>

            <div className="erp-auth-message erp-auth-error-message" style={{ marginBottom: '20px' }}>
              <strong>403 Forbidden</strong><br />
              You do not have the necessary permissions to access this page.
            </div>

            <div className="erp-auth-form-group" style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleGoBack} 
                className="erp-auth-button erp-auth-button-secondary"
                style={{ flex: 1 }}
              >
                Go Back
              </button>
              <button 
                onClick={handleGoHome} 
                className="erp-auth-button erp-auth-button-primary"
                style={{ flex: 1 }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="erp-auth-status-bar">
          <div className="erp-auth-status-item">Security System</div>
          <div className="erp-auth-status-item">Access Control</div>
          <div className="erp-auth-status-panel">Access Denied</div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;