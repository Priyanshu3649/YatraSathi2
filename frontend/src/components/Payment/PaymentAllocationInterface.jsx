import React, { useState, useEffect } from 'react';
import { paymentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const PaymentAllocationInterface = () => {
  const { user } = useAuth();
  const [unallocatedPayments, setUnallocatedPayments] = useState([]);
  const [pendingPNRs, setPendingPNRs] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedPNRs, setSelectedPNRs] = useState([]);
  const [allocationAmounts, setAllocationAmounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoAllocation, setAutoAllocation] = useState(false);

  // Fetch unallocated payments
  useEffect(() => {
    fetchUnallocatedPayments();
  }, []);

  const fetchUnallocatedPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getAllPayments({ status: 'RECEIVED' });
      const unallocated = response.payments.filter(payment => 
        parseFloat(payment.pt_unallocated_amt) > 0
      );
      setUnallocatedPayments(unallocated);
    } catch (err) {
      setError('Failed to fetch unallocated payments: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSelect = async (paymentId) => {
    const payment = unallocatedPayments.find(p => p.pt_ptid === paymentId);
    setSelectedPayment(payment);
    
    if (payment) {
      try {
        // Fetch pending PNRs for the customer
        const pnrResponse = await paymentAPI.getCustomerPendingPNRs(payment.pt_usid);
        setPendingPNRs(pnrResponse.pendingPNRs || []);
        
        // Reset selections
        setSelectedPNRs([]);
        setAllocationAmounts({});
      } catch (err) {
        setError('Failed to fetch pending PNRs: ' + err.message);
      }
    }
  };

  const handlePNRSelection = (pnr) => {
    const existingIndex = selectedPNRs.findIndex(item => item.pnrId === pnr.pnrId);
    
    if (existingIndex >= 0) {
      // Remove if already selected
      setSelectedPNRs(prev => prev.filter((_, index) => index !== existingIndex));
    } else {
      // Add with default amount
      setSelectedPNRs(prev => [
        ...prev,
        { ...pnr, amount: Math.min(pnr.pendingAmount, (selectedPayment?.pt_unallocated_amt || 0) - prev.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)) }
      ]);
    }
  };

  const updateAllocationAmount = (pnrId, amount) => {
    const updatedAmounts = { ...allocationAmounts, [pnrId]: parseFloat(amount) || 0 };
    setAllocationAmounts(updatedAmounts);
  };

  const calculateTotalAllocated = () => {
    if (autoAllocation) {
      return selectedPayment ? parseFloat(selectedPayment.pt_unallocated_amt) : 0;
    }
    return selectedPNRs.reduce((sum, pnr) => sum + (allocationAmounts[pnr.pnrId] || 0), 0);
  };

  const remainingAmount = selectedPayment 
    ? parseFloat(selectedPayment.pt_unallocated_amt) - calculateTotalAllocated() 
    : 0;

  const handleAutoAllocation = () => {
    if (selectedPayment && pendingPNRs.length > 0) {
      setAutoAllocation(true);
      setSelectedPNRs([...pendingPNRs]);
    }
  };

  const handleManualAllocation = () => {
    setAutoAllocation(false);
    setSelectedPNRs([]);
    setAllocationAmounts({});
  };

  const handleSubmitAllocation = async () => {
    if (!selectedPayment) {
      setError('Please select a payment first');
      return;
    }

    if (selectedPNRs.length === 0) {
      setError('Please select at least one PNR to allocate to');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let allocationData;

      if (autoAllocation) {
        // For auto-allocation, we'll let the backend handle the distribution
        allocationData = [];
      } else {
        // For manual allocation, send specific amounts
        allocationData = selectedPNRs.map(pnr => ({
          pnrNumber: pnr.pnrNumber,
          amount: allocationAmounts[pnr.pnrId] || 0,
          remarks: `Manual allocation to PNR ${pnr.pnrNumber}`
        }));
      }

      await paymentAPI.allocatePayment(selectedPayment.pt_ptid, {
        allocations: allocationData
      });

      setSuccess('Payment allocated successfully!');
      
      // Reset form
      setSelectedPayment(null);
      setSelectedPNRs([]);
      setAllocationAmounts({});
      setAutoAllocation(false);
      setPendingPNRs([]);
      await fetchUnallocatedPayments();
    } catch (err) {
      setError('Failed to allocate payment: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Payment Allocation</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}

      {/* Payment Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Unallocated Payment
        </label>
        <select
          value={selectedPayment?.pt_ptid || ''}
          onChange={(e) => handlePaymentSelect(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a payment</option>
          {unallocatedPayments.map(payment => (
            <option key={payment.pt_ptid} value={payment.pt_ptid}>
              #{payment.pt_ptid} - ₹{payment.pt_amount} (Unallocated: ₹{payment.pt_unallocated_amt}) - {payment.pt_usid}
            </option>
          ))}
        </select>
      </div>

      {selectedPayment && (
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800 mb-2">Payment Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Payment ID</div>
                <div className="font-medium">#{selectedPayment.pt_ptid}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="font-medium">₹{selectedPayment.pt_amount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Unallocated Amount</div>
                <div className="font-medium">₹{selectedPayment.pt_unallocated_amt}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Payment Mode</div>
                <div className="font-medium">{selectedPayment.pt_mode}</div>
              </div>
            </div>
          </div>

          {/* Allocation Method */}
          <div className="flex space-x-4 mb-4">
            <button
              type="button"
              onClick={handleManualAllocation}
              className={`px-4 py-2 rounded-md ${
                !autoAllocation 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Manual Allocation
            </button>
            <button
              type="button"
              onClick={handleAutoAllocation}
              className={`px-4 py-2 rounded-md ${
                autoAllocation 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Auto Allocation (FIFO)
            </button>
          </div>

          {!autoAllocation ? (
            // Manual Allocation Interface
            <div className="space-y-4">
              {/* PNR Selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Select PNRs to Allocate</h3>
                <div className="border rounded-lg p-4 max-h-80 overflow-y-auto">
                  {pendingPNRs.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No pending PNRs found for this customer</p>
                  ) : (
                    <div className="space-y-2">
                      {pendingPNRs.map(pnr => (
                        <div key={pnr.pnrId} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedPNRs.some(item => item.pnrId === pnr.pnrId)}
                              onChange={() => handlePNRSelection(pnr)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="ml-3">
                              <div className="font-medium">{pnr.pnrNumber}</div>
                              <div className="text-sm text-gray-500">
                                Pending: ₹{pnr.pendingAmount} | Travel: {new Date(pnr.travelDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Allocation Amounts for Selected PNRs */}
              {selectedPNRs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-800">Allocation Amounts</h3>
                  {selectedPNRs.map((pnr, index) => (
                    <div key={pnr.pnrId} className="flex items-center justify-between p-3 border rounded bg-gray-50">
                      <div>
                        <div className="font-medium">{pnr.pnrNumber}</div>
                        <div className="text-sm text-gray-500">
                          Pending: ₹{pnr.pendingAmount} | Remaining: ₹{remainingAmount}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">₹</span>
                        <input
                          type="number"
                          value={allocationAmounts[pnr.pnrId] || ''}
                          onChange={(e) => updateAllocationAmount(pnr.pnrId, e.target.value)}
                          min="0"
                          max={Math.min(pnr.pendingAmount, remainingAmount + (allocationAmounts[pnr.pnrId] || 0))}
                          step="0.01"
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                  ))}
                  
                  <div className="grid grid-cols-2 gap-4 p-3 bg-gray-100 rounded">
                    <div className="flex justify-between">
                      <div className="font-medium">Total Allocated:</div>
                      <div>₹{calculateTotalAllocated().toFixed(2)}</div>
                    </div>
                    <div className="flex justify-between">
                      <div className="font-medium">Remaining Amount:</div>
                      <div className={remainingAmount < 0 ? 'text-red-600' : 'text-gray-800'}>
                        ₹{remainingAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Auto Allocation Info
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">Auto Allocation (FIFO)</h3>
              <p className="text-yellow-700">
                The system will automatically allocate this payment to pending PNRs in First-In-First-Out order.
                Oldest pending PNRs will be paid first until the payment amount is exhausted.
              </p>
              <div className="mt-2 text-sm text-yellow-600">
                <strong>PNRs to be allocated:</strong> {pendingPNRs.length} pending PNRs will be processed.
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={fetchUnallocatedPayments}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              onClick={handleSubmitAllocation}
              disabled={loading || !selectedPayment || selectedPNRs.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Allocating...' : 'Allocate Payment'}
            </button>
          </div>
        </div>
      )}

      {loading && !selectedPayment && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading unallocated payments...</p>
        </div>
      )}
    </div>
  );
};

export default PaymentAllocationInterface;