import { useState, useCallback } from 'react';

/**
 * Reusable pagination hook for server-side pagination
 * @param {number} initialPage - Starting page number (default: 1)
 * @param {number} initialLimit - Default records per page (default: 50)
 * @returns {Object} Pagination state and methods
 */
export const usePagination = (initialPage = 1, initialLimit = 50) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  /**
   * Update pagination state from API response
   * @param {Object} paginationData - Pagination data from API
   */
  const updatePagination = useCallback((paginationData) => {
    if (paginationData) {
      setPagination({
        currentPage: paginationData.currentPage || paginationData.page || 1,
        totalPages: paginationData.totalPages || 1,
        totalRecords: paginationData.totalRecords || paginationData.count || 0,
        hasNextPage: paginationData.hasNextPage !== undefined 
          ? paginationData.hasNextPage 
          : (paginationData.currentPage < paginationData.totalPages),
        hasPrevPage: paginationData.hasPrevPage !== undefined 
          ? paginationData.hasPrevPage 
          : (paginationData.currentPage > 1)
      });
    }
  }, []);

  /**
   * Navigate to next page
   */
  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      setPage(prev => prev + 1);
    }
  }, [pagination.hasNextPage]);

  /**
   * Navigate to previous page
   */
  const prevPage = useCallback(() => {
    if (pagination.hasPrevPage) {
      setPage(prev => Math.max(1, prev - 1));
    }
  }, [pagination.hasPrevPage]);

  /**
   * Navigate to specific page
   * @param {number} newPage - Target page number
   */
  const goToPage = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
    }
  }, [pagination.totalPages]);

  /**
   * Change records per page limit
   * @param {number} newLimit - New limit value
   */
  const changeLimit = useCallback((newLimit) => {
    if (newLimit > 0) {
      setLimit(newLimit);
      setPage(1); // Reset to first page when changing limit
    }
  }, []);

  /**
   * Reset pagination to initial values
   */
  const resetPagination = useCallback(() => {
    setPage(initialPage);
    setLimit(initialLimit);
    setPagination({
      currentPage: 1,
      totalPages: 1,
      totalRecords: 0,
      hasNextPage: false,
      hasPrevPage: false
    });
  }, [initialPage, initialLimit]);

  return {
    page,
    limit,
    pagination,
    setPage,
    setLimit,
    updatePagination,
    nextPage,
    prevPage,
    goToPage,
    changeLimit,
    resetPagination
  };
};

/**
 * Helper function to calculate record range for display
 * @param {Object} pagination - Pagination state
 * @param {number} limit - Current limit
 * @returns {Object} Start and end record numbers
 */
export const getRecordRange = (pagination, limit) => {
  const { currentPage, totalRecords } = pagination;
  const start = ((currentPage - 1) * limit) + 1;
  const end = Math.min(currentPage * limit, totalRecords);
  
  return { start, end, total: totalRecords };
};
