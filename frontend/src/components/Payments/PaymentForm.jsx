// Payment Form Component - Money going out
// Implements the ASCII wireframe layout as specified

import React, { useState, useEffect, useRef } from 'react';
import { useKeyboardNavigation } from '../../contexts/KeyboardNavigationContext';
import useKeyboardNav from '../../hooks/useKeyboardNavigation';
import SaveConfirmationModal from '../common/SaveConfirmationModal';

const PaymentForm = ({ onBack }) => {
  const [formData, setFormData] = useState({
    voucher_no: '',
    entry_date: new Date().toISOString().split('T')[0],
    paid_to: '',
    payment_mode: 'Cash',
    amount: '',
    narration: ''
  });

  const [paymentModes] = useState(['Cash', 'Bank', 'Cheque', 'Draft']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Define field order for keyboard navigation
  const fieldOrder = [
    'voucher_no',
    'entry_date', 
    'paid_to',
    'payment_mode',
    'amount',
    'narration'
  ];

  const {
    formRef,
    saveConfirmationOpen,
    handleKeyDown
  } = useKeyboardNav({
    fieldOrder,
    autoFocus: true,
    onSave: handleSave,
    onCancel: onBack
  });

  const { saveConfirmationOpen: globalSaveOpen } = useKeyboardNavigation();

  // Load initial data
  useEffect(() => {
    loadNextVoucherNumber();
  }, []);

  const loadNextVoucherNumber = async () => {
    try {
      // This will be implemented when API is integrated
      setFormData(prev => ({ ...prev, voucher_no: 'PAY000001/2025-26' }));
    } catch (err) {
      console.error('Failed to load voucher number:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  async function handleSave() {
    try {
      setLoading(true);
      setError('');

      // Validation
      if (!formData.paid_to) {
        setError('Paid to is required');
        return;
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setError('Amount must be greater than 0');
        return;
      }

      // This will be implemented when API is integrated
      console.log('Saving payment entry:', formData);
      
      setSuccess('Payment entry saved successfully');
      
      // Reset form
      setFormData({
        voucher_no: '',
        entry_date: new Date().toISOString().split('T')[0],
        paid_to: '',
        payment_mode: 'Cash',
        amount: '',
        narration: ''
      });
      
      loadNextVoucherNumber();
      
    } catch (err) {
      setError(err.message || 'Failed to save payment entry');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="accounting-form-container">
      {/* ASCII Wireframe Header */}
      <div className="form-header">
        <div className="ascii-border">┌──────────────────────────────────────────────────────────────┐</div>
        <div className="ascii-line">│ Payment No : {formData.voucher_no.padEnd(11)} Date : {formData.entry_date} Last Entry : {new Date().toLocaleDateString().padEnd(8)}│</div>
        <div className="ascii-border">├──────────────────────────────────────────────────────────────┤</div>
      </div>

      {/* Form Content */}
      <div 
        className="form-content"
        ref={formRef}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Entry Fields */}
        <div className="entry-fields">
          <div className="field-row">
            <label>Paid To:</label>
            <input
              type="text"
              name="paid_to"
              value={formData.paid_to}
              onChange={(e) => handleInputChange('paid_to', e.target.value)}
              className="form-input"
              placeholder="Enter payee name"
            />
          </div>

          <div className="field-row">
            <label>Payment Mode:</label>
            <select
              name="payment_mode"
              value={formData.payment_mode}
              onChange={(e) => handleInputChange('payment_mode', e.target.value)}
              className="form-input"
            >
              {paymentModes.map(mode => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>

          <div className="field-row">
            <label>Amount:</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className="form-input"
              step="0.01"
              min="0"
            />
          </div>

          <div className="field-row">
            <label>Narration:</label>
            <textarea
              name="narration"
              value={formData.narration}
              onChange={(e) => handleInputChange('narration', e.target.value)}
              className="form-input"
              rows="3"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button type="button" onClick={onBack} className="btn-secondary">
            ESC - Back to Menu
          </button>
          <button type="button" onClick={handleSave} className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'F10 - Save'}
          </button>
        </div>

        {/* Messages */}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </div>

      {/* ASCII Wireframe Footer */}
      <div className="form-footer">
        <div className="ascii-border">├──────────────────────────────────────────────────────────────┤</div>
        <div className="ascii-line">│ ADD SAVE CANCEL VIEW REFRESH &lt;&lt; &lt; &gt; &gt;&gt; MOD DELETE PRINT RETURN│</div>
        <div className="ascii-border">└──────────────────────────────────────────────────────────────┘</div>
      </div>

      {/* Save Confirmation Modal */}
      {(saveConfirmationOpen || globalSaveOpen) && (
        <SaveConfirmationModal
          onConfirm={handleSave}
          onCancel={() => {}}
          message="Save this payment entry?"
        />
      )}
    </div>
  );
};

export default PaymentForm;