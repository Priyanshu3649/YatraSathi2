import React, { useState, useEffect } from 'react';
import { paymentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, Link, useNavigate } from 'react-router-dom';

const RefundForm = () => {
  const { user } = useAuth();
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [pnrPayments, setPnrPayments] = useState([]);
  const [formData, setFormData] = useState({
    refundAmount: '',
    pnrNumber: '',
    remarks: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPaymentDetails();
  }, [paymentId]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getPaymentById(paymentId);
      setPayment(response.payment);
    } catch (err) {
      setError('Failed to fetch payment details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPnrPayments = async (pnrNumber) => {
    try {
      const response = await paymentAPI.getPNRPayments(pnrNumber);
      setPnrPayments(response.paymentHistory || []);
    } catch (err) {
      console.error('Failed to fetch PNR payments:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Fetch PNR payments when PNR number is entered
    if (name === 'pnrNumber' && value) {
      fetchPnrPayments(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const refundData = {
        refundAmount: parseFloat(formData.refundAmount),
        pnrNumber: formData.pnrNumber || null,
        remarks: formData.remarks
      };

      await paymentAPI.refundPayment(paymentId, refundData);
      
      setSuccess('Refund processed successfully!');
      
      // Reset form after successful refund
      setFormData({
        refundAmount: '',
        pnrNumber: '',
        remarks: ''
      });
    } catch (err) {
      setError('Failed to process refund: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const maxRefundAmount = payment ? parseFloat(payment.pt_amount) : 0;

  if (loading && !payment) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Process Refund</h2>
        <Link to={`/payments/${paymentId}`} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
          Back to Payment
        </Link>
      </div>

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

      {payment && (
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800 mb-2">Payment Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-blue-600">Payment ID</div>
                <div className="font-medium">#{payment.pt_ptid}</div>
              </div>
              <div>
                <div className="text-sm text-blue-600">Total Amount</div>
                <div className="font-medium">₹{payment.pt_amount}</div>
              </div>
              <div>
                <div className="text-sm text-blue-600">Customer ID</div>
                <div className="font-medium">{payment.pt_usid}</div>
              </div>
              <div>
                <div className="text-sm text-blue-600">Payment Mode</div>
                <div className="font-medium">{payment.pt_mode}</div>
              </div>
            </div>
          </div>

          {/* Refund Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Refund Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund Amount *
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-gray-700">₹</span>
                <input
                  type="number"
                  name="refundAmount"
                  value={formData.refundAmount}
                  onChange={handleInputChange}
                  min="0"
                  max={maxRefundAmount}
                  step="0.01"
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter refund amount"
                />
              </div>
              <div className="mt-1 text-sm text-gray-500">
                Maximum refundable amount: ₹{maxRefundAmount}
              </div>
            </div>

            {/* PNR Number (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PNR Number (Optional)
              </label>
              <input
                type="text"
                name="pnrNumber"
                value={formData.pnrNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter PNR number if refunding for specific PNR"
              />
              <div className="mt-1 text-sm text-gray-500">
                Leave empty for full payment refund
              </div>
            </div>

            {/* PNR Payment History (if PNR is specified) */}
            {pnrPayments.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-800 mb-2">Payment History for PNR {formData.pnrNumber}</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Allocation ID
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pnrPayments.map(alloc => (
                        <tr key={alloc.pa_paid} className="text-sm">
                          <td className="px-3 py-2 text-gray-900">#{alloc.pa_paid}</td>
                          <td className="px-3 py-2 text-gray-900">₹{alloc.pa_amount}</td>
                          <td className="px-3 py-2 text-gray-900">
                            {new Date(alloc.pa_alloctn_date).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2 text-gray-900">{alloc.pa_alloctn_type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
                placeholder="Enter refund reason or additional notes"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <Link
                to={`/payments/${paymentId}`}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !formData.refundAmount}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing Refund...' : 'Process Refund'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default RefundForm;