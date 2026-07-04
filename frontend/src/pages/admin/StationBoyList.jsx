import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { stationBoyAPI } from '../../services/api';

const formatCurrency = (val) => {
  const num = parseFloat(val || 0);
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const StationBoyList = () => {
  const navigate = useNavigate();
  const [stationBoys, setStationBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  // Form states
  const [selectedBoy, setSelectedBoy] = useState(null);
  const [boyForm, setBoyForm] = useState({ name: '', phone: '', address: '', status: 'ACTIVE' });
  const [payForm, setPayForm] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMode: 'CASH',
    referenceNumber: '',
    remarks: ''
  });

  const fetchStationBoys = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await stationBoyAPI.getAll();
      if (res && res.success) {
        setStationBoys(res.data || []);
      } else {
        setError('Failed to fetch station boys list');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Error connecting to the ledger registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStationBoys();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!boyForm.name.trim()) return alert('Name is required');
    try {
      const res = await stationBoyAPI.create(boyForm);
      if (res && res.success) {
        alert('Station Boy added successfully!');
        setShowAddModal(false);
        setBoyForm({ name: '', phone: '', address: '', status: 'ACTIVE' });
        fetchStationBoys();
      }
    } catch (err) {
      alert(err.message || 'Failed to add station boy');
    }
  };

  const handleEditClick = (boy) => {
    setSelectedBoy(boy);
    setBoyForm({
      name: boy.name,
      phone: boy.phone || '',
      address: boy.address || '',
      status: boy.status
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!boyForm.name.trim()) return alert('Name is required');
    try {
      const res = await stationBoyAPI.update(selectedBoy.id, boyForm);
      if (res && res.success) {
        alert('Station Boy updated successfully!');
        setShowEditModal(false);
        setSelectedBoy(null);
        setBoyForm({ name: '', phone: '', address: '', status: 'ACTIVE' });
        fetchStationBoys();
      }
    } catch (err) {
      alert(err.message || 'Failed to update station boy');
    }
  };

  const handlePayClick = (boy) => {
    setSelectedBoy(boy);
    setPayForm({
      paymentDate: new Date().toISOString().split('T')[0],
      amount: '',
      paymentMode: 'CASH',
      referenceNumber: '',
      remarks: ''
    });
    setShowPayModal(true);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(payForm.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return alert('Amount must be greater than zero');
    }
    if (!payForm.paymentDate) return alert('Payment date is required');

    try {
      const res = await stationBoyAPI.addPayment(selectedBoy.id, payForm);
      if (res && res.success) {
        alert('Payment recorded successfully!');
        setShowPayModal(false);
        setSelectedBoy(null);
        fetchStationBoys();
      }
    } catch (err) {
      alert(err.message || 'Failed to record payment');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate (soft-delete) this Station Boy?')) return;
    try {
      const res = await stationBoyAPI.delete(id);
      if (res && res.success) {
        alert('Station Boy deactivated successfully!');
        fetchStationBoys();
      }
    } catch (err) {
      alert(err.message || 'Failed to deactivate station boy');
    }
  };

  if (loading) {
    return <div className="vintage-loading">Loading Station Boy registers...</div>;
  }

  if (error) {
    return (
      <div className="vintage-error" style={{ margin: '20px', padding: '20px', border: '1px solid #c00' }}>
        <h3>Registry Access Error</h3>
        <p>{error}</p>
        <button onClick={fetchStationBoys} className="vintage-btn">Retry Lookup</button>
      </div>
    );
  }

  return (
    <div className="vintage-ledger-wrapper" style={{ padding: '20px' }}>
      <div className="vintage-toolbar no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#111' }}>Station Boy Ledger Registry</h2>
        <button onClick={() => setShowAddModal(true)} className="vintage-btn primary-btn" style={{ background: 'linear-gradient(to bottom, #5a7fdd, #4169E1)', color: 'white', fontWeight: 'bold' }}>
          ➕ Add Station Boy
        </button>
      </div>

      <table className="vintage-table erp-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#e0e0e0', textAlign: 'left' }}>
            <th style={{ padding: '8px', border: '1px solid #ccc' }}>Name</th>
            <th style={{ padding: '8px', border: '1px solid #ccc' }}>Phone</th>
            <th style={{ padding: '8px', border: '1px solid #ccc' }}>Station / Address</th>
            <th style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center' }}>Status</th>
            <th style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }}>Total Incentive</th>
            <th style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }}>Total Paid</th>
            <th style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }}>Net Payable</th>
            <th className="no-print" style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center', width: '220px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {stationBoys.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No station boy records found.</td>
            </tr>
          ) : (
            stationBoys.map(boy => (
              <tr key={boy.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                  <a href={`/admin/station-boys/${boy.id}/ledger`} onClick={(e) => { e.preventDefault(); navigate(`/admin/station-boys/${boy.id}/ledger`); }} style={{ color: '#0053ee', textDecoration: 'underline', fontWeight: 'bold', cursor: 'pointer' }}>
                    {boy.name}
                  </a>
                </td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{boy.phone || '-'}</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{boy.address || '-'}</td>
                <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center' }}>
                  <span style={{
                    padding: '2px 6px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    borderRadius: '2px',
                    backgroundColor: boy.status === 'ACTIVE' ? '#d4edda' : '#f8d7da',
                    color: boy.status === 'ACTIVE' ? '#155724' : '#721c24'
                  }}>
                    {boy.status}
                  </span>
                </td>
                <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(boy.totalIncentive)}</td>
                <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right', color: '#721c24' }}>{formatCurrency(boy.totalPaid)}</td>
                <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right', fontWeight: 'bold', color: boy.pendingPayable > 0 ? '#155724' : '#333' }}>
                  {formatCurrency(boy.pendingPayable)}
                </td>
                <td className="no-print" style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    <button onClick={() => navigate(`/admin/station-boys/${boy.id}/ledger`)} className="vintage-btn btn-sm" style={{ padding: '2px 6px', fontSize: '11px' }}>
                      Ledger
                    </button>
                    <button onClick={() => handleEditClick(boy)} className="vintage-btn btn-sm" style={{ padding: '2px 6px', fontSize: '11px' }}>
                      Edit
                    </button>
                    {boy.status === 'ACTIVE' && (
                      <button onClick={() => handlePayClick(boy)} className="vintage-btn btn-sm primary-btn" style={{ padding: '2px 6px', fontSize: '11px', background: '#28a745', color: 'white', border: 'none' }}>
                        Pay
                      </button>
                    )}
                    {boy.status === 'ACTIVE' && (
                      <button onClick={() => handleDeactivate(boy.id)} className="vintage-btn btn-sm danger-btn" style={{ padding: '2px 6px', fontSize: '11px', background: '#dc3545', color: 'white', border: 'none' }}>
                        Del
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Add Modal */}
      {showAddModal && (
        <div className="erp-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="erp-modal" style={{ backgroundColor: '#f0f0f0', border: '2px solid #ccc', minWidth: '400px', padding: '16px', boxShadow: '4px 4px 8px rgba(0,0,0,0.3)' }}>
            <div className="erp-modal-title" style={{ background: 'linear-gradient(180deg, #0997ff, #0053ee)', color: 'white', padding: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
              <span>Add New Station Boy Master Record</span>
              <button onClick={() => setShowAddModal(false)} style={{ background: '#e81123', color: 'white', border: 'none', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleAddSubmit} style={{ padding: '16px 0' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Name *</label>
                <input type="text" className="erp-input" value={boyForm.name} onChange={e => setBoyForm({ ...boyForm, name: e.target.value })} required style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Phone Number</label>
                <input type="text" className="erp-input" value={boyForm.phone} onChange={e => setBoyForm({ ...boyForm, phone: e.target.value })} style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Station / Address</label>
                <textarea className="erp-input" value={boyForm.address} onChange={e => setBoyForm({ ...boyForm, address: e.target.value })} style={{ width: '100%', padding: '6px', height: '60px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #ccc', paddingTop: '12px' }}>
                <button type="button" className="erp-button" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="erp-button primary" style={{ background: '#0053ee', color: 'white' }}>Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="erp-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="erp-modal" style={{ backgroundColor: '#f0f0f0', border: '2px solid #ccc', minWidth: '400px', padding: '16px', boxShadow: '4px 4px 8px rgba(0,0,0,0.3)' }}>
            <div className="erp-modal-title" style={{ background: 'linear-gradient(180deg, #0997ff, #0053ee)', color: 'white', padding: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
              <span>Edit Station Boy Record: {selectedBoy?.name}</span>
              <button onClick={() => setShowEditModal(false)} style={{ background: '#e81123', color: 'white', border: 'none', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ padding: '16px 0' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Name *</label>
                <input type="text" className="erp-input" value={boyForm.name} onChange={e => setBoyForm({ ...boyForm, name: e.target.value })} required style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Phone Number</label>
                <input type="text" className="erp-input" value={boyForm.phone} onChange={e => setBoyForm({ ...boyForm, phone: e.target.value })} style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Station / Address</label>
                <textarea className="erp-input" value={boyForm.address} onChange={e => setBoyForm({ ...boyForm, address: e.target.value })} style={{ width: '100%', padding: '6px', height: '60px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Status</label>
                <select className="erp-input" value={boyForm.status} onChange={e => setBoyForm({ ...boyForm, status: e.target.value })} style={{ width: '100%', padding: '6px' }}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #ccc', paddingTop: '12px' }}>
                <button type="button" className="erp-button" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="erp-button primary" style={{ background: '#0053ee', color: 'white' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayModal && (
        <div className="erp-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="erp-modal" style={{ backgroundColor: '#f0f0f0', border: '2px solid #ccc', minWidth: '400px', padding: '16px', boxShadow: '4px 4px 8px rgba(0,0,0,0.3)' }}>
            <div className="erp-modal-title" style={{ background: 'linear-gradient(180deg, #28a745, #1e7e34)', color: 'white', padding: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
              <span>Record Cash/Bank Payment to: {selectedBoy?.name}</span>
              <button onClick={() => setShowPayModal(false)} style={{ background: '#e81123', color: 'white', border: 'none', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handlePaySubmit} style={{ padding: '16px 0' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Payment Date *</label>
                <input type="date" className="erp-input" value={payForm.paymentDate} onChange={e => setPayForm({ ...payForm, paymentDate: e.target.value })} required style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Amount (₹) *</label>
                <input type="number" step="0.01" className="erp-input" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} required placeholder="Enter paid amount" style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Payment Mode *</label>
                <select className="erp-input" value={payForm.paymentMode} onChange={e => setPayForm({ ...payForm, paymentMode: e.target.value })} required style={{ width: '100%', padding: '6px' }}>
                  <option value="CASH">CASH</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="UPI">UPI / GPAY / PHONEPE</option>
                  <option value="CHEQUE">CHEQUE</option>
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Reference / Transaction ID</label>
                <input type="text" className="erp-input" value={payForm.referenceNumber} onChange={e => setPayForm({ ...payForm, referenceNumber: e.target.value })} placeholder="Reference number" style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Remarks / Particulars</label>
                <input type="text" className="erp-input" value={payForm.remarks} onChange={e => setPayForm({ ...payForm, remarks: e.target.value })} placeholder="Payment details (e.g. Paid for May bill)" style={{ width: '100%', padding: '6px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #ccc', paddingTop: '12px' }}>
                <button type="button" className="erp-button" onClick={() => setShowPayModal(false)}>Cancel</button>
                <button type="submit" className="erp-button primary" style={{ background: '#28a745', color: 'white' }}>Post Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationBoyList;
