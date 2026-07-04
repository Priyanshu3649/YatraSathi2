import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, sessionAPI } from '../services/api';
import '../styles/auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, selectedFinancialYear, selectFinancialYear } = useAuth();

  // Step state: 1 = Credentials, 2 = Financial Year Selection
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 Form State
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Step 2 Session State
  const [financialYears, setFinancialYears] = useState([]);
  const [selectedFY, setSelectedFY] = useState('');
  const [tempAuthData, setTempAuthData] = useState(null); // holds token and user info before finalizing session

  // Keyboard navigation refs
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const submitRef = useRef(null);
  const fieldsStep1 = [emailRef, passwordRef, submitRef];

  const fySelectRef = useRef(null);
  const fyOkRef = useRef(null);
  const fyCancelRef = useRef(null);
  const fieldsStep2 = [fySelectRef, fyOkRef, fyCancelRef];

  const focusField = useCallback((index) => {
    const fields = step === 1 ? fieldsStep1 : fieldsStep2;
    const ref = fields[index];
    if (ref?.current) ref.current.focus();
  }, [step]);

  // Load available years inside Step 2
  const fetchAvailableYears = async (token) => {
    setLoading(true);
    setError('');
    try {
      // Temporarily store token in localStorage so fetch getHeaders gets it
      if (token) {
        localStorage.setItem('token', token);
      }
      const res = await sessionAPI.getAvailableYears();
      if (res.success && res.data.length > 0) {
        setFinancialYears(res.data);
        setSelectedFY(res.data[0].fy_name);
      } else {
        setError('No active financial years found or you do not have permission.');
      }
    } catch (err) {
      console.error('Error fetching financial years:', err);
      setError(err.message || 'Failed to load financial years.');
    } finally {
      setLoading(false);
    }
  };

  // If user is already authenticated but has no selected FY, auto-route to step 2 selection
  useEffect(() => {
    if (isAuthenticated && !selectedFinancialYear) {
      setStep(2);
      fetchAvailableYears(localStorage.getItem('token'));
    } else if (step === 1) {
      focusField(0); // focus email input on mount
    }
  }, [isAuthenticated, selectedFinancialYear, step, focusField]);

  // Focus select field when step 2 mounts
  useEffect(() => {
    if (step === 2 && fySelectRef.current) {
      fySelectRef.current.focus();
    }
  }, [step]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const fields = step === 1 ? fieldsStep1 : fieldsStep2;
      const submitBtn = step === 1 ? submitRef.current : fyOkRef.current;
      
      if (e.target === submitBtn) {
        if (step === 1) handleSubmit(e);
        else handleSelectFY(e);
      } else {
        const idx = fields.findIndex(r => r.current === e.target);
        if (idx >= 0 && idx < fields.length - 1) {
          fields[idx + 1].current.focus();
        }
      }
    }
  }, [step, formData, selectedFY]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Step 1: Login Submit
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

        setTempAuthData({
          token: data.data.token,
          user: userObject,
          sessionId: data.data.sessionId
        });

        // Temporarily put credentials in localStorage so sessionAPI can run
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(userObject));
        if (data.data.sessionId) {
          localStorage.setItem('sessionId', data.data.sessionId);
        }

        // Fetch years and go to step 2
        setStep(2);
        await fetchAvailableYears(data.data.token);
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

  // Step 2: Financial Year Select
  const handleSelectFY = async (e) => {
    e.preventDefault();
    if (!selectedFY) {
      setError('Please select a financial year.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await sessionAPI.selectYear(selectedFY);
      if (res.success) {
        const token = tempAuthData?.token || localStorage.getItem('token');
        const userObj = tempAuthData?.user || JSON.parse(localStorage.getItem('user'));
        
        // Complete login inside AuthContext
        login(token, userObj);
        selectFinancialYear(selectedFY);

        // Redirect based on role
        const role = userObj?.us_roid;
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
      }
    } catch (err) {
      console.error('Failed to select session:', err);
      setError(err.message || 'Failed to select session.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Cancel Financial Year Selection
  const handleCancelFY = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('financialYear');
    setTempAuthData(null);
    setStep(1);
    setError('');
  };

  // Step 2: Financial Year Selection Form Render
  if (step === 2) {
    return (
      <div className="register panel" style={{ 
        maxWidth: '500px', 
        margin: '30px auto', 
        padding: '0', 
        border: '2px solid #000', 
        boxShadow: '2px 2px 0px #fff inset, -2px -2px 0px #808080 inset' 
      }}>
        {/* Vintage Title Bar */}
        <div style={{
          backgroundColor: 'var(--title-bar-bg, #0a246a)',
          color: 'var(--title-bar-text, #ffffff)',
          padding: '4px 6px',
          fontWeight: 'bold',
          fontSize: '11px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>YatraSathi - Session Selection</span>
          <button 
            onClick={handleCancelFY}
            style={{
              width: '16px',
              height: '14px',
              backgroundColor: '#ece9d8',
              border: '1px solid #fff',
              borderRightColor: '#707070',
              borderBottomColor: '#707070',
              fontSize: '9px',
              fontWeight: 'bold',
              color: '#000',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0'
            }}
          >
            🗙
          </button>
        </div>

        {/* Content Box */}
        <div style={{ padding: '16px', backgroundColor: '#ece9d8' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '28px' }}>📅</div>
            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: 'bold', color: '#000' }}>
                Welcome, {tempAuthData?.user?.us_fname || 'User'}!
              </p>
              <p style={{ margin: '0', fontSize: '11px', color: '#404040' }}>
                Please select the financial year session you want to work with. Transactions and reports will be isolated to this session.
              </p>
            </div>
          </div>

          {error && <div className="alert alert-error" style={{ fontSize: '11px', padding: '6px' }}>{error}</div>}

          <form onSubmit={handleSelectFY}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="financialYear" className="form-label" style={{ fontSize: '11px' }}>
                Financial Year / Session:
              </label>
              <select
                id="financialYear"
                name="financialYear"
                ref={fySelectRef}
                value={selectedFY}
                onChange={(e) => setSelectedFY(e.target.value)}
                onKeyDown={handleKeyDown}
                className="form-control"
                style={{
                  height: '24px',
                  fontSize: '11px',
                  backgroundColor: '#fff',
                  border: '1px solid #000',
                  boxShadow: '1px 1px 0px #808080 inset',
                  padding: '2px',
                  width: '100%',
                  color: '#000'
                }}
                disabled={loading || financialYears.length === 0}
              >
                {financialYears.map((fy) => (
                  <option key={fy.fy_id} value={fy.fy_name}>
                    {fy.fy_name} {fy.fy_desc ? `(${fy.fy_desc})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              borderTop: '1px solid #808080',
              paddingTop: '12px',
              marginTop: '12px'
            }}>
              <button
                ref={fyOkRef}
                type="submit"
                onKeyDown={handleKeyDown}
                className="btn btn-primary"
                disabled={loading || financialYears.length === 0}
                style={{ minWidth: '75px', height: '23px', fontSize: '11px' }}
              >
                {loading ? 'Connecting...' : 'OK'}
              </button>
              <button
                ref={fyCancelRef}
                type="button"
                onClick={handleCancelFY}
                className="btn"
                disabled={loading}
                style={{ minWidth: '75px', height: '23px', fontSize: '11px' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step 1: Login Form Render
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