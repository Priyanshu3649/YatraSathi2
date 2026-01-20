-- Fix audit fields to have proper default values
USE TVL_001;

-- Add default values for audit fields in booking table
ALTER TABLE bkXbooking 
MODIFY COLUMN edtm DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP 
COMMENT 'Entered Date Time';

ALTER TABLE bkXbooking 
MODIFY COLUMN mdtm DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
COMMENT 'Modified Date Time';

-- Verify the changes
DESCRIBE bkXbooking;

SELECT 'Audit fields default values fixed successfully' as status;