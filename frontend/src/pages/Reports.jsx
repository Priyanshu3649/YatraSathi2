import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useReport } from '../contexts/ReportContext';
import '../styles/vintage-erp-theme.css';
import '../styles/classic-enterprise-global.css';

// Import JESPR components
import ReportBuilder from '../components/JESPR/ReportBuilder';
import ReportViewer from '../components/JESPR/ReportViewer';
import SavedReports from '../components/JESPR/SavedReports';

const Reports = () => {
  const { user } = useAuth();
  const { 
    currentReport, 
    loading, 
    error, 
    fetchTemplates, 
    savedTemplates 
  } = useReport();
  
  const [activeTab, setActiveTab] = useState('builder');
  const [showTemplates, setShowTemplates] = useState(false);

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Tab navigation between main sections
      if (e.key === 'Tab') {
        // Handle tab navigation logic here
        return;
      }
      
      // Escape to close templates panel
      if (e.key === 'Escape' && showTemplates) {
        setShowTemplates(false);
        e.preventDefault();
      }
      
      // Enter to run report in builder
      if (e.key === 'Enter' && activeTab === 'builder' && !loading) {
        // Trigger report run
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, loading, showTemplates]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'builder':
        return <ReportBuilder />;
      case 'viewer':
        return <ReportViewer />;
      case 'saved':
        return <SavedReports />;
      default:
        return <ReportBuilder />;
    }
  };

  return (
    <div className="erp-admin-container">
      {/* Title Bar */}
      <div className="title-bar">
        <div className="system-menu">📊</div>
        <div className="title-text">JESPR Reporting System</div>
        <div className="close-button">×</div>
      </div>

      {/* Menu Bar */}
      <div className="menu-bar">
        <div className="menu-item">File</div>
        <div className="menu-item">Edit</div>
        <div className="menu-item">View</div>
        <div className="menu-item">Export</div>
        <div className="menu-item">Templates</div>
        <div className="menu-item">Help</div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <button 
          className={`tool-button ${activeTab === 'builder' ? 'active' : ''}`}
          onClick={() => setActiveTab('builder')}
          disabled={loading}
        >
          Report Builder
        </button>
        
        <button 
          className={`tool-button ${activeTab === 'viewer' ? 'active' : ''}`}
          onClick={() => setActiveTab('viewer')}
          disabled={!currentReport || loading}
        >
          Report Viewer
        </button>
        
        <button 
          className={`tool-button ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
          disabled={loading}
        >
          Saved Reports ({savedTemplates.length})
        </button>
        
        <div className="tool-separator"></div>
        
        <button 
          className="tool-button"
          onClick={() => setShowTemplates(!showTemplates)}
          disabled={loading}
        >
          {showTemplates ? 'Hide Templates' : 'Show Templates'}
        </button>
        
        {loading && (
          <div className="loading-indicator">
            <span className="spinner"></span>
            Processing...
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Left Panel - Templates (collapsible) */}
        {showTemplates && (
          <div className="templates-panel">
            <div className="panel-header">
              <h3>Saved Templates</h3>
              <button 
                className="close-panel"
                onClick={() => setShowTemplates(false)}
              >
                ×
              </button>
            </div>
            <div className="templates-list">
              {savedTemplates.length === 0 ? (
                <div className="no-templates">
                  <p>No saved templates found</p>
                  <small>Create and save templates from the Report Builder</small>
                </div>
              ) : (
                savedTemplates.map(template => (
                  <div key={template.rt_rtid} className="template-item">
                    <div className="template-name">{template.rt_name}</div>
                    <div className="template-description">{template.rt_description}</div>
                    <div className="template-meta">
                      <span className="template-type">{template.rt_type}</span>
                      <span className="template-date">
                        {new Date(template.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Main Work Area */}
        <div className={`work-area ${showTemplates ? 'with-templates' : ''}`}>
          {error && (
            <div className="alert alert-error">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {renderTabContent()}
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">
          User: {user?.us_fname} {user?.us_lname}
        </div>
        <div className="status-item">
          Report: {currentReport ? currentReport.config.reportType : 'None'}
        </div>
        <div className="status-item">
          Records: {currentReport?.data?.length || 0}
        </div>
        <div className="status-item">
          Status: {loading ? 'Processing...' : currentReport ? 'Ready' : 'Idle'}
        </div>
        <div className="status-panel">
          {loading ? 'WORKING' : 'READY'}
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        .erp-admin-container {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f0f0f0;
          font-family: Arial, sans-serif;
        }

        .title-bar {
          background: linear-gradient(to right, #000080, #4169e1);
          color: white;
          padding: 4px 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          border-bottom: 2px solid #000080;
        }

        .menu-bar {
          background: #e0e0e0;
          padding: 2px 8px;
          display: flex;
          border-bottom: 1px solid #c0c0c0;
          font-size: 11px;
        }

        .menu-item {
          padding: 2px 8px;
          margin-right: 2px;
          cursor: pointer;
          border: 1px solid transparent;
        }

        .menu-item:hover {
          background: #c0c0c0;
          border: 1px solid #808080;
        }

        .toolbar {
          background: #d0d0d0;
          padding: 4px 8px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid #a0a0a0;
          font-size: 11px;
          flex-wrap: wrap;
          gap: 4px;
        }

        .tool-button {
          background: #e0e0e0;
          border: 1px solid #808080;
          padding: 2px 6px;
          margin-right: 4px;
          cursor: pointer;
          font-size: 11px;
          white-space: nowrap;
        }

        .tool-button:hover:not(:disabled) {
          background: #c0c0c0;
        }

        .tool-button.active {
          background: #000080;
          color: white;
          border-color: #000080;
        }

        .tool-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .tool-separator {
          width: 1px;
          height: 16px;
          background: #808080;
          margin: 0 4px;
        }

        .loading-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #000080;
          font-weight: bold;
        }

        .spinner {
          width: 12px;
          height: 12px;
          border: 2px solid #c0c0c0;
          border-top: 2px solid #000080;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .main-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .templates-panel {
          width: 250px;
          background: #f8f8f8;
          border-right: 1px solid #c0c0c0;
          display: flex;
          flex-direction: column;
        }

        .panel-header {
          background: #000080;
          color: white;
          padding: 6px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          font-weight: bold;
        }

        .close-panel {
          background: none;
          border: none;
          color: white;
          font-size: 16px;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .templates-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0;
        }

        .template-item {
          padding: 8px 12px;
          border-bottom: 1px solid #e0e0e0;
          cursor: pointer;
        }

        .template-item:hover {
          background: #e0e0e0;
        }

        .template-name {
          font-weight: bold;
          color: #000080;
          margin-bottom: 2px;
        }

        .template-description {
          font-size: 11px;
          color: #666;
          margin-bottom: 4px;
        }

        .template-meta {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #888;
        }

        .no-templates {
          text-align: center;
          padding: 20px;
          color: #666;
        }

        .no-templates p {
          margin: 0 0 8px 0;
        }

        .no-templates small {
          font-size: 11px;
        }

        .work-area {
          flex: 1;
          padding: 12px;
          overflow-y: auto;
          background: white;
          transition: margin-left 0.3s ease;
        }

        .work-area.with-templates {
          margin-left: 0;
        }

        .alert {
          padding: 8px 12px;
          margin-bottom: 12px;
          border-radius: 3px;
          font-size: 12px;
        }

        .alert-error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .status-bar {
          background: #c0c0c0;
          padding: 2px 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          border-top: 1px solid #808080;
        }

        .status-item {
          padding: 0 8px;
        }

        .status-panel {
          background: #008000;
          color: white;
          padding: 1px 6px;
          font-weight: bold;
          font-size: 10px;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .templates-panel {
            width: 200px;
          }
          
          .tool-button {
            padding: 4px 8px;
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default Reports;