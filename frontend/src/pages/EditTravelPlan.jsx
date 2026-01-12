import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';
import '../styles/vintage-admin-panel.css';
import '../styles/dynamic-admin-panel.css';
import '../styles/vintage-erp-global.css';

const EditTravelPlan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    tp_tpid: '',
    tp_status: 'Draft',
    tp_packname: '',
    tp_packcode: '',
    tp_startdt: new Date().toISOString().split('T')[0],
    tp_enddt: new Date().toISOString().split('T')[0],
    tp_sourcecity: '',
    tp_destcity: '',
    tp_duration: 0,
    tp_baseprice: 0,
    tp_perpersonorgroup: 'Per Person',
    tp_taxmode: 'Auto',
    tp_discount: 0,
    tp_finalamount: 0,
    tp_traveltype: 'Mixed',
    tp_foodincluded: false,
    tp_stayincluded: false,
    tp_destinations: '',
    tp_itinerary: '',
    tp_terms: '',
    tp_cancellation: '',
    tp_notes: '',
    tp_maxcapacity: 0,
    tp_minparticipants: 0,
    tp_agelimit: '',
    tp_applybydate: new Date().toISOString().split('T')[0],
    tp_visibletocustomer: false,
    tp_notifyall: false,
    tp_notifygroups: '',
    createdOn: new Date().toISOString(),
    createdBy: user?.us_name || 'system',
    modifiedOn: '',
    modifiedBy: '',
    closedOn: '',
    closedBy: ''
  });
  const [inclusions, setInclusions] = useState({
    travel: false,
    food: false,
    stay: false
  });
  const [destinations, setDestinations] = useState(['']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Calculate duration when dates change
  useEffect(() => {
    if (formData.tp_startdt && formData.tp_enddt) {
      const start = new Date(formData.tp_startdt);
      const end = new Date(formData.tp_enddt);
      const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end date
      setFormData(prev => ({
        ...prev,
        tp_duration: duration
      }));
    }
  }, [formData.tp_startdt, formData.tp_enddt]);

  // Calculate final amount when price, discount, or tax changes
  useEffect(() => {
    let finalAmount = parseFloat(formData.tp_baseprice) || 0;
    
    // Apply discount
    if (formData.tp_discount > 0) {
      finalAmount -= (finalAmount * formData.tp_discount / 100);
    }
    
    // Apply taxes if auto mode
    if (formData.tp_taxmode === 'Auto') {
      // Assuming 5% tax rate for demonstration
      finalAmount += (finalAmount * 0.05);
    }
    
    setFormData(prev => ({
      ...prev,
      tp_finalamount: finalAmount.toFixed(2)
    }));
  }, [formData.tp_baseprice, formData.tp_discount, formData.tp_taxmode]);

  // Load travel plan data when component mounts
  useEffect(() => {
    if (id) {
      // In a real implementation, this would fetch the travel plan from the API
      // For now, we'll simulate loading with mock data
      const mockData = {
        tp_tpid: id || 'TP001',
        tp_status: 'Active',
        tp_packname: 'Delhi to Manali (4D/3N)',
        tp_packcode: 'D2M',
        tp_startdt: '2026-02-01',
        tp_enddt: '2026-02-04',
        tp_sourcecity: 'Delhi',
        tp_destcity: 'Manali',
        tp_duration: 4,
        tp_baseprice: 15000,
        tp_perpersonorgroup: 'Per Person',
        tp_taxmode: 'Auto',
        tp_discount: 5,
        tp_finalamount: 14962.50,
        tp_traveltype: 'Mixed',
        tp_foodincluded: true,
        tp_stayincluded: true,
        tp_destinations: 'Manali, Solang Valley, Rohtang Pass',
        tp_itinerary: 'Day 1: Delhi to Manali\\nDay 2: Local sightseeing\\nDay 3: Rohtang Pass\\nDay 4: Return to Delhi',
        tp_terms: 'Valid ID proof required for all passengers',
        tp_cancellation: 'Cancellation charges apply as per policy',
        tp_notes: 'Early booking recommended',
        tp_maxcapacity: 20,
        tp_minparticipants: 5,
        tp_agelimit: '5 years and above',
        tp_applybydate: '2026-01-25',
        tp_visibletocustomer: true,
        tp_notifyall: false,
        tp_notifygroups: 'Premium Customers',
        createdOn: new Date().toISOString(),
        createdBy: 'admin',
        modifiedOn: new Date().toISOString(),
        modifiedBy: 'admin',
        closedOn: '',
        closedBy: ''
      };
      
      setFormData(mockData);
      setInclusions({
        travel: true,
        food: true,
        stay: true
      });
      setDestinations(mockData.tp_destinations.split(', '));
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleInclusionChange = (e) => {
    const { name, checked } = e.target;
    setInclusions(prev => ({
      ...prev,
      [name]: checked
    }));
    
    // Update form data as well
    setFormData(prev => ({
      ...prev,
      [`tp_${name}included`]: checked
    }));
  };

  const addDestination = () => {
    setDestinations([...destinations, '']);
  };

  const removeDestination = (index) => {
    if (destinations.length <= 1) {
      setError('At least one destination is required');
      return;
    }
    setDestinations(destinations.filter((_, i) => i !== index));
  };

  const updateDestination = (index, value) => {
    setDestinations(destinations.map((dest, i) => i === index ? value : dest));
  };

  const handleSave = async () => {
    try {
      const planData = {
        ...formData,
        tp_traveltype: inclusions.travel ? 'Mixed' : '',
        destinations: destinations.filter(dest => dest.trim() !== ''),
        modifiedOn: new Date().toISOString(),
        modifiedBy: user?.us_name || 'system'
      };
      
      // In a real implementation, this would save the travel plan to the API
      console.log('Saving travel plan:', planData);
      
      // Navigate back to the travel plans list
      navigate('/travel-plans');
    } catch (error) {
      setError(error.message || 'Failed to save travel plan');
    }
  };

  const handleCancel = () => {
    navigate('/travel-plans');
  };

  if (loading) {
    return (
      <div className="erp-admin-container">
        <div className="loading">Loading travel plan...</div>
      </div>
    );
  }

  return (
    <div className="erp-admin-container">
      {/* Top Menu Bar - Static */}
      <div className="erp-menu-bar">
        <div className="erp-menu-item">File</div>
        <div className="erp-menu-item">Edit</div>
        <div className="erp-menu-item">View</div>
        <div className="erp-menu-item">Travel Plan</div>
        <div className="erp-menu-item">Reports</div>
        <div className="erp-menu-item">Help</div>
        <div className="erp-user-info">USER: {user?.us_name || 'ADMIN'} ⚙</div>
      </div>

      {/* Toolbar - Static */}
      <div className="erp-toolbar">
        <button className="erp-button" onClick={handleSave}>Save</button>
        <button className="erp-button" onClick={handleCancel}>Cancel</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button">Print</button>
        <button className="erp-button">Export</button>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="erp-main-content">
        {/* Center Content */}
        <div className="erp-center-content">
          {/* Form Panel - Static */}
          <div className="erp-form-section">
            <div className="erp-panel-header">Travel Plan Details</div>
            
            {/* Travel Plan ID and Status Row */}
            <div className="erp-form-row">
              <label className="erp-form-label">Travel Plan ID</label>
              <input
                type="text"
                name="tp_tpid"
                className="erp-input"
                value={formData.tp_tpid}
                onChange={handleInputChange}
                readOnly
              />
              <label className="erp-form-label">Status</label>
              <select
                name="tp_status"
                className="erp-input"
                value={formData.tp_status}
                onChange={handleInputChange}
              >
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Package Name and Code Row */}
            <div className="erp-form-row">
              <label className="erp-form-label">Package Name</label>
              <input
                type="text"
                name="tp_packname"
                className="erp-input"
                value={formData.tp_packname}
                onChange={handleInputChange}
                placeholder="e.g. Delhi to Manali (4D/3N)"
              />
              <label className="erp-form-label">Package Code</label>
              <input
                type="text"
                name="tp_packcode"
                className="erp-input"
                value={formData.tp_packcode}
                onChange={handleInputChange}
                placeholder="e.g. D2M"
              />
            </div>

            {/* Start and End Date Row */}
            <div className="erp-form-row">
              <label className="erp-form-label">Start Date & Time</label>
              <input
                type="date"
                name="tp_startdt"
                className="erp-input"
                value={formData.tp_startdt}
                onChange={handleInputChange}
              />
              <label className="erp-form-label">End Date & Time</label>
              <input
                type="date"
                name="tp_enddt"
                className="erp-input"
                value={formData.tp_enddt}
                onChange={handleInputChange}
              />
            </div>

            {/* Source and Destination Row */}
            <div className="erp-form-row">
              <label className="erp-form-label">Source City</label>
              <input
                type="text"
                name="tp_sourcecity"
                className="erp-input"
                value={formData.tp_sourcecity}
                onChange={handleInputChange}
              />
              <label className="erp-form-label">Destination City</label>
              <input
                type="text"
                name="tp_destcity"
                className="erp-input"
                value={formData.tp_destcity}
                onChange={handleInputChange}
              />
            </div>

            {/* Duration Row */}
            <div className="erp-form-row">
              <label className="erp-form-label">Total Duration (Days)</label>
              <input
                type="text"
                name="tp_duration"
                className="erp-input"
                value={formData.tp_duration}
                readOnly
                disabled
              />
            </div>

            {/* Pricing Section */}
            <div className="erp-form-row">
              <label className="erp-form-label" style={{ gridColumn: 'span 4' }}>
                Package Pricing
              </label>
            </div>
            <div className="erp-form-row">
              <label className="erp-form-label">Base Package Price (₹)</label>
              <input
                type="number"
                name="tp_baseprice"
                className="erp-input"
                value={formData.tp_baseprice}
                onChange={handleInputChange}
              />
              <label className="erp-form-label">Per Person / Per Group</label>
              <select
                name="tp_perpersonorgroup"
                className="erp-input"
                value={formData.tp_perpersonorgroup}
                onChange={handleInputChange}
              >
                <option value="Per Person">Per Person</option>
                <option value="Per Group">Per Group</option>
              </select>
            </div>
            <div className="erp-form-row">
              <label className="erp-form-label">Taxes (Auto / Manual)</label>
              <select
                name="tp_taxmode"
                className="erp-input"
                value={formData.tp_taxmode}
                onChange={handleInputChange}
              >
                <option value="Auto">Auto (5%)</option>
                <option value="Manual">Manual</option>
              </select>
              <label className="erp-form-label">Discount (%)</label>
              <input
                type="number"
                name="tp_discount"
                className="erp-input"
                value={formData.tp_discount}
                onChange={handleInputChange}
              />
            </div>
            <div className="erp-form-row">
              <label className="erp-form-label">Final Package Amount (₹)</label>
              <input
                type="text"
                name="tp_finalamount"
                className="erp-input"
                value={formData.tp_finalamount}
                readOnly
                disabled
              />
            </div>

            {/* Package Inclusions */}
            <div className="erp-form-row">
              <label className="erp-form-label" style={{ gridColumn: 'span 4' }}>
                Package Inclusions
              </label>
            </div>
            <div className="erp-form-row">
              <div style={{ display: 'flex', gap: '20px', gridColumn: 'span 4' }}>
                <label className="erp-checkbox-item">
                  <input
                    type="checkbox"
                    name="travel"
                    checked={inclusions.travel}
                    onChange={handleInclusionChange}
                  />
                  Travel (Bus / Train / Cab / Mixed)
                </label>
                <label className="erp-checkbox-item">
                  <input
                    type="checkbox"
                    name="food"
                    checked={inclusions.food}
                    onChange={handleInclusionChange}
                  />
                  Food (Breakfast / Lunch / Dinner)
                </label>
                <label className="erp-checkbox-item">
                  <input
                    type="checkbox"
                    name="stay"
                    checked={inclusions.stay}
                    onChange={handleInclusionChange}
                  />
                  Stay (Hotel / Guest House / Camp)
                </label>
              </div>
            </div>
            <div className="erp-form-row">
              <label className="erp-form-label">Destinations Covered</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', gridColumn: 'span 3' }}>
                {destinations.map((destination, index) => (
                  <div key={index} style={{ display: 'flex', gap: '5px' }}>
                    <input
                      type="text"
                      className="erp-input"
                      value={destination}
                      onChange={(e) => updateDestination(index, e.target.value)}
                      placeholder="Enter destination..."
                      style={{ flex: 1 }}
                    />
                    {destinations.length > 1 && (
                      <button 
                        type="button" 
                        className="erp-button" 
                        style={{ padding: '2px 8px', fontSize: '11px' }} 
                        onClick={() => removeDestination(index)}
                      >
                        Del
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button" 
                  className="erp-button" 
                  style={{ padding: '2px 8px', fontSize: '11px', width: 'fit-content' }} 
                  onClick={addDestination}
                >
                  Add Destination
                </button>
              </div>
            </div>

            {/* Package Details (Description) */}
            <div className="erp-form-row">
              <label className="erp-form-label" style={{ gridColumn: 'span 4' }}>
                Package Details
              </label>
            </div>
            <div className="erp-form-row">
              <label className="erp-form-label">Detailed Itinerary (Day-wise)</label>
              <textarea
                name="tp_itinerary"
                className="erp-input"
                value={formData.tp_itinerary}
                onChange={handleInputChange}
                rows="4"
                style={{ gridColumn: 'span 3' }}
              ></textarea>
            </div>
            <div className="erp-form-row">
              <label className="erp-form-label">Terms & Conditions</label>
              <textarea
                name="tp_terms"
                className="erp-input"
                value={formData.tp_terms}
                onChange={handleInputChange}
                rows="3"
                style={{ gridColumn: 'span 3' }}
              ></textarea>
            </div>
            <div className="erp-form-row">
              <label className="erp-form-label">Cancellation Policy</label>
              <textarea
                name="tp_cancellation"
                className="erp-input"
                value={formData.tp_cancellation}
                onChange={handleInputChange}
                rows="2"
                style={{ gridColumn: 'span 3' }}
              ></textarea>
            </div>
            <div className="erp-form-row">
              <label className="erp-form-label">Notes / Remarks</label>
              <textarea
                name="tp_notes"
                className="erp-input"
                value={formData.tp_notes}
                onChange={handleInputChange}
                rows="2"
                style={{ gridColumn: 'span 3' }}
              ></textarea>
            </div>

            {/* Capacity & Eligibility */}
            <div className="erp-form-row">
              <label className="erp-form-label" style={{ gridColumn: 'span 4' }}>
                Capacity & Eligibility
              </label>
            </div>
            <div className="erp-form-row">
              <label className="erp-form-label">Maximum Seats / Capacity</label>
              <input
                type="number"
                name="tp_maxcapacity"
                className="erp-input"
                value={formData.tp_maxcapacity}
                onChange={handleInputChange}
              />
              <label className="erp-form-label">Minimum Participants</label>
              <input
                type="number"
                name="tp_minparticipants"
                className="erp-input"
                value={formData.tp_minparticipants}
                onChange={handleInputChange}
              />
            </div>
            <div className="erp-form-row">
              <label className="erp-form-label">Age Restrictions (if any)</label>
              <input
                type="text"
                name="tp_agelimit"
                className="erp-input"
                value={formData.tp_agelimit}
                onChange={handleInputChange}
                placeholder="e.g. 5 years and above"
              />
              <label className="erp-form-label">Last Date to Apply</label>
              <input
                type="date"
                name="tp_applybydate"
                className="erp-input"
                value={formData.tp_applybydate}
                onChange={handleInputChange}
              />
            </div>

            {/* Customer Visibility & Notifications */}
            <div className="erp-form-row">
              <label className="erp-form-label" style={{ gridColumn: 'span 4' }}>
                Customer Visibility & Notifications
              </label>
            </div>
            <div className="erp-form-row">
              <div style={{ display: 'flex', gap: '20px', gridColumn: 'span 4' }}>
                <label className="erp-checkbox-item">
                  <input
                    type="checkbox"
                    name="tp_visibletocustomer"
                    checked={formData.tp_visibletocustomer}
                    onChange={handleInputChange}
                  />
                  Visible to Customers (Yes / No)
                </label>
                <label className="erp-checkbox-item">
                  <input
                    type="checkbox"
                    name="tp_notifyall"
                    checked={formData.tp_notifyall}
                    onChange={handleInputChange}
                  />
                  Notify All Customers on Publish
                </label>
              </div>
            </div>
            <div className="erp-form-row">
              <label className="erp-form-label">Notify Selected Customer Groups (Optional)</label>
              <input
                type="text"
                name="tp_notifygroups"
                className="erp-input"
                value={formData.tp_notifygroups}
                onChange={handleInputChange}
                placeholder="e.g. Premium, Corporate"
                style={{ gridColumn: 'span 3' }}
              />
            </div>

            {/* Audit Section */}
            <div className="erp-audit-section">
              <div className="erp-audit-row">
                <label className="erp-audit-label">Created On</label>
                <input type="text" className="erp-audit-input" value={new Date(formData.createdOn).toLocaleString()} readOnly />
                <label className="erp-audit-label">Created By</label>
                <input type="text" className="erp-audit-input" value={formData.createdBy} readOnly />
              </div>
              <div className="erp-audit-row">
                <label className="erp-audit-label">Modified On</label>
                <input type="text" className="erp-audit-input" value={formData.modifiedOn ? new Date(formData.modifiedOn).toLocaleString() : '-'} readOnly />
                <label className="erp-audit-label">Modified By</label>
                <input type="text" className="erp-audit-input" value={formData.modifiedBy || '-'} readOnly />
              </div>
              <div className="erp-audit-row">
                <label className="erp-audit-label">Closed On</label>
                <input type="text" className="erp-audit-input" value={formData.closedOn ? new Date(formData.closedOn).toLocaleString() : '-'} readOnly />
                <label className="erp-audit-label">Closed By</label>
                <input type="text" className="erp-audit-input" value={formData.closedBy || '-'} readOnly />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar - Static */}
      <div className="erp-status-bar">
        <div className="erp-status-item">Editing Travel Plan</div>
        <div className="erp-status-item">Travel Plan ID: {formData.tp_tpid}</div>
        <div className="erp-status-item">Last Modified: {formData.modifiedOn ? new Date(formData.modifiedOn).toLocaleString() : '-'}</div>
        <div className="erp-status-item">Modified By: {formData.modifiedBy || '-'}</div>
      </div>
    </div>
  );
};

export default EditTravelPlan;