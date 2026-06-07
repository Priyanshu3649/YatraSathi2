import React, { useState, useEffect } from 'react';
import { getAuditLogsByEntity, getAuditLogs } from '../services/api';
import PaginationControls from './PaginationControls';

const ForensicAuditViewer = ({ entityName, entityId, showAll = false }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    performedBy: '',
    actionType: ''
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let result;
      if (showAll) {
        result = await getAuditLogs({
          ...filters,
          page: pagination.page,
          limit: pagination.limit
        });
      } else {
        result = await getAuditLogsByEntity(entityName, entityId, {
          page: pagination.page,
          limit: pagination.limit
        });
      }
      setLogs(result.logs || []);
      setPagination({
        page: result.page || 1,
        limit: result.limit || 50,
        total: result.total || 0,
        totalPages: result.totalPages || 0
      });
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityName, entityId, pagination.page]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '-';
    }
  };

  return (
    <div className="forensic-audit-viewer">
      <div className="forensic-audit-header">
        <h3>Forensic Audit Trail</h3>
      </div>

      {showAll && (
        <div className="forensic-audit-filters">
          <div className="filter-row">
            <div className="filter-item">
              <label>From Date:</label>
              <input
                type="date"
                name="fromDate"
                value={filters.fromDate}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-item">
              <label>To Date:</label>
              <input
                type="date"
                name="toDate"
                value={filters.toDate}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-item">
              <label>User:</label>
              <input
                type="text"
                name="performedBy"
                value={filters.performedBy}
                onChange={handleFilterChange}
                placeholder="User ID"
              />
            </div>
            <div className="filter-item">
              <label>Action:</label>
              <select
                name="actionType"
                value={filters.actionType}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="CLOSE">Close</option>
                <option value="CANCEL">Cancel</option>
                <option value="DELETE">Delete</option>
              </select>
            </div>
            <div className="filter-item">
              <button onClick={handleApplyFilters}>Apply Filters</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading audit logs...</div>
      ) : (
        <>
          <div className="forensic-audit-table-container">
            <table className="forensic-audit-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Changed By</th>
                  <th>Fields Changed</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.performedOn)}</td>
                    <td>
                      <span className={`action-badge action-${log.actionType?.toLowerCase()}`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td>{log.performedBy || '-'}</td>
                    <td>
                      {log.changedFields?.map((field, idx) => (
                        <span key={idx} className="field-tag">
                          {field}
                        </span>
                      ))}
                    </td>
                    <td>
                      <details className="change-details">
                        <summary>View Changes</summary>
                        <div className="changes-content">
                          <div className="changes-section">
                            <h5>Old Values:</h5>
                            <pre>{JSON.stringify(log.oldValues, null, 2)}</pre>
                          </div>
                          <div className="changes-section">
                            <h5>New Values:</h5>
                            <pre>{JSON.stringify(log.newValues, null, 2)}</pre>
                          </div>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationControls
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          />
        </>
      )}

      <style jsx>{`
        .forensic-audit-viewer {
          background: #fff;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          margin-top: 20px;
        }
        
        .forensic-audit-header h3 {
          margin: 0 0 20px 0;
          color: #495057;
        }
        
        .forensic-audit-filters {
          margin-bottom: 20px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        
        .filter-row {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          align-items: flex-end;
        }
        
        .filter-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .filter-item label {
          font-size: 14px;
          color: #6c757d;
          font-weight: 500;
        }
        
        .filter-item input,
        .filter-item select {
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .filter-item button {
          padding: 8px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .forensic-audit-table-container {
          overflow-x: auto;
          margin-bottom: 20px;
        }
        
        .forensic-audit-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        
        .forensic-audit-table th,
        .forensic-audit-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }
        
        .forensic-audit-table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #495057;
        }
        
        .action-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .action-create {
          background: #d4edda;
          color: #155724;
        }
        
        .action-update {
          background: #fff3cd;
          color: #856404;
        }
        
        .action-close,
        .action-cancel {
          background: #f8d7da;
          color: #721c24;
        }
        
        .action-delete {
          background: #f5c6cb;
          color: #721c24;
        }
        
        .field-tag {
          display: inline-block;
          padding: 2px 8px;
          margin: 2px;
          background: #e9ecef;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .change-details summary {
          cursor: pointer;
          color: #007bff;
          text-decoration: underline;
        }
        
        .changes-content {
          margin-top: 12px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .changes-section pre {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 4px;
          overflow-x: auto;
          margin: 0;
          font-size: 12px;
        }
        
        .changes-section h5 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #495057;
        }
        
        .loading {
          padding: 40px;
          text-align: center;
          color: #6c757d;
        }
      `}</style>
    </div>
  );
};

export default ForensicAuditViewer;