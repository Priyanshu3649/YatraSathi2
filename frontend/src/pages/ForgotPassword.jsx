import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/vintage-login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const data = await authAPI.requestPasswordReset(email);
      setSuccess(true);
      // In development, show the token (remove in production)
      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
    } catch (error) {
      setError(error.message || 'Failed to send reset link');
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
            <span className="title-icon">🔑</span>
            YatraSathi - Password Recovery
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
              <h2>Password Recovery</h2>
              <p>Enter your email address to receive a password reset link</p>
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
                  <strong>Password reset link sent!</strong>
                  <p>Please check your email for instructions to reset your password.</p>
                  {resetToken && (
                    <div className="dev-token-box">
                      <p><strong>Development Mode - Reset Token:</strong></p>
                      <code>{resetToken}</code>
                      <p style={{ fontSize: '10px', marginTop: '5px' }}>
                        Use this token on the reset password page
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {!success && (
              <form onSubmit={onSubmit} className="vintage-login-form">
                <div className="vintage-form-group">
                  <label htmlFor="email" className="vintage-label">
                    Email Address:
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    required
                    className="vintage-input"
                    placeholder="user@example.com"
                  />
                </div>

                <div className="vintage-form-actions">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="vintage-button primary"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  <Link to="/login">
                    <button type="button" className="vintage-button">
                      Back to Login
                    </button>
                  </Link>
                </div>
              </form>
            )}

            {success && (
              <div className="vintage-form-actions" style={{ marginTop: '20px' }}>
                <Link to="/reset-password">
                  <button type="button" className="vintage-button primary">
                    Reset Password Now
                  </button>
                </Link>
                <Link to="/login">
                  <button type="button" className="vintage-button">
                    Back to Login
                  </button>
                </Link>
              </div>
            )}

            <div className="vintage-login-links">
              <Link to="/login" className="vintage-link">
                <span className="link-icon">🔐</span>
                Remember your password? Login here
              </Link>
              <Link to="/register" className="vintage-link">
                <span className="link-icon">📝</span>
                Create new account
              </Link>
            </div>
          </div>

          {/* Info Panel */}
          <div className="info-panel">
            <div className="info-box">
              <div className="info-header">Password Recovery Help</div>
              <div className="info-content">
                <p><strong>Step 1:</strong> Enter your registered email address</p>
                <p><strong>Step 2:</strong> Check your email for reset link</p>
                <p><strong>Step 3:</strong> Click the link and set new password</p>
                <p><strong>Step 4:</strong> Login with your new password</p>
              </div>
            </div>

            <div className="info-box">
              <div className="info-header">Security Notice</div>
              <div className="info-content">
                <p>• Reset links expire in 1 hour</p>
                <p>• Links can only be used once</p>
                <p>• Your password is encrypted</p>
                <p>• Contact support if you need help</p>
              </div>
            </div>

            <div className="info-box">
              <div className="info-header">Need Help?</div>
              <div className="info-content">
                <p>If you don't receive the email:</p>
                <p>• Check your spam folder</p>
                <p>• Verify your email address</p>
                <p>• Contact system administrator</p>
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
            Module: Password Recovery
          </div>
          <div className="status-section">
            {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
