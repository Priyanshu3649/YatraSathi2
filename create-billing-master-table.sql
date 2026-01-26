-- BOOKING → BILLING INTEGRATION - BILLING MASTER TABLE
-- This table stores all billing records generated from confirmed bookings

CREATE TABLE billing_master (
   bl_id INT AUTO_INCREMENT PRIMARY KEY,
   bl_entry_no VARCHAR(20) NOT NULL UNIQUE,
   bl_bill_no VARCHAR(30),
   bl_sub_bill_no VARCHAR(30),
   
   -- Booking Reference (MANDATORY)
   bl_booking_id INT NOT NULL,
   bl_booking_no VARCHAR(30) NOT NULL,
   
   -- Dates
   bl_billing_date DATE NOT NULL,
   bl_journey_date DATE NOT NULL,
   
   -- Customer Information
   bl_customer_name VARCHAR(150) NOT NULL,
   bl_customer_phone VARCHAR(15) NOT NULL,
   
   -- Station Boy (NEW FIELD)
   bl_station_boy VARCHAR(100),
   
   -- Journey Details
   bl_from_station VARCHAR(50),
   bl_to_station VARCHAR(50),
   bl_train_no VARCHAR(10),
   bl_class VARCHAR(10),
   bl_pnr VARCHAR(15),
   bl_seats_reserved VARCHAR(50),
   
   -- Financial Fields (All default to 0)
   bl_railway_fare DECIMAL(10,2) DEFAULT 0,
   bl_station_boy_incentive DECIMAL(10,2) DEFAULT 0,
   bl_gst DECIMAL(10,2) DEFAULT 0,
   bl_misc_charges DECIMAL(10,2) DEFAULT 0,
   bl_platform_fee DECIMAL(10,2) DEFAULT 0,
   bl_service_charge DECIMAL(10,2) DEFAULT 0,
   bl_delivery_charge DECIMAL(10,2) DEFAULT 0,
   bl_cancellation_charge DECIMAL(10,2) DEFAULT 0,
   bl_surcharge DECIMAL(10,2) DEFAULT 0,
   bl_discount DECIMAL(10,2) DEFAULT 0,
   
   -- GST Configuration
   bl_gst_type ENUM('INCLUSIVE','EXCLUSIVE') DEFAULT 'EXCLUSIVE',
   
   -- Total Amount (AUTO-CALCULATED)
   bl_total_amount DECIMAL(12,2) NOT NULL,
   
   -- Split Bill Support
   bl_is_split BOOLEAN DEFAULT FALSE,
   bl_parent_bill_id INT NULL,
   
   -- Audit Fields
   bl_created_by INT,
   bl_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   bl_modified_by INT,
   bl_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   
   -- Foreign Key Constraints
   FOREIGN KEY (bl_booking_id) REFERENCES bookingstvl(bk_bkid) ON DELETE RESTRICT,
   FOREIGN KEY (bl_parent_bill_id) REFERENCES billing_master(bl_id) ON DELETE CASCADE,
   
   -- Indexes for Performance
   INDEX idx_booking_id (bl_booking_id),
   INDEX idx_billing_date (bl_billing_date),
   INDEX idx_customer_phone (bl_customer_phone),
   INDEX idx_parent_bill (bl_parent_bill_id),
   
   -- Business Rules Constraints
   CONSTRAINT chk_no_duplicate_billing UNIQUE (bl_booking_id),
   CONSTRAINT chk_positive_amounts CHECK (
       bl_railway_fare >= 0 AND
       bl_station_boy_incentive >= 0 AND
       bl_gst >= 0 AND
       bl_misc_charges >= 0 AND
       bl_platform_fee >= 0 AND
       bl_service_charge >= 0 AND
       bl_delivery_charge >= 0 AND
       bl_cancellation_charge >= 0 AND
       bl_surcharge >= 0 AND
       bl_discount >= 0
   )
);

-- Create sequence for Entry Number generation
CREATE TABLE billing_sequence (
    seq_year INT NOT NULL,
    seq_number INT NOT NULL DEFAULT 0,
    PRIMARY KEY (seq_year)
);

-- Insert current year sequence
INSERT INTO billing_sequence (seq_year, seq_number) VALUES (YEAR(CURDATE()), 0);