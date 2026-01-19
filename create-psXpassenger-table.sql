-- Create psXpassenger table as per YatraSathi specification
-- This is MANDATORY for the passenger entry loop mechanism

USE yatrasathi;

CREATE TABLE IF NOT EXISTS psXpassenger (
  ps_psid BIGINT AUTO_INCREMENT PRIMARY KEY,
  ps_bkid BIGINT NOT NULL,
  ps_fname VARCHAR(50) NOT NULL,
  ps_lname VARCHAR(50),
  ps_age INT NOT NULL,
  ps_gender VARCHAR(10) NOT NULL,
  ps_berthpref VARCHAR(15),
  ps_berthalloc VARCHAR(15),
  ps_seatno VARCHAR(10),
  ps_coach VARCHAR(10),
  ps_active TINYINT DEFAULT 1,
  edtm DATETIME NOT NULL,
  eby VARCHAR(15) NOT NULL,
  mdtm DATETIME NOT NULL,
  mby VARCHAR(15),
  KEY idx_bkid (ps_bkid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing (only if table is empty)
INSERT IGNORE INTO psXpassenger (ps_bkid, ps_fname, ps_lname, ps_age, ps_gender, ps_berthpref, ps_active, edtm, eby, mdtm, mby) VALUES
(1, 'John', 'Doe', 35, 'M', 'LB', 1, NOW(), 'system', NOW(), 'system'),
(1, 'Jane', 'Doe', 32, 'F', 'UB', 1, NOW(), 'system', NOW(), 'system'),
(2, 'Alice', 'Smith', 28, 'F', 'LB', 1, NOW(), 'system', NOW(), 'system'),
(2, 'Bob', 'Smith', 30, 'M', 'MB', 1, NOW(), 'system', NOW(), 'system'),
(2, 'Charlie', 'Smith', 5, 'M', 'LB', 1, NOW(), 'system', NOW(), 'system');