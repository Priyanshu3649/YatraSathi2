import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { masterPassengerAPI } from '../../services/api';
import '../../styles/booking-form.css';

const BookingForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    journeyDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
    trainClass: 'SL',
    trainPreferences: [],
    passengers: [],
    advanceAmount: ''
  });
  const [activePassenger, setActivePassenger] = useState({ name: '', age: '', gender: 'M', berthPreference: 'NO_PREF' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customerProfile, setCustomerProfile] = useState({ name: '', phone: '' });
  const [masterPassengers, setMasterPassengers] = useState([]);
  const navigate = useNavigate();

  const calculateAge = (dob) => {
    if (!dob) return '';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970).toString();
  };

  // ── Step 1 refs ──
  const fromRef = useRef(null);
  const toRef = useRef(null);
  const dateRef = useRef(null);
  const classRef = useRef(null);
  const trainPrefRef = useRef(null);
  const nextBtnRef = useRef(null);

  // ── Step 2 refs (for the LAST passenger row being entered) ──
  const nameRef = useRef(null);
  const ageRef = useRef(null);
  const genderRef = useRef(null);
  const berthRef = useRef(null);
  const addPassengerRef = useRef(null);

  // ── Step 3 ref ──
  const submitRef = useRef(null);

  // Load customer profile + master passengers
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const fullName = `${stored.us_fname || ''} ${stored.us_lname || ''}`.trim() || stored.name || stored.us_usname || 'Customer';
      const phoneNum = (stored.us_phone && stored.us_phone !== '0000000000') ? stored.us_phone : (stored.phone || '9876543210');
      setCustomerProfile({
        name: fullName,
        phone: phoneNum,
      });
    } catch (_) {}

    masterPassengerAPI.getMasterPassengers()
      .then(res => { if (res.success) setMasterPassengers(res.data || []); })
      .catch(() => {});
  }, []);

  // Auto-focus on step change
  useEffect(() => {
    if (currentStep === 1) setTimeout(() => fromRef.current?.focus(), 60);
    if (currentStep === 2) setTimeout(() => nameRef.current?.focus(), 60);
    if (currentStep === 3) setTimeout(() => submitRef.current?.focus(), 60);
  }, [currentStep]);

  const trainClasses = [
    { value: 'SL',  label: 'Sleeper (SL)' },
    { value: '3A',  label: '3rd AC (3A)' },
    { value: '2A',  label: '2nd AC (2A)' },
    { value: '1A',  label: '1st AC (1A)' },
    { value: 'CC',  label: 'Chair Car (CC)' },
    { value: '2S',  label: '2nd Sitting (2S)' },
    { value: 'EC',  label: 'Executive Chair Car (EC)' },
    { value: '3E',  label: '3rd AC Economy (3E)' },
    { value: 'FC',  label: 'First Class (FC)' },
    { value: 'GN',  label: 'General / Unreserved (GN)' }
  ];

  const berthPreferences = [
    { value: 'NO_PREF', label: 'No Preference' },
    { value: 'LOWER', label: 'Lower Berth' },
    { value: 'MIDDLE', label: 'Middle Berth' },
    { value: 'UPPER', label: 'Upper Berth' },
    { value: 'SIDE_LOWER', label: 'Side Lower' },
    { value: 'SIDE_UPPER', label: 'Side Upper' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

    const handleActivePassengerChange = (e) => {
    const { name, value } = e.target;
    setActivePassenger(prev => ({ ...prev, [name]: value }));
  };

  const commitActivePassenger = () => {
    if (!activePassenger.name || !activePassenger.age) {
      setError('Please fill in name and age before adding to the list.');
      nameRef.current?.focus();
      return false;
    }
    const age = parseInt(activePassenger.age);
    if (isNaN(age) || age < 1 || age > 120) {
      setError('Please enter a valid age.');
      return false;
    }
    setError('');
    setFormData(prev => ({
      ...prev,
      passengers: [...prev.passengers, activePassenger]
    }));
    setActivePassenger({ name: '', age: '', gender: 'M', berthPreference: 'NO_PREF' });
    setTimeout(() => nameRef.current?.focus(), 60);
    return true;
  };

  const addMasterPassengerToGrid = (passenger) => {
    let pref = 'NO_PREF';
    const validPrefs = ['NO_PREF', 'LOWER', 'MIDDLE', 'UPPER', 'SIDE_LOWER', 'SIDE_UPPER'];
    if (passenger.mp_birthpref && validPrefs.includes(passenger.mp_birthpref)) {
      pref = passenger.mp_birthpref;
    }
    setFormData(prev => ({
      ...prev,
      passengers: [
        ...prev.passengers,
        {
          name: passenger.mp_name,
          age: passenger.mp_dob ? calculateAge(passenger.mp_dob) : (passenger.mp_age || ''),
          gender: passenger.mp_gender || 'M',
          berthPreference: pref
        }
      ]
    }));
  };

  const removePassenger = (index) => {
    setFormData(prev => ({
      ...prev,
      passengers: prev.passengers.filter((_, i) => i !== index)
    }));
  };

  const editPassenger = (index) => {
    setActivePassenger(formData.passengers[index]);
    removePassenger(index);
    setTimeout(() => nameRef.current?.focus(), 60);
  };

  const validateStep1 = () => {
    if (!formData.from || !formData.to || !formData.journeyDate) {
      setError('Please fill in all journey details');
      return false;
    }
    const journeyDate = new Date(formData.journeyDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    if (journeyDate < tomorrow) {
      setError('Journey date cannot be in the past or today');
      return false;
    }
    if (formData.from === formData.to) {
      setError('From and To stations cannot be the same');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    // Ensure either we have committed passengers or the active one is valid and committed
    if (activePassenger.name || activePassenger.age) {
      if (!commitActivePassenger()) return false;
      return true; // if commit succeeds, we have at least 1 passenger
    }
    
    if (formData.passengers.length === 0) {
      setError('Please add at least one passenger.');
      nameRef.current?.focus();
      return false;
    }
    return true;
  };

  const nextStep = useCallback(() => {
    setError('');
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep(prev => prev + 1);
  }, [currentStep, formData]);

  const prevStep = () => setCurrentStep(prev => prev - 1);

  // ── Tab key handler for Step 1 fields: move to next ref, last field goes to Next button ──
  const handleStep1Tab = useCallback((e, nextRef) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      if (nextRef === 'nextBtn') {
        // Focus the next button and don't automatically advance
        nextBtnRef.current?.focus();
      } else if (nextRef?.current) {
        nextRef.current.focus();
      }
    }
  }, []);

  // ── Tab key handler for Step 2 passenger fields ──
  const handleAddPassengerKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitActivePassenger();
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      if (activePassenger.name || activePassenger.age) {
        commitActivePassenger();
      } else {
        nextStep();
      }
    }
  };

  // ── Submit button key handler ──
  const handleSubmitKey = useCallback((e) => {
    if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      submitBooking();
    }
  }, [formData, customerProfile, validateStep2]);

  const submitBooking = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const fy = localStorage.getItem('financialYear') || '2026-2027';

      // Map to what the backend createBooking expects
      const payload = {
        fromStation: formData.from,
        toStation: formData.to,
        travelDate: formData.journeyDate,
        travelClass: formData.trainClass,
        berthPreference: formData.passengers[0]?.berthPreference || 'NO_PREF',
        totalPassengers: formData.passengers.length,
        passengerList: formData.passengers.map(p => ({
          name: p.name,
          age: p.age,
          gender: p.gender,
          berthPreference: p.berthPreference,
        })),
        trainPreferences: formData.trainPreferences,
        customerName: customerProfile.name || 'Customer',
        phoneNumber: customerProfile.phone || '9876543210',
        advanceAmount: formData.advanceAmount ? parseFloat(formData.advanceAmount) : 0,
        status: 'DRF',
      };

      const response = await fetch('/api/customer/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Financial-Year': fy,
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        navigate('/customer/bookings', {
          state: {
            message: 'Booking created successfully! You will be contacted by our agent soon.',
            bookingId: data.data?.bk_bkid || data.data?.bookingId
          }
        });
      } else {
        setError(data.error?.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="booking-step">
      <h2 className="journey-heading">Journey Details</h2>

      <div className="journey-form-grid">
        <div className="form-group full-width">
          <label>From Station *</label>
          <input
            ref={fromRef}
            type="text"
            name="from"
            value={formData.from}
            onChange={handleInputChange}
            onKeyDown={(e) => handleStep1Tab(e, toRef)}
            placeholder="Enter departure station (e.g., New Delhi, Mumbai Central)"
            required
            className="wide-input"
          />
        </div>

        <div className="form-group full-width">
          <label>To Station *</label>
          <input
            ref={toRef}
            type="text"
            name="to"
            value={formData.to}
            onChange={handleInputChange}
            onKeyDown={(e) => handleStep1Tab(e, dateRef)}
            placeholder="Enter destination station (e.g., Chennai Central, Bangalore City)"
            required
            className="wide-input"
          />
        </div>

        <div className="form-group full-width">
          <label>Journey Date *</label>
          <input
            ref={dateRef}
            type="date"
            name="journeyDate"
            value={formData.journeyDate}
            onChange={handleInputChange}
            onKeyDown={(e) => handleStep1Tab(e, classRef)}
            min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
            required
            className="wide-input"
          />
        </div>

        <div className="form-group full-width">
          <label>Class *</label>
          <select
            ref={classRef}
            name="trainClass"
            value={formData.trainClass}
            onChange={handleInputChange}
            onKeyDown={(e) => handleStep1Tab(e, trainPrefRef)}
            className="wide-input"
          >
            {trainClasses.map(cls => (
              <option key={cls.value} value={cls.value}>{cls.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group full-width">
          <label>Train Preferences (Optional)</label>
          <input
            ref={trainPrefRef}
            type="text"
            name="trainPreferences"
            value={formData.trainPreferences.join(', ')}
            onChange={(e) => {
              const preferences = e.target.value.split(',').map(p => p.trim()).filter(p => p);
              setFormData(prev => ({ ...prev, trainPreferences: preferences }));
            }}
            onKeyDown={(e) => handleStep1Tab(e, 'nextBtn')}
            placeholder="Enter train numbers separated by commas (e.g., 12345, 67890)"
            className="wide-input"
          />
          <small className="form-help-text">Enter multiple train numbers separated by commas</small>
        </div>
      </div>
    </div>
  );

  
  const renderStep2 = () => (
    <div className="booking-step">
      <h3>Passenger Details</h3>

      {/* Active Form */}
      <div className="vintage-active-form">
        <h4>Add New Passenger</h4>
        <div className="passenger-details-grid">
          <div className="passenger-field">
            <label>Full Name</label>
            <input
              ref={nameRef}
              type="text"
              name="name"
              value={activePassenger.name}
              onChange={handleActivePassengerChange}
              onKeyDown={(e) => { if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); ageRef.current?.focus(); } }}
              placeholder="Enter full name"
              autoFocus
            />
          </div>
          <div className="passenger-field">
            <label>Age</label>
            <input
              ref={ageRef}
              type="number"
              name="age"
              value={activePassenger.age}
              onChange={handleActivePassengerChange}
              onKeyDown={(e) => { if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); genderRef.current?.focus(); } }}
              placeholder="Age"
              min="1"
              max="120"
            />
          </div>
          <div className="passenger-field">
            <label>Gender</label>
            <select
              ref={genderRef}
              name="gender"
              value={activePassenger.gender}
              onChange={handleActivePassengerChange}
              onKeyDown={(e) => { if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); berthRef.current?.focus(); } }}
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </div>
          <div className="passenger-field">
            <label>Berth Preference</label>
            <select
              ref={berthRef}
              name="berthPreference"
              value={activePassenger.berthPreference}
              onChange={handleActivePassengerChange}
              onKeyDown={handleAddPassengerKey}
            >
              {berthPreferences.map(pref => (
                <option key={pref.value} value={pref.value}>{pref.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="add-passenger-btn-container">
          <button type="button" onClick={commitActivePassenger} className="vintage-btn vintage-btn-primary">
            + Add Another Passenger
          </button>
        </div>
      </div>

      {/* Grid View for Committed Passengers */}
      {formData.passengers.length > 0 && (
        <div className="vintage-table-container">
          <table className="vintage-table">
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Berth Pref</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {formData.passengers.map((p, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{p.name}</td>
                  <td>{p.age}</td>
                  <td>{p.gender === 'M' ? 'Male' : (p.gender === 'F' ? 'Female' : 'Other')}</td>
                  <td>{berthPreferences.find(b => b.value === p.berthPreference)?.label || p.berthPreference}</td>
                  <td>
                    <div className="grid-actions">
                      <button type="button" onClick={() => editPassenger(i)} className="grid-action-btn edit">Edit</button>
                      <span>|</span>
                      <button type="button" onClick={() => removePassenger(i)} className="grid-action-btn delete">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {masterPassengers.length > 0 && (
        <div className="vintage-master-list">
          <h4>Saved Passengers (Master List)</h4>
          <div className="vintage-master-cards">
            {masterPassengers.map((mp, idx) => (
              <div key={idx} className="vintage-master-card">
                <div className="vintage-master-card-info">
                  <strong>{mp.mp_name || mp.name}</strong><br/>
                  {mp.mp_dob ? `Age: ${calculateAge(mp.mp_dob)}` : (mp.mp_age ? `Age: ${mp.mp_age}` : '')} | {mp.mp_gender || mp.gender}
                </div>
                <button 
                  type="button" 
                  className="vintage-btn"
                  onClick={() => addMasterPassengerToGrid(mp)}
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="booking-step">
      <h3>Review &amp; Submit</h3>

      <div className="booking-summary">
        <div className="summary-section">
          <h4>Journey Details</h4>
          <div className="summary-item"><span>Route:</span><span>{formData.from} → {formData.to}</span></div>
          <div className="summary-item"><span>Date:</span><span>{new Date(formData.journeyDate).toLocaleDateString()}</span></div>
          <div className="summary-item"><span>Class:</span><span>{trainClasses.find(c => c.value === formData.trainClass)?.label}</span></div>
        </div>

        <div className="summary-section">
          <h4>Passengers ({formData.passengers.length})</h4>
          {formData.passengers.map((passenger, index) => (
            <div key={index} className="passenger-summary">
              <span>{passenger.name}</span>
              <span>{passenger.age} years, {passenger.gender === 'M' ? 'Male' : passenger.gender === 'F' ? 'Female' : 'Other'}, {berthPreferences.find(b => b.value === passenger.berthPreference)?.label}</span>
            </div>
          ))}
        </div>

        <div className="summary-section">
          <h4>Advance Payment</h4>
          <div className="form-group full-width">
            <label>Advance Payment Amount (₹)</label>
            <input
              type="number"
              name="advanceAmount"
              value={formData.advanceAmount}
              onChange={handleInputChange}
              placeholder="Enter advance amount paid by customer (if any)"
              className="wide-input"
              min="0"
              style={{ marginTop: '5px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="booking-form-container">
      <div className="centered-card">
        <div className="booking-form-header">
          <button onClick={() => navigate('/customer/dashboard')} className="back-btn">
            <i className="fas fa-arrow-left"></i>
            Back to Dashboard
          </button>
          <h1>New Booking</h1>
        </div>

        <div className="booking-form-card">
          <div className="step-indicator">
            <div className={`step ${currentStep >= 1 ? 'active' : ''}`}><span>1</span><label>Journey</label></div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''}`}><span>2</span><label>Passengers</label></div>
            <div className={`step ${currentStep >= 3 ? 'active' : ''}`}><span>3</span><label>Review</label></div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={(e) => e.preventDefault()}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            <div className="form-actions">
              {currentStep > 1 && (
                <button type="button" onClick={prevStep} className="btn-outline" disabled={loading}>
                  Previous
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  ref={nextBtnRef}
                  type="button"
                  onClick={nextStep}
                  className="btn-primary"
                  disabled={loading}
                >
                  Next
                </button>
              ) : (
                <button
                  ref={submitRef}
                  type="button"
                  onClick={submitBooking}
                  onKeyDown={handleSubmitKey}
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Creating Booking...' : 'Submit Booking'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
