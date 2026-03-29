import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for ERP-standard filtering logic & keyboard navigation.
 * Manages dual-state filters (draft vs active) and intercepts F2, Enter, ESC keys.
 *
 * @param {Object} initialFilters - Default empty state for filters.
 * @param {Function} onApply - Callback executed when filters are formally committed (Enter key).
 * @param {Object} options - Configuration options
 * @param {boolean} options.realTime - Enable real-time filtering (default: false)
 * @param {number} options.debounceMs - Debounce delay for real-time filtering (default: 500ms)
 * @returns {Object} { draftFilters, activeFilters, handleFilterChange, setDraftFilters }
 */
export const useERPFilters = (initialFilters = {}, onApply = () => {}, options = {}) => {
  const { realTime = false, debounceMs = 500 } = options;
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [activeFilters, setActiveFilters] = useState(initialFilters);
  const debounceTimerRef = useRef(null);

  // Update draft instantly as user types
  const handleFilterChange = useCallback((field, value) => {
    setDraftFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Real-time filtering with debounce
  useEffect(() => {
    if (!realTime) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer to apply filters after delay
    debounceTimerRef.current = setTimeout(() => {
      setActiveFilters(draftFilters);
      onApply(draftFilters);
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [draftFilters, realTime, debounceMs, onApply]);

  // Sync keyboard events exclusively for filtering context
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ignore if user is inside a modal or heavily nested form
      if (document.querySelector('.erp-modal-overlay')) return;

      switch (e.key) {
        case 'F2':
          e.preventDefault();
          // Focus the first available inline filter input in a grid
          const firstFilterInput = document.querySelector('.inline-filter-input');
          if (firstFilterInput) {
            firstFilterInput.focus();
          }
          break;

        case 'Enter':
          // If we are focused on a filter input, hitting Enter should apply filters
          const activeEl = document.activeElement;
          if (activeEl && activeEl.classList.contains('inline-filter-input')) {
            e.preventDefault();
            
            // In real-time mode, Enter just confirms and moves focus
            // In manual mode, Enter applies filters
            if (!realTime) {
              setActiveFilters(draftFilters);
              onApply(draftFilters);
            }
            
            activeEl.blur(); // Remove focus after applying
          }
          break;

        case 'Escape':
          const isFilterActive = document.activeElement && 
                                 document.activeElement.classList.contains('inline-filter-input');
          
          if (isFilterActive || Object.keys(draftFilters).some(k => draftFilters[k])) {
            e.preventDefault();
            // Clear both draft and active filters entirely
            setDraftFilters(initialFilters);
            setActiveFilters(initialFilters);
            onApply(initialFilters);
            
            if (isFilterActive) {
                document.activeElement.blur();
            }
          }
          break;
          
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [draftFilters, onApply, initialFilters, realTime]);

  // Provide manual flush method for buttons ("Search" / "Clear")
  const applyFiltersManual = () => {
    setActiveFilters(draftFilters);
    onApply(draftFilters);
  };

  const clearFiltersManual = () => {
    setDraftFilters(initialFilters);
    setActiveFilters(initialFilters);
    onApply(initialFilters);
  };

  return {
    draftFilters,
    activeFilters,
    setDraftFilters,
    handleFilterChange,
    applyFiltersManual,
    clearFiltersManual
  };
};

export default useERPFilters;
