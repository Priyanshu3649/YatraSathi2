
-- Add missing columns to cmpXmasterpassenger table
USE TVL_001;

ALTER TABLE `cmpXmasterpassenger` 
ADD COLUMN IF NOT EXISTS `cmp_dob` DATE DEFAULT NULL AFTER `cmp_age`,
ADD COLUMN IF NOT EXISTS `cmp_nationality` VARCHAR(50) DEFAULT NULL AFTER `cmp_dob`,
ADD COLUMN IF NOT EXISTS `cmp_phone` VARCHAR(20) DEFAULT NULL AFTER `cmp_nationality`,
ADD COLUMN IF NOT EXISTS `cmp_email` VARCHAR(100) DEFAULT NULL AFTER `cmp_phone`,
ADD COLUMN IF NOT EXISTS `cmp_last_booking_ref` VARCHAR(50) DEFAULT NULL AFTER `cmp_email`;
