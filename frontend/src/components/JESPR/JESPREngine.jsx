import React, { useState, useMemo } from 'react';
import '../../styles/vintage-erp-theme.css';

/**
 * JESPR (JavaScript Enterprise Spreadsheet Reporting) Engine
 * Core component that provides spreadsheet-like reporting functionality
 */
const JESPREngine = ({ 
  data = [], 
  columns = [], 
  title = "Report",
  filters = {},
  onFiltersChange = null,
  reportType = 'general',
  enableSorting = true,
  enableFiltering = true,
  enableExport = true,
  onCellEdit = null,
  loading = false,
  error = null
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [localFilters, setLocalFilters] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Merge external filters with local filters
  const combinedFilters = { ...filters, ...localFilters };

  // Process data with sorting and filtering
  const processedData = useMemo(() => {
    if (loading || error) return [];

    let result = [...data];

    // Apply filters
    if (enableFiltering) {
      Object.keys(combinedFilters).forEach(key => {
        if (combinedFilters[key]) {
          result = result.filter(row => {
            const cellValue = row[key];
            if (cellValue === null || cellValue === undefined) return false;
            
            const stringValue = cellValue.toString().toLowerCase();
            return stringValue.includes(combinedFilters[key].toLowerCase());
          });
        }
      });
    }

    // Apply sorting
    if (enableSorting && sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
        if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, sortConfig, combinedFilters, enableSorting, enableFiltering, loading, error]);

  const handleSort = (key) => {
    if (!enableSorting) return;
    
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  const handleCellClick = (rowIndex, columnKey, value) => {
    if (onCellEdit) {
      setEditingCell({ rowIndex, columnKey });
      setEditValue(value?.toString() || '');
    }
  };

  const handleCellSave = () => {
    if (editingCell && onCellEdit) {
      onCellEdit(editingCell.rowIndex, editingCell.columnKey, editValue);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleExportPDF = () => {
    if (!enableExport) return;
    
    // Create a printable version of the table
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${col.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${processedData.map(row => `
              <tr>
                ${columns.map(col => `<td>${row[col.key] || ''}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportCSV = () => {
    if (!enableExport) return;

    const headers = columns.map(col => col.label).join(',');
    const rows = processedData.map(row => 
      columns.map(col => {
        const value = row[col.key];
        if (value === null || value === undefined) return '""';
        
        const stringValue = value.toString();
        // Escape commas and quotes in CSV
        const escapedValue = stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
          ? `"${stringValue.replace(/"/g, '""')}"`
          : stringValue;
        return escapedValue;
      }).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatCellValue = (value, column) => {
    if (value === null || value === undefined) return '';
    
    switch (column.type) {
      case 'currency':
        return `₹${parseFloat(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'date':
        try {
          return new Date(value).toLocaleDateString('en-IN');
        } catch {
          return value.toString();
        }
      case 'datetime':
        try {
          return new Date(value).toLocaleString('en-IN');
        } catch {
          return value.toString();
        }
      case 'percentage':
        return `${parseFloat(value).toFixed(2)}%`;
      case 'number':
        return parseFloat(value).toLocaleString('en-IN');
      default:
        return value.toString();
    }
  };

  const getCellClass = (column, value) => {
    const baseClass = "jespr-cell";
    const typeClasses = {
      currency: "cell-currency",
      date: "cell-date",
      percentage: "cell-percentage",
      number: "cell-number"
    };
    
    return `${baseClass} ${typeClasses[column.type] || ''} ${column.className || ''}`;
  };

  if (loading) {
    return (
      <div className="jespr-container">
        <div className="jespr-header">
          <h3 className="report-title">{title}</h3>
          <div className="report-controls">
            <div className="loading-spinner">Loading...</div>
          </div>
        </div>
        <div className="jespr-loading">Loading report data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="jespr-container">
        <div className="jespr-header">
          <h3 className="report-title">{title}</h3>
        </div>
        <div className="alert alert-error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="jespr-container">
      {/* Report Header */}
      <div className="jespr-header">
        <h3 className="report-title">{title}</h3>
        <div className="report-controls">
          {enableExport && (
            <>
              <button 
                className="erp-button erp-button-secondary"
                onClick={handleExportCSV}
                title="Export to CSV"
              >
                📄 CSV
              </button>
              <button 
                className="erp-button erp-button-secondary"
                onClick={handleExportPDF}
                title="Export to PDF"
              >
                📄 PDF
              </button>
            </>
          )}
          <button 
            className="erp-button erp-button-secondary"
            onClick={() => {
              setLocalFilters({});
              if (onFiltersChange) onFiltersChange({});
            }}
            title="Clear Filters"
          >
            🧹 Clear
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      {enableFiltering && (
        <div className="jespr-filters">
          {columns.map((column) => (
            <div key={column.key} className="filter-group">
              <label>{column.label}</label>
              <input
                type="text"
                className="filter-input"
                placeholder={`Filter ${column.label}...`}
                value={combinedFilters[column.key] || ''}
                onChange={(e) => handleFilterChange(column.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Spreadsheet Table */}
      <div className="jespr-wrapper">
        <table className="jespr-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.key}
                  className={`jespr-header-cell ${sortConfig.key === column.key ? 'sorted' : ''}`}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="header-content">
                    <span className="header-label">{column.label}</span>
                    {enableSorting && sortConfig.key === column.key && (
                      <span className="sort-indicator">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="no-data-cell">
                  No data available
                </td>
              </tr>
            ) : (
              processedData.map((row, rowIndex) => (
                <tr key={rowIndex} className="jespr-row">
                  {columns.map((column) => {
                    const cellValue = row[column.key];
                    const isEditing = editingCell?.rowIndex === rowIndex && 
                                    editingCell?.columnKey === column.key;
                    
                    return (
                      <td 
                        key={`${rowIndex}-${column.key}`}
                        className={getCellClass(column, cellValue)}
                        onClick={() => handleCellClick(rowIndex, column.key, cellValue)}
                      >
                        {isEditing ? (
                          <div className="cell-editor">
                            <input
                              type="text"
                              className="editor-input"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleCellSave}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCellSave();
                                if (e.key === 'Escape') handleCellCancel();
                              }}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div className="cell-content">
                            {formatCellValue(cellValue, column)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Information */}
      <div className="jespr-footer">
        <div className="summary-info">
          Showing {processedData.length} of {data.length} records
          {sortConfig.key && (
            <span className="sort-info">
              | Sorted by {columns.find(c => c.key === sortConfig.key)?.label} 
              ({sortConfig.direction})
            </span>
          )}
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        .jespr-container {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .jespr-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #e9ecef;
          border-bottom: 1px solid #dee2e6;
        }

        .report-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #495057;
        }

        .report-controls {
          display: flex;
          gap: 8px;
        }

        .loading-spinner {
          padding: 4px 8px;
          font-size: 12px;
        }

        .jespr-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          padding: 12px 16px;
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          min-width: 150px;
        }

        .filter-group label {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 4px;
          color: #495057;
        }

        .filter-input {
          padding: 6px 8px;
          border: 1px solid #ced4da;
          border-radius: 3px;
          font-size: 12px;
        }

        .jespr-wrapper {
          overflow: auto;
          max-height: 500px;
        }

        .jespr-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .jespr-header-cell {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          padding: 8px 12px;
          text-align: left;
          cursor: pointer;
          position: relative;
          user-select: none;
        }

        .jespr-header-cell:hover {
          background: #e9ecef;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-label {
          font-weight: 600;
          color: #495057;
        }

        .sort-indicator {
          margin-left: 4px;
          font-size: 12px;
        }

        .jespr-row:hover {
          background: #f8f9fa;
        }

        .jespr-cell {
          border: 1px solid #dee2e6;
          padding: 6px 8px;
          min-width: 120px;
          cursor: pointer;
        }

        .cell-content {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cell-editor {
          padding: 0;
        }

        .editor-input {
          width: 100%;
          border: 2px solid #007bff;
          padding: 4px;
          outline: none;
          background: white;
        }

        .cell-currency {
          text-align: right;
          font-family: monospace;
        }

        .cell-date {
          text-align: center;
        }

        .cell-percentage {
          text-align: right;
        }

        .cell-number {
          text-align: right;
          font-family: monospace;
        }

        .no-data-cell {
          text-align: center;
          padding: 40px;
          color: #6c757d;
          font-style: italic;
        }

        .jespr-footer {
          padding: 8px 16px;
          background: #f8f9fa;
          border-top: 1px solid #dee2e6;
          font-size: 12px;
          color: #6c757d;
        }

        .summary-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sort-info {
          margin-left: 16px;
          font-style: italic;
        }

        .sorted {
          background: #e3f2fd !important;
        }

        .jespr-loading {
          padding: 40px;
          text-align: center;
          color: #6c757d;
        }
      `}</style>
    </div>
  );
};

export default JESPREngine;