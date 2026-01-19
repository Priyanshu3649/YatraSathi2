// Journal Form Component - Adjustments and other entries
// Implements the ASCII wireframe layout as specified

import React, { useState, useEffect, useRef } from 'react';
import { useKeyboardNavigation } from '../../contexts/KeyboardNavigationContext';
import useKeyboardNav from '../../hooks/useKeyboardNavigation';
import SaveConfirmationModal from '../common/SaveConfirmationModal';

const JournalForm = ({ onBack }) => {
  const [formData, setFormData] = useState({
    voucher_no: '',
    entry_date: new Date().toISOString().split('T')[0],
    debit_ledger: '',
    credit_ledger: '',
    amount: '',
    narration: ''
  });

  const [ledgerList, setLedgerList] = useState([
    'Cash', 'Bank', 'Railway Charges', 'Service Charges', 
    'Customer Advance', 'Supplier Payment', 'Commission Income', 'Office Expenses'
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Define field order for keyboard navigation
  const fieldOrder = [
    'voucher_no',
    'entry_date', 
    'debit_ledger',
    'credit_ledger',
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
    loadLedgers();
  }, []);

  const loadNextVoucherNumber = async () => {
    try {
      // This will be implemented when API is integrated
      setFormData(prev => ({ ...prev, voucher_no: 'JOU000001/2025-26' }));
    } catch (err) {
      console.error('Failed to load voucher number:', err);
    }
  };

  const loadLedgers = async () => {
    try {
      // This will be implemented when API is integrated
      setLedgerList([
        'Cash', 'Bank', 'Railway Charges', 'Service Charges', 
        'Customer Advance', 'Supplier Payment', 'Commission Income', 'Office Expenses'
      ]);
    } catch (err) {
      console.error('Failed to load ledgers:', err);
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
      if (!formData.debit_ledger || !formData.credit_ledger) {
        setError('Both Debit and Credit ledgers are required');
        return;
      }

      if (formData.debit_ledger === formData.credit_ledger) {
        setError('Debit and Credit ledgers cannot be the same');
        return;
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setError('Amount must be greater than 0');
        return;
      }

      // This will be implemented when API is integrated
      console.log('Saving journal entry:', formData);
      
      setSuccess('Journal entry saved successfully');
      
      // Reset form
      setFormData({
        voucher_no: '',
        entry_date: new Date().toISOString().split('T')[0],
        debit_ledger: '',
        credit_ledger: '',
        amount: '',
        narration: ''
      });
      
      loadNextVoucherNumber();
      
    } catch (err) {
      setError(err.message || 'Failed to save journal entry');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="accounting-form-container">
      {/* ASCII Wireframe Header */}
      <div className="form-header">
        <div className="ascii-border">┌──────────────────────────────────────────────────────────────┐</div>
        <div className="ascii-line">│ Journal No : {formData.voucher_no.padEnd(11)} Date : {formData.entry_date} Last Entry : {new Date().toLocaleDateString().padEnd(8)}│</div>
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
            <label>Debit Ledger:</label>
            <select
              name="debit_ledger"
              value={formData.debit_ledger}
              onChange={(e) => handleInputChange('debit_ledger', e.target.value)}
              className="form-input"
            >
              <option value="">Select Debit Ledger</option>
              {ledgerList.map(ledger => (
                <option key={ledger} value={ledger}>{ledger}</option>
              ))}
            </select>
          </div>

          <div className="field-row">
            <label>Credit Ledger:</label>
            <select
              name="credit_ledger"
              value={formData.credit_ledger}
              onChange={(e) => handleInputChange('credit_ledger', e.target.value)}
              className="form-input"
            >
              <option value="">Select Credit Ledger</option>
              {ledgerList.map(ledger => (
                <option key={ledger} value={ledger}>{ledger}</option>
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
          message="Save this journal entry?"
        />
      )}
    </div>
  );
};

export default JournalForm;