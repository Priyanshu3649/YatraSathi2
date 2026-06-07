import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuditPanel from '../common/AuditPanel';
import AuditHistoryButton from '../common/AuditHistoryButton';

const BillDetails = ({ bill, onClose }) => {
  const navigate = useNavigate();
  if (!bill) {
    return <p>No bill selected.</p>;
  }

  return (
    <div className="bill-details">
      <div className="panel-header">
        Bill Details - {bill.id || bill.billId}
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="details-grid">
        <div className="detail-section">
          <h3>Customer Information</h3>
          <p><strong>Customer ID:</strong> {bill.customerId}</p>
          <p><strong>Customer Name:</strong> {bill.customerName || bill.customer?.us_name}</p>
        </div>
        
        <div className="detail-section">
          <h3>Journey &amp; Ticket Details</h3>
          <p><strong>Train Number:</strong> {bill.trainNumber}</p>
          <p><strong>Reservation Class:</strong> {bill.reservationClass}</p>
          <p><strong>Ticket Type:</strong> {bill.ticketType}</p>
          <p><strong>PNR Numbers:</strong> {bill.pnrNumbers?.join(', ') || 'N/A'}</p>
        </div>
        
        <div className="detail-section">
          <h3>Fare &amp; Charges</h3>
          <p><strong>Net Journey Fare:</strong> ₹{parseFloat(bill.netFare)?.toFixed(2) || '0.00'}</p>
          <p><strong>Service Charges:</strong> ₹{parseFloat(bill.serviceCharges)?.toFixed(2) || '0.00'}</p>
          <p><strong>Platform Fees:</strong> ₹{parseFloat(bill.platformFees)?.toFixed(2) || '0.00'}</p>
          <p><strong>Agent Fees:</strong> ₹{parseFloat(bill.agentFees)?.toFixed(2) || '0.00'}</p>
          
          {bill.extraCharges && bill.extraCharges.length > 0 && (
            <div>
              <h4>Extra Charges:</h4>
              {bill.extraCharges.map((charge, index) => (
                <p key={index}><strong>{charge.label}:</strong> ₹{parseFloat(charge.amount)?.toFixed(2) || '0.00'}</p>
              ))}
            </div>
          )}
        </div>
        
        <div className="detail-section">
          <h3>Discounts</h3>
          {bill.discounts && bill.discounts.length > 0 ? (
            bill.discounts.map((discount, index) => (
              <p key={index}>
                <strong>{discount.label}:</strong>{' '}
                {discount.type === 'PERCENTAGE'
                  ? `${discount.amount}%`
                  : `₹${parseFloat(discount.amount)?.toFixed(2) || '0.00'}`}
              </p>
            ))
          ) : (
            <p>No discounts applied</p>
          )}
        </div>
        
        <div className="detail-section">
          <h3>Financial Summary</h3>
          <p><strong>Total Amount:</strong> ₹{parseFloat(bill.totalAmount)?.toFixed(2) || '0.00'}</p>
          <p><strong>Bill Date:</strong> {new Date(bill.billDate || bill.createdOn).toLocaleDateString()}</p>
          <p><strong>Status:</strong> <span className={`status-${bill.status?.toLowerCase()}`}>{bill.status}</span></p>
          <p><strong>Created By:</strong> {bill.createdBy || bill.createdBy?.us_name || 'Unknown'}</p>
          <p><strong>Remarks:</strong> {bill.remarks || 'N/A'}</p>
        </div>
      </div>

      {/* ── Audit Panel — read-only, always visible ──────────────────────── */}
      <AuditPanel
        enteredBy={bill.entered_by || bill.createdBy || bill.bl_created_by}
        enteredOn={bill.entered_on || bill.createdOn || bill.bl_created_at}
        modifiedBy={bill.modified_by || bill.bl_modified_by}
        modifiedOn={bill.modified_on || bill.bl_modified_at}
        closedBy={bill.closed_by || bill.cancelled_by}
        closedOn={bill.closed_on || bill.cancelled_on}
      />
      {/* ────────────────────────────────────────────────────────────────── */}
      
      <div className="form-actions">
        <button
          type="button"
          className="tool-button"
          onClick={() => {
            const id = bill.bl_id ?? bill.id;
            if (!id) return;
            navigate(`/print/bill/${encodeURIComponent(id)}`, {
              state: { returnTo: `${window.location.pathname}${window.location.search}` }
            });
          }}
        >
          Print Bill
        </button>
        <button className="tool-button">Export PDF</button>
        <AuditHistoryButton
          module="Billing"
          recordId={bill.bl_id ?? bill.id}
          label="Audit History"
        />
        <button className="tool-button" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default BillDetails;