import React, { createContext, useState, useContext } from 'react';
import { reportAPI } from '../services/api';

// Create Report Context
const ReportContext = createContext();

// Report Provider Component
export const ReportProvider = ({ children }) => {
  const [reports, setReports] = useState({
    bookings: [],
    employeePerformance: [],
    financial: null,
    corporateCustomers: [],
    customerAnalytics: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch booking report
  const fetchBookingReport = async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await reportAPI.getBookingReport(filters);
      setReports(prev => ({
        ...prev,
        bookings: data.data || []
      }));
    } catch (err) {
      setError(err.message || 'Failed to fetch booking report');
    } finally {
      setLoading(false);
    }
  };

  // Fetch employee performance report
  const fetchEmployeePerformanceReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await reportAPI.getEmployeePerformanceReport();
      setReports(prev => ({
        ...prev,
        employeePerformance: data.data || []
      }));
    } catch (err) {
      setError(err.message || 'Failed to fetch employee performance report');
    } finally {
      setLoading(false);
    }
  };

  // Fetch financial report
  const fetchFinancialReport = async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await reportAPI.getFinancialReport(filters);
      setReports(prev => ({
        ...prev,
        financial: data
      }));
    } catch (err) {
      setError(err.message || 'Failed to fetch financial report');
    } finally {
      setLoading(false);
    }
  };

  // Fetch corporate customers report
  const fetchCorporateCustomerReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await reportAPI.getCorporateCustomerReport();
      setReports(prev => ({
        ...prev,
        corporateCustomers: data.data || []
      }));
    } catch (err) {
      setError(err.message || 'Failed to fetch corporate customer report');
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer analytics report
  const fetchCustomerAnalyticsReport = async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await reportAPI.getCustomerAnalyticsReport(filters);
      setReports(prev => ({
        ...prev,
        customerAnalytics: data
      }));
    } catch (err) {
      setError(err.message || 'Failed to fetch customer analytics report');
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Report context value
  const value = {
    reports,
    loading,
    error,
    fetchBookingReport,
    fetchEmployeePerformanceReport,
    fetchFinancialReport,
    fetchCorporateCustomerReport,
    fetchCustomerAnalyticsReport,
    clearError
  };

  return (
    <ReportContext.Provider value={value}>
      {children}
    </ReportContext.Provider>
  );
};

// Custom hook to use report context
export const useReport = () => {
  const context = useContext(ReportContext);
  
  if (!context) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  
  return context;
};

export default ReportContext;