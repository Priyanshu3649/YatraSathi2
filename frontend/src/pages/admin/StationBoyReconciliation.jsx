import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { stationBoyAPI, reconciliationAPI } from '../../services/api';
import PaginationControls from '../../components/common/PaginationControls';
import '../../styles/vintage-erp-theme.css';

const StationBoyReconciliation = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('ACTIVE');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, totalPages: 1, totalRecords: 0 });
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchPayments = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await stationBoyAPI.getAllPayments({ page, limit: pagination.limit, reconciliationStatus: filter });
      setPayments(res.data || []);
      setPagination(prev => ({
        ...prev,
        page: res.pagination?.currentPage || 1,
        totalPages: res.pagination?.totalPages || 1,
        totalRecords: res.pagination?.totalRecords || res.data?.length || 0
      }));
      setSelectedRecord(null);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  }, [filter, pagination.limit]);

  useEffect(() => {
    fetchPayments(1);
  }, [fetchPayments]);

  const handleReconcile = async () => {
    if (!selectedRecord) return;
    const remarks = window.prompt('Enter reconciliation remarks (optional):', 'Reconciled');
    if (remarks === null) return;
    
    try {
      setLoading(true);
      await reconciliationAPI.reconcileStationBoyPayment(selectedRecord.id, remarks);
      setSuccess('Payment reconciled successfully');
      fetchPayments(pagination.page);
    } catch (err) {
      console.error('Error reconciling payment:', err);
      setError(err.message || 'Failed to reconcile payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    fetchPayments(newPage);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  return (
    <div className="erp-page-container">
      <div className="layout-header">
        <div className="erp-menu-bar">
          <div className="erp-menu-item" onClick={() => navigate('/dashboard')}>Main Dashboard</div>
          <div className="erp-menu-item" onClick={() => navigate('/admin/station-boys')}>Station Boys</div>
          <div className="erp-menu-item active">Station Boy Reconciliation</div>
          <div className="erp-user-info">STATION: HQ</div>
        </div>
      </div>
      
      <div className="layout-action-bar">
        <button className="erp-button" onClick={() => fetchPayments(pagination.page)}>Refresh</button>
        <button 
          className="erp-button" 
          onClick={handleReconcile} 
          disabled={!selectedRecord || selectedRecord.is_reconciled}
        >
          Reconcile Selected
        </button>
        <div className="erp-tool-separator"></div>
        <select className="erp-input" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '2px', fontSize: '11px' }}>
          <option value="ACTIVE">Active (Unreconciled)</option>
          <option value="RECONCILED">Reconciled</option>
          <option value="ALL">All Payments</option>
        </select>
        <div style={{ flex: 1 }}></div>
        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>Total Records: {pagination.totalRecords}</div>
      </div>

      <div className="layout-content-wrapper" style={{ padding: '15px' }}>
        <div className="erp-panel-header">STATION BOY SETTLEMENT PAYMENTS</div>
        <div className="erp-form-content" style={{ padding: '0' }}>
          {error && <div className="erp-error-banner" style={{ margin: '10px' }}>{error}</div>}
          {success && <div className="erp-success-banner" style={{ margin: '10px' }}>{success}</div>}
          
          <div className="erp-data-grid">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Station Boy</th>
                  <th>Mode</th>
                  <th>Ref No.</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reconciled</th>
                </tr>
              </thead>
              <tbody>
                {loading && payments.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                ) : payments.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No payment records found.</td></tr>
                ) : (
                  payments.map(payment => (
                    <tr 
                      key={payment.id} 
                      onClick={() => setSelectedRecord(payment)}
                      className={selectedRecord?.id === payment.id ? 'selected-row' : ''}
                      style={{ cursor: 'pointer', backgroundColor: payment.is_reconciled ? '#f8f9fa' : 'inherit' }}
                    >
                      <td>{payment.id}</td>
                      <td>{formatDate(payment.payment_date)}</td>
                      <td>{payment.station_boy ? payment.station_boy.name : `ID: ${payment.station_boy_id}`}</td>
                      <td>{payment.payment_mode}</td>
                      <td>{payment.reference_number || '-'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(payment.amount)}</td>
                      <td>
                        <span className={`status-badge status-${payment.status.toLowerCase()}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td>
                        {payment.is_reconciled ? (
                          <span style={{ color: '#155724', fontWeight: 'bold' }}>Yes</span>
                        ) : (
                          <span style={{ color: '#721c24' }}>No</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <PaginationControls
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalRecords={pagination.totalRecords}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default StationBoyReconciliation;
