import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useReport } from '../../contexts/ReportContext';
import { debounce, throttle, VirtualScroll } from '../../utils/performanceUtils';
import '../../styles/vintage-erp-theme.css';

/**
 * Report Viewer Component
 * Displays report data in a JESPR-like spreadsheet interface
 */
const ReportViewer = () => {
  const { 
    currentReport, 
    loading, 
    error,
    reportConfig
  } = useReport();
  
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Debounced search term
  const debouncedSearch = useCallback(debounce((term) => {
    setDebouncedSearchTerm(term);
  }, 300), []);
  
  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);
  
  // Process and filter data
  const processedData = useMemo(() => {
    if (!currentReport?.data) return [];
    
    let result = [...currentReport.data];
    
    // Apply search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      result = result.filter(row => 
        Object.values(row).some(value => 
          String(value).toLowerCase().includes(searchLower)
        )
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [currentReport?.data, debouncedSearchTerm, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = processedData.slice(startIndex, endIndex);

  // Get column definitions
  const columns = useMemo(() => {
    if (!processedData.length) return [];
    
    const firstRow = processedData[0];
    return Object.keys(firstRow).map(key => ({
      key,
      label: formatColumnLabel(key),
      type: inferColumnType(firstRow[key])
    }));
  }, [processedData]);

  // Format column label
  const formatColumnLabel = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ')
      .trim();
  };

  // Infer column type for formatting
  const inferColumnType = (value) => {
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'decimal';
    }
    if (value instanceof Date || /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return 'date';
    }
    if (typeof value === 'boolean') {
      return 'boolean';
    }
    return 'string';
  };

  // Format cell value
  const formatCellValue = (value, type) => {
    if (value === null || value === undefined) {
      return '';
    }
    
    switch (type) {
      case 'date':
        if (value instanceof Date) {
          return value.toLocaleDateString();
        }
        if (typeof value === 'string') {
          const date = new Date(value);
          return date.isValid() ? date.toLocaleDateString() : value;
        }
        return value;
      
      case 'decimal':
        return typeof value === 'number' ? value.toFixed(2) : value;
      
      case 'integer':
        return typeof value === 'number' ? value.toLocaleString() : value;
      
      case 'boolean':
        return value ? 'Yes' : 'No';
      
      default:
        return String(value);
    }
  };

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle row selection
  const handleRowSelect = (rowIndex) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex);
    } else {
      newSelected.add(rowIndex);
    }
    setSelectedRows(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      const allIndices = new Set(paginatedData.map((_, index) => index));
      setSelectedRows(allIndices);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!processedData.length) return;
    
    const headers = columns.map(col => col.label);
    const csvContent = [
      headers.join(','),
      ...processedData.map(row => 
        columns.map(col => 
          JSON.stringify(row[col.key] || '')
        ).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export to Excel (simplified)
  const exportToExcel = () => {
    // In a real implementation, you'd use a library like xlsx
    exportToCSV(); // Fallback to CSV for now
  };

  // Reset view
  const resetView = () => {
    setSortConfig({ key: null, direction: 'asc' });
    setSearchTerm('');
    setCurrentPage(1);
    setSelectedRows(new Set());
  };

  // No data state
  if (!currentReport) {
    return (
      <div className="report-viewer-empty">
        <div className="empty-icon">📊</div>
        <h3>No Report Data</h3>
        <p>Run a report using the Report Builder to view data here.</p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="report-viewer-loading">
        <div className="spinner"></div>
        <p>Generating report...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="report-viewer-error">
        <div className="error-icon">⚠️</div>
        <h3>Report Error</h3>
        <p>{error}</p>
        <button className="retry-button" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  // Empty results state
  if (processedData.length === 0) {
    return (
      <div className="report-viewer-empty">
        <div className="empty-icon">🔍</div>
        <h3>No Results Found</h3>
        <p>Try adjusting your filters or search terms.</p>
        <button className="reset-button" onClick={resetView}>
          Reset Filters
        </button>
      </div>
    );
  }

  return (
    <div className="report-viewer">
      {/* Viewer Header */}
      <div className="viewer-header">
        <div className="header-info">
          <h2>{reportConfig.reportType?.toUpperCase() || 'REPORT'} RESULTS</h2>
          <div className="report-meta">
            <span className="record-count">
              Showing {startIndex + 1}-{Math.min(endIndex, processedData.length)} of {processedData.length} records
            </span>
            {currentReport.aggregates && Object.keys(currentReport.aggregates).length > 0 && (
              <span className="aggregates-summary">
                Aggregates calculated
              </span>
            )}
          </div>
        </div>
        
        <div className="viewer-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              aria-label="Search records"
            />
          </div>
          
          <div className="export-buttons">
            <button className="export-button" onClick={exportToCSV}>
              📄 CSV
            </button>
            <button className="export-button" onClick={exportToExcel}>
              📊 Excel
            </button>
          </div>
          
          <button className="reset-button" onClick={resetView}>
            Reset View
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="selection-column">
                <input
                  type="checkbox"
                  checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                  onChange={handleSelectAll}
                  title="Select all rows"
                />
              </th>
              {columns.map(column => (
                <th 
                  key={column.key}
                  className={`sortable ${sortConfig.key === column.key ? `sorted-${sortConfig.direction}` : ''}`}
                  onClick={() => handleSort(column.key)}
                >
                  <span className="column-label">{column.label}</span>
                  {sortConfig.key === column.key && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                className={selectedRows.has(rowIndex) ? 'selected' : ''}
                onClick={() => handleRowSelect(rowIndex)}
              >
                <td className="selection-cell">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(rowIndex)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleRowSelect(rowIndex);
                    }}
                  />
                </td>
                {columns.map(column => (
                  <td key={column.key} className={`cell-${column.type}`}>
                    {formatCellValue(row[column.key], column.type)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            <select 
              value={pageSize} 
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="page-size-select"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
          
          <div className="pagination-controls">
            <button 
              className="page-button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            
            <button 
              className="page-button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .report-viewer {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .viewer-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #ddd;
        }

        .header-info h2 {
          margin: 0 0 8px 0;
          color: #000080;
          font-size: 18px;
        }

        .report-meta {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #666;
        }

        .viewer-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 250px;
        }

        .search-box {
          display: flex;
        }

        .search-input {
          flex: 1;
          padding: 6px 10px;
          border: 1px solid #ddd;
          border-radius: 3px;
          font-size: 12px;
        }

        .export-buttons {
          display: flex;
          gap: 6px;
        }

        .export-button {
          padding: 6px 12px;
          border: 1px solid #808080;
          background: #f0f0f0;
          cursor: pointer;
          font-size: 11px;
          border-radius: 3px;
        }

        .export-button:hover {
          background: #e0e0e0;
        }

        .reset-button {
          padding: 6px 12px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
          font-size: 11px;
          border-radius: 3px;
        }

        .reset-button:hover {
          background: #f8f9fa;
        }

        .data-table-container {
          flex: 1;
          overflow: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .data-table thead {
          background: #f8f9fa;
          position: sticky;
          top: 0;
        }

        .data-table th {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 2px solid #ddd;
          font-weight: 600;
          color: #333;
          white-space: nowrap;
        }

        .data-table th.sortable {
          cursor: pointer;
          user-select: none;
        }

        .data-table th.sortable:hover {
          background: #e9ecef;
        }

        .column-label {
          margin-right: 8px;
        }

        .sort-indicator {
          font-size: 10px;
          color: #000080;
        }

        .selection-column, .selection-cell {
          width: 40px;
          text-align: center;
          padding: 8px 4px;
        }

        .data-table td {
          padding: 6px 12px;
          border-bottom: 1px solid #eee;
        }

        .data-table tbody tr:hover {
          background: #f8f9fa;
        }

        .data-table tbody tr.selected {
          background: #e6f0ff;
        }

        .cell-date {
          white-space: nowrap;
        }

        .cell-decimal, .cell-integer {
          text-align: right;
          font-family: monospace;
        }

        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid #eee;
        }

        .page-size-select {
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 3px;
          font-size: 12px;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .page-button {
          padding: 6px 12px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
          font-size: 12px;
          border-radius: 3px;
        }

        .page-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-button:hover:not(:disabled) {
          background: #f8f9fa;
        }

        .page-info {
          font-size: 12px;
          color: #666;
        }

        .report-viewer-empty, .report-viewer-loading, .report-viewer-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: #666;
          text-align: center;
        }

        .empty-icon, .error-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .report-viewer-empty h3, .report-viewer-error h3 {
          margin: 0 0 8px 0;
          color: #333;
        }

        .report-viewer-empty p, .report-viewer-error p {
          margin: 0 0 16px 0;
          max-width: 300px;
        }

        .retry-button, .reset-button {
          padding: 8px 16px;
          background: #000080;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        }

        .retry-button:hover, .reset-button:hover {
          background: #000060;
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
          .viewer-header {
            flex-direction: column;
            gap: 16px;
          }
          
          .viewer-actions {
            min-width: auto;
          }
          
          .data-table-container {
            font-size: 11px;
          }
          
          .data-table th, .data-table td {
            padding: 4px 6px;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportViewer;