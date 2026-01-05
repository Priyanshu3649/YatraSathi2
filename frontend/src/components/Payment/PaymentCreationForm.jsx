import React, { useState, useEffect } from 'react';
import { paymentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const PaymentCreationForm = ({ onPaymentCreated }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    mode: 'CASH',
    refNo: '',
    paymentDate: new Date().toISOString().split('T')[0],
    remarks: '',
    autoAllocate: false,
    allocations: []
  });
  
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showManualAllocation, setShowManualAllocation] = useState(false);
  const [allocationPNRs, setAllocationPNRs] = useState([]);
  const [selectedPNRs, setSelectedPNRs] = useState([]);

  // Payment modes
  const paymentModes = ['CASH', 'UPI', 'NEFT', 'RTGS', 'CHEQUE', 'CARD', 'BANK'];

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        // Assuming there's an API to get all customers
        // We'll need to add this to the API service
        const response = await fetch('/api/customers', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setCustomers(data.customers || []);
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
      }
    };

    fetchCustomers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddAllocation = () => {
    if (formData.customerId) {
      setShowManualAllocation(true);
      fetchCustomerPNRs(formData.customerId);
    }
  };

  const fetchCustomerPNRs = async (customerId) => {
    try {
      const response = await paymentAPI.getCustomerPendingPNRs(customerId);
      setAllocationPNRs(response.pendingPNRs || []);
    } catch (err) {
      setError('Failed to fetch pending PNRs: ' + err.message);
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
        { ...pnr, amount: Math.min(pnr.pendingAmount, formData.amount - prev.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)) }
      ]);
    }
  };

  const updateAllocationAmount = (pnrId, amount) => {
    setSelectedPNRs(prev => 
      prev.map(pnr => 
        pnr.pnrId === pnrId ? { ...pnr, amount: parseFloat(amount) || 0 } : pnr
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare allocation data if manual allocation is used
      const allocationData = selectedPNRs.map(pnr => ({
        pnrNumber: pnr.pnrNumber,
        amount: parseFloat(pnr.amount) || 0,
        remarks: `Payment allocation to PNR ${pnr.pnrNumber}`
      }));

      const paymentData = {
        ...formData,
        amount: parseFloat(formData.amount),
        allocations: showManualAllocation ? allocationData : [],
        autoAllocate: formData.autoAllocate && !showManualAllocation
      };

      const response = await paymentAPI.createPayment(paymentData);
      
      setSuccess('Payment created successfully!');
      if (onPaymentCreated) {
        onPaymentCreated(response.payment);
      }
      
      // Reset form
      setFormData({
        customerId: '',
        amount: '',
        mode: 'CASH',
        refNo: '',
        paymentDate: new Date().toISOString().split('T')[0],
        remarks: '',
        autoAllocate: false,
        allocations: []
      });
      setSelectedPNRs([]);
      setShowManualAllocation(false);
      setAllocationPNRs([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalAllocated = () => {
    return selectedPNRs.reduce((sum, pnr) => sum + (parseFloat(pnr.amount) || 0), 0);
  };

  const remainingAmount = parseFloat(formData.amount) - calculateTotalAllocated();

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Payment</h2>
      
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer *
            </label>
            <select
              name="customerId"
              value={formData.customerId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Customer</option>
              {customers.map(customer => (
                <option key={customer.us_usid} value={customer.us_usid}>
                  {customer.us_fname} {customer.us_lname} ({customer.us_email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter payment amount"
            />
          </div>
        </div>

        {/* Payment Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Mode *
            </label>
            <select
              name="mode"
              value={formData.mode}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {paymentModes.map(mode => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date
            </label>
            <input
              type="date"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Number
            </label>
            <input
              type="text"
              name="refNo"
              value={formData.refNo}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Transaction ID, Cheque No, etc."
            />
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Remarks
          </label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional notes about the payment"
          />
        </div>

        {/* Auto Allocation */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="autoAllocate"
            checked={formData.autoAllocate}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-700">
            Auto-allocate payment to pending PNRs (FIFO)
          </label>
        </div>

        {/* Manual Allocation */}
        {!formData.autoAllocate && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">Manual Allocation</h3>
              <button
                type="button"
                onClick={handleAddAllocation}
                disabled={!formData.customerId}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Select PNRs for Allocation
              </button>
            </div>

            {showManualAllocation && (
              <div className="space-y-4">
                {/* PNR Selection */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-2">Select PNRs to allocate payment</h4>
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                    {allocationPNRs.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No pending PNRs found for this customer</p>
                    ) : (
                      <div className="space-y-2">
                        {allocationPNRs.map(pnr => (
                          <div key={pnr.pnrId} className="flex items-center justify-between p-2 border rounded">
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

                {/* Allocation Amounts */}
                {selectedPNRs.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-md font-medium text-gray-700">Allocation Amounts</h4>
                    {selectedPNRs.map((pnr, index) => (
                      <div key={pnr.pnrId} className="flex items-center justify-between p-3 border rounded bg-gray-50">
                        <div>
                          <div className="font-medium">{pnr.pnrNumber}</div>
                          <div className="text-sm text-gray-500">
                            Max: ₹{pnr.pendingAmount} | Remaining: ₹{remainingAmount}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">₹</span>
                          <input
                            type="number"
                            value={pnr.amount || ''}
                            onChange={(e) => updateAllocationAmount(pnr.pnrId, e.target.value)}
                            min="0"
                            max={pnr.pendingAmount}
                            step="0.01"
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                      <div className="font-medium">Total Allocated:</div>
                      <div>₹{calculateTotalAllocated().toFixed(2)}</div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-100 rounded">
                      <div className="font-medium">Remaining Amount:</div>
                      <div className={remainingAmount < 0 ? 'text-red-600' : 'text-gray-800'}>
                        ₹{remainingAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.customerId || !formData.amount}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Payment...' : 'Create Payment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentCreationForm;