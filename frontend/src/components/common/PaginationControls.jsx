import React, { useEffect, useState } from 'react';

/**
 * PaginationControls — grey sticky footer bar for ERP record tables.
 * Shows: record counter | page buttons (with ellipsis) | First/Prev/Next/Last | rows-per-page select
 */
const PaginationControls = ({
  pagination,
  onPageChange,
  limit = 50,
  onLimitChange,
  // fallback props for callers that pass individual values
  currentPage: propCurrentPage,
  totalPages: propTotalPages,
  totalRecords: propTotalRecords,
  onPrev,
  onNext,
  hasNextPage: propHasNextPage,
  hasPrevPage: propHasPrevPage,
  // allow caller to pass live record count when server pagination is unavailable
  recordCount,
}) => {
  const [hovered, setHovered] = useState(null);

  // ── normalise props ──────────────────────────────────────────────────────────
  const currentPage  = pagination?.currentPage  ?? propCurrentPage  ?? 1;
  const totalRecords = pagination?.totalRecords  ?? propTotalRecords ?? recordCount ?? 0;
  const totalPages   = pagination?.totalPages    ?? propTotalPages   ??
                       (totalRecords > 0 ? Math.max(1, Math.ceil(totalRecords / limit)) : 1);
  const hasNextPage  = pagination?.hasNextPage   ?? propHasNextPage  ?? currentPage < totalPages;
  const hasPrevPage  = pagination?.hasPrevPage   ?? propHasPrevPage  ?? currentPage > 1;

  // ── derived display values ───────────────────────────────────────────────────
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endRecord   = Math.min(currentPage * limit, totalRecords);

  // ── page-change handler ──────────────────────────────────────────────────────
  const go = (newPage) => {
    if (newPage === currentPage || newPage < 1 || newPage > totalPages) return;
    if (onPageChange) onPageChange(newPage);
    else if (newPage === currentPage - 1 && onPrev) onPrev();
    else if (newPage === currentPage + 1 && onNext) onNext();
  };

  // ── keyboard navigation ──────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      if (e.key === 'ArrowRight' && hasNextPage) go(currentPage + 1);
      else if (e.key === 'ArrowLeft' && hasPrevPage) go(currentPage - 1);
      else if (e.key === 'Home') go(1);
      else if (e.key === 'End')  go(totalPages);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentPage, totalPages, hasNextPage, hasPrevPage]); // eslint-disable-line

  // ── styles ───────────────────────────────────────────────────────────────────
  const S = {
    nav: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '5px 12px',
      backgroundColor: '#6c757d',
      color: '#fff',
      borderTop: '2px solid #495057',
      fontSize: '11px',
      fontFamily: 'Segoe UI, Tahoma, sans-serif',
      userSelect: 'none',
      flexWrap: 'wrap',
      gap: '6px',
    },
    info: {
      fontWeight: 500,
      whiteSpace: 'nowrap',
      color: '#e9ecef',
    },
    controls: {
      display: 'flex',
      alignItems: 'center',
      gap: '3px',
      flexWrap: 'wrap',
    },
    btn: (active, disabled, isHovered) => ({
      background: disabled
        ? 'transparent'
        : active
          ? '#0d6efd'
          : isHovered
            ? 'linear-gradient(180deg,#adb5bd 0%,#868e96 100%)'
            : 'linear-gradient(180deg,#868e96 0%,#6c757d 100%)',
      border: `1px solid ${disabled ? '#6c757d' : active ? '#0a58ca' : '#495057'}`,
      color: disabled ? '#adb5bd' : '#fff',
      padding: '2px 9px',
      minWidth: '28px',
      minHeight: '22px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '11px',
      fontWeight: active ? 'bold' : 'normal',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.45 : 1,
      borderRadius: '2px',
      transition: 'background 0.15s',
      outline: 'none',
    }),
    ellipsis: {
      padding: '0 3px',
      color: '#ced4da',
      fontSize: '11px',
      lineHeight: '22px',
    },
    select: {
      backgroundColor: '#495057',
      color: '#fff',
      border: '1px solid #343a40',
      fontSize: '11px',
      padding: '1px 4px',
      borderRadius: '2px',
      cursor: 'pointer',
    },
  };

  // ── page-button list with ellipsis ───────────────────────────────────────────
  const renderPages = () => {
    const MAX = 7; // max visible page buttons (excluding ellipsis)
    const buttons = [];

    let start = Math.max(1, currentPage - Math.floor(MAX / 2));
    let end   = Math.min(totalPages, start + MAX - 1);
    if (end - start + 1 < MAX) start = Math.max(1, end - MAX + 1);

    // leading page + ellipsis
    if (start > 1) {
      const k = 'p1';
      buttons.push(
        <button key={1} style={S.btn(currentPage === 1, false, hovered === k)}
          onMouseEnter={() => setHovered(k)} onMouseLeave={() => setHovered(null)}
          onClick={() => go(1)} aria-label="Page 1">1</button>
      );
      if (start > 2) buttons.push(<span key="e1" style={S.ellipsis} aria-hidden="true">…</span>);
    }

    // middle pages
    for (let i = start; i <= end; i++) {
      const k = `p${i}`;
      buttons.push(
        <button key={i} style={S.btn(currentPage === i, false, hovered === k)}
          onMouseEnter={() => setHovered(k)} onMouseLeave={() => setHovered(null)}
          onClick={() => go(i)}
          aria-label={`Page ${i}`}
          aria-current={currentPage === i ? 'page' : undefined}>
          {i}
        </button>
      );
    }

    // trailing ellipsis + last page
    if (end < totalPages) {
      if (end < totalPages - 1) buttons.push(<span key="e2" style={S.ellipsis} aria-hidden="true">…</span>);
      const k = `p${totalPages}`;
      buttons.push(
        <button key={totalPages} style={S.btn(currentPage === totalPages, false, hovered === k)}
          onMouseEnter={() => setHovered(k)} onMouseLeave={() => setHovered(null)}
          onClick={() => go(totalPages)} aria-label={`Page ${totalPages}`}>
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <nav style={S.nav} aria-label="Pagination Navigation" role="navigation">
      {/* Record counter */}
      <div style={S.info} aria-live="polite">
        {totalRecords === 0
          ? 'No records'
          : <>Showing <strong style={{ color: '#ffc107' }}>{startRecord}–{endRecord}</strong> of{' '}
              <strong style={{ color: '#ffc107' }}>{totalRecords.toLocaleString()}</strong> records</>
        }
      </div>

      {/* Navigation controls */}
      <div style={S.controls} role="group" aria-label="Page navigation">
        {/* First */}
        <button style={S.btn(false, currentPage === 1, hovered === 'first')}
          onMouseEnter={() => setHovered('first')} onMouseLeave={() => setHovered(null)}
          disabled={currentPage === 1} onClick={() => go(1)}
          aria-label="First page" title="First page (Home)">
          ◀◀
        </button>

        {/* Prev */}
        <button style={S.btn(false, !hasPrevPage, hovered === 'prev')}
          onMouseEnter={() => setHovered('prev')} onMouseLeave={() => setHovered(null)}
          disabled={!hasPrevPage} onClick={() => go(currentPage - 1)}
          aria-label="Previous page" title="Previous page (←)">
          ◀
        </button>

        {/* Numbered pages */}
        {totalPages > 0 && (
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            {renderPages()}
          </div>
        )}

        {/* Next */}
        <button style={S.btn(false, !hasNextPage, hovered === 'next')}
          onMouseEnter={() => setHovered('next')} onMouseLeave={() => setHovered(null)}
          disabled={!hasNextPage} onClick={() => go(currentPage + 1)}
          aria-label="Next page" title="Next page (→)">
          ▶
        </button>

        {/* Last */}
        <button style={S.btn(false, currentPage === totalPages, hovered === 'last')}
          onMouseEnter={() => setHovered('last')} onMouseLeave={() => setHovered(null)}
          disabled={currentPage === totalPages} onClick={() => go(totalPages)}
          aria-label="Last page" title="Last page (End)">
          ▶▶
        </button>

        {/* Rows-per-page */}
        {onLimitChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '10px' }}>
            <span style={{ color: '#ced4da', fontSize: '11px' }}>Rows:</span>
            <select value={limit} onChange={(e) => onLimitChange(Number(e.target.value))}
              style={S.select} aria-label="Records per page">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>
    </nav>
  );
};

export default PaginationControls;
