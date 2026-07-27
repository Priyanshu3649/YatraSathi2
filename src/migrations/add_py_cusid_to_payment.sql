-- Migration: Add py_cusid column to pyXpayment table for customer linking
-- Purpose: Link payment records to customer records for automatic customer creation on payment

-- Check if column exists before adding
ALTER TABLE pyXpayment
ADD COLUMN IF NOT EXISTS py_cusid VARCHAR(15) AFTER py_customer_phone,
ADD CONSTRAINT fk_pyXpayment_customer 
  FOREIGN KEY (py_cusid) 
  REFERENCES cuXcustomer(cu_cusid) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- Create index on py_cusid for faster lookups
CREATE INDEX IF NOT EXISTS idx_py_cusid ON pyXpayment(py_cusid);

-- Add composite index on py_customer_name and py_customer_phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_py_customer_composite 
  ON pyXpayment(py_customer_phone, py_customer_name);

-- Log the migration
SELECT 'Migration completed: Added py_cusid column to pyXpayment table' AS status;
