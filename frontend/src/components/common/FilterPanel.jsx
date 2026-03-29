import React, { useState } from 'react';

const FilterPanel = ({ onFilter, onClear, filters, module = 'generic' }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleApply = (e) => {
    e.preventDefault();
    onFilter(localFilters);
  };

  const handleClear = () => {
    const cleared = Object.keys(localFilters).reduce((acc, key) => {
      acc[key] = typeof localFilters[key] === 'boolean' ? false : '';
      return acc;
    }, {});
    setLocalFilters(cleared);
    onClear(cleared);
  };

  return (
    <div className="erp-filter-panel">
      <form onSubmit={handleApply} className="erp-filter-form">
        <div className="erp-filter-grid">
          {/* Common Filters */}
          <div className="erp-filter-item">
            <label>Search</label>
            <input 
              type="text" 
              name="search" 
              value={localFilters.search || ''} 
              onChange={handleChange} 
              placeholder="Name, Phone, ID..." 
              className="erp-input-compact"
            />
          </div>
          
          <div className="erp-filter-item">
            <label>Status</label>
            <select name="status" value={localFilters.status || ''} onChange={handleChange} className="erp-select-compact">
              <option value="">All Status</option>
              {module === 'billing' && (
                <>
                  <option value="DRAFT">Draft</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="PAID">Paid</option>
                </>
              )}
              {module === 'booking' && (
                <>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                </>
              )}
            </select>
          </div>

          <div className="erp-filter-item">
            <label>Start Date</label>
            <input type="date" name="startDate" value={localFilters.startDate || ''} onChange={handleChange} className="erp-input-compact" />
          </div>

          <div className="erp-filter-item">
            <label>End Date</label>
            <input type="date" name="endDate" value={localFilters.endDate || ''} onChange={handleChange} className="erp-input-compact" />
          </div>

          <div className="erp-filter-item">
            <label>Min Amount</label>
            <input type="number" name="minAmount" value={localFilters.minAmount || ''} onChange={handleChange} className="erp-input-compact" />
          </div>

          <div className="erp-filter-item">
            <label>Max Amount</label>
            <input type="number" name="maxAmount" value={localFilters.maxAmount || ''} onChange={handleChange} className="erp-input-compact" />
          </div>
        </div>

        <div className="erp-filter-actions">
          <button type="submit" className="erp-button-primary">Apply Filters</button>
          <button type="button" onClick={handleClear} className="erp-button-secondary">Clear</button>
        </div>
      </form>
    </div>
  );
};

export default FilterPanel;
