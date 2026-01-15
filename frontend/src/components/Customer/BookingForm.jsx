import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/booking-form.css';

const BookingForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    journeyDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0], // Tomorrow's date by default
    trainClass: 'SL',
    trainPreferences: [], // Array to store multiple train preferences
    passengers: [
      { name: '', age: '', gender: 'M', berthPreference: 'NO_PREF' }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const trainClasses = [
    { value: 'SL', label: 'Sleeper (SL)' },
    { value: '3A', label: '3rd AC (3A)' },
    { value: '2A', label: '2nd AC (2A)' },
    { value: '1A', label: '1st AC (1A)' },
    { value: 'CC', label: 'Chair Car (CC)' }
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePassengerChange = (index, field, value) => {
    const updatedPassengers = [...formData.passengers];
    updatedPassengers[index][field] = value;
    setFormData(prev => ({
      ...prev,
      passengers: updatedPassengers
    }));
  };

  const addPassenger = () => {
    setFormData(prev => ({
      ...prev,
      passengers: [...prev.passengers, { name: '', age: '', gender: 'M', berthPreference: 'NO_PREF' }]
    }));
  };



  const removePassenger = (index) => {
    if (formData.passengers.length > 1) {
      const updatedPassengers = formData.passengers.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        passengers: updatedPassengers
      }));
    }
  };

  const validateStep1 = () => {
    if (!formData.from || !formData.to || !formData.journeyDate) {
      setError('Please fill in all journey details');
      return false;
    }
    
    const journeyDate = new Date(formData.journeyDate);
    const today = new Date();
    const tomorrow = new Date(today);
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
    for (let i = 0; i < formData.passengers.length; i++) {
      const passenger = formData.passengers[i];
      if (!passenger.name || !passenger.age) {
        setError(`Please fill in details for passenger ${i + 1}`);
        return false;
      }
      
      const age = parseInt(passenger.age);
      if (isNaN(age) || age < 1 || age > 120) {
        setError(`Please enter a valid age for passenger ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    setError('');
    
    if (currentStep === 1 && !validateStep1()) {
      return;
    }
    
    if (currentStep === 2 && !validateStep2()) {
      return;
    }
    
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const submitBooking = async () => {
    if (!validateStep2()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/customer/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          passengers: formData.passengers,
          berthPreference: formData.passengers[0]?.berthPreference || 'NO_PREF' // Use first passenger's preference as overall preference
        })
      });

      const data = await response.json();

      if (data.success) {
        navigate('/customer/bookings', {
          state: { 
            message: 'Booking created successfully! You will be contacted by our agent soon.',
            bookingId: data.data.bookingId
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
            type="text"
            name="from"
            value={formData.from}
            onChange={handleInputChange}
            placeholder="Enter departure station (e.g., New Delhi, Mumbai Central)"
            required
            className="wide-input"
          />
        </div>
                
        <div className="form-group full-width">
          <label>To Station *</label>
          <input
            type="text"
            name="to"
            value={formData.to}
            onChange={handleInputChange}
            placeholder="Enter destination station (e.g., Chennai Central, Bangalore City)"
            required
            className="wide-input"
          />
        </div>
      
        <div className="form-group full-width">
          <label>Journey Date *</label>
          <input
            type="date"
            name="journeyDate"
            value={formData.journeyDate}
            onChange={handleInputChange}
            min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
            required
            className="wide-input"
          />
        </div>
      
        <div className="form-group full-width">
          <label>Class *</label>
          <select
            name="trainClass"
            value={formData.trainClass}
            onChange={handleInputChange}
            className="wide-input"
          >
            {trainClasses.map(cls => (
              <option key={cls.value} value={cls.value}>
                {cls.label}
              </option>
            ))}
          </select>
        </div>
      
        <div className="form-group full-width">
          <label>Train Preferences (Optional)</label>
          <input
            type="text"
            name="trainPreferences"
            value={formData.trainPreferences.join(', ')}
            onChange={(e) => {
              const preferences = e.target.value.split(',').map(pref => pref.trim()).filter(pref => pref);
              setFormData(prev => ({
                ...prev,
                trainPreferences: preferences
              }));
            }}
            placeholder="Enter train numbers separated by commas (e.g., 12345, 67890, 11223)"
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
      
      {formData.passengers.map((passenger, index) => (
        <div key={index} className="passenger-card">
          <div className="passenger-header">
            <div className="passenger-title">
              <h4>Passenger {index + 1}</h4>
            </div>
            {formData.passengers.length > 1 && (
              <button
                type="button"
                onClick={() => removePassenger(index)}
                className="remove-passenger"
                title="Remove Passenger"
              >
                <i className="fas fa-times"></i>
                Remove
              </button>
            )}
          </div>
          
          <div className="passenger-details-grid">
            <div className="passenger-field">
              <label>Full Name</label>
              <input
                type="text"
                value={passenger.name}
                onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>
            
            <div className="passenger-field">
              <label>Age</label>
              <input
                type="number"
                value={passenger.age}
                onChange={(e) => handlePassengerChange(index, 'age', e.target.value)}
                placeholder="Age"
                min="1"
                max="120"
                required
              />
            </div>
            
            <div className="passenger-field">
              <label>Gender</label>
              <select
                value={passenger.gender}
                onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
            
            <div className="passenger-field">
              <label>Berth Preference</label>
              <select
                value={passenger.berthPreference}
                onChange={(e) => handlePassengerChange(index, 'berthPreference', e.target.value)}
              >
                {berthPreferences.map(pref => (
                  <option key={pref.value} value={pref.value}>
                    {pref.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}
      
      <div className="passenger-actions">
        <button
          type="button"
          onClick={addPassenger}
          className="add-passenger"
        >
          <i className="fas fa-plus"></i>
          Add Another Passenger
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="booking-step">
      <h3>Review & Submit</h3>
      
      <div className="booking-summary">
        <div className="summary-section">
          <h4>Journey Details</h4>
          <div className="summary-item">
            <span>Route:</span>
            <span>{formData.from} → {formData.to}</span>
          </div>
          <div className="summary-item">
            <span>Date:</span>
            <span>{new Date(formData.journeyDate).toLocaleDateString()}</span>
          </div>
          <div className="summary-item">
            <span>Class:</span>
            <span>{trainClasses.find(c => c.value === formData.trainClass)?.label}</span>
          </div>

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
            <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
              <span>1</span>
              <label>Journey</label>
            </div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
              <span>2</span>
              <label>Passengers</label>
            </div>
            <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
              <span>3</span>
              <label>Review</label>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={(e) => e.preventDefault()}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            <div className="form-actions">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn-outline"
                  disabled={loading}
                >
                  Previous
                </button>
              )}
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn-primary"
                  disabled={loading}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitBooking}
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