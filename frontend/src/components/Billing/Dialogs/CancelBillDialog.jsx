import React, { useState } from 'react';

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const CancelBillDialog = ({ bill, onClose, onConfirm }) => {
  const [railwayCharges, setRailwayCharges] = useState(0);
  const [agentCharges, setAgentCharges] = useState(0);
  const [reason, setReason] = useState('');
  const [selectedPassengerIds, setSelectedPassengerIds] = useState([]);
  const [error, setError] = useState('');

  const passengers = bill?.passengerList || bill?.passengers || [];
  const railChg = parseFloat(railwayCharges) || 0;
  const agentChg = parseFloat(agentCharges) || 0;
  const totalCharges = railChg + agentChg;

  // Refund comes only from the railway fare. Service charge, station boy
  // incentive, platform fee, GST and every other reservation charge is retained.
  // Fares already reversed by earlier C documents of this bill are counted through
  // the accumulated charges/refund on the reservation bill, so the per-ticket rate
  // always divides the fare that is still refundable by the tickets still on it.
  const railwayFare = parseFloat(bill?.railwayFare ?? bill?.bl_railway_fare) || 0;
  const reversedFareSoFar =
    (parseFloat(bill?.bl_railway_cancellation_charge) || 0) +
    (parseFloat(bill?.bl_agent_cancellation_charge) || 0) +
    (parseFloat(bill?.refund_amount) || 0);
  const refundableFare = Math.max(0, round2(railwayFare - reversedFareSoFar));
  const ticketsOnBill = passengers.length || 1;
  const selectedPax = selectedPassengerIds.length;
  const perTicketFare = refundableFare / ticketsOnBill;
  const cancelledFare = Math.min(round2(perTicketFare * selectedPax), refundableFare);
  const refundAmount = Math.max(0, round2(cancelledFare - totalCharges));
  const chargesExceedFare = totalCharges > cancelledFare;

  const handlePassengerToggle = (passId) => {
    setSelectedPassengerIds(prev => 
      prev.includes(passId) ? prev.filter(p => p !== passId) : [...prev, passId]
    );
  };

  const dialogRef = React.useRef(null);

  React.useEffect(() => {
    if (dialogRef.current) {
      const inputs = dialogRef.current.querySelectorAll('input, textarea, button');
      if (inputs.length > 0) inputs[0].focus();
    }
  }, []);

  React.useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag === 'textarea' || activeTag === 'button') {
          return;
        }
        if (!(chargesExceedFare || selectedPassengerIds.length === 0)) {
           e.preventDefault();
           handleConfirm();
        }
      } else if (e.key === 'Tab') {
        if (!dialogRef.current) return;
        const focusableElements = dialogRef.current.querySelectorAll(
          'input:not([disabled]), textarea:not([disabled]), button:not([disabled])'
        );
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onClose, railwayCharges, agentCharges, reason, selectedPassengerIds, cancelledFare, chargesExceedFare]);

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
    if (chargesExceedFare) {
      setError(`Cancellation charges cannot exceed the refundable railway fare of ₹${cancelledFare.toFixed(2)} for the selected passengers. Service charge and station boy incentive are retained, never refunded.`);
      return;
    }
    if (!String(reason).trim()) {
      setError('A cancellation reason is required.');
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
      <div ref={dialogRef} style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0, color: '#d32f2f' }}>Cancel Bill: {bill?.bl_bill_no || bill?.bl_entry_no}</h3>
        
        {error && <div style={{ color: 'red', marginBottom: '16px', padding: '8px', background: '#ffebee', borderRadius: '4px', fontSize: '14px' }}>{error}</div>}
        
        <div style={{ marginBottom: '16px', background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Railway fare still refundable on this bill:</span>
            <strong>₹{refundableFare.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Cancelled railway fare ({selectedPax} of {ticketsOnBill} tickets):</span>
            <strong>₹{cancelledFare.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Total Cancellation Charges:</span>
            <strong style={{ color: '#d32f2f' }}>₹{totalCharges.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ccc', paddingTop: '8px', marginTop: '8px' }}>
            <span>Refund Payable:</span>
            <strong style={{ color: '#388e3c' }}>₹{refundAmount.toFixed(2)}</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
            Service charge, station boy incentive and other reservation charges are retained.
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Railway Cancellation Charge (₹)</label>
          <input 
            type="number" 
            value={railwayCharges}
            onChange={(e) => setRailwayCharges(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !(chargesExceedFare || selectedPassengerIds.length === 0)) handleConfirm(); }}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            tabIndex={0}
            min="0"
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Agent Cancellation Charge (₹)</label>
          <input 
            type="number" 
            value={agentCharges}
            onChange={(e) => setAgentCharges(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !(chargesExceedFare || selectedPassengerIds.length === 0)) handleConfirm(); }}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            tabIndex={0}
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
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handlePassengerToggle(p.id); } }}
                    style={{ marginRight: '8px' }}
                    tabIndex={0}
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
            tabIndex={0}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #ccc', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
          <button 
            onClick={handleConfirm} 
            disabled={chargesExceedFare || selectedPassengerIds.length === 0}
            style={{ 
              padding: '8px 16px', 
              border: 'none', 
              background: (chargesExceedFare || selectedPassengerIds.length === 0) ? '#ccc' : '#d32f2f', 
              color: '#fff', 
              borderRadius: '4px', 
              cursor: (chargesExceedFare || selectedPassengerIds.length === 0) ? 'not-allowed' : 'pointer' 
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
