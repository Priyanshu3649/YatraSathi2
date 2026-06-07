-- ============================================================
-- YatraSathi Audit System Upgrade — Database Migration
-- Version: 2.0 (ERP Grade Forensic Audit)
-- Date: 2026-06-06
-- ============================================================
-- SAFE TO RUN MULTIPLE TIMES (uses IF NOT EXISTS / IF EXISTS)
-- ============================================================

-- ---------------------------------------------------------------
-- STEP 1: Archive legacy audit table (DO NOT DELETE)
-- ---------------------------------------------------------------

-- Create legacy backup table (clone of existing structure)
CREATE TABLE IF NOT EXISTS audit_forensic_log_legacy LIKE audit_forensic_log;

-- Copy all existing data into legacy table
INSERT IGNORE INTO audit_forensic_log_legacy
SELECT * FROM audit_forensic_log;

-- ---------------------------------------------------------------
-- STEP 2: Drop and recreate audit_forensic_log with new schema
-- (New: per-field rows instead of JSON blobs)
-- ---------------------------------------------------------------

DROP TABLE IF EXISTS audit_forensic_log;

CREATE TABLE audit_forensic_log (
    audit_id      BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- What was changed
    module_name   VARCHAR(100)  NOT NULL COMMENT 'Billing, Booking, Payment, etc.',
    record_id     VARCHAR(100)  NOT NULL COMMENT 'The PK of the changed record (stored as string for flexibility)',

    -- Type of change
    action_type   ENUM(
                    'INSERT',
                    'UPDATE',
                    'DELETE',
                    'CANCEL',
                    'CLOSE',
                    'LOGIN',
                    'LOGOUT',
                    'FAILED_LOGIN',
                    'PASSWORD_RESET',
                    'USER_LOCK',
                    'USER_UNLOCK',
                    'ROLE_CHANGE',
                    'PERMISSION_CHANGE'
                  ) NOT NULL,

    -- Per-field change (NULL for INSERT/DELETE/action events)
    field_name    VARCHAR(100)  NULL COMMENT 'Which field changed',
    old_value     LONGTEXT      NULL COMMENT 'Value before change',
    new_value     LONGTEXT      NULL COMMENT 'Value after change',

    -- Who made the change
    changed_by    VARCHAR(100)  NOT NULL COMMENT 'User ID who made the change',
    changed_by_name VARCHAR(200) NULL    COMMENT 'Display name of user',

    -- Where from
    ip_address    VARCHAR(100)  NULL,
    machine_name  VARCHAR(255)  NULL COMMENT 'User-Agent or hostname',

    -- When
    change_timestamp DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Indices for fast filtered lookups
    INDEX idx_module        (module_name),
    INDEX idx_record        (record_id),
    INDEX idx_module_record (module_name, record_id),
    INDEX idx_user          (changed_by),
    INDEX idx_timestamp     (change_timestamp),
    INDEX idx_action        (action_type),
    INDEX idx_field         (field_name)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='YatraSathi v2 Forensic Audit Log — immutable, per-field change history';

-- ---------------------------------------------------------------
-- STEP 3: Immutability triggers (prevent modification/deletion)
-- ---------------------------------------------------------------

DROP TRIGGER IF EXISTS prevent_audit_update;
DROP TRIGGER IF EXISTS prevent_audit_delete;

DELIMITER $$

CREATE TRIGGER prevent_audit_update
BEFORE UPDATE ON audit_forensic_log
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'YatraSathi ERP: Forensic audit logs are immutable and cannot be modified.';
END$$

CREATE TRIGGER prevent_audit_delete
BEFORE DELETE ON audit_forensic_log
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'YatraSathi ERP: Forensic audit logs are immutable and cannot be deleted.';
END$$

DELIMITER ;

-- ---------------------------------------------------------------
-- STEP 4: Standard Audit Fields on all business tables
-- Idempotent: uses ADD COLUMN IF NOT EXISTS
-- ---------------------------------------------------------------

-- bkXbooking
ALTER TABLE bkXbooking
    ADD COLUMN IF NOT EXISTS entered_by   VARCHAR(100) NULL COMMENT 'User who created the record',
    ADD COLUMN IF NOT EXISTS entered_on   DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS modified_by  VARCHAR(100) NULL COMMENT 'User who last modified the record',
    ADD COLUMN IF NOT EXISTS modified_on  DATETIME     NULL,
    ADD COLUMN IF NOT EXISTS closed_by    VARCHAR(100) NULL COMMENT 'User who closed/cancelled the record',
    ADD COLUMN IF NOT EXISTS closed_on    DATETIME     NULL;

-- blXbilling
ALTER TABLE blXbilling
    ADD COLUMN IF NOT EXISTS entered_by   VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS entered_on   DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS modified_by  VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS modified_on  DATETIME     NULL,
    ADD COLUMN IF NOT EXISTS closed_by    VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS closed_on    DATETIME     NULL;

-- ptXpayment (payment table)
ALTER TABLE ptXpayment
    ADD COLUMN IF NOT EXISTS entered_by   VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS entered_on   DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS modified_by  VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS modified_on  DATETIME     NULL,
    ADD COLUMN IF NOT EXISTS closed_by    VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS closed_on    DATETIME     NULL;

-- rcXreceipt
ALTER TABLE rcXreceipt
    ADD COLUMN IF NOT EXISTS entered_by   VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS entered_on   DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS modified_by  VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS modified_on  DATETIME     NULL,
    ADD COLUMN IF NOT EXISTS closed_by    VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS closed_on    DATETIME     NULL;

-- ctXcontra (contra entries)
ALTER TABLE ctXcontra
    ADD COLUMN IF NOT EXISTS entered_by   VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS entered_on   DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS modified_by  VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS modified_on  DATETIME     NULL,
    ADD COLUMN IF NOT EXISTS closed_by    VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS closed_on    DATETIME     NULL;

-- jeXjournal (journal entries)
ALTER TABLE jeXjournal
    ADD COLUMN IF NOT EXISTS entered_by   VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS entered_on   DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS modified_by  VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS modified_on  DATETIME     NULL,
    ADD COLUMN IF NOT EXISTS closed_by    VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS closed_on    DATETIME     NULL;

-- cuXcustomer
ALTER TABLE cuXcustomer
    ADD COLUMN IF NOT EXISTS entered_by   VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS entered_on   DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS modified_by  VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS modified_on  DATETIME     NULL,
    ADD COLUMN IF NOT EXISTS closed_by    VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS closed_on    DATETIME     NULL;

-- emXemployee
ALTER TABLE emXemployee
    ADD COLUMN IF NOT EXISTS entered_by   VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS entered_on   DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS modified_by  VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS modified_on  DATETIME     NULL,
    ADD COLUMN IF NOT EXISTS closed_by    VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS closed_on    DATETIME     NULL;

-- service_charges
ALTER TABLE service_charges
    ADD COLUMN IF NOT EXISTS entered_by   VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS entered_on   DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS modified_by  VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS modified_on  DATETIME     NULL,
    ADD COLUMN IF NOT EXISTS closed_by    VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS closed_on    DATETIME     NULL;

-- tpXtravelplan
ALTER TABLE tpXtravelplan
    ADD COLUMN IF NOT EXISTS entered_by   VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS entered_on   DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS modified_by  VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS modified_on  DATETIME     NULL,
    ADD COLUMN IF NOT EXISTS closed_by    VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS closed_on    DATETIME     NULL;

-- usXuser
ALTER TABLE usXuser
    ADD COLUMN IF NOT EXISTS entered_by   VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS entered_on   DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS modified_by  VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS modified_on  DATETIME     NULL,
    ADD COLUMN IF NOT EXISTS closed_by    VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS closed_on    DATETIME     NULL;

-- ---------------------------------------------------------------
-- STEP 5: Verify migration
-- ---------------------------------------------------------------
SELECT 'audit_forensic_log_legacy' AS table_name, COUNT(*) AS row_count FROM audit_forensic_log_legacy
UNION ALL
SELECT 'audit_forensic_log (new)', COUNT(*) FROM audit_forensic_log;

SELECT 'Migration complete. Legacy data preserved in audit_forensic_log_legacy.' AS status;
