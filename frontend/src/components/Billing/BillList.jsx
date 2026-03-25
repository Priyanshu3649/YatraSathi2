import React from 'react';

const BillList = ({ bills, loading, onEdit, onDelete, onFinalize, onExport, onView, user, selectedBill, onSelect }) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'status-confirmed';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const canEdit = (bill) => {
    return user?.us_usertype === 'admin' || 
           (user?.us_usertype === 'employee' && bill.status !== 'CANCELLED');
  };

  const canDelete = (bill) => {
    return user?.us_usertype === 'admin' && bill.status !== 'CANCELLED';
  };

  // Handle row click for selection
  const handleRowClick = (bill, e) => {
    // Prevent selection when clicking action buttons
    if (e.target.closest('.action-buttons')) return;
    
    onSelect(bill);
  };

  // Handle keyboard navigation within the table
  const handleKeyDown = (e, bill, index) => {
    switch(e.key) {
      case 'Enter':
        e.preventDefault();
        onSelect(bill);
        break;
      case ' ': // Spacebar
        e.preventDefault();
        onSelect(bill);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (index > 0) {
          const prevRow = document.querySelector(`tr[data-index="${index - 1}"]`);
          if (prevRow) {
            prevRow.focus();
            onSelect(bills[index - 1]);
          }
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (index < bills.length - 1) {
          const nextRow = document.querySelector(`tr[data-index="${index + 1}"]`);
          if (nextRow) {
            nextRow.focus();
            onSelect(bills[index + 1]);
          }
        }
        break;
      default:
        break;
    }
  };

  if (loading) {
    return <p>Loading bills...</p>;
  }

  if (bills.length === 0) {
    return <p>No bills found.</p>;
  }

  return (
    <table className="grid-table">
      <thead>
        <tr>
          <th>Bill No</th>
          <th>Booking No</th>
          <th>Customer Name</th>
          <th>Phone</th>
          <th>From Station</th>
          <th>To Station</th>
          <th>PNR Number</th>
          <th>Ticket Type</th>
          <th>Train No</th>
          <th>Class</th>
          <th>Journey Date</th>
          <th>Total Amount</th>
          <th>Billing Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {bills.map((bill, index) => (
          <tr 
            key={bill.id || bill.billId} 
            data-index={index}
            className={`${getStatusClass(bill.status)} ${selectedBill && (selectedBill.id === bill.id || selectedBill.billId === bill.billId) ? 'selected' : ''}`}
            onClick={(e) => handleRowClick(bill, e)}
            onKeyDown={(e) => handleKeyDown(e, bill, index)}
            tabIndex={0}
            style={{ cursor: 'pointer' }}
          >
            <td>{bill.billNo || bill.id || bill.billId}</td>
            <td>{bill.bookingId || bill.booking_no || '-'}</td>
            <td>{bill.customerName || bill.customer?.us_name || bill.customerId || '-'}</td>
            <td>{bill.customerPhone || bill.phone || '-'}</td>
            <td>{bill.fromStation || bill.from_station || '-'}</td>
            <td>{bill.toStation || bill.to_station || '-'}</td>
            <td>{bill.pnrNumber || bill.pnr || bill.pnrNumbers?.join(', ') || '-'}</td>
            <td>{bill.ticketType || bill.ticket_type || '-'}</td>
            <td>{bill.trainNo || bill.train_number || '-'}</td>
            <td>{bill.class || bill.reservationClass || '-'}</td>
            <td>{new Date(bill.journeyDate || bill.travelDate || '').toLocaleDateString() || '-'}</td>
            <td>₹{parseFloat(bill.totalAmount || bill.total_amount)?.toFixed(2) || '0.00'}</td>
            <td>{new Date(bill.billDate || bill.createdOn).toLocaleDateString()}</td>
            <td>
              <div className="action-buttons">
                {canEdit(bill) && (
                  <button 
                    className="tool-button" 
                    onClick={() => onEdit(bill)}
                    title="Edit Bill"
                  >
                    Edit
                  </button>
                )}
                {onView && (
                  <button 
                    className="tool-button" 
                    onClick={() => onView(bill)}
                    title="View Bill"
                  >
                    View
                  </button>
                )}
                <button 
                  className="tool-button" 
                  onClick={() => onExport(bill.id || bill.billId)}
                  title="Export Bill"
                >
                  Export
                </button>
                {canDelete(bill) && (
                  <button 
                    className="tool-button" 
                    onClick={() => onDelete(bill.id || bill.billId)}
                    title="Delete Bill"
                  >
                    Delete
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default BillList;