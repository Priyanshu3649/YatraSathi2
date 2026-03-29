-- Run on TVL database (same as blXbilling) if columns are missing.
-- Ignore "duplicate column" errors if already applied.

ALTER TABLE blXbilling ADD COLUMN bl_cancellation_ref VARCHAR(32) NULL COMMENT 'Cancellation voucher number';
ALTER TABLE blXbilling ADD COLUMN bl_cancel_approver_usid VARCHAR(15) NULL;
ALTER TABLE blXbilling ADD COLUMN bl_cancel_approver_name VARCHAR(150) NULL;
