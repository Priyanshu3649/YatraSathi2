-- Create Master Passenger Table (mpXmasterpassenger)
-- Stores customer's master passenger records with 4 fields: Name, DOB, Gender, Birth Preference

CREATE TABLE IF NOT EXISTS mpXmasterpassenger (
  mp_mpid VARCHAR(20) PRIMARY KEY,
  mp_usid VARCHAR(20) NOT NULL,
  mp_name VARCHAR(100) NOT NULL,
  mp_dob DATE NOT NULL,
  mp_gender ENUM('M', 'F', 'O') NOT NULL,
  mp_birthpref VARCHAR(20),
  mp_active TINYINT DEFAULT 1,
  eby VARCHAR(20),
  mby VARCHAR(20),
  edtm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  mdtm TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (mp_usid) REFERENCES usXuser(us_usid) ON DELETE CASCADE,
  INDEX idx_mp_usid (mp_usid),
  INDEX idx_mp_active (mp_active),
  INDEX idx_mp_edtm (edtm)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add comment to table
ALTER TABLE mpXmasterpassenger COMMENT='Master Passenger records for customers - stores 4 fields: name, DOB, gender, birth preference';
