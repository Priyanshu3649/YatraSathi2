import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import ShareTravelPlanModal from '../components/ShareTravelPlanModal';
import '../styles/travelPlans.css';

const TravelPlans = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [travelPlans, setTravelPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sharingPlan, setSharingPlan] = useState(null);

  // Fetch travel plans
  useEffect(() => {
    fetchTravelPlans();
  }, []);

  const fetchTravelPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/travel-plans');
      setTravelPlans(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch travel plans');
      console.error('Error fetching travel plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId) => {
    if (window.confirm('Are you sure you want to delete this travel plan?')) {
      try {
        await api.delete(`/travel-plans/${planId}`);
        fetchTravelPlans();
      } catch (err) {
        setError('Failed to delete travel plan');
        console.error('Error deleting travel plan:', err);
      }
    }
  };

  const handleShare = (plan) => {
    setSharingPlan(plan);
  };

  const handleShareSuccess = () => {
    fetchTravelPlans();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="travel-plans panel">
      <div className="page-header panel-header">
        <h2>My Travel Plans</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/travel-plans/new')}
        >
          Create New Plan
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {sharingPlan && (
        <ShareTravelPlanModal
          plan={sharingPlan}
          onClose={() => setSharingPlan(null)}
          onShareSuccess={handleShareSuccess}
        />
      )}

      {loading ? (
        <div className="loading">Loading travel plans...</div>
      ) : (
        <div className="plans-list">
          {travelPlans.length === 0 ? (
            <p>No travel plans found. Create your first travel plan!</p>
          ) : (
            <div className="plans-grid">
              {travelPlans.map((plan) => (
                <div key={plan.tp_tpid} className="plan-card panel mb-3">
                  <div className="plan-header panel-header">
                    <h3>
                      <Link to={`/travel-plans/${plan.tp_tpid}`} className="plan-title-link">
                        {plan.tp_title}
                      </Link>
                    </h3>
                    {plan.tp_ispublic === 1 && <span className="badge badge-public">Public</span>}
                  </div>
                  <p className="plan-description">{plan.tp_description}</p>
                  <div className="plan-details">
                    <p><strong>Destination:</strong> {plan.tp_destination}</p>
                    <p><strong>Dates:</strong> {formatDate(plan.tp_startdate)} - {formatDate(plan.tp_enddate)}</p>
                    <p><strong>Budget:</strong> ₹{parseFloat(plan.tp_budget).toLocaleString()}</p>
                    {plan.tp_activities && (
                      <p><strong>Activities:</strong> {JSON.parse(plan.tp_activities).join(', ')}</p>
                    )}
                  </div>
                  <div className="plan-footer">
                    <small>Created: {formatDate(plan.edtm)}</small>
                    {plan.tp_usid === user.us_usid && (
                      <div className="plan-actions">
                        <button 
                          className="btn btn-secondary mr-1"
                          onClick={() => navigate(`/travel-plans/edit/${plan.tp_tpid}`)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-secondary mr-1"
                          onClick={() => handleShare(plan)}
                        >
                          Share
                        </button>
                        <button 
                          className="btn btn-danger"
                          onClick={() => handleDelete(plan.tp_tpid)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TravelPlans;