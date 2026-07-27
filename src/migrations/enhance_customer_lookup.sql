-- Migration: Enhance customer lookup indexes for name+phone combination matching
-- Purpose: Improve performance of customer lookups by name and phone

-- Create composite index on usXuser for phone-based lookups
CREATE INDEX IF NOT EXISTS idx_us_phone 
  ON usXuser(us_phone);

CREATE INDEX IF NOT EXISTS idx_us_name_composite 
  ON usXuser(us_fname, us_lname, us_phone);

-- Create index on cuXcustomer user ID lookup
CREATE INDEX IF NOT EXISTS idx_cu_usid 
  ON cuXcustomer(cu_usid);

-- Create unique index on customer number for faster lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_cu_custno 
  ON cuXcustomer(cu_custno);

-- Log the migration
SELECT 'Migration completed: Enhanced customer lookup indexes' AS status;
