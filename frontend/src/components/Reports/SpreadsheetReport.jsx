import React, { useState, useMemo } from 'react';
import '../../styles/vintage-erp-theme.css';

const SpreadsheetReport = ({ 
  data = [], 
  columns = [], 
  title = "Report Data",
  onCellEdit = null,
  enableSorting = true,
  enableFiltering = true,
  enableExport = true 
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Process data with sorting and filtering
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply filters
    if (enableFiltering) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          result = result.filter(row => {
            const cellValue = row[key];
            return cellValue && 
                   cellValue.toString().toLowerCase().includes(filters[key].toLowerCase());
          });
        }
      });
    }

    // Apply sorting
    if (enableSorting && sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
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
  }, [data, sortConfig, filters, enableSorting, enableFiltering]);

  const handleSort = (key) => {
    if (!enableSorting) return;
    
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCellClick = (rowIndex, columnKey, value) => {
    if (onCellEdit) {
      setEditingCell({ rowIndex, columnKey });
      setEditValue(value || '');
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

  const handleExportCSV = () => {
    if (!enableExport) return;

    const headers = columns.map(col => col.label).join(',');
    const rows = processedData.map(row => 
      columns.map(col => {
        const value = row[col.key];
        // Escape commas and quotes in CSV
        return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (!enableExport) return;
    
    // Simple Excel-like export using data URI
    const headers = columns.map(col => `<td><b>${col.label}</b></td>`).join('');
    const rows = processedData.map(row => 
      `<tr>${columns.map(col => `<td>${row[col.key] || ''}</td>`).join('')}</tr>`
    ).join('');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
      </head>
      <body>
        <table border="1">
          <tr>${headers}</tr>
          ${rows}
        </table>
      </body>
      </html>
    `;
    
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatCellValue = (value, column) => {
    if (value === null || value === undefined) return '';
    
    switch (column.type) {
      case 'currency':
        return `₹${parseFloat(value).toFixed(2)}`;
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'datetime':
        return new Date(value).toLocaleString();
      case 'percentage':
        return `${parseFloat(value).toFixed(2)}%`;
      default:
        return value.toString();
    }
  };

  const getCellClass = (column, value) => {
    const baseClass = "spreadsheet-cell";
    const typeClasses = {
      currency: "cell-currency",
      date: "cell-date",
      percentage: "cell-percentage"
    };
    
    return `${baseClass} ${typeClasses[column.type] || ''} ${column.className || ''}`;
  };

  return (
    <div className="spreadsheet-report-container">
      {/* Report Header */}
      <div className="spreadsheet-header">
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
                onClick={handleExportExcel}
                title="Export to Excel"
              >
                📊 Excel
              </button>
            </>
          )}
          <button 
            className="erp-button erp-button-secondary"
            onClick={() => setFilters({})}
            title="Clear Filters"
          >
            🧹 Clear
          </button>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="spreadsheet-wrapper">
        <table className="spreadsheet-table">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th 
                  key={column.key}
                  className={`spreadsheet-header-cell ${sortConfig.key === column.key ? 'sorted' : ''}`}
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
                  {enableFiltering && (
                    <input
                      type="text"
                      className="filter-input"
                      placeholder={`Filter ${column.label}...`}
                      value={filters[column.key] || ''}
                      onChange={(e) => handleFilterChange(column.key, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
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
                <tr key={rowIndex} className="spreadsheet-row">
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
      <div className="spreadsheet-footer">
        <div className="summary-info">
          Showing {processedData.length} of {data.length} records
          {sortConfig.key && (
            <span className="sort-info">
              Sorted by {columns.find(c => c.key === sortConfig.key)?.label} 
              ({sortConfig.direction})
            </span>
          )}
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .spreadsheet-report-container {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          overflow: hidden;
        }

        .spreadsheet-header {
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

        .spreadsheet-wrapper {
          overflow: auto;
          max-height: 500px;
        }

        .spreadsheet-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .spreadsheet-header-cell {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          padding: 8px 12px;
          text-align: left;
          cursor: pointer;
          position: relative;
          user-select: none;
        }

        .spreadsheet-header-cell:hover {
          background: #e9ecef;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .header-label {
          font-weight: 600;
          color: #495057;
        }

        .sort-indicator {
          margin-left: 4px;
          font-size: 12px;
        }

        .filter-input {
          width: 100%;
          padding: 4px 6px;
          border: 1px solid #ced4da;
          border-radius: 3px;
          font-size: 12px;
        }

        .spreadsheet-row:hover {
          background: #f8f9fa;
        }

        .spreadsheet-cell {
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

        .no-data-cell {
          text-align: center;
          padding: 40px;
          color: #6c757d;
          font-style: italic;
        }

        .spreadsheet-footer {
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
      `}</style>
    </div>
  );
};

export default SpreadsheetReport;