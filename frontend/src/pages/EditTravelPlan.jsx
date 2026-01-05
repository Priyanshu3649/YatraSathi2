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

const EditTravelPlan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [travelPlan, setTravelPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    destination: '',
    budget: '',
    activities: ''
  });

  useEffect(() => {
    if (id) {
      fetchTravelPlan();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchTravelPlan = async () => {
    try {
      setLoading(true);
      const data = await travelPlanApi.getById(id);
      setTravelPlan(data);
      
      // Populate form data
      setFormData({
        title: data.tp_title,
        description: data.tp_description,
        startDate: data.tp_startdate.split('T')[0],
        endDate: data.tp_enddate.split('T')[0],
        destination: data.tp_destination,
        budget: data.tp_budget,
        activities: data.tp_activities ? JSON.parse(data.tp_activities).join(', ') : ''
      });
      setError('');
    } catch (err) {
      setError('Failed to fetch travel plan');
      console.error('Error fetching travel plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const planData = {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        destination: formData.destination,
        budget: parseFloat(formData.budget),
        activities: formData.activities.split(',').map(activity => activity.trim())
      };
      
      if (id) {
        // Update existing plan
        await travelPlanApi.update(id, planData);
      } else {
        // Create new plan
        await travelPlanApi.create(planData);
      }
      
      navigate('/travel-plans');
    } catch (err) {
      setError('Failed to save travel plan');
      console.error('Error saving travel plan:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/travel-plans');
  };

  if (loading) {
    return <div className="loading panel">Loading travel plan...</div>;
  }

  return (
    <div className="edit-travel-plan panel">
      <div className="page-header panel-header">
        <h2>{id ? 'Edit Travel Plan' : 'Create Travel Plan'}</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-container panel">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title" className="form-label">Title:</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">Description:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              className="form-control"
              rows="4"
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group col-6">
              <label htmlFor="startDate" className="form-label">Start Date:</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                className="form-control"
              />
            </div>

            <div className="form-group col-6">
              <label htmlFor="endDate" className="form-label">End Date:</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                required
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="destination" className="form-label">Destination:</label>
            <input
              type="text"
              id="destination"
              name="destination"
              value={formData.destination}
              onChange={handleInputChange}
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="budget" className="form-label">Budget (₹):</label>
            <input
              type="number"
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="activities" className="form-label">Activities (comma separated):</label>
            <input
              type="text"
              id="activities"
              name="activities"
              value={formData.activities}
              onChange={handleInputChange}
              placeholder="Sightseeing, Shopping, Hiking..."
              className="form-control"
            />
          </div>

          <div className="form-group">
            <button 
              type="submit" 
              className="btn btn-primary mr-2"
              disabled={saving}
            >
              {saving ? 'Saving...' : (id ? 'Update Plan' : 'Create Plan')}
            </button>
            <button 
              type="button" 
              className="btn"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTravelPlan;