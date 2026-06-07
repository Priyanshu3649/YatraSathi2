/**
 * AuditPanel — Reusable read-only ERP audit information block
 * Displays: Entered By/On, Modified By/On, Closed By/On
 * Visible in View, Edit, Cancel, and Close screens.
 */

import React from 'react';
import '../../styles/audit-panel.css';

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
};

const AuditPanel = ({
  enteredBy,
  enteredOn,
  modifiedBy,
  modifiedOn,
  closedBy,
  closedOn,
  className = '',
}) => {
  return (
    <fieldset className={`audit-panel ${className}`} aria-label="Audit Information">
      <legend className="audit-panel__legend">
        <span className="audit-panel__icon">🔒</span> Audit Information
      </legend>

      <div className="audit-panel__grid">
        {/* Entered */}
        <div className="audit-panel__row">
          <div className="audit-panel__cell">
            <span className="audit-panel__label">Entered By</span>
            <span className="audit-panel__value audit-panel__value--user">
              {enteredBy || '—'}
            </span>
          </div>
          <div className="audit-panel__cell">
            <span className="audit-panel__label">Entered On</span>
            <span className="audit-panel__value">{fmt(enteredOn)}</span>
          </div>
        </div>

        {/* Modified */}
        <div className="audit-panel__row">
          <div className="audit-panel__cell">
            <span className="audit-panel__label">Modified By</span>
            <span className="audit-panel__value audit-panel__value--user">
              {modifiedBy || '—'}
            </span>
          </div>
          <div className="audit-panel__cell">
            <span className="audit-panel__label">Modified On</span>
            <span className="audit-panel__value">{fmt(modifiedOn)}</span>
          </div>
        </div>

        {/* Closed */}
        <div className="audit-panel__row">
          <div className="audit-panel__cell">
            <span className="audit-panel__label">Closed By</span>
            <span
              className={`audit-panel__value ${closedBy ? 'audit-panel__value--closed' : 'audit-panel__value--empty'}`}
            >
              {closedBy || '—'}
            </span>
          </div>
          <div className="audit-panel__cell">
            <span className="audit-panel__label">Closed On</span>
            <span
              className={`audit-panel__value ${closedOn ? 'audit-panel__value--closed' : 'audit-panel__value--empty'}`}
            >
              {fmt(closedOn)}
            </span>
          </div>
        </div>
      </div>
    </fieldset>
  );
};

export default AuditPanel;
