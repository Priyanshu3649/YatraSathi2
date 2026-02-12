import React, { useState, useEffect } from 'react';
import { useReport } from '../../contexts/ReportContext';
import '../../styles/vintage-erp-theme.css';

/**
 * Saved Reports Component
 * Allows users to manage their saved report templates
 */
const SavedReports = () => {
  const { 
    savedTemplates, 
    loadingTemplates, 
    fetchTemplates, 
    loadTemplate, 
    deleteTemplate,
    runReport 
  } = useReport();

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleLoadTemplate = (template) => {
    loadTemplate(template);
    setSelectedTemplate(template);
  };

  const handleRunTemplate = (template) => {
    try {
      const config = typeof template.rt_config === 'string' 
        ? JSON.parse(template.rt_config)
        : template.rt_config;
      
      runReport(config);
    } catch (error) {
      console.error('Error running template:', error);
    }
  };

  const handleDeleteTemplate = (templateId) => {
    deleteTemplate(templateId);
    if (showDeleteConfirm === templateId) {
      setShowDeleteConfirm(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loadingTemplates) {
    return (
      <div className="saved-reports-loading">
        <div className="spinner"></div>
        <p>Loading saved reports...</p>
      </div>
    );
  }

  return (
    <div className="saved-reports">
      <div className="saved-reports-header">
        <h3>Saved Reports</h3>
        <span className="template-count">
          {savedTemplates?.length || 0} templates
        </span>
      </div>

      {savedTemplates && savedTemplates.length > 0 ? (
        <div className="saved-reports-list">
          {savedTemplates.map((template) => (
            <div 
              key={template.rt_rtid} 
              className={`saved-report-item ${
                selectedTemplate?.rt_rtid === template.rt_rtid ? 'selected' : ''
              }`}
            >
              <div className="template-info">
                <div className="template-name">
                  <strong>{template.rt_name}</strong>
                  <span className="template-type">{template.rt_type}</span>
                </div>
                {template.rt_description && (
                  <div className="template-description">
                    {template.rt_description}
                  </div>
                )}
                <div className="template-meta">
                  <span className="template-created">
                    Created: {formatDate(template.rt_created_dt || template.createdAt)}
                  </span>
                  <span className="template-owner">
                    By: {template.rt_created_by || 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="template-actions">
                <button
                  className="action-button load-button"
                  onClick={() => handleLoadTemplate(template)}
                  title="Load template configuration"
                >
                  📝 Load
                </button>
                <button
                  className="action-button run-button"
                  onClick={() => handleRunTemplate(template)}
                  title="Run this template"
                >
                  ▶️ Run
                </button>
                <button
                  className="action-button delete-button"
                  onClick={() => setShowDeleteConfirm(
                    showDeleteConfirm === template.rt_rtid ? null : template.rt_rtid
                  )}
                  title="Delete template"
                >
                  🗑️ Delete
                </button>
              </div>

              {showDeleteConfirm === template.rt_rtid && (
                <div className="delete-confirm">
                  <p>Are you sure you want to delete "{template.rt_name}"?</p>
                  <div className="confirm-buttons">
                    <button
                      className="confirm-delete"
                      onClick={() => handleDeleteTemplate(template.rt_rtid)}
                    >
                      Yes, Delete
                    </button>
                    <button
                      className="cancel-delete"
                      onClick={() => setShowDeleteConfirm(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="saved-reports-empty">
          <div className="empty-icon">💾</div>
          <h4>No Saved Reports</h4>
          <p>Create and save report configurations to access them here.</p>
        </div>
      )}

      <style jsx>{`
        .saved-reports {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .saved-reports-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #ddd;
        }

        .saved-reports-header h3 {
          margin: 0;
          color: #000080;
          font-size: 16px;
        }

        .template-count {
          font-size: 12px;
          color: #666;
          background: #f0f0f0;
          padding: 4px 8px;
          border-radius: 12px;
        }

        .saved-reports-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
          flex: 1;
        }

        .saved-report-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          transition: all 0.2s ease;
        }

        .saved-report-item:hover {
          border-color: #000080;
          box-shadow: 0 2px 4px rgba(0,0,128,0.1);
        }

        .saved-report-item.selected {
          border-color: #000080;
          background: #f8f8ff;
        }

        .template-info {
          flex: 1;
          min-width: 0;
        }

        .template-name {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 8px;
        }

        .template-type {
          font-size: 11px;
          color: #666;
          background: #e8e8e8;
          padding: 2px 6px;
          border-radius: 10px;
          align-self: flex-start;
        }

        .template-description {
          font-size: 12px;
          color: #555;
          margin-bottom: 8px;
          line-height: 1.4;
        }

        .template-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 11px;
          color: #888;
        }

        .template-actions {
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-self: flex-start;
        }

        .action-button {
          padding: 6px 10px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
          font-size: 11px;
          border-radius: 3px;
          min-width: 60px;
          text-align: center;
        }

        .action-button:hover {
          background: #f8f9fa;
        }

        .load-button:hover {
          background: #e8f4ff;
          border-color: #000080;
        }

        .run-button:hover {
          background: #e8ffe8;
          border-color: #008000;
        }

        .delete-button:hover {
          background: #ffe8e8;
          border-color: #800000;
        }

        .delete-confirm {
          margin-top: 8px;
          padding: 12px;
          background: #fff8f8;
          border: 1px solid #ffdddd;
          border-radius: 4px;
          font-size: 12px;
        }

        .delete-confirm p {
          margin: 0 0 8px 0;
          color: #333;
        }

        .confirm-buttons {
          display: flex;
          gap: 8px;
        }

        .confirm-delete {
          padding: 4px 8px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 3px;
          font-size: 11px;
          cursor: pointer;
        }

        .confirm-delete:hover {
          background: #c82333;
        }

        .cancel-delete {
          padding: 4px 8px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 3px;
          font-size: 11px;
          cursor: pointer;
        }

        .cancel-delete:hover {
          background: #5a6268;
        }

        .saved-reports-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #666;
          text-align: center;
        }

        .empty-icon {
          font-size: 36px;
          margin-bottom: 12px;
        }

        .saved-reports-empty h4 {
          margin: 0 0 8px 0;
          color: #333;
        }

        .saved-reports-empty p {
          margin: 0;
          font-size: 12px;
          max-width: 200px;
        }

        .saved-reports-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100px;
          color: #666;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #f0f0f0;
          border-top: 2px solid #000080;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 8px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SavedReports;