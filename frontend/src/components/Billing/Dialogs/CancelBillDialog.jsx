import React, { useState } from 'react';

const CancelBillDialog = ({ bill, onClose, onConfirm }) => {
  const [railwayCharges, setRailwayCharges] = useState(0);
  const [agentCharges, setAgentCharges] = useState(0);
  const [reason, setReason] = useState('');
  const [selectedPassengerIds, setSelectedPassengerIds] = useState([]);
  const [error, setError] = useState('');

  const passengers = bill?.passengers || [];
  const originalTotal = parseFloat(bill?.bl_total_amount || 0);
  
  const railChg = parseFloat(railwayCharges) || 0;
  const agentChg = parseFloat(agentCharges) || 0;
  const totalCharges = railChg + agentChg;
  const refundAmount = Math.max(0, originalTotal - totalCharges);

  const handlePassengerToggle = (passId) => {
    setSelectedPassengerIds(prev => 
      prev.includes(passId) ? prev.filter(p => p !== passId) : [...prev, passId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPassengerIds.length === passengers.length) {
      setSelectedPassengerIds([]);
    } else {
      setSelectedPassengerIds(passengers.map(p => p.id));
    }
  };

  const handleConfirm = () => {
    if (selectedPassengerIds.length === 0) {
      setError('Please select at least one passenger to cancel.');
      return;
    }
    if (totalCharges > originalTotal) {
      setError('Total cancellation charges cannot exceed original bill amount.');
      return;
    }

    onConfirm({
      railwayCharges: railChg,
      agentCharges: agentChg,
      cancelledPassengers: selectedPassengerIds,
      reason
    });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0, color: '#d32f2f' }}>Cancel Bill: {bill?.bl_bill_no || bill?.bl_entry_no}</h3>
        
        {error && <div style={{ color: 'red', marginBottom: '16px', padding: '8px', background: '#ffebee', borderRadius: '4px', fontSize: '14px' }}>{error}</div>}
        
        <div style={{ marginBottom: '16px', background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Original Total Amount:</span>
            <strong>₹{originalTotal.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Total Cancellation Charges:</span>
            <strong style={{ color: '#d32f2f' }}>₹{totalCharges.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ccc', paddingTop: '8px', marginTop: '8px' }}>
            <span>Refundable Amount:</span>
            <strong style={{ color: '#388e3c' }}>₹{refundAmount.toFixed(2)}</strong>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Railway Cancellation Charge (₹)</label>
          <input 
            type="number" 
            value={railwayCharges}
            onChange={(e) => setRailwayCharges(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            min="0"
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Agent Cancellation Charge (₹)</label>
          <input 
            type="number" 
            value={agentCharges}
            onChange={(e) => setAgentCharges(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            min="0"
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>Select Passengers to Cancel</label>
            {passengers.length > 0 && (
              <button onClick={handleSelectAll} style={{ background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer', fontSize: '13px' }}>
                {selectedPassengerIds.length === passengers.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
          
          <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '8px', maxHeight: '150px', overflowY: 'auto' }}>
            {passengers.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#666', padding: '8px' }}>No passengers found.</div>
            ) : (
              passengers.map(p => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '4px 0', fontSize: '14px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedPassengerIds.includes(p.id)}
                    onChange={() => handlePassengerToggle(p.id)}
                    style={{ marginRight: '8px' }}
                  />
                  {p.name}
                </label>
              ))
            )}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Cancellation Reason</label>
          <textarea 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '60px' }}
            placeholder="Enter reason for cancellation..."
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #ccc', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
          <button 
            onClick={handleConfirm} 
            disabled={totalCharges > originalTotal || selectedPassengerIds.length === 0}
            style={{ 
              padding: '8px 16px', 
              border: 'none', 
              background: (totalCharges > originalTotal || selectedPassengerIds.length === 0) ? '#ccc' : '#d32f2f', 
              color: '#fff', 
              borderRadius: '4px', 
              cursor: (totalCharges > originalTotal || selectedPassengerIds.length === 0) ? 'not-allowed' : 'pointer' 
            }}
          >
            Confirm Cancellation
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelBillDialog;
