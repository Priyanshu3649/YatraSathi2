/**
 * AuditHistoryModal — Full forensic timeline modal for a single record.
 * Fetches GET /api/audit/record/:module/:recordId and renders a
 * chronological, color-coded audit timeline.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { auditAPI } from '../../services/api';
import '../../styles/audit-history-modal.css';

// ── Action badge colours ──────────────────────────────────────────────────────
const ACTION_STYLES = {
  INSERT:            { bg: '#1e40af', color: '#bfdbfe', label: 'INSERT'   },
  UPDATE:            { bg: '#92400e', color: '#fde68a', label: 'UPDATE'   },
  DELETE:            { bg: '#7f1d1d', color: '#fecaca', label: 'DELETE'   },
  CANCEL:            { bg: '#831843', color: '#fbcfe8', label: 'CANCEL'   },
  CLOSE:             { bg: '#1e3a5f', color: '#bae6fd', label: 'CLOSE'    },
  LOGIN:             { bg: '#14532d', color: '#bbf7d0', label: 'LOGIN'    },
  LOGOUT:            { bg: '#374151', color: '#e5e7eb', label: 'LOGOUT'   },
  FAILED_LOGIN:      { bg: '#7f1d1d', color: '#fca5a5', label: 'FAIL'     },
};

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    });
  } catch { return dateStr; }
};

const ActionBadge = ({ action }) => {
  const s = ACTION_STYLES[action] || { bg: '#374151', color: '#e5e7eb', label: action };
  return (
    <span className="ahm-badge" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
};

const AuditHistoryModal = ({ module, recordId, onClose }) => {
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await auditAPI.getRecordHistory(module, recordId);
      const data = res.data || res;
      setHistory(data.history || []);
    } catch (err) {
      setError(err.message || 'Failed to load audit history');
    } finally {
      setLoading(false);
    }
  }, [module, recordId]);

  useEffect(() => {
    load();
    // Close on Escape
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [load, onClose]);

  return (
    <div className="ahm-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ahm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ahm-header">
          <div className="ahm-header-left">
            <span className="ahm-icon">🔍</span>
            <div>
              <div className="ahm-title">Audit History</div>
              <div className="ahm-subtitle">{module} #{recordId}</div>
            </div>
          </div>
          <button className="ahm-close" onClick={onClose} title="Close (Esc)">✕</button>
        </div>

        {/* Body */}
        <div className="ahm-body">
          {loading && (
            <div className="ahm-loading">
              <div className="ahm-spinner" />
              Loading forensic history…
            </div>
          )}

          {error && (
            <div className="ahm-error">⚠ {error}</div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="ahm-empty">No audit records found for {module} #{recordId}.</div>
          )}

          {!loading && history.length > 0 && (
            <>
              <div className="ahm-summary">
                {history.length} forensic event{history.length !== 1 ? 's' : ''} recorded
              </div>
              <div className="ahm-timeline">
                {history.map((row, idx) => (
                  <div key={row.audit_id || idx} className="ahm-event">
                    {/* Timeline dot */}
                    <div className="ahm-dot-col">
                      <div className="ahm-dot" />
                      {idx < history.length - 1 && <div className="ahm-line" />}
                    </div>

                    {/* Event card */}
                    <div className="ahm-event-card">
                      <div className="ahm-event-header">
                        <ActionBadge action={row.action_type} />
                        <span className="ahm-event-time">{fmt(row.change_timestamp)}</span>
                        <span className="ahm-event-user">
                          👤 {row.changed_by_name || row.changed_by || '—'}
                        </span>
                      </div>

                      {row.field_name && (
                        <div className="ahm-field-row">
                          <span className="ahm-field-name">{row.field_name}</span>
                          {row.old_value != null && (
                            <>
                              <span className="ahm-old">{row.old_value}</span>
                              <span className="ahm-arrow">→</span>
                            </>
                          )}
                          <span className="ahm-new">{row.new_value ?? '—'}</span>
                        </div>
                      )}

                      {row.ip_address && (
                        <div className="ahm-meta">
                          IP: {row.ip_address}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="ahm-footer">
          <span className="ahm-footer-note">🔒 Read-only — Immutable forensic record</span>
          <button className="ahm-close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default AuditHistoryModal;
