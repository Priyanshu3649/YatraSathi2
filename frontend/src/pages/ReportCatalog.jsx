import React, { useState, useEffect, useCallback } from 'react';
import { reportAPI } from '../services/api';
import PaginationControls from '../components/common/PaginationControls';
import '../styles/vintage-erp-theme.css';

const PERIOD_TYPES = [
  { value: 'DAILY', label: 'Today' },
  { value: 'MONTHLY', label: 'This Month' },
  { value: 'QUARTERLY', label: 'This Quarter' },
  { value: 'ANNUAL', label: 'This FY' },
  { value: 'CUSTOM', label: 'Custom Range' },
  { value: 'ALL', label: 'All Time' },
];

const ReportCatalog = () => {
  const [catalog, setCatalog] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [totals, setTotals] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [periodType, setPeriodType] = useState('MONTHLY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Master');

  // Load catalog on mount
  useEffect(() => {
    reportAPI.getCatalog().then((res) => {
      setCatalog(res.catalog || []);
    }).catch(() => {});
  }, []);

  const runReport = useCallback(async (report, pg = 1, lim = 50) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pg, limit: lim,
        periodType: periodType === 'ALL' ? undefined : periodType,
        startDate: periodType === 'CUSTOM' ? startDate : undefined,
        endDate: periodType === 'CUSTOM' ? endDate : undefined,
        search: search || undefined,
      };
      const res = await reportAPI.runCatalogReport(report.id, params);
      setData(res.data || []);
      setPagination(res.pagination || null);
      setTotals(res.totals || res.data?.length ? null : null);
      // Extract totals from response
      const t = {};
      Object.keys(res).forEach(k => { if (k !== 'success' && k !== 'data' && k !== 'pagination') t[k] = res[k]; });
      setTotals(Object.keys(t).length ? t : null);
    } catch (e) {
      setError(e.message);
      setData([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [periodType, startDate, endDate, search]);

  const handleSelectReport = (report) => {
    setSelectedReport(report);
    setPage(1);
    runReport(report, 1, limit);
  };

  const handleRun = () => {
    if (selectedReport) {
      setPage(1);
      runReport(selectedReport, 1, limit);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    if (selectedReport) runReport(selectedReport, newPage, limit);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
    if (selectedReport) runReport(selectedReport, 1, newLimit);
  };

  const handleExport = async (format) => {
    if (!selectedReport) return;
    try {
      await reportAPI.exportCatalogReport(selectedReport.id, format, {
        periodType: periodType === 'ALL' ? undefined : periodType,
        startDate: periodType === 'CUSTOM' ? startDate : undefined,
        endDate: periodType === 'CUSTOM' ? endDate : undefined,
        search: search || undefined,
      });
    } catch (e) {
      setError(e.message);
    }
  };

  const handlePrint = () => window.print();

  const formatValue = (key, val) => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'number') {
      const k = String(key).toLowerCase();
      if (['amount', 'fare', 'total', 'tax', 'gst', 'net', 'balance', 'revenue', 'charge', 'refund', 'outstanding', 'debit', 'credit', 'paid'].some(h => k.includes(h))) {
        return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      if (val % 1 !== 0) return val.toLocaleString('en-IN', { maximumFractionDigits: 2 });
      return val.toLocaleString('en-IN');
    }
    return String(val);
  };

  const prettify = (col) => {
    if (!col) return '';
    return col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="erp-admin-container" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside className="print-hide" style={{
        width: '240px', minWidth: '240px', background: '#343a40', color: '#fff',
        overflowY: 'auto', padding: '0', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #495057', fontWeight: 'bold', fontSize: '14px' }}>
          Reports
        </div>
        {catalog.map((cat) => (
          <div key={cat.category}>
            <div
              onClick={() => setActiveCategory(cat.category)}
              style={{
                padding: '8px 16px', fontSize: '11px', fontWeight: 'bold',
                color: '#ffc107', background: activeCategory === cat.category ? '#495057' : 'transparent',
                cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px'
              }}
            >
              {cat.category}
            </div>
            {activeCategory === cat.category && cat.reports.map((r) => (
              <div
                key={r.id}
                onClick={() => handleSelectReport(r)}
                style={{
                  padding: '6px 16px 6px 28px', fontSize: '11px', cursor: 'pointer',
                  background: selectedReport?.id === r.id ? '#0056b3' : 'transparent',
                  color: selectedReport?.id === r.id ? '#fff' : '#ced4da',
                }}
                onMouseEnter={(e) => { if (selectedReport?.id !== r.id) e.currentTarget.style.background = '#495057'; }}
                onMouseLeave={(e) => { if (selectedReport?.id !== r.id) e.currentTarget.style.background = 'transparent'; }}
              >
                {r.name}
              </div>
            ))}
          </div>
        ))}
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Filter bar */}
        <div className="erp-action-bar print-hide" style={{ flexWrap: 'wrap', gap: '6px', padding: '8px 12px' }}>
          <select className="erp-input" value={periodType} onChange={(e) => setPeriodType(e.target.value)} style={{ width: '130px' }}>
            {PERIOD_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          {periodType === 'CUSTOM' && (
            <>
              <input type="date" className="erp-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '140px' }} />
              <input type="date" className="erp-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: '140px' }} />
            </>
          )}
          <input type="text" className="erp-input" placeholder="Search..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRun()}
            style={{ width: '150px' }}
          />
          <button className="erp-button erp-button-primary" onClick={handleRun} disabled={!selectedReport || loading}>
            {loading ? 'Loading...' : 'Run'}
          </button>
          <div className="erp-tool-separator" />
          <button className="erp-button" onClick={() => handleExport('EXCEL')} disabled={!data?.length}>Excel</button>
          <button className="erp-button" onClick={() => handleExport('PDF')} disabled={!data?.length}>PDF</button>
          <button className="erp-button" onClick={handlePrint} disabled={!data?.length}>Print</button>
        </div>

        {error && <div className="erp-error-banner" style={{ margin: '8px 12px 0' }}>{error}</div>}

        {/* Report Title */}
        {selectedReport && (
          <div className="section-title print-show-block" style={{ padding: '8px 12px', margin: 0, fontSize: '14px' }}>
            {selectedReport.name}
            {periodType !== 'ALL' && <span style={{ fontSize: '11px', color: '#6c757d', marginLeft: '12px' }}>({periodType}{periodType === 'CUSTOM' ? `: ${startDate} to ${endDate}` : ''})</span>}
          </div>
        )}

        {/* Totals banner */}
        {totals && (
          <div style={{
            background: '#343a40', color: '#ffc107', padding: '8px 16px', margin: '4px 12px',
            borderRadius: '4px', display: 'flex', gap: '24px', fontSize: '12px', fontWeight: 'bold', flexWrap: 'wrap'
          }}>
            {Object.entries(totals).map(([k, v]) => (
              <span key={k}>{prettify(k)}: {formatValue(k, v)}</span>
            ))}
          </div>
        )}

        {/* Data Table */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 12px 12px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#adb5bd' }}>Loading report data...</div>
          ) : !selectedReport ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#adb5bd' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
              <p>Select a report from the sidebar to begin.</p>
            </div>
          ) : !data || data.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#adb5bd' }}>No data found. Try adjusting filters.</div>
          ) : (
            <>
              <table className="erp-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
                    <th style={{ padding: '6px 8px', fontSize: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>#</th>
                    {Object.keys(data[0]).map((col) => (
                      <th key={col} style={{ padding: '6px 8px', fontSize: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6', whiteSpace: 'nowrap' }}>
                        {prettify(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '5px 8px', fontSize: '10px', color: '#6c757d' }}>
                        {pagination ? (pagination.currentPage - 1) * pagination.pageSize + i + 1 : i + 1}
                      </td>
                      {Object.entries(row).map(([col, val]) => (
                        <td key={col} style={{ padding: '5px 8px', fontSize: '10px', whiteSpace: 'nowrap' }}>
                          {formatValue(col, val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {pagination && (
                <PaginationControls
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  limit={limit}
                  onLimitChange={handleLimitChange}
                />
              )}
            </>
          )}
        </div>
      </main>

      <style>{`
        @media print {
          .print-hide { display: none !important; }
          .print-show-block { display: block !important; }
          .erp-admin-container { height: auto !important; overflow: visible !important; }
          main { overflow: visible !important; }
        }
      `}</style>
    </div>
  );
};

export default ReportCatalog;
