import React from 'react';

/**
 * JESPR Report Selector Component
 * Provides UI for selecting different report types
 */
const JESPRSelector = ({ 
  selectedReportType, 
  onReportTypeChange,
  reportTypes = [] 
}) => {
  // Default report types if none provided
  const defaultReportTypes = [
    { key: 'customer-specific', label: 'Customer-Specific Reports', icon: '👤', description: 'Reports for specific customers' },
    { key: 'daily', label: 'Daily Reports', icon: '📅', description: 'Daily summary reports' },
    { key: 'weekly', label: 'Weekly Reports', icon: '🗓️', description: 'Weekly summary reports' },
    { key: 'monthly', label: 'Monthly Reports', icon: '📆', description: 'Monthly summary reports' },
    { key: 'quarterly', label: 'Quarterly Reports', icon: '📊', description: 'Quarterly summary reports' },
    { key: 'annual', label: 'Annual Reports', icon: '📈', description: 'Annual summary reports' },
    { key: 'financial', label: 'Financial Reports', icon: '💰', description: 'General financial reports' },
    { key: 'credit', label: 'Credit Reports', icon: '💳+', description: 'Credit statement reports' },
    { key: 'debit', label: 'Debit Reports', icon: '💳-', description: 'Debit statement reports' },
    { key: 'combined', label: 'Combined Statements', icon: '📋', description: 'Combined credit/debit statements' },
    { key: 'booking-summary', label: 'Booking Reports', icon: '🎫', description: 'Booking summary reports' },
    { key: 'billing', label: 'Billing Reports', icon: '🧾', description: 'Billing reports' },
    { key: 'employee-performance', label: 'Employee Performance', icon: '👥', description: 'Employee performance reports' },
    { key: 'payment', label: 'Payment Reports', icon: '💸', description: 'Payment reports' }
  ];

  const availableReportTypes = reportTypes.length > 0 ? reportTypes : defaultReportTypes;

  return (
    <div className="jespr-selector-container">
      <h4 className="selector-title">Select Report Type</h4>
      <div className="report-type-grid">
        {availableReportTypes.map((reportType) => (
          <div
            key={reportType.key}
            className={`report-type-card ${selectedReportType === reportType.key ? 'selected' : ''}`}
            onClick={() => onReportTypeChange(reportType.key)}
          >
            <div className="report-icon">{reportType.icon}</div>
            <div className="report-info">
              <div className="report-label">{reportType.label}</div>
              <div className="report-description">{reportType.description}</div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .jespr-selector-container {
          padding: 20px;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .selector-title {
          margin: 0 0 15px 0;
          color: #495057;
          font-size: 16px;
          font-weight: 600;
        }

        .report-type-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 12px;
        }

        .report-type-card {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .report-type-card:hover {
          border-color: #007bff;
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
        }

        .report-type-card.selected {
          border-color: #007bff;
          background: #e3f2fd;
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
        }

        .report-icon {
          font-size: 20px;
          min-width: 30px;
          text-align: center;
        }

        .report-info {
          flex: 1;
        }

        .report-label {
          font-weight: 600;
          color: #495057;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .report-description {
          font-size: 12px;
          color: #6c757d;
        }
      `}</style>
    </div>
  );
};

export default JESPRSelector;