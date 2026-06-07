/**
 * AuditHistoryButton — Drop-in "History" button for any module record.
 * Opens AuditHistoryModal showing the full forensic timeline for that record.
 *
 * Usage:
 *   <AuditHistoryButton module="Booking" recordId={booking.bk_bkid} />
 *   <AuditHistoryButton module="Billing" recordId={bill.bl_id} label="Audit Trail" />
 */

import React, { useState } from 'react';
import AuditHistoryModal from './AuditHistoryModal';
import './AuditHistoryButton.css';

const AuditHistoryButton = ({ module, recordId, label = 'History', disabled = false }) => {
  const [open, setOpen] = useState(false);

  if (!module || !recordId) return null;

  return (
    <>
      <button
        type="button"
        className="audit-history-btn"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={`View audit history for ${module} #${recordId}`}
      >
        <span className="audit-history-btn__icon">🔍</span>
        {label}
      </button>

      {open && (
        <AuditHistoryModal
          module={module}
          recordId={recordId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};

export default AuditHistoryButton;
