-- Migration: Add phone number and customer name fields to booking table
-- MANDATORY: Phone-based customer identification system

USE TVL_001;

-- Add phone number field to booking table
ALTER TABLE bkXbooking 
ADD COLUMN bk_phonenumber VARCHAR(15) NULL 
COMMENT 'Customer Phone Number (10-15 digits)';

-- Add customer name field to booking table for quick access
ALTER TABLE bkXbooking 
ADD COLUMN bk_customername VARCHAR(100) NULL 
COMMENT 'Customer Name (for quick access)';

-- Create index on phone number for fast lookups
CREATE INDEX idx_bkXbooking_phonenumber ON bkXbooking(bk_phonenumber);

-- Create index on customer name for filtering
CREATE INDEX idx_bkXbooking_customername ON bkXbooking(bk_customername);

-- Update existing records to populate phone numbers from user table
UPDATE bkXbooking b
JOIN cuXcustomer c ON b.bk_usid = c.cu_usid
JOIN usXuser u ON c.cu_usid = u.us_usid
SET b.bk_phonenumber = u.us_phone,
    b.bk_customername = CONCAT(IFNULL(u.us_fname, ''), ' ', IFNULL(u.us_lname, ''))
WHERE b.bk_phonenumber IS NULL;

-- Clean up customer names (remove extra spaces)
UPDATE bkXbooking 
SET bk_customername = TRIM(REPLACE(bk_customername, '  ', ' '))
WHERE bk_customername IS NOT NULL;

-- Add constraint to ensure phone number format (10-15 digits)
ALTER TABLE bkXbooking 
ADD CONSTRAINT chk_bk_phonenumber_format 
CHECK (bk_phonenumber IS NULL OR (bk_phonenumber REGEXP '^[0-9]{10,15}$'));

-- Add constraint to ensure customer name is not empty if provided
ALTER TABLE bkXbooking 
ADD CONSTRAINT chk_bk_customername_not_empty 
CHECK (bk_customername IS NULL OR LENGTH(TRIM(bk_customername)) > 0);

-- Migration completed successfully
SELECT 'Phone-based customer identification fields added to booking table' as migration_status;