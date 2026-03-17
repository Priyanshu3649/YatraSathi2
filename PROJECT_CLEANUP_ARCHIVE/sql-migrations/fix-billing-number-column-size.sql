-- Fix billing number column sizes to accommodate longer billing numbers

USE TVL_001;

-- Increase bl_entry_no column size
ALTER TABLE blXbilling 
MODIFY COLUMN bl_entry_no VARCHAR(30) NOT NULL;

-- Verify the changes
DESCRIBE blXbilling;

SELECT 'Billing number columns updated successfully!' AS Status;
