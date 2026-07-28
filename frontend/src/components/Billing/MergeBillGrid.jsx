import React, { useState, useEffect } from 'react';
import { billingAPI } from '../../services/api';

const MergeBillGrid = ({ customerName, customerPhone, onMergeComplete, currentBillId }) => {
  const [bills, setBills] = useState([]);
  const [selectedBills, setSelectedBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customerName || customerPhone) {
      fetchEligibleBills();
    } else {
      setBills([]);
      setSelectedBills([]);
    }
  }, [customerName, customerPhone, currentBillId]);

  const fetchEligibleBills = async () => {
    setLoading(true);
    try {
      // Find all bills for this customer
      const response = await billingAPI.getAllBills(1, 100);
      if (response.success) {
        // Filter: same customer, not cancelled, not already merged, not the current one (maybe include current one if we want to merge it too)
        const eligible = response.data.filter(b => 
          (b.bl_customer_name === customerName || b.bl_customer_phone === customerPhone) &&
          b.bl_status !== 'CANCELLED' && 
          b.bl_status !== 'CAN' &&
          !b.bl_is_merged
        );
        setBills(eligible);
        
        // Auto-select current bill if it's in the list
        if (currentBillId && eligible.some(b => b.bl_id === currentBillId)) {
          setSelectedBills([currentBillId]);
        } else {
          setSelectedBills([]);
        }
      }
    } catch (err) {
      setError('Failed to fetch bills for merging');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (billId) => {
    setSelectedBills(prev => 
      prev.includes(billId) 
        ? prev.filter(id => id !== billId)
        : [...prev, billId]
    );
  };

  const handleMerge = async () => {
    if (selectedBills.length < 2) {
      setError('Select at least 2 bills to merge');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/billing/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ billIds: selectedBills })
      });
      const data = await response.json();
      if (data.success) {
        setSelectedBills([]);
        if (onMergeComplete) onMergeComplete(data.mergedBill);
      } else {
        setError(data.error || 'Failed to merge bills');
      }
    } catch (err) {
      setError('Network error while merging bills');
    } finally {
      setLoading(false);
    }
  };

  if (!customerName && !customerPhone) return null;

  return (
    <div className="erp-panel" style={{ marginTop: '10px', marginBottom: '10px', border: '1px solid #cce5ff', backgroundColor: '#e6f2ff' }}>
      <div className="erp-panel-header" style={{ backgroundColor: '#cce5ff', color: '#004085' }}>
        Merge Bills for {customerName}
      </div>
      <div style={{ padding: '10px' }}>
        {error && <div style={{ color: 'red', marginBottom: '10px', fontSize: '12px' }}>{error}</div>}
        
        {loading ? (
          <div style={{ fontSize: '12px' }}>Loading eligible bills...</div>
        ) : bills.length < 2 ? (
          <div style={{ fontSize: '12px', color: '#666' }}>Not enough eligible bills to merge. (Need at least 2 unmerged bills)</div>
        ) : (
          <>
            <table className="erp-table" style={{ width: '100%', fontSize: '11px', marginBottom: '10px' }}>
              <thead>
                <tr>
                  <th style={{ width: '30px' }}></th>
                  <th>Bill No</th>
                  <th>Date</th>
                  <th>Route</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {bills.map(b => (
                  <tr key={b.bl_id} style={{ backgroundColor: selectedBills.includes(b.bl_id) ? '#d4edda' : 'white' }}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedBills.includes(b.bl_id)}
                        onChange={() => handleSelect(b.bl_id)}
                      />
                    </td>
                    <td>{b.bl_bill_no}</td>
                    <td>{new Date(b.bl_billing_date).toLocaleDateString()}</td>
                    <td>{b.bl_from_station} - {b.bl_to_station}</td>
                    <td>₹{Number(b.bl_total_amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <button 
              className="erp-button" 
              style={{ backgroundColor: '#004085', color: 'white' }}
              onClick={handleMerge}
              disabled={selectedBills.length < 2 || loading}
            >
              {loading ? 'Merging...' : `Merge Selected (${selectedBills.length})`}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MergeBillGrid;
