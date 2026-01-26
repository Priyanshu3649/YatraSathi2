import React, { useState, useEffect, useCallback } from 'react';

const BillingMasterForm = ({ 
  formData, 
  onChange, 
  isEditing, 
  isNew, 
  onCalculateTotal,
  onFocusNext,
  onFieldBlur
}) => {
  // Local state for keyboard navigation
  const [focusedField, setFocusedField] = useState('');
  // State for save confirmation modal
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Handle field changes
  const handleChange = (field, value) => {
    onChange({ ...formData, [field]: value });
    
    // Calculate total when certain fields change
    if ([
      'railwayFare', 'miscCharges', 'platformFee', 'serviceCharge', 
      'deliveryCharge', 'surcharge', 'gst', 'discount', 'cancellationCharge'
    ].includes(field)) {
      calculateTotal();
    }
  };

  // Calculate total amount
  const calculateTotal = useCallback(() => {
    const {
      railwayFare = 0,
      miscCharges = 0,
      platformFee = 0,
      serviceCharge = 0,
      deliveryCharge = 0,
      surcharge = 0,
      gst = 0,
      discount = 0,
      cancellationCharge = 0
    } = formData;

    // Calculate total based on the formula
    let total = parseFloat(railwayFare) || 0;
    total += parseFloat(miscCharges) || 0;
    total += parseFloat(platformFee) || 0;
    total += parseFloat(serviceCharge) || 0;
    total += parseFloat(deliveryCharge) || 0;
    total += parseFloat(surcharge) || 0;
    total += parseFloat(gst) || 0;
    total -= parseFloat(discount) || 0;
    total -= parseFloat(cancellationCharge) || 0;

    // Ensure total is not negative
    total = Math.max(0, total);

    onChange({ ...formData, totalAmount: total });
  }, [formData, onChange]);

  // Handle field focus
  const handleFocus = (field) => {
    setFocusedField(field);
  };

  // Handle field blur
  const handleBlur = (field, value) => {
    onFieldBlur && onFieldBlur(field, value);
  };

  // Handle save confirmation
  const handleSaveConfirm = (confirmed) => {
    setShowSaveModal(false);
    if (confirmed && onFocusNext) {
      onFocusNext('discount'); // Trigger save action
    }
  };

  // Handle key down for navigation
  const handleKeyDown = (e, field, isLastField = false) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift + Tab - go to previous field
        e.preventDefault();
        // We'll handle this in the parent component
      } else if (isLastField) {
        e.preventDefault();
        // At the last field, show save confirmation modal
        setShowSaveModal(true);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Move to next field
      if (isLastField) {
        // If it's the last field, confirm save
        setShowSaveModal(true);
      } else {
        onFocusNext && onFocusNext(field);
      }
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '';
    return parseFloat(value).toFixed(2);
  };

  // Effect to handle ESC key for modal
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape' && showSaveModal) {
        handleSaveConfirm(false);
      }
    };

    if (showSaveModal) {
      document.addEventListener('keydown', handleGlobalKeyDown);
      return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }
  }, [showSaveModal]);

  return (
    <>
      <div className="billing-master-form">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {/* Entry No (readonly) */}
          <div className="field">
            <label className="label">Entry No *</label>
            <input
              type="text"
              className="erp-input"
              value={formData.entryNo || ''}
              onChange={(e) => handleChange('entryNo', e.target.value)}
              disabled={!isNew}
              onFocus={() => handleFocus('entryNo')}
              onBlur={(e) => handleBlur('entryNo', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'entryNo')}
              placeholder="Auto-generated"
            />
          </div>

          {/* Billing Date */}
          <div className="field">
            <label className="label">Billing Date *</label>
            <input
              type="date"
              className="erp-input"
              value={formData.billingDate || ''}
              onChange={(e) => handleChange('billingDate', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('billingDate')}
              onBlur={(e) => handleBlur('billingDate', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'billingDate')}
              autoFocus={isNew} // Auto-focus on billing date for new records
            />
          </div>

          {/* Booking ID (readonly) */}
          <div className="field">
            <label className="label">Booking ID *</label>
            <input
              type="text"
              className="erp-input"
              value={formData.bookingId || ''}
              onChange={(e) => handleChange('bookingId', e.target.value)}
              disabled={true} // Always readonly
              onFocus={() => handleFocus('bookingId')}
              onBlur={(e) => handleBlur('bookingId', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'bookingId')}
            />
          </div>

          {/* Bill No */}
          <div className="field">
            <label className="label">Bill No</label>
            <input
              type="text"
              className="erp-input"
              value={formData.billNo || ''}
              onChange={(e) => handleChange('billNo', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('billNo')}
              onBlur={(e) => handleBlur('billNo', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'billNo')}
            />
          </div>

          {/* Sub Bill No */}
          <div className="field">
            <label className="label">Sub Bill No</label>
            <input
              type="text"
              className="erp-input"
              value={formData.subBillNo || ''}
              onChange={(e) => handleChange('subBillNo', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('subBillNo')}
              onBlur={(e) => handleBlur('subBillNo', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'subBillNo')}
            />
          </div>

          {/* Customer Name */}
          <div className="field">
            <label className="label">Customer Name *</label>
            <input
              type="text"
              className="erp-input"
              value={formData.customerName || ''}
              onChange={(e) => handleChange('customerName', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('customerName')}
              onBlur={(e) => handleBlur('customerName', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'customerName')}
            />
          </div>

          {/* Customer Phone Number */}
          <div className="field">
            <label className="label">Customer Phone Number *</label>
            <input
              type="text"
              className="erp-input"
              value={formData.customerPhone || ''}
              onChange={(e) => handleChange('customerPhone', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('customerPhone')}
              onBlur={(e) => handleBlur('customerPhone', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'customerPhone')}
            />
          </div>

          {/* Phone Number */}
          <div className="field">
            <label className="label">Phone Number *</label>
            <input
              type="text"
              className="erp-input"
              value={formData.customerPhone || ''}
              onChange={(e) => handleChange('customerPhone', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('customerPhone')}
              onBlur={(e) => handleBlur('customerPhone', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'customerPhone')}
            />
          </div>

          {/* Station Boy */}
          <div className="field">
            <label className="label">Station Boy</label>
            <select
              className="erp-input"
              value={formData.stationBoy || ''}
              onChange={(e) => handleChange('stationBoy', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('stationBoy')}
              onBlur={(e) => handleBlur('stationBoy', e.target.value)}
              onKeyDown={(e) => {
                // Handle arrow keys for dropdown navigation
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  // Let the browser handle native dropdown behavior
                  return;
                }
                // Handle Enter to select option
                if (e.key === 'Enter') {
                  // Let the browser handle native dropdown behavior
                  return;
                }
                // Handle Escape to close dropdown
                if (e.key === 'Escape') {
                  e.target.blur();
                  return;
                }
                handleKeyDown(e, 'stationBoy');
              }}
            >
              <option value="">Select Station Boy</option>
              <option value="Ramesh">Ramesh</option>
              <option value="Suresh">Suresh</option>
              <option value="Mahesh">Mahesh</option>
              <option value="Rajesh">Rajesh</option>
              <option value="Vijay">Vijay</option>
              <option value="Amit">Amit</option>
            </select>
          </div>

          {/* From Station */}
          <div className="field">
            <label className="label">From Station</label>
            <input
              type="text"
              className="erp-input"
              value={formData.fromStation || ''}
              onChange={(e) => handleChange('fromStation', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('fromStation')}
              onBlur={(e) => handleBlur('fromStation', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'fromStation')}
            />
          </div>

          {/* To Station */}
          <div className="field">
            <label className="label">To Station</label>
            <input
              type="text"
              className="erp-input"
              value={formData.toStation || ''}
              onChange={(e) => handleChange('toStation', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('toStation')}
              onBlur={(e) => handleBlur('toStation', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'toStation')}
            />
          </div>

          {/* Journey Date */}
          <div className="field">
            <label className="label">Journey Date</label>
            <input
              type="date"
              className="erp-input"
              value={formData.journeyDate || ''}
              onChange={(e) => handleChange('journeyDate', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('journeyDate')}
              onBlur={(e) => handleBlur('journeyDate', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'journeyDate')}
            />
          </div>

          {/* Train Number */}
          <div className="field">
            <label className="label">Train Number</label>
            <input
              type="text"
              className="erp-input"
              value={formData.trainNo || ''}
              onChange={(e) => handleChange('trainNo', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('trainNo')}
              onBlur={(e) => handleBlur('trainNo', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'trainNo')}
            />
          </div>

          {/* Class */}
          <div className="field">
            <label className="label">Class</label>
            <input
              type="text"
              className="erp-input"
              value={formData.class || ''}
              onChange={(e) => handleChange('class', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('class')}
              onBlur={(e) => handleBlur('class', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'class')}
            />
          </div>

          {/* PNR Number */}
          <div className="field">
            <label className="label">PNR Number</label>
            <input
              type="text"
              className="erp-input"
              value={formData.pnr || ''}
              onChange={(e) => handleChange('pnr', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('pnr')}
              onBlur={(e) => handleBlur('pnr', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'pnr')}
            />
          </div>

          {/* Ticket Type */}
          <div className="field">
            <label className="label">Ticket Type</label>
            <select
              className="erp-input"
              value={formData.ticketType || 'NORMAL'}
              onChange={(e) => handleChange('ticketType', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('ticketType')}
              onBlur={(e) => handleBlur('ticketType', e.target.value)}
              onKeyDown={(e) => {
                // Handle arrow keys for dropdown navigation
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  // Let the browser handle native dropdown behavior
                  return;
                }
                // Handle Enter to select option
                if (e.key === 'Enter') {
                  // Let the browser handle native dropdown behavior
                  return;
                }
                // Handle Escape to close dropdown
                if (e.key === 'Escape') {
                  e.target.blur();
                  return;
                }
                handleKeyDown(e, 'ticketType');
              }}
            >
              <option value="NORMAL">NORMAL</option>
              <option value="TATKAL">TATKAL</option>
              <option value="PREMIUM TATKAL">PREMIUM TATKAL</option>
              <option value="LADIES">LADIES</option>
              <option value="SENIOR CITIZEN">SENIOR CITIZEN</option>
            </select>
          </div>

          {/* Seat(s) Reserved */}
          <div className="field">
            <label className="label">Seat(s) Reserved</label>
            <input
              type="text"
              className="erp-input"
              value={formData.seatsReserved || ''}
              onChange={(e) => handleChange('seatsReserved', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('seatsReserved')}
              onBlur={(e) => handleBlur('seatsReserved', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'seatsReserved')}
            />
          </div>

          {/* Monetary Fields */}
          <div className="field">
            <label className="label">Railway Fare</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              value={formatCurrency(formData.railwayFare)}
              onChange={(e) => handleChange('railwayFare', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('railwayFare')}
              onBlur={(e) => handleBlur('railwayFare', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'railwayFare')}
            />
          </div>

          <div className="field">
            <label className="label">Station Boy Incentive</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              value={formatCurrency(formData.stationBoyIncentive)}
              onChange={(e) => handleChange('stationBoyIncentive', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('stationBoyIncentive')}
              onBlur={(e) => handleBlur('stationBoyIncentive', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'stationBoyIncentive')}
            />
          </div>

          <div className="field">
            <label className="label">GST</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              value={formatCurrency(formData.gst)}
              onChange={(e) => handleChange('gst', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('gst')}
              onBlur={(e) => handleBlur('gst', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'gst')}
            />
          </div>

          <div className="field">
            <label className="label">Misc Charges</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              value={formatCurrency(formData.miscCharges)}
              onChange={(e) => handleChange('miscCharges', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('miscCharges')}
              onBlur={(e) => handleBlur('miscCharges', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'miscCharges')}
            />
          </div>

          <div className="field">
            <label className="label">Platform Fees</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              value={formatCurrency(formData.platformFee)}
              onChange={(e) => handleChange('platformFee', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('platformFee')}
              onBlur={(e) => handleBlur('platformFee', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'platformFee')}
            />
          </div>

          <div className="field">
            <label className="label">Service Charge</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              value={formatCurrency(formData.serviceCharge)}
              onChange={(e) => handleChange('serviceCharge', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('serviceCharge')}
              onBlur={(e) => handleBlur('serviceCharge', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'serviceCharge')}
            />
          </div>

          <div className="field">
            <label className="label">Delivery Charge</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              value={formatCurrency(formData.deliveryCharge)}
              onChange={(e) => handleChange('deliveryCharge', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('deliveryCharge')}
              onBlur={(e) => handleBlur('deliveryCharge', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'deliveryCharge')}
            />
          </div>

          <div className="field">
            <label className="label">Cancellation Charges</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              value={formatCurrency(formData.cancellationCharge)}
              onChange={(e) => handleChange('cancellationCharge', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('cancellationCharge')}
              onBlur={(e) => handleBlur('cancellationCharge', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'cancellationCharge')}
            />
          </div>

          <div className="field">
            <label className="label">GST Type</label>
            <select
              className="erp-input"
              value={formData.gstType || 'EXCLUSIVE'}
              onChange={(e) => handleChange('gstType', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('gstType')}
              onBlur={(e) => handleBlur('gstType', e.target.value)}
              onKeyDown={(e) => {
                // Handle arrow keys for dropdown navigation
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  // Let the browser handle native dropdown behavior
                  return;
                }
                // Handle Enter to select option
                if (e.key === 'Enter') {
                  // Let the browser handle native dropdown behavior
                  return;
                }
                // Handle Escape to close dropdown
                if (e.key === 'Escape') {
                  e.target.blur();
                  return;
                }
                handleKeyDown(e, 'gstType');
              }}
            >
              <option value="INCLUSIVE">INCLUSIVE</option>
              <option value="EXCLUSIVE">EXCLUSIVE</option>
            </select>
          </div>

          <div className="field">
            <label className="label">Surcharge</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              value={formatCurrency(formData.surcharge)}
              onChange={(e) => handleChange('surcharge', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('surcharge')}
              onBlur={(e) => handleBlur('surcharge', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'surcharge')}
            />
          </div>

          <div className="field">
            <label className="label">Discounts</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              value={formatCurrency(formData.discount)}
              onChange={(e) => handleChange('discount', e.target.value)}
              disabled={!isEditing}
              onFocus={() => handleFocus('discount')}
              onBlur={(e) => handleBlur('discount', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'discount', true)}
            />
          </div>

          {/* Total Amount (readonly) */}
          <div className="field">
            <label className="label">Total Amount *</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              value={formatCurrency(formData.totalAmount)}
              disabled={true} // Always readonly - auto calculated
              onFocus={() => handleFocus('totalAmount')}
              onKeyDown={(e) => handleKeyDown(e, 'totalAmount', true)} // Mark as last field
            />
          </div>

          {/* Split Bill Checkbox */}
          <div className="field" style={{ gridColumn: 'span 2' }}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isSplit || false}
                onChange={(e) => handleChange('isSplit', e.target.checked)}
                disabled={!isEditing}
              />
              Split Bill
            </label>
          </div>
        </div>
      </div>

      {/* Save Confirmation Modal */}
      {showSaveModal && (
        <div className="erp-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="erp-modal" style={{
            backgroundColor: '#f0f0f0',
            border: '2px solid #cccccc',
            boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.3)',
            minWidth: '300px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div className="erp-modal-title" style={{
              background: 'linear-gradient(180deg, #0997ff 0%, #0053ee 50%, #0050ee 50%, #06f 100%)',
              color: 'white',
              padding: '8px',
              fontWeight: 'bold',
              fontSize: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Confirm Save</span>
              <button 
                className="erp-modal-close"
                onClick={() => handleSaveConfirm(false)}
                style={{
                  background: '#e81123',
                  border: 'none',
                  color: 'white',
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                ×
              </button>
            </div>
            <div className="erp-modal-body" style={{ padding: '16px' }}>
              <p>Save Billing Record?</p>
            </div>
            <div className="erp-modal-footer" style={{ 
              padding: '8px 16px', 
              borderTop: '1px solid #ccc',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px'
            }}>
              <button 
                className="erp-button"
                onClick={() => handleSaveConfirm(false)}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px'
                }}
              >
                Cancel
              </button>
              <button 
                className="erp-button primary"
                onClick={() => handleSaveConfirm(true)}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  background: 'linear-gradient(to bottom, #5a7fdd, #4169E1)',
                  color: 'white',
                  fontWeight: 'bold'
                }}
                autoFocus
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BillingMasterForm;