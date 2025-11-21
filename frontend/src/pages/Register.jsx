import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password2: '',
    userType: 'customer' // Only allow customer registration by default
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();
  
  const { name, email, phone, password, password2, userType } = formData;
  
  const onChange = (e) => {
    // Prevent changing user type to employee
    if (e.target.name === 'userType' && e.target.value === 'employee') {
      return; // Don't allow employee selection
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear error when user types
    setSuccess(''); // Clear success message
  };
  
  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!name || !email || !phone || !password || !password2) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== password2) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Prepare registration data
      const registrationData = {
        name,
        email,
        phone,
        password,
        userType: 'customer' // Force user type to customer
      };
      
      // Register using API
      const data = await authAPI.register(registrationData);
      
      setSuccess('Registration successful! Please check your email for verification.');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="register panel" style={{ maxWidth: '500px', margin: '30px auto' }}>
      <div className="panel-header text-center">
        <h2>Register</h2>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={onSubmit}>
        <div className="input-group">
          <label htmlFor="name" className="form-label">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={onChange}
            required
            className="form-control"
          />
        </div>
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
          <label htmlFor="phone" className="form-label">Phone:</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={phone}
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
        <div className="input-group">
          <label htmlFor="password2" className="form-label">Confirm Password:</label>
          <input
            type="password"
            id="password2"
            name="password2"
            value={password2}
            onChange={onChange}
            required
            className="form-control"
          />
        </div>
        <div className="input-group">
          <label htmlFor="userType" className="form-label">User Type:</label>
          <select
            id="userType"
            name="userType"
            value="customer" // Force to customer
            onChange={onChange}
            disabled // Disable the dropdown to prevent changes
            className="form-control"
          >
            <option value="customer">Customer</option>
            {/* Employee option removed to prevent individual employee registration */}
          </select>
        </div>
        <div className="text-center mt-3">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </div>
      </form>
      <div className="text-center mt-3">
        <p>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;