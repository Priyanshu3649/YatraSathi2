import React, { useState, useEffect } from 'react';
import { paymentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const PaymentAllocationSummary = () => {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    customerId: '',
    pnrNumber: '',
    startDate: '',
    endDate: ''
  });
  const [summary, setSummary] = useState({
    totalAllocations: 0,
    totalAllocated: 0,
    totalUnallocated: 0
  });

  useEffect(() => {
    fetchPaymentAllocations();
  }, [filters]);

  const fetchPaymentAllocations = async () => {
    try {
      setLoading(true);
      // Since we don't have a direct API for allocation summary, we'll fetch all payments
      // and calculate allocations from them
      const params = {
        customerId: filters.customerId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await paymentAPI.getAllPayments(params);
      const payments = response.payments || [];

      // Calculate allocation summary
      const totalAllocated = payments.reduce((sum, payment) => 
        sum + (parseFloat(payment.pt_amount) - parseFloat(payment.pt_unallocated_amt)), 0);
      const totalUnallocated = payments.reduce((sum, payment) => 
        sum + parseFloat(payment.pt_unallocated_amt), 0);

      setSummary({
        totalAllocations: payments.length,
        totalAllocated,
        totalUnallocated
      });

      // For detailed view, we'll use the payment list
      setAllocations(payments);
    } catch (err) {
      setError('Failed to fetch payment allocations: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      customerId: '',
      pnrNumber: '',
      startDate: '',
      endDate: ''
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Payment Allocation Summary</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-700 mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID</label>
            <input
              type="text"
              name="customerId"
              value={filters.customerId}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Customer ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-3 flex space-x-2">
          <button
            onClick={fetchPaymentAllocations}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Apply Filters
          </button>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600">Total Payments</div>
          <div className="text-3xl font-bold text-blue-800">{summary.totalAllocations}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600">Total Allocated</div>
          <div className="text-3xl font-bold text-green-800">₹{summary.totalAllocated.toFixed(2)}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-sm text-yellow-600">Total Unallocated</div>
          <div className="text-3xl font-bold text-yellow-800">₹{summary.totalUnallocated.toFixed(2)}</div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading payment allocation summary...</p>
        </div>
      )}

      {/* Allocations Table */}
      {!loading && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allocated Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unallocated Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allocations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No payment allocations found
                  </td>
                </tr>
              ) : (
                allocations.map(payment => {
                  const allocatedAmount = parseFloat(payment.pt_amount) - parseFloat(payment.pt_unallocated_amt);
                  return (
                    <tr key={payment.pt_ptid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{payment.pt_ptid}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.pt_usid}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{payment.pt_amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{allocatedAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{payment.pt_unallocated_amt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.pt_mode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.pt_status === 'RECEIVED' ? 'bg-blue-100 text-blue-800' :
                          payment.pt_status === 'ADJUSTED' ? 'bg-green-100 text-green-800' :
                          payment.pt_status === 'REFUNDED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.pt_status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )
            }
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PaymentAllocationSummary;