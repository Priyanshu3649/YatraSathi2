import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useReport } from '../contexts/ReportContext';
import { useKeyboardNavigation } from '../contexts/KeyboardNavigationContext';
import '../styles/vintage-erp-theme.css';

const Reports = () => {
  const { user } = useAuth();
  const { 
    runReport, 
    generateGenericReport, 
    exportReport, 
    currentReport, 
    loading, 
    error, 
    resetReport 
  } = useReport();
  const { setActiveZone, setActiveForm, registerForm, unregisterForm } = useKeyboardNavigation();
  
  // 1. Generic Engine State
  const [filters, setFilters] = useState({
    module: 'billing',
    periodType: 'MONTHLY',
    startDate: '',
    endDate: '',
    customerId: '',
    status: 'All'
  });
  
  const [groupBy, setGroupBy] = useState([]); // Array of strings: ['customer', 'status']
  const [metrics, setMetrics] = useState(['SUM:amount', 'SUM:net_amount']);
  const [expandedGroups, setExpandedGroups] = useState({}); // Tracking expanded states: { 'GroupKey:GroupValue': true }

  const [focusedRowIndex, setFocusedRowIndex] = useState(-1);
  const filterFormRef = useRef(null);

  // Configuration for modules
  const MODULES = ['BILLING', 'BOOKINGS', 'CUSTOMERS', 'EMPLOYEES', 'PAYMENTS', 'RECEIPTS', 'JOURNALS'];
  const GROUP_OPTIONS = {
    BILLING: ['customer', 'status', 'date'],
    BOOKINGS: ['customer', 'status', 'travel_date', 'booking_no'],
    CUSTOMERS: ['type', 'status', 'company'],
    EMPLOYEES: ['dept', 'status', 'role'],
    PAYMENTS: ['mode', 'status', 'date'],
    RECEIPTS: ['mode', 'status', 'customer', 'date'],
    JOURNALS: ['status', 'date', 'debit_ledger']
  };

  const METRIC_OPTIONS = {
    BILLING: ['SUM:amount', 'SUM:tax', 'SUM:net_amount', 'AVG:amount'],
    BOOKINGS: ['SUM:fare', 'SUM:net_amount', 'SUM:passengers'],
    PAYMENTS: ['SUM:amount'],
    RECEIPTS: ['SUM:amount'],
    JOURNALS: ['SUM:amount']
  };

  const formatSummaryValue = (key, value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value !== 'number') return value;
    const k = String(key).toLowerCase();
    const hints = ['amount', 'charges', 'refund', 'total', 'balance', 'paid', 'due', 'fare', 'tax', 'gst', 'net', 'revenue'];
    if (hints.some((h) => k.includes(h))) {
      return `₹${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return value;
  };

  const prettifyColumnName = (col) => {
    if (!col) return '';
    let name = col.replace(/^(ft_|bl_|bk_|cu_|em_|us_|total_|avg_)/, '');
    name = name.replace(/_/g, ' ');
    return name.replace(/\b\w/g, l => l.toUpperCase());
  };

  // 2. Recursive Table Component
  const ReportGroup = ({ data, level = 0, path = '' }) => {
    if (!data) return null;

    const isTopLevel = level === 0;
    const hasNextGroups = data.groups && data.groups.length > 0;

    return (
      <div className={`report-level level-${level}`} style={{ marginLeft: level > 0 ? '20px' : '0' }}>
        {/* Render Subgroups if they exist */}
        {hasNextGroups ? (
          data.groups.map((group, idx) => {
            const groupPath = `${path}-${group.groupKey}:${group.groupValue}`;
            const isExpanded = expandedGroups[groupPath] !== false; // Default expanded

            return (
              <div key={idx} className="group-container" style={{ marginBottom: isTopLevel ? '20px' : '10px' }}>
                <div 
                  className="group-row-header" 
                  onClick={() => setExpandedGroups(prev => ({ ...prev, [groupPath]: !isExpanded }))}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: level === 0 ? '#495057' : level === 1 ? '#6c757d' : '#dee2e6',
                    color: level < 2 ? '#fff' : '#000',
                    cursor: 'pointer',
                    borderRadius: '4px 4px 0 0',
                    borderLeft: `4px solid ${level === 0 ? '#ffc107' : '#17a2b8'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '10px' }}>{isExpanded ? '▼' : '▶'}</span>
                    <span style={{ fontSize: '11px', fontWeight: 'bold' }}>
                      {prettifyColumnName(group.groupKey)}: {group.groupValue}
                    </span>
                  </div>
                  
                  {/* Inline Group Totals */}
                  <div className="group-metrics" style={{ display: 'flex', gap: '20px', fontSize: '11px' }}>
                    {Object.entries(group.summary || {}).map(([mk, mv]) => (
                      <span key={mk}>
                        {prettifyColumnName(mk)}: <span style={{ color: level < 2 ? '#ffc107' : '#0056b3' }}>{formatSummaryValue(mk, mv)}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {isExpanded && (
                  <div className="group-content" style={{ border: '1px solid #dee2e6', borderTop: 'none', padding: '10px', background: '#fff' }}>
                    <ReportGroup data={group} level={level + 1} path={groupPath} />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          /* Render actual data rows when we hit the leaf node */
          <div className="erp-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="erp-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  {currentReport.columns.map((col, i) => (
                    <th key={i} style={{ textAlign: 'left', padding: '8px', fontSize: '11px', borderBottom: '2px solid #dee2e6' }}>
                      {prettifyColumnName(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: '1px solid #eee' }}>
                    {currentReport.columns.map((col, cIdx) => (
                      <td key={cIdx} style={{ padding: '6px 8px', fontSize: '11px' }}>
                        {row[col] !== null && row[col] !== undefined ? row[col].toString() : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {/* Table Subtotal Footer for this specific small table */}
              {data.summary && data.rows.length > 1 && (
                <tfoot>
                  <tr style={{ background: '#fff9db', fontWeight: 'bold' }}>
                    <td colSpan={currentReport.columns.length} style={{ padding: '8px', textAlign: 'right', fontSize: '11px' }}>
                      SUBTOTAL: 
                      {Object.entries(data.summary).map(([mk, mv]) => (
                        <span key={mk} style={{ marginLeft: '15px' }}>
                          {prettifyColumnName(mk)}: {formatSummaryValue(mk, mv)}
                        </span>
                      ))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    );
  };

  // Keyboard and Form logic
  useEffect(() => {
    registerForm('report-filters', ['module', 'periodType', 'startDate', 'endDate', 'customerId']);
    setActiveForm('report-filters');
    setActiveZone('FORM');
    return () => unregisterForm('report-filters');
  }, [registerForm, unregisterForm, setActiveForm, setActiveZone]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const toggleGroup = (field) => {
    setGroupBy(prev => prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]);
  };

  const handleGenerate = useCallback(() => {
    generateGenericReport({
      module: filters.module,
      filters: filters,
      groupBy: groupBy,
      metrics: metrics
    });
    setActiveZone('TABLE');
  }, [generateGenericReport, filters, groupBy, metrics, setActiveZone]);

  const handleExportClick = (format) => {
    exportReport(filters.module, format, filters);
  };

  const handleClear = () => {
    setFilters({ module: 'billing', periodType: 'MONTHLY', startDate: '', endDate: '', customerId: '', status: 'All' });
    setGroupBy([]);
    resetReport();
  };

  return (
    <div className="erp-admin-container reports-layout">
      {/* Action Bar */}
      <div className="erp-action-bar">
        <button className="erp-button erp-button-primary" onClick={handleGenerate} disabled={loading}>
          <span className="kb-shortcut">F5</span> Generate Report
        </button>
        <div className="erp-tool-separator"></div>
        <button className="erp-button" onClick={() => handleExportClick('EXCEL')} disabled={!currentReport}>
          Excel
        </button>
        <button className="erp-button" onClick={() => handleExportClick('PDF')} disabled={!currentReport}>
          PDF
        </button>
        <button className="erp-button" onClick={handleClear}>
          Clear
        </button>
      </div>

      <div className="report-main-content">
        <section className="erp-section filter-section" ref={filterFormRef}>
          <div className="section-header">JESPR Generic Reporting Engine</div>
          
          <div className="erp-form-row-compact-5" style={{ padding: '15px' }}>
            <div className="erp-form-group">
              <label>Module</label>
              <select className="erp-input" name="module" value={filters.module} onChange={handleFilterChange}>
                {MODULES.map(m => <option key={m} value={m.toLowerCase()}>{m}</option>)}
              </select>
            </div>
            <div className="erp-form-group">
              <label>Period</label>
              <select className="erp-input" name="periodType" value={filters.periodType} onChange={handleFilterChange}>
                {['DAILY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="erp-form-group">
              <label>Field Grouping (Multi-level)</label>
              <div className="group-chips" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '5px' }}>
                {GROUP_OPTIONS[filters.module.toUpperCase()]?.map(g => (
                  <button 
                    key={g} 
                    className={`erp-chip ${groupBy.includes(g) ? 'active' : ''}`}
                    onClick={() => toggleGroup(g)}
                    style={{ 
                      padding: '2px 8px', 
                      fontSize: '10px', 
                      borderRadius: '12px', 
                      border: '1px solid #ced4da',
                      background: groupBy.includes(g) ? '#0056b3' : '#f8f9fa',
                      color: groupBy.includes(g) ? '#fff' : '#495057',
                      cursor: 'pointer'
                    }}
                  >
                    {prettifyColumnName(g)} {groupBy.includes(g) ? `(${groupBy.indexOf(g) + 1})` : ''}
                  </button>
                )) || <span style={{ fontSize: '10px', color: '#999' }}>Select a module</span>}
              </div>
            </div>
            <div className="erp-form-group">
              <label>Metrics</label>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '5px' }}>
                {METRIC_OPTIONS[filters.module.toUpperCase()]?.map(m => (
                  <label key={m} style={{ fontSize: '10px', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={metrics.includes(m)} 
                      onChange={() => setMetrics(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])} 
                    />
                    {prettifyColumnName(m)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Data Table Area */}
        <section className="erp-section table-section" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="section-header">
            📊 {filters.module.toUpperCase()} REPORT 
            {groupBy.length > 0 && ` (Grouped by: ${groupBy.join(' > ')})`}
          </div>
          
          <div className="erp-table-container" style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div className="erp-loading-placeholder">Processing Multi-level Dataset...</div>
            ) : currentReport ? (
              <div className="report-canvas">
                {/* Render Grand Total Top Info */}
                <div className="grand-total-banner" style={{ 
                  background: '#343a40', 
                  color: '#ffc107', 
                  padding: '10px 20px', 
                  borderRadius: '4px', 
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 'bold'
                }}>
                  <span>GRAND TOTAL ({currentReport.recordCount} Records)</span>
                  <div style={{ display: 'flex', gap: '30px' }}>
                    {Object.entries(currentReport.summary || {}).map(([key, val]) => (
                      <span key={key}>{prettifyColumnName(key)}: {formatSummaryValue(key, val)}</span>
                    ))}
                  </div>
                </div>

                {/* Recursive Group Rendering */}
                <ReportGroup data={currentReport} />
              </div>
            ) : (
              <div className="erp-empty-placeholder">
                <div className="placeholder-icon">🛠️</div>
                <p>Configure filters and grouping, then click <strong>Generate Report</strong>.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <style>{`
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