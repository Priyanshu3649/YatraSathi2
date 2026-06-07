/**
 * AuditRetentionConfig — Admin-only retention policy configuration screen.
 * Route: /audit/retention
 */

import React, { useState, useEffect } from 'react';
import { auditAPI } from '../services/api';
import '../styles/audit-retention.css';


const AuditRetentionConfig = () => {
  const [policy,   setPolicy]   = useState(null);
  const [form,     setForm]     = useState({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [archiving,setArchiving]= useState(false);
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(null);
  const [confirmArchive, setConfirmArchive] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res  = await auditAPI.getRetentionPolicy();
        const data = res.data || res;
        setPolicy(data);
        setForm({
          retentionYears:      data.retentionYears,
          archiveEnabled:      data.archiveEnabled,
          deleteRequiresAdmin: data.deleteRequiresAdmin,
          autoArchiveEnabled:  data.autoArchiveEnabled,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res  = await auditAPI.updateRetentionPolicy(form);
      const data = res.data || res;
      setPolicy(data);
      setSuccess('✅ Retention policy saved successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await auditAPI.archiveOldLogs();
      setSuccess(`✅ ${res.message}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setArchiving(false);
      setConfirmArchive(false);
    }
  };

  if (loading) return <div className="arc-loading">Loading retention policy…</div>;

  return (
    <div className="arc-page">
      <div className="arc-container">
        {/* Page header */}
        <div className="arc-page-header">
          <div className="arc-page-icon">🗄️</div>
          <div>
            <h1 className="arc-page-title">Audit Retention Policy</h1>
            <p className="arc-page-subtitle">
              Configure how long forensic audit records are kept before archival.
              Deletion always requires Admin authorization.
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error   && <div className="arc-alert arc-alert--error">⚠ {error}</div>}
        {success && <div className="arc-alert arc-alert--success">{success}</div>}

        {/* Current policy summary */}
        {policy && (
          <div className="arc-summary">
            <div className="arc-summary-item">
              <span className="arc-summary-label">Current Retention</span>
              <span className="arc-summary-value">{policy.retentionYears} Years</span>
            </div>
            <div className="arc-summary-item">
              <span className="arc-summary-label">Archive Enabled</span>
              <span className={`arc-summary-value ${policy.archiveEnabled ? 'arc-yes' : 'arc-no'}`}>
                {policy.archiveEnabled ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="arc-summary-item">
              <span className="arc-summary-label">Delete Requires Admin</span>
              <span className={`arc-summary-value ${policy.deleteRequiresAdmin ? 'arc-yes' : 'arc-no'}`}>
                {policy.deleteRequiresAdmin ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="arc-summary-item">
              <span className="arc-summary-label">Auto Archive</span>
              <span className={`arc-summary-value ${policy.autoArchiveEnabled ? 'arc-yes' : 'arc-no'}`}>
                {policy.autoArchiveEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        )}

        {/* Settings form */}
        <form className="arc-form" onSubmit={handleSave}>
          <div className="arc-form-section">
            <h2 className="arc-section-title">⚙️ Policy Settings</h2>

            <div className="arc-field">
              <label className="arc-label" htmlFor="retentionYears">
                Retention Period (Years)
              </label>
              <div className="arc-field-hint">
                Audit records older than this will be eligible for archival. Default: 7 years.
              </div>
              <input
                id="retentionYears"
                type="number"
                min="1"
                max="100"
                className="arc-input"
                value={form.retentionYears ?? 7}
                onChange={(e) => setForm(f => ({ ...f, retentionYears: parseInt(e.target.value, 10) }))}
                required
              />
            </div>

            <div className="arc-toggle-group">
              <label className="arc-toggle-label">
                <input
                  type="checkbox"
                  className="arc-toggle"
                  checked={!!form.archiveEnabled}
                  onChange={(e) => setForm(f => ({ ...f, archiveEnabled: e.target.checked }))}
                />
                <span>Enable Archival</span>
                <span className="arc-toggle-hint">Move old records to audit_forensic_log_legacy</span>
              </label>

              <label className="arc-toggle-label">
                <input
                  type="checkbox"
                  className="arc-toggle"
                  checked={!!form.deleteRequiresAdmin}
                  onChange={(e) => setForm(f => ({ ...f, deleteRequiresAdmin: e.target.checked }))}
                />
                <span>Deletion Requires Admin Authorization</span>
                <span className="arc-toggle-hint">Recommended: always ON for ERP compliance</span>
              </label>

              <label className="arc-toggle-label">
                <input
                  type="checkbox"
                  className="arc-toggle"
                  checked={!!form.autoArchiveEnabled}
                  onChange={(e) => setForm(f => ({ ...f, autoArchiveEnabled: e.target.checked }))}
                />
                <span>Auto Archive (Scheduled)</span>
                <span className="arc-toggle-hint">Automatically archive on a nightly schedule</span>
              </label>
            </div>
          </div>

          <div className="arc-form-actions">
            <button type="submit" className="arc-btn arc-btn--primary" disabled={saving}>
              {saving ? 'Saving…' : '💾 Save Policy'}
            </button>
          </div>
        </form>

        {/* Manual archive section */}
        <div className="arc-archive-section">
          <h2 className="arc-section-title">🗂️ Manual Archive</h2>
          <p className="arc-archive-desc">
            Archive all records older than <strong>{form.retentionYears ?? 7} years</strong> to
            the legacy table. Records are <strong>never permanently deleted</strong> without
            explicit Admin authorization.
          </p>

          {!confirmArchive ? (
            <button
              type="button"
              className="arc-btn arc-btn--warning"
              onClick={() => setConfirmArchive(true)}
              disabled={archiving}
            >
              🗄️ Archive Old Records Now
            </button>
          ) : (
            <div className="arc-confirm-box">
              <p className="arc-confirm-text">
                ⚠ This will move all records older than {form.retentionYears ?? 7} years to the
                archive table. This action is logged. Confirm?
              </p>
              <div className="arc-confirm-actions">
                <button
                  type="button"
                  className="arc-btn arc-btn--danger"
                  onClick={handleArchive}
                  disabled={archiving}
                >
                  {archiving ? 'Archiving…' : '✅ Confirm Archive'}
                </button>
                <button
                  type="button"
                  className="arc-btn arc-btn--secondary"
                  onClick={() => setConfirmArchive(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ERP compliance note */}
        <div className="arc-compliance-note">
          <span className="arc-compliance-icon">🔒</span>
          <div>
            <strong>ERP Compliance Rule:</strong> Audit history is never permanently destroyed
            without Admin authorization. Archived records remain available in{' '}
            <code>audit_forensic_log_legacy</code> for historical investigation and regulatory
            compliance. Storage is cheap — lost audit history is irreversible.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditRetentionConfig;
