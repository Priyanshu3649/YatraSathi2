import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import '../../styles/erp-auth-theme.css';

const EmployeeLogin = () => {
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
      const data = await authAPI.employeeLogin(formData.email, formData.password);

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
        
        // Store session ID in localStorage
        if (data.data.sessionId) {
          localStorage.setItem('sessionId', data.data.sessionId);
        }

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
          case 'ADM':
            navigate('/admin-dashboard');
            break;
          default:
            navigate('/employee/dashboard');
        }
      } else {
        setError(data.error?.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Network error. Please try again.';
      
      if (error.message) {
        if (error.message.includes('UNAUTHORIZED')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.message.includes('EMPLOYEE_INACTIVE')) {
          errorMessage = 'Your employee account is currently inactive. Please contact your administrator.';
        } else if (error.message.includes('VALIDATION_ERROR')) {
          errorMessage = 'Please enter both email and password.';
        } else if (error.message.includes('SERVER_ERROR')) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register panel" style={{ maxWidth: '500px', margin: '30px auto' }}>
      <div className="panel-header text-center">
        <h2>Employee Login</h2>
        <p>Access your employee dashboard and management tools</p>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="email" className="form-label required">Email Address:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="form-control"
            disabled={loading}
            placeholder="Enter your work email"
          />
        </div>
        <div className="input-group">
          <label htmlFor="password" className="form-label required">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="form-control"
            disabled={loading}
            placeholder="Enter your password"
          />
        </div>
        <div className="text-center mt-3">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </div>
      </form>
      <div className="text-center mt-3">
        <p>
          <a href="/auth/forgot-password">Forgot your password?</a>
        </p>
        <p>
          Customer? <a href="/auth/login">Login here</a>
        </p>
      </div>
    </div>
  );
};

export default EmployeeLogin;