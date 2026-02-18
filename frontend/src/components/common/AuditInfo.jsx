// Reusable Audit Information Component
// Displays audit trail information for any record
// Read-only display of 6 audit fields

import React from 'react';

const AuditInfo = ({ auditData, className = '' }) => {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return '-';
    }
  };

  // Get user display name
  const getUserDisplay = (userId) => {
    if (!userId) return '-';
    
    // In a real implementation, this would fetch user details
    // For now, we'll just display the user ID
    return userId.toString();
  };

  // Default audit data structure
  const defaultAuditData = {
    enteredBy: null,
    enteredOn: null,
    modifiedBy: null,
    modifiedOn: null,
    closedBy: null,
    closedOn: null
  };

  const data = { ...defaultAuditData, ...auditData };

  return (
    <div className={`audit-info-container ${className}`}>
      <div className="audit-info-header">
        <h4>Audit Details</h4>
      </div>
      
      <div className="audit-info-grid">
        <div className="audit-field">
          <span className="audit-label">Entered By:</span>
          <span className="audit-value">{getUserDisplay(data.enteredBy)}</span>
        </div>
        
        <div className="audit-field">
          <span className="audit-label">Entered On:</span>
          <span className="audit-value">{formatDate(data.enteredOn)}</span>
        </div>
        
        <div className="audit-field">
          <span className="audit-label">Modified By:</span>
          <span className="audit-value">{getUserDisplay(data.modifiedBy) || '-'}</span>
        </div>
        
        <div className="audit-field">
          <span className="audit-label">Modified On:</span>
          <span className="audit-value">{formatDate(data.modifiedOn) || '-'}</span>
        </div>
        
        <div className="audit-field">
          <span className="audit-label">Closed By:</span>
          <span className="audit-value">{getUserDisplay(data.closedBy) || '-'}</span>
        </div>
        
        <div className="audit-field">
          <span className="audit-label">Closed On:</span>
          <span className="audit-value">{formatDate(data.closedOn) || '-'}</span>
        </div>
      </div>
      
      <style>{`
        .audit-info-container {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 16px;
          margin-top: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        .audit-info-header {
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #dee2e6;
        }
        
        .audit-info-header h4 {
          margin: 0;
          color: #495057;
          font-size: 16px;
          font-weight: 600;
        }
        
        .audit-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        .audit-field {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: white;
          border-radius: 4px;
          border: 1px solid #dee2e6;
          font-size: 13px;
        }
        
        .audit-label {
          font-weight: 600;
          color: #495057;
        }
        
        .audit-value {
          font-weight: 500;
          color: #6c757d;
          text-align: right;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        @media (max-width: 768px) {
          .audit-info-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          
          .audit-field {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
          
          .audit-value {
            text-align: left;
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
};

export default AuditInfo;