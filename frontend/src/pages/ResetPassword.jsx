import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/vintage-login.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  
  const [formData, setFormData] = useState({
    token: tokenFromUrl,
    newPassword: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const { token, newPassword, confirmPassword } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validatePassword = () => {
    if (!token) {
      setError('Reset token is required');
      return false;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await authAPI.resetPassword(token, newPassword);
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vintage-login-container">
      <div className="vintage-login-window">
        {/* Title Bar */}
        <div className="vintage-title-bar">
          <div className="title-bar-text">
            <span className="title-icon">🔒</span>
            YatraSathi - Reset Password
          </div>
          <div className="title-bar-controls">
            <button className="title-bar-button" aria-label="Minimize">_</button>
            <button className="title-bar-button" aria-label="Maximize">□</button>
            <button className="title-bar-button close" aria-label="Close">×</button>
          </div>
        </div>

        {/* Menu Bar */}
        <div className="vintage-menu-bar">
          <span className="menu-item">File</span>
          <span className="menu-item">Edit</span>
          <span className="menu-item">View</span>
          <span className="menu-item">Help</span>
        </div>

        {/* Content Area */}
        <div className="vintage-login-content">
          <div className="login-panel">
            <div className="panel-header">
              <h2>Reset Your Password</h2>
              <p>Enter your reset token and new password</p>
            </div>
            
            {error && (
              <div className="vintage-error-box">
                <span className="error-icon">⚠</span>
                <span className="error-text">{error}</span>
              </div>
            )}

            {success && (
              <div className="vintage-success-box">
                <span className="success-icon">✓</span>
                <div className="success-content">
                  <strong>Password reset successful!</strong>
                  <p>Your password has been updated. Redirecting to login page...</p>
                </div>
              </div>
            )}
            
            {!success && (
              <form onSubmit={onSubmit} className="vintage-login-form">
                <div className="vintage-form-group">
                  <label htmlFor="token" className="vintage-label">
                    Reset Token:
                  </label>
                  <input
                    type="text"
                    id="token"
                    name="token"
                    value={token}
                    onChange={onChange}
                    required
                    className="vintage-input"
                    placeholder="Enter reset token from email"
                  />
                  <span className="field-hint">
                    Copy the token from the email you received
                  </span>
                </div>

                <div className="vintage-form-group">
                  <label htmlFor="newPassword" className="vintage-label">
                    New Password:
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={newPassword}
                    onChange={onChange}
                    required
                    className="vintage-input"
                    placeholder="Enter new password"
                  />
                  <span className="field-hint">
                    Minimum 6 characters
                  </span>
                </div>

                <div className="vintage-form-group">
                  <label htmlFor="confirmPassword" className="vintage-label">
                    Confirm Password:
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={onChange}
                    required
                    className="vintage-input"
                    placeholder="Re-enter new password"
                  />
                </div>

                <div className="vintage-form-actions">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="vintage-button primary"
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                  <Link to="/login">
                    <button type="button" className="vintage-button">
                      Cancel
                    </button>
                  </Link>
                </div>
              </form>
            )}

            {success && (
              <div className="vintage-form-actions" style={{ marginTop: '20px' }}>
                <Link to="/login">
                  <button type="button" className="vintage-button primary">
                    Go to Login
                  </button>
                </Link>
              </div>
            )}

            <div className="vintage-login-links">
              <Link to="/forgot-password" className="vintage-link">
                <span className="link-icon">🔑</span>
                Request new reset link
              </Link>
              <Link to="/login" className="vintage-link">
                <span className="link-icon">🔐</span>
                Back to login
              </Link>
            </div>
          </div>

          {/* Info Panel */}
          <div className="info-panel">
            <div className="info-box">
              <div className="info-header">Password Requirements</div>
              <div className="info-content">
                <p>Your new password must:</p>
                <p>✓ Be at least 6 characters long</p>
                <p>✓ Match the confirmation field</p>
                <p>✓ Be different from old password</p>
                <p>✓ Not contain your email address</p>
              </div>
            </div>

            <div className="info-box">
              <div className="info-header">Security Tips</div>
              <div className="info-content">
                <p>• Use a strong, unique password</p>
                <p>• Mix letters, numbers & symbols</p>
                <p>• Don't reuse old passwords</p>
                <p>• Keep your password secure</p>
              </div>
            </div>

            <div className="info-box">
              <div className="info-header">Token Information</div>
              <div className="info-content">
                <p><strong>Valid for:</strong> 1 hour</p>
                <p><strong>Usage:</strong> One-time only</p>
                <p><strong>Source:</strong> Email link</p>
                <p>Expired? Request a new one</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="vintage-status-bar">
          <div className="status-section">
            <span className="status-icon">●</span>
            Ready
          </div>
          <div className="status-section">
            Module: Password Reset
          </div>
          <div className="status-section">
            {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
