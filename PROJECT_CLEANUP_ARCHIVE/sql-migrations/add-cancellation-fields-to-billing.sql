-- Add cancellation-related fields to blXbilling table
ALTER TABLE blXbilling 
ADD COLUMN IF NOT EXISTS bl_railway_cancellation_charge DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Railway Cancellation Charge',
ADD COLUMN IF NOT EXISTS bl_agent_cancellation_charge DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Agent Cancellation Charge',
ADD COLUMN IF NOT EXISTS bl_cancellation_remarks TEXT COMMENT 'Cancellation Remarks';

-- Update the modified_at and modified_by fields if they don't exist
ALTER TABLE blXbilling 
ADD COLUMN IF NOT EXISTS bl_modified_at TIMESTAMP NULL COMMENT 'Modified At',
ADD COLUMN IF NOT EXISTS bl_modified_by VARCHAR(20) NULL COMMENT 'Modified By User ID';

-- Show the updated table structure
DESCRIBE blXbilling;
