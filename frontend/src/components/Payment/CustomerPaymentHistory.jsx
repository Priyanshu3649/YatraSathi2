import React, { useState, useEffect } from 'react';
import { paymentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useParams } from 'react-router-dom';

const CustomerPaymentHistory = () => {
  const { user } = useAuth();
  const { customerId } = useParams();
  const [payments, setPayments] = useState([]);
  const [customerAdvance, setCustomerAdvance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomerPaymentHistory();
  }, [customerId]);

  const fetchCustomerPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getCustomerPayments(customerId);
      setPayments(response.payments || []);

      // Fetch customer advance
      try {
        const advanceResponse = await paymentAPI.getCustomerAdvance(customerId);
        setCustomerAdvance(advanceResponse);
      } catch (err) {
        console.error('Failed to fetch customer advance:', err);
      }
    } catch (err) {
      setError('Failed to fetch customer payment history: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading customer payment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Customer Payment History</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Customer Advance Summary */}
      {customerAdvance && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Customer Advance Balance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-blue-600">Advance Amount</div>
              <div className="font-medium text-lg">₹{customerAdvance.advanceBalance}</div>
            </div>
            <div>
              <div className="text-sm text-blue-600">Financial Year</div>
              <div className="font-medium">{customerAdvance.financialYear}</div>
            </div>
            <div>
              <div className="text-sm text-blue-600">Customer ID</div>
              <div className="font-medium">{customerAdvance.customerId}</div>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unallocated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No payment history found for this customer
                </td>
              </tr>
            ) : (
              payments.map(payment => (
                <tr key={payment.pt_ptid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{payment.pt_ptid}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{payment.pt_amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.pt_mode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(payment.pt_paydt).toLocaleDateString()}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{payment.pt_unallocated_amt}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {payment.pt_refno || 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {payments.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Payment Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Payments</div>
              <div className="font-medium">{payments.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="font-medium">
                ₹{payments.reduce((sum, p) => sum + parseFloat(p.pt_amount || 0), 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Unallocated</div>
              <div className="font-medium">
                ₹{payments.reduce((sum, p) => sum + parseFloat(p.pt_unallocated_amt || 0), 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Avg. Payment</div>
              <div className="font-medium">
                ₹{payments.length > 0 
                  ? (payments.reduce((sum, p) => sum + parseFloat(p.pt_amount || 0), 0) / payments.length).toFixed(2) 
                  : '0.00'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPaymentHistory;