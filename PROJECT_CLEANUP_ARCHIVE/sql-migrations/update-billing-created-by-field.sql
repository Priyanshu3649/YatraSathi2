-- Update the bl_created_by field in blXbilling table to support string user IDs
-- This addresses the issue where alphanumeric user IDs like 'ADM001' were causing 
-- "Incorrect integer value" errors when stored in an INTEGER field

ALTER TABLE blXbilling MODIFY COLUMN bl_created_by VARCHAR(15);

-- Also update other related user ID fields that might have similar issues
-- Check if bl_modified_by also needs updating
-- ALTER TABLE blXbilling MODIFY COLUMN bl_modified_by VARCHAR(15);