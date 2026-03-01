-- Add bl_booking_no column to blXbilling table if it doesn't exist
ALTER TABLE blXbilling 
ADD COLUMN IF NOT EXISTS bl_booking_no VARCHAR(30) COMMENT 'Booking Number';