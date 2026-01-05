import React from 'react';

const BillList = ({ bills, loading, onEdit, onDelete, onFinalize, onExport, onView, user }) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'DRAFT':
        return 'status-draft';
      case 'FINAL':
        return 'status-final';
      case 'PAID':
        return 'status-paid';
      case 'PARTIAL':
        return 'status-partial';
      default:
        return '';
    }
  };

  const canEdit = (bill) => {
    return user?.us_usertype === 'admin' || 
           (user?.us_usertype === 'employee' && bill.status !== 'PAID');
  };

  const canDelete = (bill) => {
    return user?.us_usertype === 'admin' && bill.status !== 'PAID';
  };

  const canFinalize = (bill) => {
    return (user?.us_usertype === 'admin' || user?.us_usertype === 'employee') && 
           bill.status === 'DRAFT';
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
          <th>Bill ID</th>
          <th>Customer Name</th>
          <th>Total Amount</th>
          <th>Bill Date</th>
          <th>Status</th>
          <th>Created By</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {bills.map((bill) => (
          <tr key={bill.id || bill.billId} className={getStatusClass(bill.status)}>
            <td>{bill.id || bill.billId}</td>
            <td>{bill.customerName || bill.customer?.us_name || bill.customerId}</td>
            <td>₹{bill.totalAmount?.toFixed(2) || bill.totalAmount}</td>
            <td>{new Date(bill.billDate || bill.createdOn).toLocaleDateString()}</td>
            <td>{bill.status}</td>
            <td>{bill.createdBy || bill.createdBy?.us_name || 'Unknown'}</td>
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
                {canFinalize(bill) && (
                  <button 
                    className="tool-button" 
                    onClick={() => onFinalize(bill.id || bill.billId)}
                    title="Finalize Bill"
                  >
                    Finalize
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