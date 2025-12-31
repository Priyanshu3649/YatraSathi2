import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import '../../styles/auth.css';

const EmployeeLogin = () => {
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
      const data = await authAPI.employeeLogin(formData.email, formData.password);

      if (data.success) {
        // Store token and user data
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('sessionId', data.data.sessionId);

        // Redirect based on role/department
        const role = data.data.user.role;
        // const department = data.data.user.department; // Not used currently

        // Role-based redirect
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
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Employee Login</h2>
          <p>Access your employee dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your work email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <a href="/auth/forgot-password">Forgot your password?</a>
          </p>
          <p>
            Customer? <a href="/auth/login">Login here</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLogin;