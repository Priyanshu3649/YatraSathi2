-- Fix booking audit fields to match the application's user ID format
-- The application uses string user IDs (us_usid), but the database expects integers

USE TVL_001;

-- Option 1: Make entered_by nullable with default (recommended for backward compatibility)
ALTER TABLE bkXbooking 
MODIFY COLUMN entered_by INT NULL DEFAULT NULL;

ALTER TABLE bkXbooking 
MODIFY COLUMN modified_by INT NULL DEFAULT NULL;

ALTER TABLE bkXbooking 
MODIFY COLUMN closed_by INT NULL DEFAULT NULL;

-- Verify the changes
DESCRIBE bkXbooking;

SELECT 'Booking audit fields updated successfully!' AS Status;
