import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';

const ServiceChargeManager = () => {
  const { user } = useAuth();
  const [customerRules, setCustomerRules] = useState([]);
  const [defaultRules, setDefaultRules] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' or 'default'
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    service_type: 'RESERVATION',
    travel_class: '3A',
    charge_mode: 'FIXED',
    passenger_min: 1,
    passenger_max: '',
    amount: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
    fetchCustomers();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [custRes, defRes] = await Promise.all([
        fetch('/api/service-charge/customer-rules', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/service-charge/default-rules', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const custData = await custRes.json();
      const defData = await defRes.json();

      if (custData.success) setCustomerRules(custData.data);
      if (defData.success) setDefaultRules(defData.data);
    } catch (err) {
      console.error('Failed to fetch rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(Array.isArray(data) ? data : (data.customers || []));
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isDefault = activeTab === 'default';
    const url = editingRule 
      ? `/api/service-charge/rules/${editingRule.id}` 
      : '/api/service-charge/rules';
    const method = editingRule ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...formData, isDefault })
      });

      if (response.ok) {
        setShowModal(false);
        setEditingRule(null);
        resetForm();
        fetchData();
      }
    } catch (err) {
      console.error('Failed to save rule:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      service_type: 'RESERVATION',
      travel_class: '3A',
      charge_mode: 'FIXED',
      passenger_min: 1,
      passenger_max: '',
      amount: '',
      is_active: true
    });
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      customer_id: rule.customer_id || '',
      service_type: rule.service_type,
      travel_class: rule.travel_class,
      charge_mode: rule.charge_mode,
      passenger_min: rule.passenger_min,
      passenger_max: rule.passenger_max || '',
      amount: rule.amount,
      is_active: rule.is_active
    });
    setShowModal(true);
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this rule?')) return;
    try {
      const response = await fetch(`/api/service-charge/rules/${id}?isDefault=${activeTab === 'default'}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) fetchData();
    } catch (err) {
      console.error('Failed to deactivate rule:', err);
    }
  };

  return (
    <div className="erp-admin-container">
      <div className="erp-menu-bar">
        <div className="erp-menu-item">Rule Management</div>
        <div className="erp-user-info">ADMIN: {user?.us_name}</div>
      </div>

      <div className="erp-toolbar">
        <button className="erp-button" onClick={() => { resetForm(); setEditingRule(null); setShowModal(true); }}>
          + Add New Rule
        </button>
        <div className="erp-tool-separator"></div>
        <button className={`erp-button ${activeTab === 'customer' ? 'active' : ''}`} onClick={() => setActiveTab('customer')}>
          Customer Specific
        </button>
        <button className={`erp-button ${activeTab === 'default' ? 'active' : ''}`} onClick={() => setActiveTab('default')}>
          System Defaults
        </button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={fetchData}>Refresh</button>
      </div>

      <div className="erp-main-content">
        <div className="erp-center-content">
          <div className="section-header">
            {activeTab === 'customer' ? 'CUSTOMER PRICING RULES' : 'SYSTEM DEFAULT CHARGES'}
          </div>
          
          <div className="table-container shadow-sm" style={{ backgroundColor: 'white', borderRadius: '4px', overflow: 'hidden' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  {activeTab === 'customer' && <th>Customer</th>}
                  <th>Type</th>
                  <th>Class</th>
                  <th>Mode</th>
                  <th>Pax Range</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'customer' ? customerRules : defaultRules).map((rule) => (
                  <tr key={rule.id}>
                    {activeTab === 'customer' && (
                      <td>{rule.us_fname ? `${rule.us_fname} ${rule.us_lname}` : rule.customer_id}</td>
                    )}
                    <td><span className={`badge ${rule.service_type === 'RESERVATION' ? 'bg-blue' : 'bg-orange'}`}>{rule.service_type}</span></td>
                    <td>{rule.travel_class}</td>
                    <td>{rule.charge_mode}</td>
                    <td>{rule.passenger_min} - {rule.passenger_max || '∞'}</td>
                    <td className="fw-bold text-success">₹{rule.amount}</td>
                    <td>
                      <span className={`status-dot ${rule.is_active ? 'active' : 'inactive'}`}></span>
                      {rule.is_active ? 'Active' : 'Closed'}
                    </td>
                    <td>
                      <button className="icon-btn" onClick={() => handleEdit(rule)}>✏️</button>
                      {rule.is_active && (
                        <button className="icon-btn text-danger" onClick={() => handleDeactivate(rule.id)}>🚫</button>
                      )}
                    </td>
                  </tr>
                ))}
                {loading && <tr><td colSpan="8" className="text-center">Loading rules...</td></tr>}
                {!loading && (activeTab === 'customer' ? customerRules : defaultRules).length === 0 && (
                  <tr><td colSpan="8" className="text-center">No rules found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="erp-modal-overlay">
          <div className="erp-modal" style={{ maxWidth: '500px' }}>
            <div className="erp-modal-header">
              {editingRule ? 'Edit Pricing Rule' : 'Create New Pricing Rule'}
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="erp-form p-4">
              <div className="form-grid">
                {activeTab === 'customer' && (
                  <>
                    <label className="form-label required">Customer</label>
                    <select 
                      name="customer_id" 
                      value={formData.customer_id} 
                      onChange={handleInputChange} 
                      required 
                      className="form-input"
                    >
                      <option value="">Select Customer</option>
                      {customers.map(c => (
                        <option key={c.id || c.us_usid} value={c.id || c.us_usid}>
                          {c.us_name || c.name} ({c.id || c.us_usid})
                        </option>
                      ))}
                    </select>
                  </>
                )}

                <label className="form-label">Service Type</label>
                <select name="service_type" value={formData.service_type} onChange={handleInputChange} className="form-input">
                  <option value="RESERVATION">RESERVATION</option>
                  <option value="CANCELLATION">CANCELLATION</option>
                </select>

                <label className="form-label">Travel Class</label>
                <select name="travel_class" value={formData.travel_class} onChange={handleInputChange} className="form-input">
                  <option value="SL">Sleeper (SL)</option>
                  <option value="3A">3rd AC (3A)</option>
                  <option value="2A">2nd AC (2A)</option>
                  <option value="1A">1st AC (1A)</option>
                  <option value="CC">Chair Car (CC)</option>
                  <option value="2S">Second Sitting (2S)</option>
                </select>

                <label className="form-label">Charge Mode</label>
                <select name="charge_mode" value={formData.charge_mode} onChange={handleInputChange} className="form-input">
                  <option value="FIXED">Fixed Amount</option>
                  <option value="PER_PASSENGER">Per Passenger</option>
                </select>

                <label className="form-label">Min Passengers</label>
                <input type="number" name="passenger_min" value={formData.passenger_min} onChange={handleInputChange} className="form-input" min="1" />

                <label className="form-label">Max Passengers (Empty for No Limit)</label>
                <input type="number" name="passenger_max" value={formData.passenger_max} onChange={handleInputChange} className="form-input" />

                <label className="form-label required">Amount (₹)</label>
                <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} className="form-input" required step="0.01" />

                <div className="checkbox-group mt-2">
                  <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleInputChange} />
                  <label htmlFor="is_active" className="ms-2">Rule is Active</label>
                </div>
              </div>

              <div className="form-actions mt-4">
                <button type="submit" className="erp-button primary">{editingRule ? 'Update Rule' : 'Create Rule'}</button>
                <button type="button" className="erp-button" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .active { background: #e2e8f0; border-bottom: 2px solid #3182ce; }
        .bg-blue { background: #ebf8ff; color: #2b6cb0; border: 1px solid #bee3f8; }
        .bg-orange { background: #fffaf0; color: #9c4221; border: 1px solid #feebc8; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }
        .status-dot.active { background: #48bb78; }
        .status-dot.inactive { background: #fb6340; }
        .icon-btn { background: none; border: none; cursor: pointer; padding: 4px 8px; font-size: 1.1rem; }
        .fw-bold { font-weight: 600; }
        .text-success { color: #2f855a; }
        .text-danger { color: #c53030; }
        .shadow-sm { box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .erp-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .erp-modal { background: white; border-radius: 4px; width: 90%; max-width: 600px; }
        .erp-modal-header { padding: 15px 20px; border-bottom: 1px solid #edf2f7; display: flex; justify-content: space-between; font-weight: 600; background: #f7fafc; }
        .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default ServiceChargeManager;
