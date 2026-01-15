-- Create cmpXmasterpassenger table in TVL_001 database
USE TVL_001;

CREATE TABLE IF NOT EXISTS `cmpXmasterpassenger` (
  `cmp_cmpid` VARCHAR(20) NOT NULL PRIMARY KEY,
  `cmp_cuid` VARCHAR(15) NOT NULL,
  `cmp_firstname` VARCHAR(50) NOT NULL,
  `cmp_lastname` VARCHAR(50) DEFAULT NULL,
  `cmp_age` INT NOT NULL,
  `cmp_gender` ENUM('M', 'F', 'O') NOT NULL,
  `cmp_berthpref` VARCHAR(20) DEFAULT NULL,
  `cmp_idtype` VARCHAR(20) DEFAULT NULL,
  `cmp_idnumber` VARCHAR(50) DEFAULT NULL,
  `cmp_aadhaar` VARCHAR(12) DEFAULT NULL,
  `cmp_active` TINYINT NOT NULL DEFAULT 1,
  `cmp_created_by` VARCHAR(20) DEFAULT NULL,
  `cmp_modified_by` VARCHAR(20) DEFAULT NULL,
  `cmp_created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cmp_modified_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_cmp_cuid` (`cmp_cuid`),
  INDEX `idx_cmp_active` (`cmp_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO `cmpXmasterpassenger` 
  (`cmp_cmpid`, `cmp_cuid`, `cmp_firstname`, `cmp_lastname`, `cmp_age`, `cmp_gender`, `cmp_berthpref`, `cmp_idtype`, `cmp_idnumber`, `cmp_aadhaar`, `cmp_active`, `cmp_created_by`, `cmp_modified_by`)
VALUES
  ('CMP001', 'CUS002', 'Rajesh', 'Kumar', 35, 'M', 'Lower', 'Aadhaar', '123456789012', '123456789012', 1, 'CUS002', 'CUS002'),
  ('CMP002', 'CUS002', 'Priya', 'Sharma', 28, 'F', 'Upper', 'PAN', 'ABCDE1234F', '234567890123', 1, 'CUS002', 'CUS002'),
  ('CMP003', 'CUS002', 'Amit', 'Patel', 42, 'M', 'Middle', 'Passport', 'P1234567', '345678901234', 1, 'CUS002', 'CUS002')
ON DUPLICATE KEY UPDATE `cmp_modified_at` = CURRENT_TIMESTAMP;
