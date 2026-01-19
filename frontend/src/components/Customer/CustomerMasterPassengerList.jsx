// Customer Master Passenger List Component
// Allows customers to maintain a master passenger list for reuse in bookings
// As per YatraSathi specification requirement #13

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useKeyboardNav } from '../../hooks/useKeyboardNavigation';
import { usePassengerEntry } from '../../hooks/usePassengerEntry';
import SaveConfirmationModal from '../common/SaveConfirmationModal';
import '../../styles/vintage-erp-theme.css';

const CustomerMasterPassengerList = () => {
  const { user } = useAuth();
  const [masterPassengers, setMasterPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState(null);

  // Define field order for keyboard navigation
  const fieldOrder = [
    'passenger_name',
    'passenger_age',
    'passenger_gender',
    'passenger_berth',
    'passenger_id_type',
    'passenger_id_number'
  ];

  // Initialize keyboard navigation
  const {
    formRef,
    saveConfirmationOpen,
    focusField
  } = useKeyboardNav({
    fieldOrder,
    autoFocus: true,
    onSave: handleSaveConfirmed,
    onCancel: () => setIsEditing(false)
  });

  // Initialize passenger entry system for adding new passengers
  const {
    passengerData,
    passengerList,
    isInLoop,
    handlePassengerTab,
    handlePassengerEnter,
    enterPassengerLoop,
    exitPassengerLoop,
    getFieldProps,
    updatePassengerField
  } = usePassengerEntry({
    passengerFields: ['name', 'age', 'gender', 'berth', 'id_type', 'id_number'],
    onPassengerSave: (passenger) => {
      // Add to master list
      addToMasterList(passenger);
    },
    onLoopExit: () => {
      // Exit passenger entry mode
      setIsEditing(false);
    },
    onPassengerValidate: (data) => {
      if (!data.name || data.name.trim() === '') {
        return { isValid: false, error: 'Passenger name is required', invalidField: 'name' };
      }
      if (!data.age || data.age < 1 || data.age > 120) {
        return { isValid: false, error: 'Valid age is required', invalidField: 'age' };
      }
      return { isValid: true };
    }
  });

  // Fetch master passenger list on component mount
  useEffect(() => {
    fetchMasterPassengers();
  }, []);

  // Fetch master passengers for current customer
  const fetchMasterPassengers = async () => {
    try {
      setLoading(true);
      
      // Search for passengers associated with this customer
      const response = await fetch(`/api/passengers/search?customerId=${user.us_usid}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMasterPassengers(data.passengers || []);
        } else {
          setError('Failed to fetch master passenger list');
        }
      } else {
        setError('Failed to fetch master passenger list');
      }
    } catch (error) {
      console.error('Error fetching master passengers:', error);
      setError('Failed to fetch master passenger list');
    } finally {
      setLoading(false);
    }
  };

  // Add passenger to master list
  const addToMasterList = async (passenger) => {
    try {
      // Create a master passenger record
      const masterPassenger = {
        ps_fname: passenger.name,
        ps_age: passenger.age,
        ps_gender: passenger.gender,
        ps_berthpref: passenger.berth,
        ps_idtype: passenger.id_type,
        ps_idno: passenger.id_number,
        customerId: user.us_usid
      };

      // Add to local state immediately for UI responsiveness
      setMasterPassengers(prev => [...prev, masterPassenger]);
      setSuccess('Passenger added to master list');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error adding to master list:', error);
      setError('Failed to add passenger to master list');
    }
  };

  // Remove passenger from master list
  const removeFromMasterList = (index) => {
    if (window.confirm('Are you sure you want to remove this passenger from your master list?')) {
      setMasterPassengers(prev => prev.filter((_, i) => i !== index));
      setSuccess('Passenger removed from master list');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // Handle save confirmation
  const handleSaveConfirmed = async () => {
    // Save logic would go here if needed
    setIsEditing(false);
  };

  // Start adding new passenger
  const handleAddNew = () => {
    setIsEditing(true);
    enterPassengerLoop();
  };

  // Use passenger in booking (callback for parent component)
  const handleUsePassenger = (passenger) => {
    // This would be called by parent component to use passenger in booking
    if (window.onUsePassenger) {
      window.onUsePassenger(passenger);
    }
  };

  return (
    <div className="erp-admin-container" ref={formRef}>
      {/* Header */}
      <div className="erp-panel-header">
        Master Passenger List
        <div style={{ fontSize: '11px', fontWeight: 'normal', marginTop: '2px' }}>
          Maintain your frequently used passengers for quick booking
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="error-message" style={{ 
          background: '#ffebee', 
          border: '1px solid #f44336', 
          padding: '8px', 
          marginBottom: '10px',
          fontSize: '12px'
        }}>
          {error}
        </div>
      )}
      
      {success && (
        <div className="success-message" style={{ 
          background: '#e8f5e8', 
          border: '1px solid #4caf50', 
          padding: '8px', 
          marginBottom: '10px',
          fontSize: '12px'
        }}>
          {success}
        </div>
      )}

      {/* Add New Passenger Section */}
      <div className="erp-form-section" style={{ marginBottom: '20px' }}>
        <div className="erp-form-row">
          <button 
            className="erp-button" 
            onClick={handleAddNew}
            disabled={isEditing}
          >
            Add New Passenger to Master List
          </button>
          {masterPassengers.length > 0 && (
            <span style={{ marginLeft: '20px', fontSize: '12px', color: '#666' }}>
              Total: {masterPassengers.length} passengers in master list
            </span>
          )}
        </div>

        {/* Passenger Entry Fields - Only visible when adding */}
        {isInLoop && (
          <div className="passenger-entry-section" style={{ 
            border: '2px solid #007acc', 
            padding: '10px', 
            marginTop: '10px',
            backgroundColor: '#f0f8ff' 
          }}>
            <div className="erp-form-row">
              <label className="erp-form-label">Name</label>
              <input
                type="text"
                {...getFieldProps('name')}
                className="erp-input"
                placeholder="Enter passenger name"
              />
              <label className="erp-form-label">Age</label>
              <input
                type="number"
                {...getFieldProps('age')}
                className="erp-input"
                placeholder="Age"
                min="1"
                max="120"
              />
            </div>
            <div className="erp-form-row">
              <label className="erp-form-label">Gender</label>
              <select
                {...getFieldProps('gender')}
                className="erp-input"
              >
                <option value="">Select</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
              <label className="erp-form-label">Berth Preference</label>
              <select
                {...getFieldProps('berth')}
                className="erp-input"
              >
                <option value="">Any</option>
                <option value="LB">Lower Berth</option>
                <option value="UB">Upper Berth</option>
                <option value="MB">Middle Berth</option>
              </select>
            </div>
            <div className="erp-form-row">
              <label className="erp-form-label">ID Type</label>
              <select
                {...getFieldProps('id_type')}
                className="erp-input"
              >
                <option value="">Select</option>
                <option value="AADHAAR">Aadhaar</option>
                <option value="PAN">PAN Card</option>
                <option value="PASSPORT">Passport</option>
                <option value="VOTER">Voter ID</option>
                <option value="DRIVING">Driving License</option>
              </select>
              <label className="erp-form-label">ID Number</label>
              <input
                type="text"
                {...getFieldProps('id_number')}
                className="erp-input"
                placeholder="ID number"
              />
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
              Press Tab to save passenger to master list. Double-Tab on empty fields to exit.
            </div>
          </div>
        )}
      </div>

      {/* Master Passenger List Display */}
      <div className="erp-grid-section">
        <div className="erp-panel-header">Your Master Passenger List</div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
        ) : masterPassengers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            No passengers in your master list. Add passengers above to build your master list.
          </div>
        ) : (
          <div className="erp-grid-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Name</th>
                  <th style={{ width: '10%' }}>Age</th>
                  <th style={{ width: '10%' }}>Gender</th>
                  <th style={{ width: '15%' }}>Berth Pref</th>
                  <th style={{ width: '15%' }}>ID Type</th>
                  <th style={{ width: '15%' }}>ID Number</th>
                  <th style={{ width: '10%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {masterPassengers.map((passenger, index) => (
                  <tr key={index}>
                    <td>{passenger.ps_fname} {passenger.ps_lname || ''}</td>
                    <td>{passenger.ps_age}</td>
                    <td>{passenger.ps_gender}</td>
                    <td>{passenger.ps_berthpref || 'Any'}</td>
                    <td>{passenger.ps_idtype || '-'}</td>
                    <td>{passenger.ps_idno || '-'}</td>
                    <td>
                      <button 
                        className="erp-button" 
                        style={{ padding: '2px 6px', fontSize: '11px', marginRight: '4px' }}
                        onClick={() => handleUsePassenger(passenger)}
                        title="Use in booking"
                      >
                        Use
                      </button>
                      <button 
                        className="erp-button" 
                        style={{ padding: '2px 6px', fontSize: '11px' }}
                        onClick={() => removeFromMasterList(index)}
                        title="Remove from master list"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{ 
        marginTop: '20px', 
        padding: '10px', 
        background: '#f8f8f8', 
        border: '1px solid #ddd',
        fontSize: '11px',
        color: '#666'
      }}>
        <strong>How to use Master Passenger List:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>Add frequently used passengers to your master list</li>
          <li>Use "Use" button to quickly add passenger to new bookings</li>
          <li>No limit on number of passengers in master list</li>
          <li>Master list is private to your account</li>
        </ul>
      </div>

      {/* Save Confirmation Modal */}
      <SaveConfirmationModal
        isOpen={saveConfirmationOpen}
        onConfirm={handleSaveConfirmed}
        onCancel={() => setIsEditing(false)}
        message="Save changes to master passenger list?"
      />
    </div>
  );
};

export default CustomerMasterPassengerList;