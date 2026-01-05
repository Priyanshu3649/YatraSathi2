import React from 'react';

const BillDetails = ({ bill, onClose }) => {
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
          <h3>Journey & Ticket Details</h3>
          <p><strong>Train Number:</strong> {bill.trainNumber}</p>
          <p><strong>Reservation Class:</strong> {bill.reservationClass}</p>
          <p><strong>Ticket Type:</strong> {bill.ticketType}</p>
          <p><strong>PNR Numbers:</strong> {bill.pnrNumbers?.join(', ') || 'N/A'}</p>
        </div>
        
        <div className="detail-section">
          <h3>Fare & Charges</h3>
          <p><strong>Net Journey Fare:</strong> ₹{bill.netFare?.toFixed(2)}</p>
          <p><strong>Service Charges:</strong> ₹{bill.serviceCharges?.toFixed(2)}</p>
          <p><strong>Platform Fees:</strong> ₹{bill.platformFees?.toFixed(2)}</p>
          <p><strong>Agent Fees:</strong> ₹{bill.agentFees?.toFixed(2)}</p>
          
          {bill.extraCharges && bill.extraCharges.length > 0 && (
            <div>
              <h4>Extra Charges:</h4>
              {bill.extraCharges.map((charge, index) => (
                <p key={index}><strong>{charge.label}:</strong> ₹{charge.amount?.toFixed(2)}</p>
              ))}
            </div>
          )}
        </div>
        
        <div className="detail-section">
          <h3>Discounts</h3>
          {bill.discounts && bill.discounts.length > 0 ? (
            bill.discounts.map((discount, index) => (
              <p key={index}>
                <strong>{discount.label}:</strong> 
                {discount.type === 'PERCENTAGE' 
                  ? `${discount.amount}%` 
                  : `₹${discount.amount?.toFixed(2)}`}
              </p>
            ))
          ) : (
            <p>No discounts applied</p>
          )}
        </div>
        
        <div className="detail-section">
          <h3>Financial Summary</h3>
          <p><strong>Total Amount:</strong> ₹{bill.totalAmount?.toFixed(2)}</p>
          <p><strong>Bill Date:</strong> {new Date(bill.billDate || bill.createdOn).toLocaleDateString()}</p>
          <p><strong>Status:</strong> <span className={`status-${bill.status?.toLowerCase()}`}>{bill.status}</span></p>
          <p><strong>Created By:</strong> {bill.createdBy || bill.createdBy?.us_name || 'Unknown'}</p>
          <p><strong>Remarks:</strong> {bill.remarks || 'N/A'}</p>
        </div>
      </div>
      
      <div className="form-actions">
        <button className="tool-button" onClick={() => window.print()}>Print Bill</button>
        <button className="tool-button">Export PDF</button>
        <button className="tool-button" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default BillDetails;