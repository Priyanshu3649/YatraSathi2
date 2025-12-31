import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../../services/api';
import '../../../styles/dashboard-common.css';

const HRDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await dashboardAPI.getHRDashboard();
      
      if (data.success) {
        setDashboardData(data.data);
      } else {
        setError(data.error?.message || 'Failed to load dashboard');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="dashboard-loading">Loading...</div>;

  const { stats, recentJoiners } = dashboardData || {};

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>HR Dashboard</h1>
        <p>Manage employee roster and HR operations</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.totalEmployees || 0}</h3>
            <p>Total Employees</p>
          </div>
        </div>

        <div className="stat-card confirmed">
          <div className="stat-icon">
            <i className="fas fa-user-plus"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.recentJoinersCount || 0}</h3>
            <p>Recent Joiners</p>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Department Breakdown</h2>
        <div className="department-grid">
          {stats?.departmentBreakdown?.map((dept) => (
            <div key={dept.em_dept} className="dept-card">
              <h4>{dept.em_dept}</h4>
              <p>{dept.count} employees</p>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Recent Joiners</h2>
        <div className="joiners-table">
          {recentJoiners && recentJoiners.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Join Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentJoiners.map((employee) => (
                  <tr key={employee.em_usid}>
                    <td>{employee.User?.us_fname} {employee.User?.us_lname}</td>
                    <td>{employee.em_dept}</td>
                    <td>{new Date(employee.em_joindt).toLocaleDateString()}</td>
                    <td>
                      <span className="status-badge confirmed">
                        {employee.em_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <i className="fas fa-user-friends"></i>
              <h3>No Recent Joiners</h3>
              <p>No new employees in the last 30 days.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;