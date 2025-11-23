import React, { useState, useEffect } from 'react';
import { travelPlanApi } from '../utils/travelPlanApi';
import '../styles/vintage-theme.css';

const ShareTravelPlanModal = ({ plan, onClose, onShareSuccess }) => {
  const [isPublic, setIsPublic] = useState(false);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSharedUsers();
  }, [plan]);

  const fetchSharedUsers = async () => {
    try {
      const data = await travelPlanApi.getSharedUsers(plan.tp_tpid);
      setIsPublic(data.isPublic);
      setSharedUsers(data.sharedWith || []);
    } catch (err) {
      console.error('Error fetching shared users:', err);
    }
  };

  const handleShare = async () => {
    if (!userEmail.trim()) return;

    try {
      setLoading(true);
      // First, we need to get the user ID by email
      // In a real app, you'd have an endpoint to search users by email
      // For now, we'll just show an error if email is not valid format
      if (!userEmail.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // In a real implementation, you would:
      // 1. Call an API to find user by email
      // 2. Get their user ID
      // 3. Share the plan with that user ID
      // For now, we'll simulate this with a mock implementation
      
      setError('In a complete implementation, you would search for users by email and share the plan with them.');
    } catch (err) {
      setError(err.message || 'Failed to share travel plan');
    } finally {
      setLoading(false);
    }
  };

  const togglePublic = async () => {
    try {
      setLoading(true);
      await api.post(`/travel-plans/${plan.tp_tpid}/share`, {
        isPublic: !isPublic
      });
      setIsPublic(!isPublic);
      onShareSuccess();
    } catch (err) {
      setError('Failed to update public status');
      console.error('Error updating public status:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeUser = async (userId) => {
    try {
      setLoading(true);
      // Get current shared users
      const currentSharedUsers = sharedUsers.map(user => user.us_usid);
      // Remove the user
      const newSharedUsers = currentSharedUsers.filter(id => id !== userId);
      
      await api.post(`/travel-plans/${plan.tp_tpid}/share`, {
        userIDs: newSharedUsers
      });
      
      // Refresh the shared users list
      fetchSharedUsers();
      onShareSuccess();
    } catch (err) {
      setError('Failed to remove user');
      console.error('Error removing user:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header panel-header">
          <h3>Share Travel Plan: {plan.tp_title}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          
          <div className="share-option">
            <div className="share-option-header">
              <h4>Make Public</h4>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={togglePublic}
                  disabled={loading}
                />
                <span className="slider"></span>
              </label>
            </div>
            <p className="help-text">
              {isPublic 
                ? 'This plan is publicly visible to all users.' 
                : 'Make this plan visible to all users.'}
            </p>
          </div>
          
          <div className="share-option">
            <h4>Share with Specific Users</h4>
            <div className="share-form form-row">
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="Enter user email"
                disabled={loading}
                className="form-control"
              />
              <button 
                className="btn btn-primary"
                onClick={handleShare}
                disabled={loading || !userEmail.trim()}
              >
                {loading ? 'Sharing...' : 'Share'}
              </button>
            </div>
            
            {sharedUsers.length > 0 && (
              <div className="shared-users">
                <h5>Currently Shared With:</h5>
                <ul>
                  {sharedUsers.map(user => (
                    <li key={user.us_usid} className="form-row">
                      <span>{user.us_fname} {user.us_lname} ({user.us_email})</span>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => removeUser(user.us_usid)}
                        disabled={loading}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ShareTravelPlanModal;