import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';
import '../styles/vintage-admin-panel.css';
import '../styles/dynamic-admin-panel.css';
import '../styles/vintage-erp-global.css';

const TravelPlans = () => {
  const { user } = useAuth();
  const [travelPlans, setTravelPlans] = useState([]);
  const [filteredTravelPlans, setFilteredTravelPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
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
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 100;

  // Filter state for inline grid filtering
  const [inlineFilters, setInlineFilters] = useState({});

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

  // Fetch travel plans when component mounts
  useEffect(() => {
    fetchTravelPlans();
  }, [user]);

  // Apply filters
  useEffect(() => {
    let filtered = [...travelPlans];
    
    // Apply inline filters
    Object.entries(inlineFilters).forEach(([column, value]) => {
      if (value !== undefined && value !== '') {
        filtered = filtered.filter(record => 
          record[column]?.toString().toLowerCase().includes(value.toLowerCase())
        );
      }
    });
    
    setFilteredTravelPlans(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [inlineFilters, travelPlans]);

  const fetchTravelPlans = async () => {
    try {
      setLoading(true);
      // Simulating API call - in real implementation, this would fetch from backend
      const mockData = [
        {
          tp_tpid: 'TP001',
          tp_status: 'Active',
          tp_packname: 'Delhi to Manali (4D/3N)',
          tp_packcode: 'D2M',
          tp_startdt: '2026-02-01',
          tp_enddt: '2026-02-04',
          tp_sourcecity: 'Delhi',
          tp_destcity: 'Manali',
          tp_duration: 4,
          tp_baseprice: 15000,
          tp_finalamount: 15750,
          tp_maxcapacity: 20,
          tp_minparticipants: 5,
          tp_visibletocustomer: true
        },
        {
          tp_tpid: 'TP002',
          tp_status: 'Draft',
          tp_packname: 'Kerala Backwaters Tour',
          tp_packcode: 'KBT',
          tp_startdt: '2026-02-15',
          tp_enddt: '2026-02-20',
          tp_sourcecity: 'Cochin',
          tp_destcity: 'Alleppey',
          tp_duration: 6,
          tp_baseprice: 22000,
          tp_finalamount: 23100,
          tp_maxcapacity: 15,
          tp_minparticipants: 8,
          tp_visibletocustomer: false
        }
      ];
      
      setTravelPlans(mockData);
      setFilteredTravelPlans(mockData);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch travel plans');
    } finally {
      setLoading(false);
    }
  };

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

  const handleInlineFilterChange = (column, value) => {
    setInlineFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const handleNew = () => {
    setSelectedPlan(null);
    setFormData({
      tp_tpid: '', // Will be auto-generated
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
    setInclusions({
      travel: false,
      food: false,
      stay: false
    });
    setDestinations(['']);
    setIsEditing(true);
  };

  const handleEdit = () => {
    if (selectedPlan) {
      setIsEditing(true);
    } else {
      alert('Please select a record first');
    }
  };

  const handleSave = async () => {
    try {
      const planData = {
        ...formData,
        tp_traveltype: inclusions.travel ? 'Mixed' : '',
        destinations: destinations.filter(dest => dest.trim() !== ''),
        createdOn: formData.createdOn || new Date().toISOString(),
        createdBy: formData.createdBy || user?.us_name || 'system'
      };
      
      if (selectedPlan) {
        // Update existing plan - in real implementation, this would call API
        console.log('Updating plan:', planData);
      } else {
        // Create new plan - in real implementation, this would call API
        console.log('Creating new plan:', planData);
      }
      
      // Refresh the data list in background
      await fetchTravelPlans();
      setIsEditing(false);
    } catch (error) {
      setError(error.message || 'Failed to save travel plan');
    }
  };

  const handleDelete = async () => {
    if (!selectedPlan) {
      alert('Please select a record to delete');
      return;
    }

    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        // In real implementation, this would call API
        console.log('Deleting plan:', selectedPlan.tp_tpid);
        fetchTravelPlans();
      } catch (error) {
        setError(error.message || 'Failed to delete travel plan');
      }
    }
  };

  const handleRecordSelect = (record) => {
    setSelectedPlan(record);
    setFormData({
      tp_tpid: record.tp_tpid || '',
      tp_status: record.tp_status || 'Draft',
      tp_packname: record.tp_packname || '',
      tp_packcode: record.tp_packcode || '',
      tp_startdt: record.tp_startdt ? new Date(record.tp_startdt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      tp_enddt: record.tp_enddt ? new Date(record.tp_enddt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      tp_sourcecity: record.tp_sourcecity || '',
      tp_destcity: record.tp_destcity || '',
      tp_duration: record.tp_duration || 0,
      tp_baseprice: record.tp_baseprice || 0,
      tp_perpersonorgroup: record.tp_perpersonorgroup || 'Per Person',
      tp_taxmode: record.tp_taxmode || 'Auto',
      tp_discount: record.tp_discount || 0,
      tp_finalamount: record.tp_finalamount || 0,
      tp_traveltype: record.tp_traveltype || 'Mixed',
      tp_foodincluded: record.tp_foodincluded || false,
      tp_stayincluded: record.tp_stayincluded || false,
      tp_destinations: record.tp_destinations || '',
      tp_itinerary: record.tp_itinerary || '',
      tp_terms: record.tp_terms || '',
      tp_cancellation: record.tp_cancellation || '',
      tp_notes: record.tp_notes || '',
      tp_maxcapacity: record.tp_maxcapacity || 0,
      tp_minparticipants: record.tp_minparticipants || 0,
      tp_agelimit: record.tp_agelimit || '',
      tp_applybydate: record.tp_applybydate ? new Date(record.tp_applybydate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      tp_visibletocustomer: record.tp_visibletocustomer || false,
      tp_notifyall: record.tp_notifyall || false,
      tp_notifygroups: record.tp_notifygroups || '',
      createdOn: record.createdOn || new Date().toISOString(),
      createdBy: record.createdBy || 'system',
      modifiedOn: record.modifiedOn || '',
      modifiedBy: record.modifiedBy || '',
      closedOn: record.closedOn || '',
      closedBy: record.closedBy || ''
    });
    
    // Set inclusions
    setInclusions({
      travel: record.tp_traveltype ? true : false,
      food: record.tp_foodincluded || false,
      stay: record.tp_stayincluded || false
    });
    
    // Set destinations
    if (record.destinations) {
      setDestinations(record.destinations);
    } else {
      setDestinations([record.tp_destinations || '']);
    }
    
    setIsEditing(false);
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

  // Pagination
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return filteredTravelPlans.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredTravelPlans.length / recordsPerPage);
  const paginatedData = getPaginatedData();

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
        <button className="erp-button" onClick={handleNew}>New</button>
        <button className="erp-button" onClick={handleEdit}>Edit</button>
        <button className="erp-button" onClick={handleDelete}>Delete</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={handleSave} disabled={!isEditing}>Save</button>
        <button className="erp-button" onClick={fetchTravelPlans}>Refresh</button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button">Filters</button>
        <button className="erp-button">Print</button>
        <button className="erp-button">Export</button>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="erp-main-content">
        {/* Center Content - Now takes full space since left sidebar is removed */}
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
                disabled={!isEditing}
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
                disabled={!isEditing}
                placeholder="e.g. Delhi to Manali (4D/3N)"
              />
              <label className="erp-form-label">Package Code</label>
              <input
                type="text"
                name="tp_packcode"
                className="erp-input"
                value={formData.tp_packcode}
                onChange={handleInputChange}
                disabled={!isEditing}
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
                disabled={!isEditing}
              />
              <label className="erp-form-label">End Date & Time</label>
              <input
                type="date"
                name="tp_enddt"
                className="erp-input"
                value={formData.tp_enddt}
                onChange={handleInputChange}
                disabled={!isEditing}
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
                disabled={!isEditing}
              />
              <label className="erp-form-label">Destination City</label>
              <input
                type="text"
                name="tp_destcity"
                className="erp-input"
                value={formData.tp_destcity}
                onChange={handleInputChange}
                disabled={!isEditing}
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
                disabled={!isEditing}
              />
              <label className="erp-form-label">Per Person / Per Group</label>
              <select
                name="tp_perpersonorgroup"
                className="erp-input"
                value={formData.tp_perpersonorgroup}
                onChange={handleInputChange}
                disabled={!isEditing}
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
                disabled={!isEditing}
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
                disabled={!isEditing}
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
                    disabled={!isEditing}
                  />
                  Travel (Bus / Train / Cab / Mixed)
                </label>
                <label className="erp-checkbox-item">
                  <input
                    type="checkbox"
                    name="food"
                    checked={inclusions.food}
                    onChange={handleInclusionChange}
                    disabled={!isEditing}
                  />
                  Food (Breakfast / Lunch / Dinner)
                </label>
                <label className="erp-checkbox-item">
                  <input
                    type="checkbox"
                    name="stay"
                    checked={inclusions.stay}
                    onChange={handleInclusionChange}
                    disabled={!isEditing}
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
                      disabled={!isEditing}
                      placeholder="Enter destination..."
                      style={{ flex: 1 }}
                    />
                    {destinations.length > 1 && (
                      <button 
                        type="button" 
                        className="erp-button" 
                        style={{ padding: '2px 8px', fontSize: '11px' }} 
                        onClick={() => removeDestination(index)}
                        disabled={!isEditing}
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
                  disabled={!isEditing}
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
                disabled={!isEditing}
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
                disabled={!isEditing}
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
                disabled={!isEditing}
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
                disabled={!isEditing}
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
                disabled={!isEditing}
              />
              <label className="erp-form-label">Minimum Participants</label>
              <input
                type="number"
                name="tp_minparticipants"
                className="erp-input"
                value={formData.tp_minparticipants}
                onChange={handleInputChange}
                disabled={!isEditing}
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
                disabled={!isEditing}
                placeholder="e.g. 5 years and above"
              />
              <label className="erp-form-label">Last Date to Apply</label>
              <input
                type="date"
                name="tp_applybydate"
                className="erp-input"
                value={formData.tp_applybydate}
                onChange={handleInputChange}
                disabled={!isEditing}
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
                    disabled={!isEditing}
                  />
                  Visible to Customers (Yes / No)
                </label>
                <label className="erp-checkbox-item">
                  <input
                    type="checkbox"
                    name="tp_notifyall"
                    checked={formData.tp_notifyall}
                    onChange={handleInputChange}
                    disabled={!isEditing}
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
                disabled={!isEditing}
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

          {/* Data Grid - Scrollable */}
          <div className="erp-grid-section">
            <div className="erp-panel-header">Travel Plan Records</div>
            <div className="grid-toolbar">
              <input
                type="text"
                placeholder="Quick search..."
                className="filter-input"
                style={{ width: '200px' }}
              />
              <button className="erp-button">Filter</button>
              <button className="erp-button">Clear</button>
            </div>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
            ) : (
              <div className="erp-grid-container" style={{ maxHeight: 'calc(100vh - 450px)', overflowY: 'auto' }}>
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th style={{ width: '30px' }}><input type="checkbox" /></th>
                      <th>Plan ID</th>
                      <th>Package Name</th>
                      <th>Dates</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Applications</th>
                    </tr>
                    {/* Inline Filter Row */}
                    <tr className="inline-filter-row">
                      <td></td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters['tp_tpid'] || ''}
                          onChange={(e) => handleInlineFilterChange('tp_tpid', e.target.value)}
                          placeholder="Filter ID..."
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters['tp_packname'] || ''}
                          onChange={(e) => handleInlineFilterChange('tp_packname', e.target.value)}
                          placeholder="Filter package..."
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-filter-input"
                          value={inlineFilters['dates'] || ''}
                          onChange={(e) => handleInlineFilterChange('dates', e.target.value)}
                          placeholder="Filter dates..."
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="inline-filter-input"
                          value={inlineFilters['tp_finalamount'] || ''}
                          onChange={(e) => handleInlineFilterChange('tp_finalamount', e.target.value)}
                          placeholder="Filter price..."
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                      <td>
                        <select
                          className="inline-filter-input"
                          value={inlineFilters['tp_status'] || ''}
                          onChange={(e) => handleInlineFilterChange('tp_status', e.target.value)}
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        >
                          <option value="">All</option>
                          <option value="Draft">Draft</option>
                          <option value="Active">Active</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="inline-filter-input"
                          value={inlineFilters['applications'] || ''}
                          onChange={(e) => handleInlineFilterChange('applications', e.target.value)}
                          placeholder="Filter apps..."
                          style={{ width: '100%', padding: '2px', fontSize: '11px', backgroundColor: '#f0f0f0' }}
                        />
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length === 0 ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center' }}>No records found</td></tr>
                    ) : (
                      paginatedData.map((record, idx) => {
                        const isSelected = selectedPlan && selectedPlan.tp_tpid === record.tp_tpid;
                        return (
                          <tr 
                            key={idx}
                            className={isSelected ? 'selected' : ''}
                            onClick={() => handleRecordSelect(record)}
                          >
                            <td><input type="checkbox" checked={!!isSelected} onChange={() => {}} /></td>
                            <td>{record.tp_tpid}</td>
                            <td>{record.tp_packname}</td>
                            <td>{new Date(record.tp_startdt).toLocaleDateString()} to {new Date(record.tp_enddt).toLocaleDateString()}</td>
                            <td>₹{record.tp_finalamount?.toLocaleString() || record.tp_baseprice?.toLocaleString() || '0'}</td>
                            <td>{record.tp_status}</td>
                            <td>{record.applications || 0}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Filter Panel */}
        <div className="erp-filter-panel">
          <div className="erp-filter-header">
            Filter Criteria
            {(filteredTravelPlans.length !== travelPlans.length) && (
              <span className="erp-filter-indicator">{filteredTravelPlans.length}/{travelPlans.length}</span>
            )}
          </div>
          
          <div className="erp-form-row">
            <label className="erp-form-label">Plan ID</label>
            <input 
              type="text" 
              className="erp-input"
              value={inlineFilters['tp_tpid'] || ''}
              onChange={(e) => handleInlineFilterChange('tp_tpid', e.target.value)}
              placeholder="Search ID..."
            />
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">Package Name</label>
            <input 
              type="text" 
              className="erp-input"
              value={inlineFilters['tp_packname'] || ''}
              onChange={(e) => handleInlineFilterChange('tp_packname', e.target.value)}
              placeholder="Search package..."
            />
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">Status</label>
            <select 
              className="erp-input"
              value={inlineFilters['tp_status'] || ''}
              onChange={(e) => handleInlineFilterChange('tp_status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div className="erp-form-row">
            <label className="erp-form-label">Price Range</label>
            <input 
              type="text" 
              className="erp-input"
              value={inlineFilters['priceRange'] || ''}
              onChange={(e) => handleInlineFilterChange('priceRange', e.target.value)}
              placeholder="e.g. 10000-20000"
            />
          </div>
          
          <div style={{ marginTop: '12px', display: 'flex', gap: '4px' }}>
            <button 
              className="erp-button" 
              style={{ flex: 1 }}
              onClick={() => {
                setInlineFilters({});
                fetchTravelPlans();
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar - Static */}
      <div className="erp-status-bar">
        <div className="erp-status-item">{isEditing ? 'Editing' : 'Ready'}</div>
        <div className="erp-status-item">
          Records: {filteredTravelPlans.length !== travelPlans.length ? `${filteredTravelPlans.length}/${travelPlans.length}` : filteredTravelPlans.length}
        </div>
        <div className="erp-status-item">
          Showing: {paginatedData.length > 0 ? `${((currentPage - 1) * recordsPerPage) + 1}-${Math.min(currentPage * recordsPerPage, filteredTravelPlans.length)}` : '0'} of {filteredTravelPlans.length}
        </div>
        <div className="erp-status-item" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button 
            className="erp-icon-button" 
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            title="First Page"
          >
            |◀
          </button>
          <button 
            className="erp-icon-button" 
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            title="Previous Page"
          >
            ◀
          </button>
          <span style={{ margin: '0 4px', fontSize: '11px' }}>Page {currentPage}/{totalPages || 1}</span>
          <button 
            className="erp-icon-button" 
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            title="Next Page"
          >
            ▶
          </button>
          <button 
            className="erp-icon-button" 
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            title="Last Page"
          >
            ▶|
          </button>
        </div>
      </div>
    </div>
  );
};

export default TravelPlans;