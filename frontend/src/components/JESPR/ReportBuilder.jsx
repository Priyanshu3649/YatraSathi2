import React, { useState, useEffect } from 'react';
import { useReport } from '../../contexts/ReportContext';

const ReportBuilder = () => {
  const { 
    reportConfig, 
    updateConfig, 
    runReport, 
    saveTemplate, 
    loading,
    getReportSchema
  } = useReport();
  
  const [schema, setSchema] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [availableColumns, setAvailableColumns] = useState([]);

  // Load schema on component mount
  useEffect(() => {
    const loadSchema = async () => {
      const schemaData = await getReportSchema();
      setSchema(schemaData);
    };
    loadSchema();
  }, [getReportSchema]);

  // Update available columns when report type changes
  useEffect(() => {
    if (schema && reportConfig.reportType) {
      setAvailableColumns(schema[reportConfig.reportType]?.columns || []);
    }
  }, [schema, reportConfig.reportType]);

  // Handle report type change
  const handleReportTypeChange = (type) => {
    updateConfig({
      reportType: type,
      columns: [],
      filters: {},
      groupBy: [],
      aggregates: {}
    });
  };

  // Handle column selection
  const handleColumnToggle = (column) => {
    const currentColumns = reportConfig.columns || [];
    const newColumns = currentColumns.includes(column)
      ? currentColumns.filter(c => c !== column)
      : [...currentColumns, column];
    
    updateConfig({ columns: newColumns });
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    updateConfig({
      filters: {
        ...reportConfig.filters,
        [key]: value
      }
    });
  };

  // Handle aggregate change
  const handleAggregateChange = (field, func) => {
    updateConfig({
      aggregates: {
        ...reportConfig.aggregates,
        [field]: func
      }
    });
  };

  // Handle group by change
  const handleGroupByToggle = (field) => {
    const currentGroupBy = reportConfig.groupBy || [];
    const newGroupBy = currentGroupBy.includes(field)
      ? currentGroupBy.filter(f => f !== field)
      : [...currentGroupBy, field];
    
    updateConfig({ groupBy: newGroupBy });
  };

  // Save template
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    const success = await saveTemplate(
      templateName.trim(),
      templateDescription.trim(),
      false // isPublic - can be made configurable
    );

    if (success) {
      setTemplateName('');
      setTemplateDescription('');
      setShowSaveModal(false);
      alert('Template saved successfully!');
    }
  };

  // Get report type options
  const getReportTypeOptions = () => {
    if (!schema) return [];
    
    return Object.keys(schema).map(type => ({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1) + ' Reports',
      icon: getReportTypeIcon(type)
    }));
  };

  // Get icon for report type
  const getReportTypeIcon = (type) => {
    const icons = {
      booking: '🎫',
      billing: '🧾',
      payment: '💰',
      customer: '👤',
      employee: '👥',
      financial: '📊'
    };
    return icons[type] || '📋';
  };

  // Render filter inputs based on filter type
  const renderFilterInput = (filter) => {
    const currentValue = reportConfig.filters?.[filter.name] || '';
    
    switch (filter.type) {
      case 'date':
        return (
          <input
            type="date"
            value={currentValue}
            onChange={(e) => handleFilterChange(filter.name, e.target.value)}
            className="filter-input"
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleFilterChange(filter.name, parseFloat(e.target.value) || '')}
            className="filter-input"
            placeholder="Enter number"
          />
        );
      
      case 'string':
      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleFilterChange(filter.name, e.target.value)}
            className="filter-input"
            placeholder={`Filter by ${filter.name}`}
          />
        );
    }
  };

  if (!schema) {
    return (
      <div className="report-builder-loading">
        <div className="spinner"></div>
        <p>Loading report schema...</p>
      </div>
    );
  }

  return (
    <div className="report-builder">
      <div className="builder-header">
        <h2>Report Builder</h2>
        <div className="builder-actions">
          <button 
            className="action-button primary"
            onClick={() => runReport()}
            disabled={loading || !reportConfig.reportType}
          >
            {loading ? 'Generating...' : 'Run Report'}
          </button>
          
          <button 
            className="action-button secondary"
            onClick={() => setShowSaveModal(true)}
            disabled={loading || !reportConfig.reportType}
          >
            Save Template
          </button>
          
          <button 
            className="action-button secondary"
            onClick={() => updateConfig({ reportType: '', columns: [], filters: {} })}
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="builder-content">
        {/* Report Type Selection */}
        <div className="section">
          <h3>1. Select Report Type</h3>
          <div className="report-type-grid">
            {getReportTypeOptions().map(option => (
              <div
                key={option.value}
                className={`report-type-card ${reportConfig.reportType === option.value ? 'selected' : ''}`}
                onClick={() => handleReportTypeChange(option.value)}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleReportTypeChange(option.value)}
              >
                <div className="report-icon">{option.icon}</div>
                <div className="report-label">{option.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Column Selection */}
        {reportConfig.reportType && (
          <div className="section">
            <h3>2. Select Columns</h3>
            <div className="columns-grid">
              {availableColumns.map(column => (
                <label key={column} className="column-checkbox">
                  <input
                    type="checkbox"
                    checked={reportConfig.columns?.includes(column) || false}
                    onChange={() => handleColumnToggle(column)}
                  />
                  <span className="column-name">{column}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        {reportConfig.reportType && schema[reportConfig.reportType]?.filters && (
          <div className="section">
            <h3>3. Apply Filters</h3>
            <div className="filters-grid">
              {schema[reportConfig.reportType].filters.map(filter => (
                <div key={filter.name} className="filter-row">
                  <label className="filter-label">
                    {filter.description || filter.name}:
                  </label>
                  {renderFilterInput(filter)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grouping and Aggregations */}
        {reportConfig.reportType && (
          <div className="section">
            <h3>4. Grouping & Aggregations</h3>
            <div className="advanced-options">
              <div className="group-by-section">
                <h4>Group By:</h4>
                <div className="group-by-options">
                  {availableColumns.map(column => (
                    <label key={column} className="group-checkbox">
                      <input
                        type="checkbox"
                        checked={reportConfig.groupBy?.includes(column) || false}
                        onChange={() => handleGroupByToggle(column)}
                      />
                      <span>{column}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {reportConfig.groupBy && reportConfig.groupBy.length > 0 && (
                <div className="aggregates-section">
                  <h4>Aggregations:</h4>
                  <div className="aggregates-grid">
                    {reportConfig.groupBy.map(field => (
                      <div key={field} className="aggregate-row">
                        <label>{field}:</label>
                        <select
                          value={reportConfig.aggregates?.[field] || ''}
                          onChange={(e) => handleAggregateChange(field, e.target.value)}
                          className="aggregate-select"
                        >
                          <option value="">Select aggregate</option>
                          <option value="SUM">Sum</option>
                          <option value="COUNT">Count</option>
                          <option value="AVG">Average</option>
                          <option value="MIN">Minimum</option>
                          <option value="MAX">Maximum</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Save Report Template</h3>
              <button 
                className="modal-close"
                onClick={() => setShowSaveModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Template Name *</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="form-input"
                  placeholder="Enter template name"
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="form-input"
                  placeholder="Enter template description"
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowSaveModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSaveTemplate}
                disabled={!templateName.trim() || loading}
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .report-builder {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .builder-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #ddd;
        }

        .builder-header h2 {
          margin: 0;
          color: #000080;
        }

        .builder-actions {
          display: flex;
          gap: 8px;
        }

        .action-button {
          padding: 6px 12px;
          border: 1px solid #808080;
          background: #e0e0e0;
          cursor: pointer;
          font-size: 12px;
        }

        .action-button:hover:not(:disabled) {
          background: #d0d0d0;
        }

        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-button.primary {
          background: #000080;
          color: white;
          border-color: #000080;
        }

        .action-button.primary:hover:not(:disabled) {
          background: #000060;
        }

        .action-button.secondary {
          background: #f0f0f0;
        }

        .builder-content {
          flex: 1;
          overflow-y: auto;
        }

        .section {
          margin-bottom: 24px;
          padding: 16px;
          background: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
        }

        .section h3 {
          margin: 0 0 16px 0;
          color: #000080;
          font-size: 16px;
        }

        .report-type-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
        }

        .report-type-card {
          padding: 16px;
          border: 2px solid #ddd;
          border-radius: 6px;
          text-align: center;
          cursor: pointer;
          background: white;
          transition: all 0.2s;
        }

        .report-type-card:hover {
          border-color: #4169e1;
          background: #f0f8ff;
        }

        .report-type-card.selected {
          border-color: #000080;
          background: #e6f0ff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .report-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .report-label {
          font-size: 12px;
          font-weight: 500;
          color: #333;
        }

        .columns-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 8px;
        }

        .column-checkbox {
          display: flex;
          align-items: center;
          padding: 6px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }

        .column-checkbox input {
          margin-right: 8px;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 12px;
        }

        .filter-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .filter-label {
          font-size: 12px;
          font-weight: 500;
          color: #555;
        }

        .filter-input {
          padding: 6px 8px;
          border: 1px solid #ddd;
          border-radius: 3px;
          font-size: 12px;
        }

        .advanced-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .group-by-options {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .group-checkbox {
          display: flex;
          align-items: center;
          padding: 4px 8px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 3px;
          font-size: 12px;
        }

        .group-checkbox input {
          margin-right: 6px;
        }

        .aggregates-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .aggregate-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .aggregate-row label {
          min-width: 100px;
          font-size: 12px;
        }

        .aggregate-select {
          flex: 1;
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 3px;
          font-size: 12px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          border-radius: 6px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header h3 {
          margin: 0;
          color: #000080;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-body {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #333;
          font-size: 13px;
        }

        .form-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 13px;
        }

        .form-input:focus {
          outline: none;
          border-color: #000080;
          box-shadow: 0 0 0 2px rgba(0,0,128,0.1);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 20px;
          border-top: 1px solid #eee;
          background: #f8f9fa;
        }

        .btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f8f9fa;
          color: #333;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e9ecef;
        }

        .btn-primary {
          background: #000080;
          color: white;
          border-color: #000080;
        }

        .btn-primary:hover:not(:disabled) {
          background: #000060;
        }

        .report-builder-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: #666;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f0f0f0;
          border-top: 3px solid #000080;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .advanced-options {
            grid-template-columns: 1fr;
          }
          
          .filters-grid {
            grid-template-columns: 1fr;
          }
          
          .columns-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportBuilder;