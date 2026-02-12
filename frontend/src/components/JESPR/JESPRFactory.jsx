import React, { useState, useEffect } from 'react';
import JESPREngine from './JESPREngine';

/**
 * JESPR Factory - Creates different types of reports
 */
const JESPRFactory = ({ 
  reportType, 
  filters = {}, 
  onFiltersChange = null,
  onLoadingChange = null,
  onErrorChange = null
}) => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Set loading state when it changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(loading);
    }
  }, [loading, onLoadingChange]);

  // Set error state when it changes
  useEffect(() => {
    if (onErrorChange) {
      onErrorChange(error);
    }
  }, [error, onErrorChange]);

  // Fetch report data based on report type
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Construct API URL based on report type
        let apiUrl = `/api/reports/${reportType}`;
        
        // Add filters to the URL
        const urlParams = new URLSearchParams();
        Object.keys(filters).forEach(key => {
          if (filters[key]) {
            urlParams.append(key, filters[key]);
          }
        });
        
        if (urlParams.toString()) {
          apiUrl += `?${urlParams.toString()}`;
        }

        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch ${reportType} report`);
        }

        const data = await response.json();
        
        // Extract data based on response structure
        setReportData(data.data || data.reports || data || []);
      } catch (err) {
        console.error(`Error fetching ${reportType} report:`, err);
        setError(err.message);
        setReportData([]); // Clear data on error
      } finally {
        setLoading(false);
      }
    };

    if (reportType) {
      fetchReportData();
    }
  }, [reportType, filters]);

  // Define columns based on report type
  const getReportColumns = () => {
    switch (reportType) {
      case 'customer':
      case 'customer-specific':
        return [
          { key: 'customerId', label: 'Customer ID', type: 'text' },
          { key: 'customerName', label: 'Customer Name', type: 'text' },
          { key: 'email', label: 'Email', type: 'text' },
          { key: 'phone', label: 'Phone', type: 'text' },
          { key: 'totalBookings', label: 'Total Bookings', type: 'number' },
          { key: 'totalAmount', label: 'Total Amount (₹)', type: 'currency' },
          { key: 'lastBookingDate', label: 'Last Booking', type: 'date' },
          { key: 'status', label: 'Status', type: 'text' }
        ];

      case 'daily':
      case 'weekly':
      case 'monthly':
      case 'quarterly':
      case 'annual':
        return [
          { key: 'period', label: 'Period', type: 'text' },
          { key: 'totalBookings', label: 'Total Bookings', type: 'number' },
          { key: 'totalRevenue', label: 'Total Revenue (₹)', type: 'currency' },
          { key: 'avgBookingValue', label: 'Avg Booking Value (₹)', type: 'currency' },
          { key: 'confirmedBookings', label: 'Confirmed', type: 'number' },
          { key: 'pendingBookings', label: 'Pending', type: 'number' },
          { key: 'cancelledBookings', label: 'Cancelled', type: 'number' }
        ];

      case 'financial':
      case 'credit':
      case 'debit':
      case 'combined':
        return [
          { key: 'accountId', label: 'Account ID', type: 'text' },
          { key: 'accountName', label: 'Account Name', type: 'text' },
          { key: 'creditAmount', label: 'Credit (₹)', type: 'currency' },
          { key: 'debitAmount', label: 'Debit (₹)', type: 'currency' },
          { key: 'balance', label: 'Balance (₹)', type: 'currency' },
          { key: 'transactionDate', label: 'Date', type: 'date' },
          { key: 'reference', label: 'Reference', type: 'text' },
          { key: 'description', label: 'Description', type: 'text' }
        ];

      case 'booking-summary':
        return [
          { key: 'bookingId', label: 'Booking ID', type: 'text' },
          { key: 'customerName', label: 'Customer', type: 'text' },
          { key: 'fromStation', label: 'From', type: 'text' },
          { key: 'toStation', label: 'To', type: 'text' },
          { key: 'travelDate', label: 'Travel Date', type: 'date' },
          { key: 'class', label: 'Class', type: 'text' },
          { key: 'status', label: 'Status', type: 'text' },
          { key: 'amount', label: 'Amount (₹)', type: 'currency' },
          { key: 'agent', label: 'Agent', type: 'text' }
        ];

      case 'billing':
        return [
          { key: 'billId', label: 'Bill ID', type: 'text' },
          { key: 'customerName', label: 'Customer', type: 'text' },
          { key: 'bookingId', label: 'Booking ID', type: 'text' },
          { key: 'billDate', label: 'Bill Date', type: 'date' },
          { key: 'dueDate', label: 'Due Date', type: 'date' },
          { key: 'grossAmount', label: 'Gross (₹)', type: 'currency' },
          { key: 'taxAmount', label: 'Tax (₹)', type: 'currency' },
          { key: 'netAmount', label: 'Net (₹)', type: 'currency' },
          { key: 'status', label: 'Status', type: 'text' }
        ];

      case 'employee-performance':
        return [
          { key: 'employeeId', label: 'Employee ID', type: 'text' },
          { key: 'name', label: 'Employee Name', type: 'text' },
          { key: 'department', label: 'Department', type: 'text' },
          { key: 'designation', label: 'Designation', type: 'text' },
          { key: 'totalBookings', label: 'Total Bookings', type: 'number' },
          { key: 'confirmedBookings', label: 'Confirmed', type: 'number' },
          { key: 'successRate', label: 'Success Rate (%)', type: 'percentage' },
          { key: 'totalRevenue', label: 'Total Revenue (₹)', type: 'currency' }
        ];

      case 'payment':
        return [
          { key: 'paymentId', label: 'Payment ID', type: 'text' },
          { key: 'customerName', label: 'Customer', type: 'text' },
          { key: 'bookingId', label: 'Booking ID', type: 'text' },
          { key: 'paymentDate', label: 'Date', type: 'date' },
          { key: 'paymentMode', label: 'Mode', type: 'text' },
          { key: 'amount', label: 'Amount (₹)', type: 'currency' },
          { key: 'status', label: 'Status', type: 'text' },
          { key: 'reference', label: 'Reference', type: 'text' }
        ];

      default:
        // Generic columns for unknown report types
        return [
          { key: 'id', label: 'ID', type: 'text' },
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'value', label: 'Value', type: 'text' },
          { key: 'date', label: 'Date', type: 'date' },
          { key: 'amount', label: 'Amount', type: 'currency' }
        ];
    }
  };

  // Get report title based on type
  const getReportTitle = () => {
    const titles = {
      'customer': 'Customer-Specific Reports',
      'customer-specific': 'Customer-Specific Reports',
      'daily': 'Daily Reports',
      'weekly': 'Weekly Reports',
      'monthly': 'Monthly Reports',
      'quarterly': 'Quarterly Reports',
      'annual': 'Annual Reports',
      'financial': 'Financial Reports',
      'credit': 'Credit Reports',
      'debit': 'Debit Reports',
      'combined': 'Combined Credit/Debit Statements',
      'booking-summary': 'Booking Reports',
      'billing': 'Billing Reports',
      'employee-performance': 'Employee Performance Reports',
      'payment': 'Payment Reports'
    };
    
    return titles[reportType] || `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Reports`;
  };

  // If no report type is specified, show an error
  if (!reportType) {
    return (
      <div className="alert alert-warning">
        No report type specified. Please select a report type to view.
      </div>
    );
  }

  return (
    <JESPREngine
      data={reportData}
      columns={getReportColumns()}
      title={getReportTitle()}
      filters={filters}
      onFiltersChange={onFiltersChange}
      reportType={reportType}
      enableSorting={true}
      enableFiltering={true}
      enableExport={true}
      loading={loading}
      error={error}
    />
  );
};

export default JESPRFactory;