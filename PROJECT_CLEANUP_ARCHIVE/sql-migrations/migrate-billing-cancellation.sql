-- ============================================================================
-- BILLING CANCELLATION MODULE - COMPREHENSIVE DATABASE MIGRATION
-- ============================================================================
-- This script adds all required fields for the production-level billing 
-- cancellation feature with accounting integration, payment tracking, and
-- full audit traceability.
-- ============================================================================

USE TVL_001;

-- Step 1: Add comprehensive cancellation fields to blXbilling table
-- MySQL doesn't support IF NOT EXISTS for ADD COLUMN, so we use a procedure
DROP PROCEDURE IF EXISTS add_cancellation_columns;

DELIMITER $$
CREATE PROCEDURE add_cancellation_columns()
BEGIN
    -- Check and add is_cancelled column
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS 
                   WHERE TABLE_SCHEMA = 'TVL_001' AND TABLE_NAME = 'blXbilling' 
                   AND COLUMN_NAME = 'is_cancelled') THEN
        ALTER TABLE blXbilling ADD COLUMN is_cancelled TINYINT(1) DEFAULT 0 COMMENT 'Flag indicating if bill is cancelled' AFTER bl_status;
    END IF;
    
    -- Check and add cancelled_on column
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS 
                   WHERE TABLE_SCHEMA = 'TVL_001' AND TABLE_NAME = 'blXbilling' 
                   AND COLUMN_NAME = 'cancelled_on') THEN
        ALTER TABLE blXbilling ADD COLUMN cancelled_on DATETIME NULL COMMENT 'Timestamp when bill was cancelled' AFTER is_cancelled;
    END IF;
    
    -- Check and add cancelled_by column
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS 
                   WHERE TABLE_SCHEMA = 'TVL_001' AND TABLE_NAME = 'blXbilling' 
                   AND COLUMN_NAME = 'cancelled_by') THEN
        ALTER TABLE blXbilling ADD COLUMN cancelled_by VARCHAR(15) NULL COMMENT 'User ID who cancelled the bill' AFTER cancelled_on;
    END IF;
    
    -- Check and add cancellation_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS 
                   WHERE TABLE_SCHEMA = 'TVL_001' AND TABLE_NAME = 'blXbilling' 
                   AND COLUMN_NAME = 'cancellation_date') THEN
        ALTER TABLE blXbilling ADD COLUMN cancellation_date DATE NULL COMMENT 'Effective date of cancellation' AFTER cancelled_by;
    END IF;
    
    -- Check and add total_cancel_charges column
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS 
                   WHERE TABLE_SCHEMA = 'TVL_001' AND TABLE_NAME = 'blXbilling' 
                   AND COLUMN_NAME = 'total_cancel_charges') THEN
        ALTER TABLE blXbilling ADD COLUMN total_cancel_charges DECIMAL(10,2) DEFAULT 0 COMMENT 'Total cancellation charges (railway + agent)' AFTER cancellation_date;
    END IF;
    
    -- Check and add refund_amount column
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS 
                   WHERE TABLE_SCHEMA = 'TVL_001' AND TABLE_NAME = 'blXbilling' 
                   AND COLUMN_NAME = 'refund_amount') THEN
        ALTER TABLE blXbilling ADD COLUMN refund_amount DECIMAL(10,2) DEFAULT 0 COMMENT 'Refund amount after cancellation' AFTER total_cancel_charges;
    END IF;
    
    -- Check and add payment_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS 
                   WHERE TABLE_SCHEMA = 'TVL_001' AND TABLE_NAME = 'blXbilling' 
                   AND COLUMN_NAME = 'payment_status') THEN
        ALTER TABLE blXbilling ADD COLUMN payment_status ENUM('UNPAID', 'PARTIALLY_PAID', 'FULLY_PAID', 'REFUND_DUE') DEFAULT 'UNPAID' COMMENT 'Payment status for cancelled bill' AFTER refund_amount;
    END IF;
END$$
DELIMITER ;

CALL add_cancellation_columns();
DROP PROCEDURE IF EXISTS add_cancellation_columns;

-- Step 2: Modify cancelled_by column type if needed and add foreign key constraint
-- First check if cancelled_by column exists and its type
SET @col_type = (
    SELECT COLUMN_TYPE 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'TVL_001' 
    AND TABLE_NAME = 'blXbilling' 
    AND COLUMN_NAME = 'cancelled_by'
);

-- If column exists as INT, modify it to VARCHAR(15)
SET @sql = IF(@col_type = 'int',
    'ALTER TABLE blXbilling MODIFY COLUMN cancelled_by VARCHAR(15) NULL COMMENT ''User ID who cancelled the bill''',
    'SELECT "Column cancelled_by is already correct type or does not exist" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Now add foreign key constraint if it doesn't exist
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = 'TVL_001' 
    AND CONSTRAINT_NAME = 'fk_blXbilling_cancelled_by'
    AND TABLE_NAME = 'blXbilling'
);

SET @sql = IF(@constraint_exists = 0,
    'ALTER TABLE blXbilling ADD CONSTRAINT fk_blXbilling_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES usXuser(us_usid) ON DELETE SET NULL',
    'SELECT "Foreign key constraint fk_blXbilling_cancelled_by already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3: Add performance indexes for cancellation queries
-- Check and create index: idx_bl_is_cancelled
SET @index_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = 'TVL_001' 
    AND TABLE_NAME = 'blXbilling' 
    AND INDEX_NAME = 'idx_bl_is_cancelled'
);

SET @sql = IF(@index_exists = 0,
    'CREATE INDEX idx_bl_is_cancelled ON blXbilling(is_cancelled)',
    'SELECT "Index idx_bl_is_cancelled already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and create index: idx_bl_cancelled_on
SET @index_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = 'TVL_001' 
    AND TABLE_NAME = 'blXbilling' 
    AND INDEX_NAME = 'idx_bl_cancelled_on'
);

SET @sql = IF(@index_exists = 0,
    'CREATE INDEX idx_bl_cancelled_on ON blXbilling(cancelled_on)',
    'SELECT "Index idx_bl_cancelled_on already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and create index: idx_bl_cancelled_by
SET @index_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = 'TVL_001' 
    AND TABLE_NAME = 'blXbilling' 
    AND INDEX_NAME = 'idx_bl_cancelled_by'
);

SET @sql = IF(@index_exists = 0,
    'CREATE INDEX idx_bl_cancelled_by ON blXbilling(cancelled_by)',
    'SELECT "Index idx_bl_cancelled_by already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and create index: idx_bl_payment_status
SET @index_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = 'TVL_001' 
    AND TABLE_NAME = 'blXbilling' 
    AND INDEX_NAME = 'idx_bl_payment_status'
);

SET @sql = IF(@index_exists = 0,
    'CREATE INDEX idx_bl_payment_status ON blXbilling(payment_status)',
    'SELECT "Index idx_bl_payment_status already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Update existing cancelled records with new fields
UPDATE blXbilling 
SET 
    is_cancelled = CASE WHEN bl_status = 'CANCELLED' THEN 1 ELSE 0 END,
    cancelled_on = COALESCE(bl_modified_at, modified_on, NOW()),
    cancelled_by = COALESCE(modified_by, bl_created_by),
    total_cancel_charges = COALESCE(bl_railway_cancellation_charge, 0) + COALESCE(bl_agent_cancellation_charge, 0),
    refund_amount = 0,
    payment_status = 'UNPAID',
    cancellation_date = DATE(COALESCE(bl_modified_at, modified_on, NOW()))
WHERE bl_status = 'CANCELLED';

-- Step 5: Verify the changes
SELECT 'Migration completed successfully!' AS status;

-- Display updated table structure
DESCRIBE blXbilling;

-- Show cancellation-related fields specifically
SELECT 
    COLUMN_NAME, 
    COLUMN_TYPE, 
    COLUMN_DEFAULT, 
    IS_NULLABLE, 
    COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'TVL_001'
AND TABLE_NAME = 'blXbilling'
AND COLUMN_NAME IN (
    'is_cancelled',
    'cancelled_on',
    'cancelled_by',
    'cancellation_date',
    'total_cancel_charges',
    'refund_amount',
    'payment_status'
)
ORDER BY ORDINAL_POSITION;

-- Show indexes on blXbilling table
SHOW INDEX FROM blXbilling;

-- Count of cancelled bills
SELECT 
    COUNT(*) AS total_bills,
    SUM(CASE WHEN is_cancelled = 1 OR bl_status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_bills,
    SUM(CASE WHEN bl_status != 'CANCELLED' AND (is_cancelled IS NULL OR is_cancelled = 0) THEN 1 ELSE 0 END) AS active_bills
FROM blXbilling;
