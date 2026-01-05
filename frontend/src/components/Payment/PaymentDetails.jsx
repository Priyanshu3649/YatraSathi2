import React, { useState, useEffect } from 'react';
import { paymentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, Link } from 'react-router-dom';

const PaymentDetails = () => {
  const { user } = useAuth();
  const { paymentId } = useParams();
  const [payment, setPayment] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPaymentDetails();
  }, [paymentId]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getPaymentById(paymentId);
      setPayment(response.payment);

      // Fetch allocations for this payment
      const allocationResponse = await paymentAPI.getPaymentAllocations(paymentId);
      setAllocations(allocationResponse.allocations || []);
    } catch (err) {
      setError('Failed to fetch payment details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
        <Link to="/payments" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Back to Payments
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Payment Details</h2>
        <Link to="/payments" className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
          Back to Payments
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {payment && (
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600">Payment ID</div>
              <div className="font-medium text-lg">#{payment.pt_ptid}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600">Amount</div>
              <div className="font-medium text-lg">₹{payment.pt_amount}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-600">Unallocated</div>
              <div className="font-medium text-lg">₹{payment.pt_unallocated_amt}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600">Status</div>
              <div className="font-medium text-lg">{payment.pt_status}</div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Payment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Customer ID</div>
                <div className="font-medium">{payment.pt_usid}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Payment Mode</div>
                <div className="font-medium">{payment.pt_mode}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Reference Number</div>
                <div className="font-medium">{payment.pt_refno || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Payment Date</div>
                <div className="font-medium">{new Date(payment.pt_paydt).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Received By</div>
                <div className="font-medium">{payment.pt_rcvby}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Accounting Period</div>
                <div className="font-medium">{payment.pt_acct_period}</div>
              </div>
              {payment.pt_remarks && (
                <div className="md:col-span-2">
                  <div className="text-sm text-gray-600">Remarks</div>
                  <div className="font-medium">{payment.pt_remarks}</div>
                </div>
              )}
            </div>
          </div>

          {/* Allocation History */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">Allocation History</h3>
              <Link
                to={`/payments/${paymentId}/allocate`}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Allocate Payment
              </Link>
            </div>
            
            {allocations.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No allocations found for this payment
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Allocation ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PNR Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Allocation Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allocations.map(allocation => (
                      <tr key={allocation.pa_paid} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{allocation.pa_paid}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {allocation.pa_pnr}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{allocation.pa_amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(allocation.pa_alloctn_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {allocation.pa_alloctn_type}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {allocation.pa_remarks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Link
              to={`/payments/${paymentId}/allocate`}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Allocate Payment
            </Link>
            <Link
              to={`/payments/${paymentId}/refund`}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Process Refund
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDetails;