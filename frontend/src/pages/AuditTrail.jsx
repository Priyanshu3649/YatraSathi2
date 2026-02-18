// Audit Trail Viewer Page
// Administrative interface for viewing forensic audit logs

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuditTrail = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    entityName: '',
    entityId: '',
    actionType: '',
    performedBy: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 20
  });
  const [totalLogs, setTotalLogs] = useState(0);
  const [expandedLogs, setExpandedLogs] = useState(new Set());

  // Check admin permissions
  useEffect(() => {
    if (user?.us_usertype !== 'admin' && user?.us_roid !== 'ADM') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    if (user?.us_usertype !== 'admin' && user?.us_roid !== 'ADM') return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get('/audit/logs', {
        params: {
          ...filters,
          page: filters.page,
          limit: filters.limit
        }
      });
      
      if (response.data.success) {
        setAuditLogs(response.data.data.logs);
        setTotalLogs(response.data.data.totalCount);
      } else {
        setError(response.data.message || 'Failed to fetch audit logs');
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch logs on component mount and when filters change
  useEffect(() => {
    fetchAuditLogs();
  }, [filters.page, filters.limit]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  // Handle search
  const handleSearch = () => {
    fetchAuditLogs();
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Toggle expanded view for log details
  const toggleExpanded = (logId) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get action type color
  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'CREATE': return '#28a745'; // Green
      case 'UPDATE': return '#007bff'; // Blue
      case 'CLOSE': return '#fd7e14';  // Orange
      case 'CANCEL': return '#dc3545'; // Red
      case 'DELETE': return '#6f42c1'; // Purple
      default: return '#6c757d';       // Gray
    }
  };

  // Format JSON diff for display
  const formatDiff = (oldValues, newValues, changedFields) => {
    if (!changedFields || changedFields.length === 0) return null;
    
    return (
      <div className="diff-container">
        <h5>Field Changes:</h5>
        <table className="diff-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Old Value</th>
              <th>New Value</th>
            </tr>
          </thead>
          <tbody>
            {changedFields.map(field => (
              <tr key={field}>
                <td>{field}</td>
                <td className="old-value">
                  {oldValues?.[field] !== undefined ? 
                    JSON.stringify(oldValues[field], null, 2) : 
                    <span className="null-value">null</span>
                  }
                </td>
                <td className="new-value">
                  {newValues?.[field] !== undefined ? 
                    JSON.stringify(newValues[field], null, 2) : 
                    <span className="null-value">null</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalLogs / filters.limit);

  if (user?.us_usertype !== 'admin' && user?.us_roid !== 'ADM') {
    return null;
  }

  return (
    <div className="audit-trail-page">
      <div className="page-header">
        <h2>Forensic Audit Trail</h2>
        <p>Immutable record of all system changes</p>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>Entity Type:</label>
            <select 
              value={filters.entityName}
              onChange={(e) => handleFilterChange('entityName', e.target.value)}
              className="filter-input"
            >
              <option value="">All Entities</option>
              <option value="BookingTVL">Booking</option>
              <option value="BillingMaster">Billing</option>
              <option value="PaymentTVL">Payment</option>
              <option value="ReceiptTVL">Receipt</option>
              <option value="CustomerTVL">Customer</option>
              <option value="UserTVL">User</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Entity ID:</label>
            <input
              type="text"
              value={filters.entityId}
              onChange={(e) => handleFilterChange('entityId', e.target.value)}
              placeholder="Enter ID"
              className="filter-input"
            />
          </div>
          
          <div className="filter-group">
            <label>Action Type:</label>
            <select 
              value={filters.actionType}
              onChange={(e) => handleFilterChange('actionType', e.target.value)}
              className="filter-input"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="CLOSE">Close</option>
              <option value="CANCEL">Cancel</option>
              <option value="DELETE">Delete</option>
            </select>
          </div>
        </div>
        
        <div className="filter-row">
          <div className="filter-group">
            <label>User ID:</label>
            <input
              type="text"
              value={filters.performedBy}
              onChange={(e) => handleFilterChange('performedBy', e.target.value)}
              placeholder="Enter user ID"
              className="filter-input"
            />
          </div>
          
          <div className="filter-group">
            <label>From Date:</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="filter-input"
            />
          </div>
          
          <div className="filter-group">
            <label>To Date:</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="filter-input"
            />
          </div>
          
          <div className="filter-group search-button-group">
            <button 
              onClick={handleSearch}
              disabled={loading}
              className="search-button"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="results-section">
        {error && <div className="error-message">{error}</div>}
        
        <div className="results-header">
          <h3>Audit Records ({totalLogs} total)</h3>
        </div>

        {loading ? (
          <div className="loading">Loading audit records...</div>
        ) : auditLogs.length === 0 ? (
          <div className="no-results">No audit records found</div>
        ) : (
          <div className="audit-logs-container">
            {auditLogs.map(log => (
              <div key={log.id} className="audit-log-card">
                <div className="log-header">
                  <div className="log-summary">
                    <span 
                      className="action-badge"
                      style={{ backgroundColor: getActionColor(log.actionType) }}
                    >
                      {log.actionType}
                    </span>
                    <span className="entity-info">
                      {log.entityName} #{log.entityId}
                    </span>
                    <span className="user-info">
                      by User {log.performedBy}
                    </span>
                    <span className="timestamp">
                      {formatDate(log.performedOn)}
                    </span>
                  </div>
                  <button 
                    className="expand-button"
                    onClick={() => toggleExpanded(log.id)}
                  >
                    {expandedLogs.has(log.id) ? '▼' : '▶'}
                  </button>
                </div>
                
                {expandedLogs.has(log.id) && (
                  <div className="log-details">
                    <div className="detail-row">
                      <span className="detail-label">IP Address:</span>
                      <span className="detail-value">{log.ipAddress || '-'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">User Agent:</span>
                      <span className="detail-value">{log.userAgent || '-'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Branch:</span>
                      <span className="detail-value">{log.branchId || '-'}</span>
                    </div>
                    {log.changedFields && log.changedFields.length > 0 && (
                      <div className="detail-row">
                        <div className="diff-section">
                          {formatDiff(log.oldValues, log.newValues, log.changedFields)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalLogs > 0 && (
          <div className="pagination">
            <button 
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page <= 1}
              className="pagination-button"
            >
              Previous
            </button>
            
            <span className="page-info">
              Page {filters.page} of {totalPages}
            </span>
            
            <button 
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page >= totalPages}
              className="pagination-button"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <style>{`
        .audit-trail-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        .page-header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #000080;
        }
        
        .page-header h2 {
          margin: 0 0 8px 0;
          color: #000080;
          font-size: 24px;
          font-weight: 600;
        }
        
        .page-header p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }
        
        .filters-section {
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .filter-row {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          align-items: end;
        }
        
        .filter-row:last-child {
          margin-bottom: 0;
        }
        
        .filter-group {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        
        .search-button-group {
          align-self: end;
        }
        
        .filter-group label {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 6px;
          color: #333;
        }
        
        .filter-input {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .search-button {
          padding: 8px 16px;
          background: #000080;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .search-button:hover:not(:disabled) {
          background: #000066;
        }
        
        .search-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .results-section {
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .results-header {
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #eee;
        }
        
        .results-header h3 {
          margin: 0;
          color: #333;
          font-size: 18px;
          font-weight: 600;
        }
        
        .error-message {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .loading, .no-results {
          text-align: center;
          padding: 40px;
          color: #666;
          font-size: 16px;
        }
        
        .audit-logs-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .audit-log-card {
          border: 1px solid #ddd;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f8f9fa;
          cursor: pointer;
        }
        
        .log-summary {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .action-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
        }
        
        .entity-info {
          font-weight: 600;
          color: #333;
        }
        
        .user-info {
          color: #666;
        }
        
        .timestamp {
          color: #888;
          font-size: 13px;
        }
        
        .expand-button {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: #000080;
          padding: 4px;
        }
        
        .log-details {
          padding: 16px;
          background: white;
          border-top: 1px solid #eee;
        }
        
        .detail-row {
          display: flex;
          margin-bottom: 12px;
        }
        
        .detail-row:last-child {
          margin-bottom: 0;
        }
        
        .detail-label {
          font-weight: 600;
          color: #495057;
          min-width: 120px;
        }
        
        .detail-value {
          color: #666;
          flex: 1;
        }
        
        .diff-section {
          width: 100%;
          margin-top: 12px;
        }
        
        .diff-container h5 {
          margin: 0 0 12px 0;
          color: #333;
          font-size: 14px;
        }
        
        .diff-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        
        .diff-table th,
        .diff-table td {
          padding: 8px;
          border: 1px solid #ddd;
          text-align: left;
          vertical-align: top;
        }
        
        .diff-table th {
          background: #f8f9fa;
          font-weight: 600;
        }
        
        .old-value {
          background: #ffecec;
        }
        
        .new-value {
          background: #e8f5e8;
        }
        
        .null-value {
          color: #999;
          font-style: italic;
        }
        
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #eee;
        }
        
        .pagination-button {
          padding: 8px 16px;
          background: #000080;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .pagination-button:hover:not(:disabled) {
          background: #000066;
        }
        
        .pagination-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .page-info {
          font-size: 14px;
          color: #666;
        }
        
        @media (max-width: 768px) {
          .audit-trail-page {
            padding: 12px;
          }
          
          .filter-row {
            flex-direction: column;
            gap: 12px;
          }
          
          .log-summary {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          
          .pagination {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default AuditTrail;