import React, { useState, useEffect } from 'react';
import { billingAPI } from '../../services/api';

const BillCreationForm = ({ onCancel, onSubmit, user, error, setError }) => {
  const [formData, setFormData] = useState({
    customerId: user?.us_usertype === 'customer' ? user.us_usid : '',
    customerName: '',
    trainNumber: '',
    reservationClass: '3A',
    ticketType: 'NORMAL',
    pnrNumbers: [''],
    netFare: '',
    serviceCharges: '',
    platformFees: '',
    agentFees: '',
    extraCharges: [{ label: '', amount: '' }],
    discounts: [{ label: '', amount: '', type: 'FIXED' }], // FIXED or PERCENTAGE
    billDate: new Date().toISOString().split('T')[0],
    status: 'DRAFT',
    remarks: ''
  });
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch customers when component mounts
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCustomers(Array.isArray(data) ? data : (data.customers || []));
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const fetchCustomerBookings = async (customerId) => {
    // This function can be used to fetch customer bookings if needed
    // For now, we'll keep it as a placeholder
  };

  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    setFormData({ ...formData, customerId });
    
    // Find customer name
    const customer = customers.find(c => c.id === customerId || c.us_usid === customerId);
    if (customer) {
      setFormData({ ...formData, customerId, customerName: customer.us_name || customer.name });
      fetchCustomerBookings(customerId);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePNRChange = (index, value) => {
    const newPNRs = [...formData.pnrNumbers];
    newPNRs[index] = value;
    setFormData({ ...formData, pnrNumbers: newPNRs });
  };

  const addPNR = () => {
    setFormData({ ...formData, pnrNumbers: [...formData.pnrNumbers, ''] });
  };

  const removePNR = (index) => {
    if (formData.pnrNumbers.length > 1) {
      const newPNRs = formData.pnrNumbers.filter((_, i) => i !== index);
      setFormData({ ...formData, pnrNumbers: newPNRs });
    }
  };

  const addExtraCharge = () => {
    setFormData({
      ...formData,
      extraCharges: [...formData.extraCharges, { label: '', amount: '' }]
    });
  };

  const removeExtraCharge = (index) => {
    if (formData.extraCharges.length > 1) {
      const newCharges = formData.extraCharges.filter((_, i) => i !== index);
      setFormData({ ...formData, extraCharges: newCharges });
    }
  };

  const handleExtraChargeChange = (index, field, value) => {
    const newCharges = [...formData.extraCharges];
    newCharges[index][field] = value;
    setFormData({ ...formData, extraCharges: newCharges });
  };

  const addDiscount = () => {
    setFormData({
      ...formData,
      discounts: [...formData.discounts, { label: '', amount: '', type: 'FIXED' }]
    });
  };

  const removeDiscount = (index) => {
    if (formData.discounts.length > 1) {
      const newDiscounts = formData.discounts.filter((_, i) => i !== index);
      setFormData({ ...formData, discounts: newDiscounts });
    }
  };

  const handleDiscountChange = (index, field, value) => {
    const newDiscounts = [...formData.discounts];
    newDiscounts[index][field] = value;
    setFormData({ ...formData, discounts: newDiscounts });
  };

  const calculateTotalAmount = () => {
    let total = parseFloat(formData.netFare) || 0;
    total += parseFloat(formData.serviceCharges) || 0;
    total += parseFloat(formData.platformFees) || 0;
    total += parseFloat(formData.agentFees) || 0;

    // Add extra charges
    formData.extraCharges.forEach(charge => {
      if (charge.amount) {
        total += parseFloat(charge.amount) || 0;
      }
    });

    // Subtract discounts
    formData.discounts.forEach(discount => {
      if (discount.amount) {
        if (discount.type === 'PERCENTAGE') {
          const discountAmount = (total * parseFloat(discount.amount)) / 100;
          total -= discountAmount;
        } else {
          total -= parseFloat(discount.amount) || 0;
        }
      }
    });

    return Math.max(0, total); // Ensure total is not negative
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Prepare the bill data
      const billData = {
        ...formData,
        totalAmount: calculateTotalAmount(),
        pnrNumbers: formData.pnrNumbers.filter(pnr => pnr.trim() !== ''),
        extraCharges: formData.extraCharges.filter(charge => charge.label && charge.amount),
        discounts: formData.discounts.filter(discount => discount.label && discount.amount),
        createdBy: user?.us_usid,
        createdOn: new Date().toISOString()
      };

      await onSubmit(billData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = calculateTotalAmount();

  return (
    <form onSubmit={handleSubmit} className="erp-form">
      <div className="form-grid">
        {/* Customer Information */}
        <label htmlFor="customerId" className="form-label required">Customer ID</label>
        <select
          id="customerId"
          name="customerId"
          value={formData.customerId}
          onChange={handleCustomerChange}
          required
          className="form-input"
        >
          <option value="">Select Customer</option>
          {customers.map(customer => (
            <option key={customer.id || customer.us_usid} value={customer.id || customer.us_usid}>
              {customer.us_name || customer.name} ({customer.id || customer.us_usid})
            </option>
          ))}
        </select>

        <label className="form-label">Customer Name</label>
        <input
          type="text"
          value={formData.customerName}
          readOnly
          className="form-input"
          style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
        />

        {/* Journey & Ticket Details */}
        <label htmlFor="trainNumber" className="form-label">Train Number</label>
        <input
          type="text"
          id="trainNumber"
          name="trainNumber"
          value={formData.trainNumber}
          onChange={handleInputChange}
          className="form-input"
        />

        <label htmlFor="reservationClass" className="form-label">Reservation Class</label>
        <select
          id="reservationClass"
          name="reservationClass"
          value={formData.reservationClass}
          onChange={handleInputChange}
          className="form-input"
        >
          <option value="SL">Sleeper</option>
          <option value="3A">3rd AC</option>
          <option value="2A">2nd AC</option>
          <option value="1A">1st AC</option>
          <option value="CC">Chair Car</option>
        </select>

        <label htmlFor="ticketType" className="form-label">Ticket Type</label>
        <select
          id="ticketType"
          name="ticketType"
          value={formData.ticketType}
          onChange={handleInputChange}
          className="form-input"
        >
          <option value="NORMAL">Normal</option>
          <option value="TATKAL">Tatkal</option>
          <option value="PREMIUM_TATKAL">Premium Tatkal</option>
        </select>

        {/* PNR Numbers */}
        <label className="form-label">PNR Numbers</label>
        <div className="form-input-group">
          {formData.pnrNumbers.map((pnr, index) => (
            <div key={index} className="form-row">
              <input
                type="text"
                value={pnr}
                onChange={(e) => handlePNRChange(index, e.target.value)}
                placeholder={`PNR #${index + 1}`}
                className="form-input"
              />
              {formData.pnrNumbers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePNR(index)}
                  className="tool-button"
                  style={{ marginLeft: '5px' }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addPNR}
            className="tool-button"
            style={{ marginTop: '5px' }}
          >
            Add PNR
          </button>
        </div>

        {/* Fare & Charges */}
        <label htmlFor="netFare" className="form-label">Net Journey Fare</label>
        <input
          type="number"
          id="netFare"
          name="netFare"
          value={formData.netFare}
          onChange={handleInputChange}
          step="0.01"
          className="form-input"
        />

        <label htmlFor="serviceCharges" className="form-label">Service Charges</label>
        <input
          type="number"
          id="serviceCharges"
          name="serviceCharges"
          value={formData.serviceCharges}
          onChange={handleInputChange}
          step="0.01"
          className="form-input"
        />

        <label htmlFor="platformFees" className="form-label">Platform Fees</label>
        <input
          type="number"
          id="platformFees"
          name="platformFees"
          value={formData.platformFees}
          onChange={handleInputChange}
          step="0.01"
          className="form-input"
        />

        <label htmlFor="agentFees" className="form-label">Agent Fees</label>
        <input
          type="number"
          id="agentFees"
          name="agentFees"
          value={formData.agentFees}
          onChange={handleInputChange}
          step="0.01"
          className="form-input"
        />

        {/* Extra Charges */}
        <label className="form-label">Extra Charges</label>
        <div className="form-input-group">
          {formData.extraCharges.map((charge, index) => (
            <div key={index} className="form-row">
              <input
                type="text"
                value={charge.label}
                onChange={(e) => handleExtraChargeChange(index, 'label', e.target.value)}
                placeholder="Charge Label"
                className="form-input"
                style={{ flex: 1 }}
              />
              <input
                type="number"
                value={charge.amount}
                onChange={(e) => handleExtraChargeChange(index, 'amount', e.target.value)}
                placeholder="Amount"
                step="0.01"
                className="form-input"
                style={{ flex: 1, marginLeft: '5px' }}
              />
              {formData.extraCharges.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeExtraCharge(index)}
                  className="tool-button"
                  style={{ marginLeft: '5px' }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addExtraCharge}
            className="tool-button"
            style={{ marginTop: '5px' }}
          >
            Add Extra Charge
          </button>
        </div>

        {/* Discounts */}
        <label className="form-label">Discounts</label>
        <div className="form-input-group">
          {formData.discounts.map((discount, index) => (
            <div key={index} className="form-row">
              <input
                type="text"
                value={discount.label}
                onChange={(e) => handleDiscountChange(index, 'label', e.target.value)}
                placeholder="Discount Label"
                className="form-input"
                style={{ flex: 1 }}
              />
              <input
                type="number"
                value={discount.amount}
                onChange={(e) => handleDiscountChange(index, 'amount', e.target.value)}
                placeholder="Amount"
                step="0.01"
                className="form-input"
                style={{ flex: 1, marginLeft: '5px' }}
              />
              <select
                value={discount.type}
                onChange={(e) => handleDiscountChange(index, 'type', e.target.value)}
                className="form-input"
                style={{ flex: 1, marginLeft: '5px' }}
              >
                <option value="FIXED">Fixed</option>
                <option value="PERCENTAGE">Percentage</option>
              </select>
              {formData.discounts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDiscount(index)}
                  className="tool-button"
                  style={{ marginLeft: '5px' }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addDiscount}
            className="tool-button"
            style={{ marginTop: '5px' }}
          >
            Add Discount
          </button>
        </div>

        {/* Total Amount */}
        <label className="form-label">Total Amount</label>
        <input
          type="number"
          value={totalAmount.toFixed(2)}
          readOnly
          className="form-input"
          style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed', fontWeight: 'bold' }}
        />

        {/* Bill Details */}
        <label htmlFor="billDate" className="form-label">Bill Date</label>
        <input
          type="date"
          id="billDate"
          name="billDate"
          value={formData.billDate}
          onChange={handleInputChange}
          required
          className="form-input"
        />

        <label htmlFor="status" className="form-label">Status</label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleInputChange}
          className="form-input"
        >
          <option value="DRAFT">Draft</option>
          <option value="FINAL">Final</option>
          <option value="PAID">Paid</option>
          <option value="PARTIAL">Partial</option>
        </select>

        <label htmlFor="remarks" className="form-label">Remarks</label>
        <textarea
          id="remarks"
          name="remarks"
          value={formData.remarks}
          onChange={handleInputChange}
          className="form-input"
          rows="3"
        ></textarea>
      </div>

      <div className="form-actions">
        <button type="submit" className="tool-button" disabled={loading}>
          {loading ? 'Saving...' : 'Create Bill'}
        </button>
        <button type="button" className="tool-button" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => {
            setFormData({ ...formData, status: 'FINAL' });
          }}
        >
          Save as Draft
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => {
            setFormData({ ...formData, status: 'FINAL' });
          }}
        >
          Finalize Bill
        </button>
      </div>
    </form>
  );
};

export default BillCreationForm;