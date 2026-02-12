import React, { createContext, useState, useContext, useCallback } from 'react';
import api from '../services/api';

// Create Report Context
const ReportContext = createContext();

// Report Provider Component
export const ReportProvider = ({ children }) => {
  // Report state
  const [currentReport, setCurrentReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Template state
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  
  // Report configuration state
  const [reportConfig, setReportConfig] = useState({
    reportType: '',
    columns: [],
    filters: {},
    groupBy: [],
    aggregates: {},
    orderBy: [],
    limit: 1000,
    offset: 0
  });

  /**
   * Run a report with the current configuration
   */
  const runReport = useCallback(async (config = null) => {
    const effectiveConfig = config || reportConfig;
    
    // Validate required fields
    if (!effectiveConfig.reportType) {
      setError('Please select a report type');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/reports/run', effectiveConfig);
      
      if (response.data.success) {
        setCurrentReport({
          data: response.data.data,
          metadata: response.data.metadata,
          aggregates: response.data.aggregates,
          config: effectiveConfig
        });
        
        // Log successful report generation
        console.log(`Report generated successfully: ${effectiveConfig.reportType}`, {
          recordCount: response.data.data.length,
          metadata: response.data.metadata
        });
      } else {
        setError(response.data.message || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Report generation error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to generate report');
      setCurrentReport(null);
    } finally {
      setLoading(false);
    }
  }, [reportConfig]);

  /**
   * Save current report configuration as template
   */
  const saveTemplate = useCallback(async (templateName, description = '', isPublic = false) => {
    if (!templateName) {
      setError('Template name is required');
      return false;
    }

    if (!reportConfig.reportType) {
      setError('No report configuration to save');
      return false;
    }

    setLoadingTemplates(true);
    setError(null);
    
    try {
      const templateData = {
        name: templateName,
        description,
        config: reportConfig,
        isPublic
      };

      const response = await api.post('/reports/templates', templateData);
      
      if (response.data.success) {
        // Refresh templates list
        await fetchTemplates();
        return true;
      } else {
        setError(response.data.message || 'Failed to save template');
        return false;
      }
    } catch (err) {
      console.error('Template save error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save template');
      return false;
    } finally {
      setLoadingTemplates(false);
    }
  }, [reportConfig]);

  /**
   * Fetch user's saved templates
   */
  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    
    try {
      const response = await api.get('/reports/templates');
      
      if (response.data.success) {
        setSavedTemplates(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch templates');
      }
    } catch (err) {
      console.error('Template fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch templates');
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  /**
   * Load template configuration
   */
  const loadTemplate = useCallback((template) => {
    try {
      const config = typeof template.rt_config === 'string' 
        ? JSON.parse(template.rt_config)
        : template.rt_config;
      
      setReportConfig(config);
      setCurrentReport(null); // Clear current report when loading new template
      setError(null);
      
      return true;
    } catch (err) {
      console.error('Template load error:', err);
      setError('Failed to load template configuration');
      return false;
    }
  }, []);

  /**
   * Delete a template
   */
  const deleteTemplate = useCallback(async (templateId) => {
    setLoadingTemplates(true);
    
    try {
      const response = await api.delete(`/reports/templates/${templateId}`);
      
      if (response.data.success) {
        // Remove from local state
        setSavedTemplates(prev => prev.filter(t => t.rt_rtid !== templateId));
        return true;
      } else {
        setError(response.data.message || 'Failed to delete template');
        return false;
      }
    } catch (err) {
      console.error('Template delete error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete template');
      return false;
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  /**
   * Update report configuration
   */
  const updateConfig = useCallback((newConfig) => {
    setReportConfig(prev => ({
      ...prev,
      ...newConfig
    }));
    
    // Clear current report when config changes
    if (Object.keys(newConfig).length > 0) {
      setCurrentReport(null);
    }
  }, []);

  /**
   * Reset report state
   */
  const resetReport = useCallback(() => {
    setCurrentReport(null);
    setReportConfig({
      reportType: '',
      columns: [],
      filters: {},
      groupBy: [],
      aggregates: {},
      orderBy: [],
      limit: 1000,
      offset: 0
    });
    setError(null);
  }, []);

  /**
   * Get available report schema
   */
  const getReportSchema = useCallback(async () => {
    try {
      const response = await api.get('/reports/schema');
      return response.data.data;
    } catch (err) {
      console.error('Schema fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch report schema');
      return null;
    }
  }, []);

  // Context value
  const contextValue = {
    // State
    currentReport,
    loading,
    error,
    savedTemplates,
    loadingTemplates,
    reportConfig,
    
    // Actions
    runReport,
    saveTemplate,
    fetchTemplates,
    loadTemplate,
    deleteTemplate,
    updateConfig,
    resetReport,
    getReportSchema,
    
    // Derived state
    hasData: !!currentReport && currentReport.data && currentReport.data.length > 0,
    recordCount: currentReport?.data?.length || 0,
    reportType: reportConfig.reportType
  };

  return (
    <ReportContext.Provider value={contextValue}>
      {children}
    </ReportContext.Provider>
  );
};

// Custom hook to use Report Context
export const useReport = () => {
  const context = useContext(ReportContext);
  
  if (!context) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  
  return context;
};

export default ReportContext;