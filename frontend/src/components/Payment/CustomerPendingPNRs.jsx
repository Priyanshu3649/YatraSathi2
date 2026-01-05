import React, { useState, useEffect } from 'react';
import { paymentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useParams } from 'react-router-dom';

const CustomerPendingPNRs = () => {
  const { user } = useAuth();
  const { customerId } = useParams();
  const [pendingPNRs, setPendingPNRs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomerPendingPNRs();
  }, [customerId]);

  const fetchCustomerPendingPNRs = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getCustomerPendingPNRs(customerId);
      setPendingPNRs(response.pendingPNRs || []);
    } catch (err) {
      setError('Failed to fetch pending PNRs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading pending PNRs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Customer Pending PNRs</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Summary Card */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-blue-600">Total Pending PNRs</div>
            <div className="text-2xl font-bold text-blue-800">{pendingPNRs.length}</div>
          </div>
          <div>
            <div className="text-sm text-blue-600">Total Outstanding Amount</div>
            <div className="text-2xl font-bold text-blue-800">
              ₹{pendingPNRs.reduce((sum, pnr) => sum + parseFloat(pnr.pendingAmount || 0), 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Pending PNRs Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PNR Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paid Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pending Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Travel Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pendingPNRs.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No pending PNRs found for this customer
                </td>
              </tr>
            ) : (
              pendingPNRs.map(pnr => (
                <tr key={pnr.pnrId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {pnr.pnrNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{pnr.totalAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{pnr.paidAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{pnr.pendingAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      pnr.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                      pnr.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {pnr.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(pnr.travelDate).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Action Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={fetchCustomerPendingPNRs}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default CustomerPendingPNRs;