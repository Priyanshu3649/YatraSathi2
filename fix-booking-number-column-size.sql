-- Fix booking number column size to accommodate longer booking numbers
-- Run this script to update the bk_bkno column from VARCHAR(20) to VARCHAR(30)

USE TVL_001;

-- Alter the bk_bkno column to increase size
ALTER TABLE bkXbooking 
MODIFY COLUMN bk_bkno VARCHAR(30) NOT NULL UNIQUE 
COMMENT 'Booking Number';

-- Verify the change
SHOW COLUMNS FROM bkXbooking LIKE 'bk_bkno';

-- Display success message
SELECT 'Booking number column size updated successfully!' AS Status;
