-- Fix bl_status ENUM to include DRAFT and FINAL values
-- This resolves the "Data truncated for column 'bl_status'" error

USE TVL_001;

-- Modify the bl_status column to include DRAFT and FINAL
ALTER TABLE blXbilling 
MODIFY COLUMN bl_status ENUM('DRAFT', 'CONFIRMED', 'CANCELLED', 'PENDING', 'PAID', 'FINAL') 
DEFAULT 'DRAFT';

-- Verify the change
SHOW COLUMNS FROM blXbilling WHERE Field = 'bl_status';
