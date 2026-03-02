-- Add billing number field to passenger table
ALTER TABLE psXpassenger 
ADD COLUMN bl_bill_no VARCHAR(30) DEFAULT NULL COMMENT 'Billing Number associated with this passenger',
ADD INDEX idx_passenger_bill_no (bl_bill_no);

-- Update existing passengers with their booking's billing number
-- This will be done after bills are generated for existing bookings