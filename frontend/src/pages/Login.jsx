import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, sessionAPI } from '../services/api';
import '../styles/auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, selectedFinancialYear, selectFinancialYear } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Keyboard navigation refs
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const submitRef = useRef(null);
  const fields = [emailRef, passwordRef, submitRef];

  const focusField = useCallback((index) => {
    const ref = fields[index];
    if (ref?.current) ref.current.focus();
  }, []);

  // Redirect if already authenticated with a session
  useEffect(() => {
    if (isAuthenticated && selectedFinancialYear) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      redirectByRole(user?.us_roid);
    } else {
      focusField(0);
    }
  }, [isAuthenticated, selectedFinancialYear]);

  const redirectByRole = (role) => {
    if (role === 'ADM') {
      navigate('/admin-dashboard');
    } else if (['AGT', 'ACC', 'HR', 'CC', 'MKT', 'MGT'].includes(role)) {
      switch (role) {
        case 'AGT': navigate('/employee/agent'); break;
        case 'ACC': navigate('/employee/accounts'); break;
        case 'HR': navigate('/employee/hr'); break;
        case 'CC': navigate('/employee/callcenter'); break;
        case 'MKT': navigate('/employee/marketing'); break;
        case 'MGT': navigate('/employee/management'); break;
        default: navigate('/employee/dashboard');
      }
    } else {
      navigate('/customer/dashboard');
    }
  };

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.target === submitRef.current) {
        handleSubmit(e);
      } else {
        const idx = fields.findIndex(r => r.current === e.target);
        if (idx >= 0 && idx < fields.length - 1) {
          fields[idx + 1].current.focus();
        }
      }
    }
  }, [formData]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  /**
   * Auto-select the current financial year (April 1 rollover logic).
   * Returns the best matching FY name from the provided list.
   */
  const pickCurrentFY = (fyList, serverCurrentFY) => {
    // Trust server's recommendation first
    if (serverCurrentFY && fyList.find(f => f.fy_name === serverCurrentFY)) {
      return serverCurrentFY;
    }
    // Client-side fallback: compute current FY label
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const startYear = month >= 4 ? year : year - 1;
    const endYear = (startYear + 1) % 100;
    const label = `${startYear}-${String(endYear).padStart(2, '0')}`;
    const match = fyList.find(f => f.fy_name === label);
    if (match) return match.fy_name;
    // Fallback: latest (last in ASC sorted list)
    return fyList[fyList.length - 1]?.fy_name || null;
  };

  // Login Submit — auto-selects current FY, no session selection page
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let data;
      
      // Auto-detect role: Try employee login first (for admins/employees), fallback to customer login
      try {
        data = await authAPI.employeeLogin(formData.email, formData.password);
      } catch (employeeError) {
        try {
          data = await authAPI.customerLogin(formData.email, formData.password);
        } catch (customerError) {
          // If both fail, throw the final error
          throw customerError;
        }
      }

      if (data.success) {
        const userObject = {
          us_usid: data.data.user.id,
          us_fname: data.data.user.name,
          us_email: data.data.user.email,
          us_usertype: data.data.user.us_usertype,
          us_roid: data.data.user.role || data.data.user.roleId,
          department: data.data.user.department
        };

        // Store credentials in localStorage so sessionAPI can run with auth header
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(userObject));
        if (data.data.sessionId) {
          localStorage.setItem('sessionId', data.data.sessionId);
        }

        // Fetch available FYs and auto-select the current one (no user prompt)
        const fyRes = await sessionAPI.getAvailableYears();
        const fyList = (fyRes.success && fyRes.data?.length > 0) ? fyRes.data : [];
        const chosenFY = pickCurrentFY(fyList, fyRes.currentFY);

        if (chosenFY) {
          // Activate the chosen FY on the backend
          await sessionAPI.selectYear(chosenFY);
          login(data.data.token, userObject);
          selectFinancialYear(chosenFY);
        } else {
          // No FYs configured — still log in but without a session
          login(data.data.token, userObject);
        }

        redirectByRole(userObject.us_roid);
      } else {
        setError(data.error?.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Network error. Please try again.';
      if (error.message) {
        if (error.message.includes('UNAUTHORIZED')) {
          errorMessage = 'Invalid email or password.';
        } else if (error.message.includes('EMPLOYEE_INACTIVE')) {
          errorMessage = 'Your account is inactive. Contact admin.';
        } else if (error.message.includes('VALIDATION_ERROR')) {
          errorMessage = 'Enter both email and password.';
        } else {
          errorMessage = error.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Login Form Render
  return (
    <div className="register panel" style={{ maxWidth: '500px', margin: '30px auto' }}>
      <div className="panel-header text-center">
        <h2>Login</h2>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="email" className="form-label required">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            ref={emailRef}
            value={formData.email}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            required
            className="form-control"
            disabled={loading}
            style={{ color: '#000' }}
          />
        </div>

        <div className="input-group">
          <label htmlFor="password" className="form-label required">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            ref={passwordRef}
            value={formData.password}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            required
            className="form-control"
            disabled={loading}
            style={{ color: '#000' }}
          />
        </div>

        <div className="text-center mt-3">
          <button ref={submitRef} type="submit" onKeyDown={handleKeyDown} disabled={loading} className="btn btn-primary">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </form>
      <div className="text-center mt-3">
        <p>
          <a href="/forgot-password">Forgot your password?</a>
        </p>
        <p>
          Don't have an account? <a href="/register">Register here</a>
        </p>
      </div>
    </div>
  );
};

export default Login;