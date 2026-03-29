import React, { useEffect } from 'react';
import '../../styles/vintage-erp-theme.css';

/**
 * Professional Sticky Pagination component for Vintage ERP theme
 * Remains fixed at the bottom, supports keyboard navigation, page numbers, and jump-to-page logic.
 */
const PaginationControls = ({ 
  pagination, 
  onPageChange, 
  limit = 50, 
  onLimitChange,
  // Backward compatibility props
  currentPage: propCurrentPage,
  totalPages: propTotalPages,
  totalRecords: propTotalRecords,
  onPrev,
  onNext,
  hasNextPage: propHasNextPage,
  hasPrevPage: propHasPrevPage
}) => {
  // Normalize pagination data from either pagination object or individual props
  const currentPage = pagination?.currentPage || propCurrentPage || 1;
  const totalPages = pagination?.totalPages || propTotalPages || 1;
  const totalRecords = pagination?.totalRecords || propTotalRecords || 0;
  const hasNextPage = pagination?.hasNextPage !== undefined ? pagination.hasNextPage : (propHasNextPage || currentPage < totalPages);
  const hasPrevPage = pagination?.hasPrevPage !== undefined ? pagination.hasPrevPage : (propHasPrevPage || currentPage > 1);

  const handlePageChange = (newPage) => {
    if (newPage === currentPage) return;
    if (newPage < 1 || newPage > totalPages) return;
    
    if (onPageChange) {
      onPageChange(newPage);
    } else if (newPage === currentPage - 1 && onPrev) {
      onPrev();
    } else if (newPage === currentPage + 1 && onNext) {
      onNext();
    }
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeElement = document.activeElement;
      const isInputFocused = activeElement.tagName === 'INPUT' || 
                            activeElement.tagName === 'TEXTAREA' || 
                            activeElement.isContentEditable;
      
      if (isInputFocused) return;

      if (e.key === 'ArrowRight' && hasNextPage) {
        handlePageChange(currentPage + 1);
      } else if (e.key === 'ArrowLeft' && hasPrevPage) {
        handlePageChange(currentPage - 1);
      } else if (e.key === 'Home') {
        handlePageChange(1);
      } else if (e.key === 'End') {
        handlePageChange(totalPages);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, hasNextPage, hasPrevPage, onPageChange, onPrev, onNext]);

  if (totalRecords === 0) {
    return (
      <nav className="erp-pagination" aria-label="Pagination Navigation">
        <div className="erp-pagination-info">No records match the current filters.</div>
      </nav>
    );
  }

  const renderPageButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      buttons.push(
        <button 
          key={1} 
          className="erp-pagination-button" 
          onClick={() => handlePageChange(1)}
          aria-label="Page 1"
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(<span key="dots1" className="erp-pagination-ellipsis" aria-hidden="true">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button 
          key={i} 
          className={`erp-pagination-button ${currentPage === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
          aria-label={`Page ${i}`}
          aria-current={currentPage === i ? 'page' : undefined}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="dots2" className="erp-pagination-ellipsis" aria-hidden="true">...</span>);
      }
      buttons.push(
        <button 
          key={totalPages} 
          className="erp-pagination-button" 
          onClick={() => handlePageChange(totalPages)}
          aria-label={`Page ${totalPages}`}
        >
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endRecord = Math.min(currentPage * limit, totalRecords);

  return (
    <nav className="erp-pagination" aria-label="Pagination Navigation">
      <div className="erp-pagination-info">
        Showing <strong>{startRecord}–{endRecord}</strong> of <strong>{totalRecords}</strong> records
      </div>
      
      <div className="erp-pagination-controls">
        <button 
          className="erp-pagination-button" 
          disabled={currentPage === 1}
          onClick={() => handlePageChange(1)}
          title="First Page (Home)"
          aria-label="First Page"
        >
          First
        </button>
        <button 
          className="erp-pagination-button" 
          disabled={!hasPrevPage}
          onClick={() => handlePageChange(currentPage - 1)}
          title="Previous Page (ArrowLeft)"
          aria-label="Previous Page"
        >
          Prev
        </button>
        
        <div className="erp-pagination-numbers" style={{ display: 'flex', gap: '4px' }}>
          {renderPageButtons()}
        </div>
        
        <button 
          className="erp-pagination-button" 
          disabled={!hasNextPage}
          onClick={() => handlePageChange(currentPage + 1)}
          title="Next Page (ArrowRight)"
          aria-label="Next Page"
        >
          Next
        </button>
        <button 
          className="erp-pagination-button" 
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(totalPages)}
          title="Last Page (End)"
          aria-label="Last Page"
        >
          Last
        </button>

        <div className="erp-pagination-limit" style={{ display: 'flex', alignItems: 'center', marginLeft: '12px' }}>
          <span style={{ marginRight: '6px', fontSize: '11px' }}>Rows:</span>
          <select 
            value={limit} 
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="limit-select"
            aria-label="Records per page"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    </nav>
  );
};

export default PaginationControls;
