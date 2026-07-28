import React, { useState, useEffect } from 'react';

const SplitBillDialog = ({ bill, onClose, onConfirm }) => {
  const [splits, setSplits] = useState([
    { id: Date.now(), amount: '', passengerIds: [] },
    { id: Date.now() + 1, amount: '', passengerIds: [] }
  ]);
  const [error, setError] = useState('');

  const passengers = bill?.passengers || [];
  const originalTotal = parseFloat(bill?.bl_total_amount || 0);

  const handleAddSplit = () => {
    setSplits([...splits, { id: Date.now(), amount: '', passengerIds: [] }]);
  };

  const handleRemoveSplit = (id) => {
    if (splits.length <= 2) return;
    setSplits(splits.filter(s => s.id !== id));
  };

  const handleAmountChange = (id, val) => {
    setSplits(splits.map(s => s.id === id ? { ...s, amount: val } : s));
  };

  const handlePassengerToggle = (splitId, passId) => {
    setSplits(splits.map(s => {
      if (s.id === splitId) {
        const isSelected = s.passengerIds.includes(passId);
        return {
          ...s,
          passengerIds: isSelected 
            ? s.passengerIds.filter(p => p !== passId)
            : [...s.passengerIds, passId]
        };
      } else {
        // Remove from other splits if selected here
        return {
          ...s,
          passengerIds: s.passengerIds.filter(p => p !== passId)
        };
      }
    }));
  };

  const handleConfirm = () => {
    const totalSplit = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
    if (Math.abs(totalSplit - originalTotal) > 0.01) {
      setError(`Split amounts must equal the original bill amount (${originalTotal}). Current sum: ${totalSplit}`);
      return;
    }
    
    // Check if any split has 0 amount
    if (splits.some(s => !s.amount || parseFloat(s.amount) <= 0)) {
      setError('All splits must have an amount greater than 0');
      return;
    }

    const payload = splits.map(s => ({
      amount: parseFloat(s.amount),
      passengerIds: s.passengerIds
    }));

    onConfirm(payload);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>Split Bill: {bill?.bl_bill_no || bill?.bl_entry_no}</h3>
        <p>Original Amount: <strong>₹{originalTotal}</strong></p>
        
        {error && <div style={{ color: 'red', marginBottom: '16px', padding: '8px', background: '#ffebee', borderRadius: '4px' }}>{error}</div>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {splits.map((split, index) => (
            <div key={split.id} style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0 }}>Split {String.fromCharCode(65 + index)}</h4>
                {splits.length > 2 && (
                  <button onClick={() => handleRemoveSplit(split.id)} style={{ background: 'transparent', border: 'none', color: 'red', cursor: 'pointer' }}>Remove</button>
                )}
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Amount (₹)</label>
                <input 
                  type="number" 
                  value={split.amount}
                  onChange={(e) => handleAmountChange(split.id, e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Assign Passengers</label>
                {passengers.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#666' }}>No passengers available.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {passengers.map(p => (
                      <label key={p.id} style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                        <input 
                          type="checkbox" 
                          checked={split.passengerIds.includes(p.id)}
                          onChange={() => handlePassengerToggle(split.id, p.id)}
                          style={{ marginRight: '8px' }}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '16px' }}>
          <button onClick={handleAddSplit} style={{ padding: '8px 16px', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>
            + Add Another Split
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #ccc', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleConfirm} style={{ padding: '8px 16px', border: 'none', background: '#1a73e8', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Confirm Split</button>
        </div>
      </div>
    </div>
  );
};

export default SplitBillDialog;
