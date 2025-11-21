import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import '../styles/auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const { email, password } = formData;
  
  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear error when user types
  };
  
  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Login using API
      const data = await authAPI.login(email, password);
      
      // Create user object with the correct field name
      const userObject = {
        us_usid: data.id,
        us_fname: data.name,
        us_email: data.email,
        us_usertype: data.us_usertype, // Use the correct field name from backend
      };
      
      // Update auth context
      login(data.token, userObject);
      
      // Redirect based on user type
      if (data.us_usertype === 'admin') {
        navigate('/dashboard');
      } else if (data.us_usertype === 'employee') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login panel" style={{ maxWidth: '400px', margin: '50px auto' }}>
      <div className="panel-header text-center">
        <h2>Login</h2>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={onSubmit}>
        <div className="input-group">
          <label htmlFor="email" className="form-label">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={onChange}
            required
            className="form-control"
          />
        </div>
        <div className="input-group">
          <label htmlFor="password" className="form-label">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={onChange}
            required
            className="form-control"
          />
        </div>
        <div className="text-center mt-3">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </form>
      <div className="text-center mt-3">
        <p>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;