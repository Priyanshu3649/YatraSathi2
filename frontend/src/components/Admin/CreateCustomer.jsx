import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const CreateCustomer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    customerType: 'INDIVIDUAL',
    companyName: '',
    gstNumber: '',
    creditLimit: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await customerAPI.createCustomer(formData);
      setSuccessMessage(response.message);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          customerType: 'INDIVIDUAL',
          companyName: '',
          gstNumber: '',
          creditLimit: 0
        });
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin
  const isAdmin = user?.us_usertype === 'admin' || user?.us_roid === 'ADM';

  if (!isAdmin) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Access Denied</h4>
          <p>Only admin users can create customers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5 mb-5">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-md-10">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h2 className="mb-0">Create New Customer</h2>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger">{error}</div>
              )}
              {successMessage && (
                <div className="alert alert-success">{successMessage}</div>
              )}
              
              <form onSubmit={onSubmit}>
                {/* Personal Information */}
                <div className="mb-4">
                  <h4>Personal Information</h4>
                  <hr />
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="firstName" className="form-label">First Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={onChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="lastName" className="form-label">Last Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={onChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="email" className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={onChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="phone" className="form-label">Phone *</label>
                      <input
                        type="tel"
                        className="form-control"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={onChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="password" className="form-label">Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={onChange}
                        required
                        minLength="6"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="mb-4">
                  <h4>Address Information</h4>
                  <hr />
                  <div className="mb-3">
                    <label htmlFor="address" className="form-label">Address</label>
                    <input
                      type="text"
                      className="form-control"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={onChange}
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label htmlFor="city" className="form-label">City</label>
                      <input
                        type="text"
                        className="form-control"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={onChange}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label htmlFor="state" className="form-label">State</label>
                      <input
                        type="text"
                        className="form-control"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={onChange}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label htmlFor="pincode" className="form-label">Pincode</label>
                      <input
                        type="text"
                        className="form-control"
                        id="pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={onChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="mb-4">
                  <h4>Customer Details</h4>
                  <hr />
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="customerType" className="form-label">Customer Type</label>
                      <select
                        className="form-select"
                        id="customerType"
                        name="customerType"
                        value={formData.customerType}
                        onChange={onChange}
                      >
                        <option value="INDIVIDUAL">Individual</option>
                        <option value="CORPORATE">Corporate</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="creditLimit" className="form-label">Credit Limit</label>
                      <input
                        type="number"
                        className="form-control"
                        id="creditLimit"
                        name="creditLimit"
                        value={formData.creditLimit}
                        onChange={onChange}
                        min="0"
                      />
                    </div>
                  </div>

                  {formData.customerType === 'CORPORATE' && (
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="companyName" className="form-label">Company Name</label>
                        <input
                          type="text"
                          className="form-control"
                          id="companyName"
                          name="companyName"
                          value={formData.companyName}
                          onChange={onChange}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="gstNumber" className="form-label">GST Number</label>
                        <input
                          type="text"
                          className="form-control"
                          id="gstNumber"
                          name="gstNumber"
                          value={formData.gstNumber}
                          onChange={onChange}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Customer'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate('/admin/customers')}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCustomer;
