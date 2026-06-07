/**
 * AuditQueueWidget — Live audit queue health dashboard card
 * Polls /api/audit/metrics every 30 seconds.
 * Shows: Queue Size, Total Success, Failed, Retried, Dropped + Health badge.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { auditAPI } from '../../services/api';
import '../../styles/audit-queue-widget.css';

const REFRESH_INTERVAL = 30_000; // 30 seconds

const HEALTH_CONFIG = {
  Healthy:  { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  icon: '🟢', label: 'Healthy' },
  Warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '🟡', label: 'Warning' },
  Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: '🔴', label: 'Critical' },
};

const StatCard = ({ label, value, color }) => (
  <div className="aqw-stat">
    <span className="aqw-stat__value" style={{ color }}>{value ?? '—'}</span>
    <span className="aqw-stat__label">{label}</span>
  </div>
);

const AuditQueueWidget = () => {
  const [metrics, setMetrics]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const timerRef = useRef(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const res  = await auditAPI.getMetrics();
      const data = res.data || res;
      setMetrics(data);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err.message || 'Unable to fetch audit metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    timerRef.current = setInterval(fetchMetrics, REFRESH_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [fetchMetrics]);

  const health = metrics?.healthStatus || 'Healthy';
  const cfg    = HEALTH_CONFIG[health] || HEALTH_CONFIG.Healthy;

  return (
    <div className="aqw-card" style={{ '--aqw-accent': cfg.color, '--aqw-accent-bg': cfg.bg }}>
      {/* Header */}
      <div className="aqw-header">
        <span className="aqw-title">⚙️ Audit Queue</span>
        <div className="aqw-header-right">
          <span className="aqw-badge" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
            <span className="aqw-pulse" style={{ background: cfg.color }} />
            {cfg.icon} {cfg.label}
          </span>
          <button
            className="aqw-refresh-btn"
            onClick={() => { setLoading(true); fetchMetrics(); }}
            title="Refresh now"
            disabled={loading}
          >
            {loading ? '⟳' : '↺'}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && !metrics && (
        <div className="aqw-error">⚠ {error}</div>
      )}

      {/* Stats grid */}
      {metrics && (
        <div className="aqw-stats">
          <StatCard label="Queue Size"     value={metrics.queueLen} color={cfg.color} />
          <StatCard label="Total Success"  value={metrics.success}  color="#22c55e"   />
          <StatCard label="Total Failed"   value={metrics.failed}   color={metrics.failed  > 0 ? '#ef4444' : '#64748b'} />
          <StatCard label="Total Retried"  value={metrics.retried}  color={metrics.retried > 0 ? '#f59e0b' : '#64748b'} />
          <StatCard label="Total Dropped"  value={metrics.dropped}  color={metrics.dropped > 0 ? '#f97316' : '#64748b'} />
        </div>
      )}

      {/* Footer */}
      <div className="aqw-footer">
        {lastRefresh
          ? `Last updated: ${lastRefresh.toLocaleTimeString('en-IN')} · Auto-refresh 30s`
          : 'Loading…'}
      </div>
    </div>
  );
};

export default AuditQueueWidget;
