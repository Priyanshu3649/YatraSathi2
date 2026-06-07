/**
 * AuditTrail.jsx — YatraSathi ERP Forensic Audit Viewer
 * =======================================================
 * ERP-grade investigation tool for auditors & accountants.
 *
 * Features:
 *  - Advanced filters: Module, Action, User, Date Range, Record ID
 *  - Record drilldown: full chronological history per record
 *  - Per-field change view (Field | Old Value | New Value)
 *  - Server-side pagination (50 records/page)
 *  - Color-coded action badges
 *  - Keyboard accessible
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { auditAPI } from '../services/api';
import AuditQueueWidget from '../components/common/AuditQueueWidget';
import './AuditTrail.css';

// ── Constants ─────────────────────────────────────────────────────────────────
const MODULES = [
  'Billing', 'Booking', 'Payment', 'Receipt',
  'Contra', 'Journal', 'Customer', 'Employee',
  'User', 'ServiceCharge', 'TravelPlan', 'Auth', 'Ledger',
];

const ACTIONS = [
  { value: 'INSERT',            label: 'INSERT',            color: '#4caf50' },
  { value: 'UPDATE',            label: 'UPDATE',            color: '#2196f3' },
  { value: 'DELETE',            label: 'DELETE',            color: '#f44336' },
  { value: 'CANCEL',            label: 'CANCEL',            color: '#ff9800' },
  { value: 'CLOSE',             label: 'CLOSE',             color: '#9c27b0' },
  { value: 'LOGIN',             label: 'LOGIN',             color: '#00bcd4' },
  { value: 'LOGOUT',            label: 'LOGOUT',            color: '#607d8b' },
  { value: 'FAILED_LOGIN',      label: 'FAILED LOGIN',      color: '#e53935' },
  { value: 'PASSWORD_RESET',    label: 'PASSWORD RESET',    color: '#ff9800' },
  { value: 'USER_LOCK',         label: 'USER LOCK',         color: '#795548' },
  { value: 'USER_UNLOCK',       label: 'USER UNLOCK',       color: '#4caf50' },
  { value: 'ROLE_CHANGE',       label: 'ROLE CHANGE',       color: '#9c27b0' },
  { value: 'PERMISSION_CHANGE', label: 'PERMISSION CHANGE', color: '#9c27b0' },
];

const ACTION_MAP = Object.fromEntries(ACTIONS.map(a => [a.value, a]));

const PAGE_LIMIT = 50;

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return d; }
};

const fmtDateShort = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return d; }
};

const ActionBadge = ({ action }) => {
  const a = ACTION_MAP[action] || { label: action, color: '#888' };
  return (
    <span className="audit-badge" style={{ '--badge-color': a.color }}>
      {a.label}
    </span>
  );
};

const ChangeValue = ({ val }) => {
  if (val == null || val === '') return <span className="audit-empty">—</span>;
  return <span className="audit-value">{val}</span>;
};

// ── Export utilities ─────────────────────────────────────────────────────────────
const CSV_COLS = [
  { key: 'audit_id',       label: 'Audit ID'    },
  { key: 'module_name',    label: 'Module'      },
  { key: 'record_id',      label: 'Record ID'   },
  { key: 'action_type',    label: 'Action'      },
  { key: 'field_name',     label: 'Field'       },
  { key: 'old_value',      label: 'Old Value'   },
  { key: 'new_value',      label: 'New Value'   },
  { key: 'changed_by_name',label: 'Changed By'  },
  { key: 'ip_address',     label: 'IP Address'  },
  { key: 'change_timestamp',label: 'Timestamp'  },
];

function exportCSV(logs) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = CSV_COLS.map(c => esc(c.label)).join(',');
  const rows   = logs.map(row =>
    CSV_COLS.map(c => esc(row[c.key] ?? '')).join(',')
  );
  const bom  = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([bom + [header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `YatraSathi_AuditLog_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(logs) {
  const rows = logs.map(r => `
    <tr>
      <td>${r.audit_id ?? ''}</td>
      <td>${r.module_name ?? ''}</td>
      <td>${r.record_id ?? ''}</td>
      <td>${r.action_type ?? ''}</td>
      <td>${r.field_name ?? ''}</td>
      <td>${r.old_value ?? ''}</td>
      <td>${r.new_value ?? ''}</td>
      <td>${r.changed_by_name ?? ''}</td>
      <td>${r.change_timestamp ? new Date(r.change_timestamp).toLocaleString('en-IN') : ''}</td>
    </tr>`).join('');

  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>YatraSathi Audit Log</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; color: #111; }
        h1 { font-size: 16px; margin-bottom: 4px; }
        p  { font-size: 10px; color: #555; margin: 0 0 12px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1e293b; color: #fff; padding: 6px 4px; text-align: left; font-size: 10px; }
        td { padding: 4px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
        tr:nth-child(even) td { background: #f8fafc; }
        @media print { body { margin: 10px; } }
      </style>
    </head>
    <body>
      <h1>YatraSathi — Forensic Audit Log</h1>
      <p>Exported: ${new Date().toLocaleString('en-IN')} &nbsp;|&nbsp; Total records shown: ${logs.length}</p>
      <table>
        <thead><tr>
          <th>ID</th><th>Module</th><th>Record</th><th>Action</th>
          <th>Field</th><th>Old Value</th><th>New Value</th>
          <th>Changed By</th><th>Timestamp</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`);
  win.document.close();
  win.print();
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AuditTrail() {
  // Filter state
  const [filters, setFilters] = useState({
    module: '',
    action: '',
    changedBy: '',
    recordId: '',
    fromDate: '',
    toDate: '',
  });

  // Log list state
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Drilldown state
  const [drilldown, setDrilldown] = useState(null); // { module, recordId, history }
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillError, setDrillError] = useState(null);

  // Refs for keyboard navigation
  const filterRef = useRef(null);
  const tableRef  = useRef(null);

  // ── Fetch logs ──────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async (currentPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: currentPage, limit: PAGE_LIMIT };
      if (filters.module)    params.module    = filters.module;
      if (filters.action)    params.action    = filters.action;
      if (filters.changedBy) params.changedBy = filters.changedBy;
      if (filters.recordId)  params.recordId  = filters.recordId;
      if (filters.fromDate)  params.fromDate  = filters.fromDate;
      if (filters.toDate)    params.toDate    = filters.toDate;

      const res = await auditAPI.getAuditLogs(params);
      const data = res.data || res;
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setPage(currentPage);
    } catch (err) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Drilldown fetch ─────────────────────────────────────────────────────────
  const loadDrilldown = async (module, recordId) => {
    setDrillLoading(true);
    setDrillError(null);
    setDrilldown(null);
    try {
      const res  = await auditAPI.getRecordHistory(module, recordId);
      const data = res.data || res;
      setDrilldown({ module, recordId, history: data.history || [] });
    } catch (err) {
      setDrillError(err.message || 'Failed to load record history');
    } finally {
      setDrillLoading(false);
    }
  };

  // ── Event handlers ──────────────────────────────────────────────────────────
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleClear = () => {
    setFilters({ module: '', action: '', changedBy: '', recordId: '', fromDate: '', toDate: '' });
    setTimeout(() => fetchLogs(1), 50);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchLogs(newPage);
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleRowClick = (log) => {
    loadDrilldown(log.module_name, log.record_id);
  };

  const handleCloseDrilldown = () => {
    setDrilldown(null);
    setDrillError(null);
  };

  // Group drilldown history by timestamp (event buckets)
  const groupHistory = (history) => {
    const groups = [];
    let prev = null;
    for (const row of history) {
      const key = `${row.change_timestamp}_${row.action_type}`;
      if (prev && prev.key === key) {
        prev.rows.push(row);
      } else {
        prev = { key, timestamp: row.change_timestamp, action: row.action_type,
                  changedBy: row.changed_by_name || row.changed_by, rows: [row] };
        groups.push(prev);
      }
    }
    return groups;
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="audit-trail">
      {/* ── Header ── */}
      <div className="audit-header">
        <div className="audit-header__title-block">
          <h1 className="audit-header__title">
            <span className="audit-header__icon">🔍</span>
            Forensic Audit Viewer
          </h1>
          <p className="audit-header__subtitle">
            ERP Investigation Tool &mdash; All changes are immutable and time-stamped
          </p>
        </div>
        <div className="audit-header__stats">
          <span className="audit-stat">
            <span className="audit-stat__num">{total.toLocaleString()}</span>
            <span className="audit-stat__label">Total Records</span>
          </span>
        </div>
      </div>

      {/* ── Audit Queue Widget ── */}
      <AuditQueueWidget />

      {/* ── Export Toolbar ── */}
      <div className="audit-export-bar">
        <span className="audit-export-bar__label">Export:</span>
        <button type="button" className="audit-export-btn"
          onClick={() => exportCSV(logs)} disabled={logs.length === 0}
          title="Download as Excel-compatible CSV">
          📊 Excel / CSV
        </button>
        <button type="button" className="audit-export-btn"
          onClick={() => exportPDF(logs)} disabled={logs.length === 0}
          title="Open printable PDF view">
          📄 PDF Export
        </button>
        <button type="button" className="audit-export-btn"
          onClick={() => window.print()} title="Print current view">
          🖨️ Print
        </button>
        <div style={{ flex: 1 }} />
        <Link to="/audit/retention" className="audit-retention-link">
          🗄️ Retention Policy
        </Link>
      </div>

      {/* ── Filter Panel ── */}
      <form className="audit-filters" onSubmit={handleSearch} ref={filterRef}>
        <div className="audit-filters__grid">
          {/* Module */}
          <div className="audit-filters__field">
            <label className="audit-filters__label" htmlFor="af-module">Module</label>
            <select
              id="af-module"
              className="audit-filters__select"
              value={filters.module}
              onChange={e => handleFilterChange('module', e.target.value)}
            >
              <option value="">All Modules</option>
              {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Action */}
          <div className="audit-filters__field">
            <label className="audit-filters__label" htmlFor="af-action">Action Type</label>
            <select
              id="af-action"
              className="audit-filters__select"
              value={filters.action}
              onChange={e => handleFilterChange('action', e.target.value)}
            >
              <option value="">All Actions</option>
              {ACTIONS.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          {/* User */}
          <div className="audit-filters__field">
            <label className="audit-filters__label" htmlFor="af-user">User / Employee ID</label>
            <input
              id="af-user"
              type="text"
              className="audit-filters__input"
              placeholder="e.g. ADM001 or Priyanshu"
              value={filters.changedBy}
              onChange={e => handleFilterChange('changedBy', e.target.value)}
            />
          </div>

          {/* Record ID */}
          <div className="audit-filters__field">
            <label className="audit-filters__label" htmlFor="af-record">Record ID</label>
            <input
              id="af-record"
              type="text"
              className="audit-filters__input"
              placeholder="e.g. 604 or BK-2026001"
              value={filters.recordId}
              onChange={e => handleFilterChange('recordId', e.target.value)}
            />
          </div>

          {/* From Date */}
          <div className="audit-filters__field">
            <label className="audit-filters__label" htmlFor="af-from">From Date</label>
            <input
              id="af-from"
              type="date"
              className="audit-filters__input"
              value={filters.fromDate}
              onChange={e => handleFilterChange('fromDate', e.target.value)}
            />
          </div>

          {/* To Date */}
          <div className="audit-filters__field">
            <label className="audit-filters__label" htmlFor="af-to">To Date</label>
            <input
              id="af-to"
              type="date"
              className="audit-filters__input"
              value={filters.toDate}
              onChange={e => handleFilterChange('toDate', e.target.value)}
            />
          </div>
        </div>

        <div className="audit-filters__actions">
          <button type="submit" className="audit-btn audit-btn--primary" disabled={loading}>
            {loading ? '⏳ Searching...' : '🔍 Search Audit Logs'}
          </button>
          <button type="button" className="audit-btn audit-btn--secondary" onClick={handleClear}>
            ✕ Clear Filters
          </button>
        </div>
      </form>

      {/* ── Error ── */}
      {error && (
        <div className="audit-error">
          <span>⚠️ {error}</span>
          <button className="audit-error__close" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* ── Results Table ── */}
      <div className="audit-results" ref={tableRef}>
        <div className="audit-results__header">
          <span className="audit-results__count">
            Showing {logs.length} of {total.toLocaleString()} records (Page {page} of {totalPages})
          </span>
          {filters.module || filters.action || filters.changedBy || filters.recordId || filters.fromDate || filters.toDate ? (
            <span className="audit-results__filter-indicator">Filtered</span>
          ) : null}
        </div>

        {loading ? (
          <div className="audit-loading">
            <div className="audit-loading__spinner"></div>
            <span>Loading audit records...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="audit-empty-state">
            <span className="audit-empty-state__icon">📋</span>
            <p>No audit records found for the selected filters.</p>
          </div>
        ) : (
          <div className="audit-table-wrapper">
            <table className="audit-table" role="grid" aria-label="Audit Log Records">
              <thead>
                <tr>
                  <th className="audit-th">Timestamp</th>
                  <th className="audit-th">Module</th>
                  <th className="audit-th">Record ID</th>
                  <th className="audit-th">Action</th>
                  <th className="audit-th">Field</th>
                  <th className="audit-th">Old Value</th>
                  <th className="audit-th">New Value</th>
                  <th className="audit-th">Changed By</th>
                  <th className="audit-th audit-th--actions">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr
                    key={log.audit_id}
                    className="audit-tr"
                    data-action={log.action_type}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && handleRowClick(log)}
                  >
                    <td className="audit-td audit-td--ts">{fmtDate(log.change_timestamp)}</td>
                    <td className="audit-td audit-td--module">{log.module_name}</td>
                    <td className="audit-td audit-td--record">{log.record_id}</td>
                    <td className="audit-td">
                      <ActionBadge action={log.action_type} />
                    </td>
                    <td className="audit-td audit-td--field">{log.field_name || '—'}</td>
                    <td className="audit-td audit-td--old">
                      <ChangeValue val={log.old_value} />
                    </td>
                    <td className="audit-td audit-td--new">
                      <ChangeValue val={log.new_value} />
                    </td>
                    <td className="audit-td audit-td--user">
                      <span className="audit-user">
                        {log.changed_by_name || log.changed_by}
                      </span>
                    </td>
                    <td className="audit-td audit-td--drilldown">
                      <button
                        className="audit-drill-btn"
                        title={`View full history of ${log.module_name} #${log.record_id}`}
                        onClick={() => handleRowClick(log)}
                        aria-label={`Drilldown ${log.module_name} ${log.record_id}`}
                      >
                        History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div className="audit-pagination">
            <button
              className="audit-page-btn"
              disabled={page <= 1}
              onClick={() => handlePageChange(1)}
              aria-label="First page"
            >
              «
            </button>
            <button
              className="audit-page-btn"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              aria-label="Previous page"
            >
              ‹
            </button>
            <span className="audit-page-info">
              Page {page} / {totalPages}
            </span>
            <button
              className="audit-page-btn"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
              aria-label="Next page"
            >
              ›
            </button>
            <button
              className="audit-page-btn"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(totalPages)}
              aria-label="Last page"
            >
              »
            </button>
          </div>
        )}
      </div>

      {/* ── Drilldown Modal ── */}
      {(drilldown || drillLoading || drillError) && (
        <div
          className="audit-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Record History"
          onClick={(e) => e.target === e.currentTarget && handleCloseDrilldown()}
        >
          <div className="audit-modal">
            <div className="audit-modal__header">
              {drilldown && (
                <>
                  <span className="audit-modal__icon">📋</span>
                  <h2 className="audit-modal__title">
                    {drilldown.module} &mdash; Record #{drilldown.recordId}
                  </h2>
                  <span className="audit-modal__count">
                    {drilldown.history.length} audit event{drilldown.history.length !== 1 ? 's' : ''}
                  </span>
                </>
              )}
              <button
                className="audit-modal__close"
                onClick={handleCloseDrilldown}
                aria-label="Close record history"
              >
                ✕
              </button>
            </div>

            <div className="audit-modal__body">
              {drillLoading && (
                <div className="audit-loading audit-loading--modal">
                  <div className="audit-loading__spinner"></div>
                  <span>Loading record history...</span>
                </div>
              )}

              {drillError && (
                <div className="audit-error">⚠️ {drillError}</div>
              )}

              {drilldown && !drillLoading && (
                drilldown.history.length === 0 ? (
                  <div className="audit-empty-state">
                    <span className="audit-empty-state__icon">🔍</span>
                    <p>No history found for this record.</p>
                  </div>
                ) : (
                  <div className="audit-timeline">
                    {groupHistory(drilldown.history).map((group, gi) => (
                      <div key={gi} className="audit-event" data-action={group.action}>
                        {/* Event header */}
                        <div className="audit-event__header">
                          <div className="audit-event__marker"></div>
                          <div className="audit-event__meta">
                            <span className="audit-event__time">{fmtDateShort(group.timestamp)}</span>
                            <ActionBadge action={group.action} />
                            <span className="audit-event__user">by {group.changedBy}</span>
                          </div>
                        </div>

                        {/* Changed fields */}
                        {group.rows.filter(r => r.field_name).length > 0 && (
                          <table className="audit-event__table">
                            <thead>
                              <tr>
                                <th>Field</th>
                                <th>Before</th>
                                <th>After</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.rows.map((r, ri) => (
                                r.field_name ? (
                                  <tr key={ri} className="audit-event__row">
                                    <td className="audit-event__field">{r.field_name}</td>
                                    <td className="audit-event__old">
                                      <ChangeValue val={r.old_value} />
                                    </td>
                                    <td className="audit-event__new">
                                      <ChangeValue val={r.new_value} />
                                    </td>
                                  </tr>
                                ) : null
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}