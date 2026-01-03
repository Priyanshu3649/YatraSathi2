import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { travelPlanApi } from '../utils/travelPlanApi';
import ShareTravelPlanModal from '../components/ShareTravelPlanModal';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';

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
      const data = await travelPlanApi.getAll();
      setTravelPlans(data);
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
        await travelPlanApi.delete(planId);
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
    <div className="erp-admin-container">
      {/* Title Bar */}
      <div className="title-bar">
        <div className="system-menu">✈️</div>
        <div className="title-text">Travel Plans Management System</div>
        <div className="close-button">×</div>
      </div>

      {/* Menu Bar */}
      <div className="menu-bar">
        <div className="menu-item">File</div>
        <div className="menu-item">Edit</div>
        <div className="menu-item">View</div>
        <div className="menu-item">Plans</div>
        <div className="menu-item">Share</div>
        <div className="menu-item">Help</div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <button className="tool-button" onClick={() => navigate('/travel-plans/new')}>
          New Plan
        </button>
        <div className="tool-separator"></div>
        <button className="tool-button" onClick={fetchTravelPlans}>Refresh</button>
        <button className="tool-button">Export</button>
        <button className="tool-button">Print</button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Navigation Panel */}
        <div className="nav-panel">
          <div className="nav-header">Travel Plan Actions</div>
          <div className="nav-item" onClick={() => navigate('/travel-plans/new')}>
            Create New Plan
          </div>
          <div className="nav-item" onClick={fetchTravelPlans}>Refresh Plans</div>
          <div className="nav-item">My Plans</div>
          <div className="nav-item">Shared Plans</div>
          <div className="nav-item">Public Plans</div>
          <div className="nav-item">Export Data</div>
        </div>

        {/* Work Area */}
        <div className="work-area">
          {error && <div className="alert alert-error">{error}</div>}

          {sharingPlan && (
            <ShareTravelPlanModal
              plan={sharingPlan}
              onClose={() => setSharingPlan(null)}
              onShareSuccess={handleShareSuccess}
            />
          )}

          {/* Grid Panel */}
          <div className="grid-panel">
            <div className="panel-header">My Travel Plans</div>

            <div className="grid-toolbar">
              <input
                type="text"
                placeholder="Search travel plans..."
                className="filter-input"
              />
              <button className="tool-button">Filter</button>
              <button className="tool-button">Clear</button>
            </div>

            <div className="grid-container">
              {loading ? (
                <div className="loading">Loading travel plans...</div>
              ) : (
                <>
                  {travelPlans.length === 0 ? (
                    <p>No travel plans found. Create your first travel plan!</p>
                  ) : (
                    <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', padding: '10px' }}>
                      {travelPlans.map((plan) => (
                        <div key={plan.tp_tpid} className="plan-card" style={{ 
                          background: '#e8f4f8', 
                          border: '1px solid #cccccc', 
                          padding: '12px',
                          minHeight: '200px'
                        }}>
                          <div className="plan-header" style={{ 
                            background: '#4169E1', 
                            color: 'white', 
                            padding: '6px 12px', 
                            margin: '-12px -12px 10px -12px',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <Link 
                              to={`/travel-plans/${plan.tp_tpid}`} 
                              style={{ color: 'white', textDecoration: 'none' }}
                            >
                              {plan.tp_title}
                            </Link>
                            {plan.tp_ispublic === 1 && (
                              <span style={{ 
                                background: '#008000', 
                                color: 'white', 
                                padding: '2px 6px', 
                                fontSize: '10px',
                                border: '1px solid #006400'
                              }}>
                                Public
                              </span>
                            )}
                          </div>
                          
                          <div className="plan-content" style={{ fontSize: '11px' }}>
                            <p style={{ marginBottom: '8px' }}>{plan.tp_description}</p>
                            
                            <div className="plan-details" style={{ marginBottom: '10px' }}>
                              <div style={{ marginBottom: '4px' }}>
                                <strong>Destination:</strong> {plan.tp_destination}
                              </div>
                              <div style={{ marginBottom: '4px' }}>
                                <strong>Dates:</strong> {formatDate(plan.tp_startdate)} - {formatDate(plan.tp_enddate)}
                              </div>
                              <div style={{ marginBottom: '4px' }}>
                                <strong>Budget:</strong> ₹{parseFloat(plan.tp_budget).toLocaleString()}
                              </div>
                              {plan.tp_activities && (
                                <div style={{ marginBottom: '4px' }}>
                                  <strong>Activities:</strong> {JSON.parse(plan.tp_activities).join(', ')}
                                </div>
                              )}
                            </div>
                            
                            <div className="plan-footer" style={{ 
                              borderTop: '1px solid #cccccc', 
                              paddingTop: '8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <small style={{ color: '#006400', fontWeight: 'bold' }}>
                                Created: {formatDate(plan.edtm)}
                              </small>
                              
                              {plan.tp_usid === user.us_usid && (
                                <div className="plan-actions" style={{ display: 'flex', gap: '4px' }}>
                                  <button 
                                    className="tool-button"
                                    style={{ fontSize: '10px', padding: '2px 6px' }}
                                    onClick={() => navigate(`/travel-plans/edit/${plan.tp_tpid}`)}
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    className="tool-button"
                                    style={{ fontSize: '10px', padding: '2px 6px' }}
                                    onClick={() => handleShare(plan)}
                                  >
                                    Share
                                  </button>
                                  <button 
                                    className="tool-button"
                                    style={{ fontSize: '10px', padding: '2px 6px' }}
                                    onClick={() => handleDelete(plan.tp_tpid)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">Plans: {travelPlans.length}</div>
        <div className="status-item">User: {user?.us_name || 'Unknown'}</div>
        <div className="status-panel">Ready</div>
      </div>
    </div>
  );
};

export default TravelPlans;