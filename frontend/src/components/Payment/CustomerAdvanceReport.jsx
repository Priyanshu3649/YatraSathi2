import React, { useState, useEffect } from 'react';
import { paymentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const CustomerAdvanceReport = () => {
  const { user } = useAuth();
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    customerId: '',
    fyear: ''
  });

  useEffect(() => {
    fetchCustomerAdvances();
  }, [filters]);

  const fetchCustomerAdvances = async () => {
    try {
      setLoading(true);
      // Since we don't have a direct API for all customer advances, 
      // we'll simulate by fetching all customers and then their advance balances
      // In a real implementation, there would be an API endpoint for this
      const response = await fetch('/api/customers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const customerIds = data.customers?.slice(0, 20) || []; // Limit to 20 for demo
        
        const advancePromises = customerIds.map(async (customer) => {
          try {
            const advanceResponse = await paymentAPI.getCustomerAdvance(customer.us_usid, filters.fyear);
            return {
              ...customer,
              advanceBalance: advanceResponse.advanceBalance,
              financialYear: advanceResponse.financialYear,
              advanceRecord: advanceResponse.record
            };
          } catch (err) {
            return {
              ...customer,
              advanceBalance: 0,
              financialYear: filters.fyear || 'Current',
              advanceRecord: null
            };
          }
        });
        
        const advancesData = await Promise.all(advancePromises);
        setAdvances(advancesData.filter(adv => adv.advanceBalance > 0)); // Only show customers with advance
      }
    } catch (err) {
      setError('Failed to fetch customer advances: ' + err.message);
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
      fyear: ''
    });
  };

  // Calculate summary
  const totalAdvance = advances.reduce((sum, adv) => sum + (parseFloat(adv.advanceBalance) || 0), 0);
  const totalCustomers = advances.length;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Customer Advance Balances Report</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-700 mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Financial Year</label>
            <input
              type="text"
              name="fyear"
              value={filters.fyear}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 2023-24"
            />
          </div>
        </div>
        <div className="mt-3 flex space-x-2">
          <button
            onClick={fetchCustomerAdvances}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600">Total Customers with Advance</div>
          <div className="text-3xl font-bold text-green-800">{totalCustomers}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600">Total Advance Balance</div>
          <div className="text-3xl font-bold text-blue-800">₹{totalAdvance.toFixed(2)}</div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading customer advances...</p>
        </div>
      )}

      {/* Advances Table */}
      {!loading && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Financial Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Advance Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {advances.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No customer advances found
                  </td>
                </tr>
              ) : (
                advances.map((advance, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {advance.us_usid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {advance.us_fname} {advance.us_lname}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {advance.us_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {advance.us_phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {advance.financialYear}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{advance.advanceBalance.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {advance.advanceRecord?.ca_last_updated 
                        ? new Date(advance.advanceRecord.ca_last_updated).toLocaleDateString() 
                        : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomerAdvanceReport;