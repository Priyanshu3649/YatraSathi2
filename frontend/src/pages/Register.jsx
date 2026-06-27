import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password2: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  // Keyboard navigation
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);
  const password2Ref = useRef(null);
  const submitRef = useRef(null);
  const fields = [nameRef, emailRef, phoneRef, passwordRef, password2Ref, submitRef];

  const focusField = useCallback((index) => {
    const ref = fields[index];
    if (ref?.current) ref.current.focus();
  }, []);

  useEffect(() => { focusField(0); }, [focusField]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.target === submitRef.current || e.target === password2Ref.current) {
        const form = e.target.closest('form');
        if (form) form.requestSubmit();
      } else {
        const idx = fields.findIndex(r => r.current === e.target);
        if (idx >= 0 && idx < fields.length - 1) focusField(idx + 1);
      }
    }
  }, [focusField]);
  
  const { name, email, phone, password, password2 } = formData;
  
  const onChange = (e) => {
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
        password
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
            ref={nameRef}
            value={name}
            onChange={onChange}
            onKeyDown={handleKeyDown}
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
            ref={emailRef}
            value={email}
            onChange={onChange}
            onKeyDown={handleKeyDown}
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
            ref={phoneRef}
            value={phone}
            onChange={onChange}
            onKeyDown={handleKeyDown}
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
            ref={passwordRef}
            value={password}
            onChange={onChange}
            onKeyDown={handleKeyDown}
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
            ref={password2Ref}
            value={password2}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            required
            className="form-control"
          />
        </div>

        <div className="text-center mt-3">
          <button ref={submitRef} type="submit" onKeyDown={handleKeyDown} disabled={loading} className="btn btn-primary">
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