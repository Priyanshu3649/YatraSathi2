import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';

// Create Report Context
const ReportContext = createContext();

// Report Provider Component
export const ReportProvider = ({ children }) => {
  const [currentReport, setCurrentReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Run a standardized report
   */
  const runReport = useCallback(async (reportType, filters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/reports', {
        params: { reportType, ...filters },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setCurrentReport(response.data.data);
        return response.data.data;
      } else {
        setError(response.data.message || 'Failed to generate report');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Export report
   */
  const exportReport = useCallback(async (reportType, format, filters) => {
    try {
      const response = await axios.post('/api/reports/export', {
        reportType,
        format,
        filters
      }, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_Report_${Date.now()}.${format === 'EXCEL' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  }, []);

  const resetReport = useCallback(() => {
    setCurrentReport(null);
    setError(null);
  }, []);

  return (
    <ReportContext.Provider value={{
      currentReport,
      loading,
      error,
      runReport,
      exportReport,
      resetReport
    }}>
      {children}
    </ReportContext.Provider>
  );
};

export const useReport = () => {
  const context = useContext(ReportContext);
  if (!context) throw new Error('useReport must be used within a ReportProvider');
  return context;
};

export default ReportContext;