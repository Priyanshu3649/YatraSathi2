import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useReport } from '../contexts/ReportContext';
import { useKeyboardNavigation } from '../contexts/KeyboardNavigationContext';
import '../styles/vintage-erp-theme.css';

const Reports = () => {
  const { user } = useAuth();
  const { runReport, exportReport, currentReport, loading, error, resetReport } = useReport();
  const { setActiveZone, setActiveForm, registerForm, unregisterForm } = useKeyboardNavigation();
  
  // Filter State
  const [filters, setFilters] = useState({
    reportType: 'CANCELLATION',
    periodType: 'MONTHLY',
    startDate: '',
    endDate: '',
    customerId: ''
  });
  
  const [focusedRowIndex, setFocusedRowIndex] = useState(-1);
  const filterFormRef = useRef(null);

  const REPORT_TYPES = [
    'JOURNAL', 'SALES', 'PURCHASE', 'RECEIPT', 'PAYMENT', 
    'CANCELLATION', 'OUTSTANDING', 'AGING', 'PROFITABILITY'
  ];
  const PERIOD_TYPES = ['DAILY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM'];

  // Register form for keyboard navigation
  useEffect(() => {
    const fields = ['reportType', 'periodType', 'startDate', 'endDate', 'customerId'];
    registerForm('report-filters', fields);
    setActiveForm('report-filters');
    setActiveZone('FORM');
    
    return () => unregisterForm('report-filters');
  }, [registerForm, unregisterForm, setActiveForm, setActiveZone]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = useCallback(() => {
    runReport(filters.reportType, filters);
    setActiveZone('TABLE');
    setFocusedRowIndex(0);
  }, [runReport, filters, setActiveZone]);

  const handleExportClick = useCallback((format) => {
    exportReport(filters.reportType, format, filters);
  }, [exportReport, filters]);

  const handleClear = useCallback(() => {
    setFilters({
      reportType: 'CANCELLATION',
      periodType: 'MONTHLY',
      startDate: '',
      endDate: '',
      customerId: ''
    });
    resetReport();
    setActiveZone('FORM');
  }, [resetReport, setActiveZone]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveZone('FORM');
        filterFormRef.current?.querySelector('select')?.focus();
      }
      if (e.key === 'F5') {
        e.preventDefault();
        handleGenerate();
      }
      if (e.key === 'F10') {
        e.preventDefault();
        handleExportClick('EXCEL');
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
      
      // Table Navigation
      if (currentReport && currentReport.rows.length > 0) {
        if (e.key === 'ArrowDown') {
          setFocusedRowIndex(prev => Math.min(prev + 1, currentReport.rows.length - 1));
        }
        if (e.key === 'ArrowUp') {
          setFocusedRowIndex(prev => Math.max(prev - 1, 0));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGenerate, handleExportClick, handleClear, currentReport, setActiveZone]);

  return (
    <div className="erp-admin-container reports-layout">
      {/* Action Bar */}
      <div className="erp-action-bar">
        <button className="erp-button" onClick={() => setActiveZone('FORM')} title="Focus Filters (F2)">
          <span className="kb-shortcut">F2</span> Filters
        </button>
        <button className="erp-button erp-button-primary" onClick={handleGenerate} disabled={loading} title="Generate Report (F5)">
          <span className="kb-shortcut">F5</span> Generate
        </button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={() => handleExportClick('EXCEL')} disabled={!currentReport} title="Export Excel (F10)">
          <span className="kb-shortcut">F10</span> Export Excel
        </button>
        <button className="erp-button" onClick={() => handleExportClick('PDF')} disabled={!currentReport}>
          PDF
        </button>
        <button className="erp-button" onClick={handleClear} title="Clear Filters (ESC)">
          <span className="kb-shortcut">ESC</span> Clear
        </button>
      </div>

      <div className="report-main-content">
        {/* Filters Section */}
        <section className="erp-section filter-section" ref={filterFormRef}>
          <div className="section-header">🔍 Report Filters</div>
          <div className="erp-form-row-compact-5">
            <div className="erp-form-group">
              <label>Report Type</label>
              <select className="erp-input" name="reportType" value={filters.reportType} onChange={handleFilterChange}>
                {REPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="erp-form-group">
              <label>Period</label>
              <select className="erp-input" name="periodType" value={filters.periodType} onChange={handleFilterChange}>
                {PERIOD_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="erp-form-group">
              <label>From Date</label>
              <input type="date" className="erp-input" name="startDate" value={filters.startDate} onChange={handleFilterChange} disabled={filters.periodType !== 'CUSTOM'} />
            </div>
            <div className="erp-form-group">
              <label>To Date</label>
              <input type="date" className="erp-input" name="endDate" value={filters.endDate} onChange={handleFilterChange} disabled={filters.periodType !== 'CUSTOM'} />
            </div>
            <div className="erp-form-group">
              <label>Customer ID</label>
              <input type="number" className="erp-input" name="customerId" value={filters.customerId} onChange={handleFilterChange} placeholder="All" />
            </div>
          </div>
        </section>

        {/* Summary Info */}
        {currentReport && currentReport.summary && (
          <div className="erp-summary-row">
            {Object.entries(currentReport.summary).map(([key, value]) => (
              <div key={key} className="summary-card">
                <div className="summary-label">{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</div>
                <div className="summary-value">
                  {typeof value === 'number' && key.toLowerCase().includes('amount' || 'charges' || 'refund') 
                    ? `₹${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}` 
                    : value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error Display */}
        {error && <div className="erp-error-banner">❌ {error}</div>}

        {/* Data Table */}
        <section className="erp-section table-section">
          <div className="section-header">📋 Report Data: {filters.reportType}</div>
          <div className="erp-table-container">
            {loading ? (
              <div className="erp-loading-placeholder">Processing Report Data...</div>
            ) : currentReport ? (
              <table className="erp-table">
                <thead>
                  <tr>
                    {currentReport.columns.map(col => <th key={col}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {currentReport.rows.map((row, idx) => (
                    <tr key={idx} className={focusedRowIndex === idx ? 'focused-row' : ''}>
                      {Object.values(row).map((val, i) => (
                        <td key={i}>{val !== null && val !== undefined ? val.toString() : '-'}</td>
                      ))}
                    </tr>
                  ))}
                  {currentReport.rows.length === 0 && (
                    <tr>
                      <td colSpan={currentReport.columns.length} className="no-data">No records found for the selected period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <div className="erp-empty-placeholder">
                <div className="placeholder-icon">📊</div>
                <p>Select your criteria and click <strong>Generate</strong> to view the report.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <style>{`
        .reports-layout {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f8f9fa;
        }
        .report-main-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .erp-section {
          background: #fff;
          border: 1px solid #dee2e6;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .section-header {
          background: #e9ecef;
          padding: 8px 15px;
          font-weight: bold;
          font-size: 13px;
          border-bottom: 1px solid #dee2e6;
          color: #495057;
        }
        .filter-section {
          padding-bottom: 15px;
        }
        .erp-summary-row {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }
        .summary-card {
          flex: 1;
          min-width: 200px;
          background: #fff;
          padding: 15px;
          border-left: 4px solid #0056b3;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .summary-label {
          font-size: 11px;
          color: #6c757d;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .summary-value {
          font-size: 20px;
          font-weight: bold;
          color: #0056b3;
        }
        .table-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 400px;
        }
        .erp-table-container {
          flex: 1;
          overflow: auto;
        }
        .erp-loading-placeholder, .erp-empty-placeholder {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #adb5bd;
          text-align: center;
        }
        .placeholder-icon {
          font-size: 48px;
          margin-bottom: 10px;
          opacity: 0.5;
        }
        .no-data {
          text-align: center;
          padding: 30px !important;
          color: #adb5bd;
          font-style: italic;
        }
        .focused-row {
          background-color: #e7f3ff !important;
          outline: 2px solid #007bff;
        }
        .kb-shortcut {
          background: #343a40;
          color: #fff;
          padding: 2px 5px;
          border-radius: 3px;
          font-size: 10px;
          margin-right: 6px;
          vertical-align: middle;
        }
        .erp-error-banner {
          background: #f8d7da;
          color: #721c24;
          padding: 10px 15px;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default Reports;