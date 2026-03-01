-- Fix billing audit fields to match the application's user ID format
-- Make entered_by nullable and add proper defaults

USE TVL_001;

-- Make entered_by nullable (same as booking table fix)
ALTER TABLE blXbilling 
MODIFY COLUMN entered_by INT NULL DEFAULT NULL;

-- Ensure other audit fields are nullable
ALTER TABLE blXbilling 
MODIFY COLUMN modified_by INT NULL DEFAULT NULL;

ALTER TABLE blXbilling 
MODIFY COLUMN closed_by INT NULL DEFAULT NULL;

-- Verify the changes
DESCRIBE blXbilling;

SELECT 'Billing audit fields updated successfully!' AS Status;
