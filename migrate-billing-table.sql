-- Migration script to update billXbill table with new field structure
-- Run this against the TVL_001 database

USE TVL_001;

-- Add new columns to billXbill table
ALTER TABLE billXbill 
ADD COLUMN booking_number VARCHAR(50) NULL COMMENT 'Booking Number' AFTER bill_no,
ADD COLUMN phone_no VARCHAR(20) NULL COMMENT 'Phone Number' AFTER customer_name,
ADD COLUMN station_boy_name VARCHAR(100) NULL COMMENT 'Station Boy Name' AFTER phone_no,
ADD COLUMN pnr_number VARCHAR(20) NULL COMMENT 'PNR Number' AFTER train_number,
ADD COLUMN berth_detail VARCHAR(50) NULL COMMENT 'Berth Detail' AFTER pnr_number;

-- Rename existing columns to match new structure
ALTER TABLE billXbill 
CHANGE COLUMN net_fare net_journey_fare DECIMAL(15,2) DEFAULT 0 COMMENT 'Net Journey Fare',
CHANGE COLUMN service_charges service_charge DECIMAL(15,2) DEFAULT 0 COMMENT 'Service Charge';

-- Add new charge columns
ALTER TABLE billXbill 
ADD COLUMN station_boy_charge DECIMAL(15,2) DEFAULT 0 COMMENT 'Station Boy Charge' AFTER service_charge,
ADD COLUMN gst DECIMAL(15,2) DEFAULT 0 COMMENT 'GST Amount' AFTER platform_fees,
ADD COLUMN misc_charges DECIMAL(15,2) DEFAULT 0 COMMENT 'Miscellaneous Charges' AFTER gst,
ADD COLUMN delivery_charge DECIMAL(15,2) DEFAULT 0 COMMENT 'Delivery Charge' AFTER misc_charges,
ADD COLUMN cancellation_charges DECIMAL(15,2) DEFAULT 0 COMMENT 'Cancellation Charges' AFTER delivery_charge,
ADD COLUMN gst_on_cancellation DECIMAL(15,2) DEFAULT 0 COMMENT 'GST on Cancellation' AFTER cancellation_charges,
ADD COLUMN sur_charge DECIMAL(15,2) DEFAULT 0 COMMENT 'Sur Charge' AFTER gst_on_cancellation,
ADD COLUMN gst_type VARCHAR(20) DEFAULT 'CGST+SGST' COMMENT 'GST Type (CGST+SGST, IGST)' AFTER sur_charge,
ADD COLUMN rounded_off_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Rounded Off Amount' AFTER gst_type;

-- Remove old columns that are no longer needed
ALTER TABLE billXbill 
DROP COLUMN IF EXISTS reservation_class,
DROP COLUMN IF EXISTS ticket_type,
DROP COLUMN IF EXISTS pnr_numbers,
DROP COLUMN IF EXISTS agent_fees,
DROP COLUMN IF EXISTS extra_charges,
DROP COLUMN IF EXISTS discounts;

-- Show the updated table structure
DESCRIBE billXbill;

-- Insert some sample data for testing
INSERT INTO billXbill (
    bill_no, booking_number, customer_id, customer_name, phone_no, 
    station_boy_name, train_number, pnr_number, berth_detail,
    net_journey_fare, station_boy_charge, service_charge, platform_fees,
    gst, misc_charges, delivery_charge, cancellation_charges,
    gst_on_cancellation, sur_charge, gst_type, rounded_off_amount,
    total_amount, bill_date, status, created_by, modified_by
) VALUES (
    'BILL001', 'BK001', 'CUS001', 'Test Customer', '9876543210',
    'Station Boy 1', '12345', 'PNR123456', 'S1-25 (LB)',
    1500.00, 50.00, 100.00, 20.00,
    82.50, 25.00, 30.00, 0.00,
    0.00, 15.00, 'CGST+SGST', 0.50,
    1823.00, CURDATE(), 'DRAFT', 'ADMIN01', 'ADMIN01'
);

SELECT 'Migration completed successfully!' as status;