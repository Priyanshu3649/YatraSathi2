import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { billingAPI } from '../services/api';
import PaginationControls from '../components/common/PaginationControls';
import '../styles/vintage-erp-theme.css';

const emptyFilters = { fromDate: '', toDate: '', customerName: '', reason: '' };

const CancellationHistory = () => {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    pageSize: 50
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [filters, setFilters] = useState({ ...emptyFilters });
  const [appliedFilters, setAppliedFilters] = useState({ ...emptyFilters });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await billingAPI.getCancellationHistory({
        page,
        limit,
        fromDate: appliedFilters.fromDate || undefined,
        toDate: appliedFilters.toDate || undefined,
        customerName: appliedFilters.customerName || undefined,
        reason: appliedFilters.reason || undefined
      });
      setRows(res.data || []);
      if (res.pagination) {
        setPagination({
          currentPage: res.pagination.currentPage,
          totalPages: res.pagination.totalPages,
          totalRecords: res.pagination.totalRecords,
          pageSize: res.pagination.pageSize || limit
        });
      }
    } catch (e) {
      setError(e.message || 'Failed to load');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, appliedFilters]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="erp-admin-container" style={{ padding: '16px' }}>
      <div className="erp-action-bar" style={{ marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <Link className="erp-button" to="/billing">← Back to billing</Link>
        <span className="erp-tool-separator" />
        <input
          type="date"
          className="erp-input"
          value={filters.fromDate}
          onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
        />
        <input
          type="date"
          className="erp-input"
          value={filters.toDate}
          onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
        />
        <input
          type="text"
          className="erp-input"
          placeholder="Customer name"
          value={filters.customerName}
          onChange={(e) => setFilters((f) => ({ ...f, customerName: e.target.value }))}
        />
        <input
          type="text"
          className="erp-input"
          placeholder="Reason contains"
          value={filters.reason}
          onChange={(e) => setFilters((f) => ({ ...f, reason: e.target.value }))}
        />
        <button
          type="button"
          className="erp-button erp-button-primary"
          onClick={() => {
            setPage(1);
            setAppliedFilters({ ...filters });
          }}
        >
          Apply filters
        </button>
      </div>

      <h1 className="section-title">Bill cancellation history</h1>
      {error && <div className="erp-error-banner">{error}</div>}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="erp-table-container" style={{ overflow: 'auto' }}>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Cancel ref</th>
                <th>Bill no</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Charges</th>
                <th>Refund</th>
                <th>Cancelled on</th>
                <th>Approver</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9}>No cancellations found.</td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.bl_id}>
                    <td>{r.bl_cancellation_ref || '—'}</td>
                    <td>{r.bl_bill_no}</td>
                    <td>{r.bl_customer_name}</td>
                    <td>{r.bl_total_amount}</td>
                    <td>{r.total_cancel_charges}</td>
                    <td>{r.refund_amount}</td>
                    <td>{r.cancelled_on ? new Date(r.cancelled_on).toLocaleString() : '—'}</td>
                    <td>{r.bl_cancel_approver_name || r.bl_cancel_approver_usid || '—'}</td>
                    <td style={{ maxWidth: '240px', whiteSpace: 'pre-wrap' }}>{r.bl_cancellation_remarks || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <PaginationControls
            pagination={pagination}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={(n) => {
              setLimit(n);
              setPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CancellationHistory;
