import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { travelPlanApi } from '../utils/travelPlanApi';
import '../styles/travelPlans.css';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';
import '../styles/vintage-admin-panel.css';
import '../styles/dynamic-admin-panel.css';
import '../styles/vintage-erp-global.css';

const TravelPlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [travelPlan, setTravelPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTravelPlan();
  }, [id]);

  const fetchTravelPlan = async () => {
    try {
      setLoading(true);
      const data = await travelPlanApi.getById(id);
      setTravelPlan(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch travel plan');
      console.error('Error fetching travel plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleBack = () => {
    navigate('/travel-plans');
  };

  if (loading) {
    return <div className="loading panel">Loading travel plan...</div>;
  }

  if (error) {
    return (
      <div className="travel-plan-detail panel">
        <div className="page-header panel-header">
          <h2>Travel Plan Details</h2>
          <button className="btn btn-secondary" onClick={handleBack}>
            Back to Plans
          </button>
        </div>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!travelPlan) {
    return (
      <div className="travel-plan-detail panel">
        <div className="page-header panel-header">
          <h2>Travel Plan Details</h2>
          <button className="btn btn-secondary" onClick={handleBack}>
            Back to Plans
          </button>
        </div>
        <p>Travel plan not found.</p>
      </div>
    );
  }

  return (
    <div className="travel-plan-detail panel">
      <div className="page-header panel-header">
        <h2>Travel Plan Details</h2>
        <button className="btn btn-secondary" onClick={handleBack}>
          Back to Plans
        </button>
      </div>

      <div className="plan-detail-card panel mb-3">
        <div className="plan-header panel-header">
          <h3>{travelPlan.tp_title}</h3>
          {travelPlan.tp_ispublic === 1 && <span className="badge badge-public">Public</span>}
        </div>
        
        <div className="plan-section">
          <h4>Description</h4>
          <p>{travelPlan.tp_description}</p>
        </div>
        
        <div className="plan-section">
          <h4>Travel Dates</h4>
          <p><strong>From:</strong> {formatDate(travelPlan.tp_startdate)}</p>
          <p><strong>To:</strong> {formatDate(travelPlan.tp_enddate)}</p>
        </div>
        
        <div className="plan-section">
          <h4>Destination</h4>
          <p>{travelPlan.tp_destination}</p>
        </div>
        
        <div className="plan-section">
          <h4>Budget</h4>
          <p>₹{parseFloat(travelPlan.tp_budget).toLocaleString()}</p>
        </div>
        
        {travelPlan.tp_activities && (
          <div className="plan-section">
            <h4>Activities</h4>
            <ul>
              {JSON.parse(travelPlan.tp_activities).map((activity, index) => (
                <li key={index}>{activity}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="plan-section">
          <h4>Created By</h4>
          <p>{travelPlan.tp_usid}</p>
        </div>
        
        <div className="plan-section">
          <h4>Created On</h4>
          <p>{formatDate(travelPlan.edtm)}</p>
        </div>
        
        {travelPlan.tp_usid === user.us_usid && (
          <div className="plan-actions panel-header">
            <button 
              className="btn btn-primary mr-2"
              onClick={() => navigate(`/travel-plans/edit/${id}`)}
            >
              Edit Plan
            </button>
            <button 
              className="btn btn-danger"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this travel plan?')) {
                  // Handle delete
                }
              }}
            >
              Delete Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelPlanDetail;