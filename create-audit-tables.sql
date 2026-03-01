-- Create Forensic Audit Log Table
-- Immutable audit trail for all business transactions

CREATE TABLE IF NOT EXISTS audit_forensic_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_name VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    action_type ENUM('CREATE', 'UPDATE', 'CLOSE', 'CANCEL', 'DELETE') NOT NULL,
    changed_fields JSON,
    old_values JSON,
    new_values JSON,
    performed_by INT NOT NULL,
    performed_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    branch_id INT,
    transaction_id VARCHAR(50),
    
    INDEX idx_entity_lookup (entity_name, entity_id),
    INDEX idx_performed_on (performed_on),
    INDEX idx_performed_by (performed_by),
    INDEX idx_action_type (action_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add audit fields to existing tables
-- Booking table
ALTER TABLE bkXbooking 
    ADD COLUMN IF NOT EXISTS entered_by INT NOT NULL,
    ADD COLUMN IF NOT EXISTS entered_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS modified_by INT,
    ADD COLUMN IF NOT EXISTS modified_on TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS closed_by INT,
    ADD COLUMN IF NOT EXISTS closed_on TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS status ENUM('OPEN', 'CLOSED', 'CANCELLED') DEFAULT 'OPEN';

-- Billing table
ALTER TABLE blXbilling 
    ADD COLUMN IF NOT EXISTS entered_by INT NOT NULL,
    ADD COLUMN IF NOT EXISTS entered_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS modified_by INT,
    ADD COLUMN IF NOT EXISTS modified_on TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS closed_by INT,
    ADD COLUMN IF NOT EXISTS closed_on TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS status ENUM('OPEN', 'CLOSED', 'CANCELLED') DEFAULT 'OPEN';

-- Payment table
ALTER TABLE pyXpayment 
    ADD COLUMN IF NOT EXISTS entered_by INT NOT NULL,
    ADD COLUMN IF NOT EXISTS entered_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS modified_by INT,
    ADD COLUMN IF NOT EXISTS modified_on TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS closed_by INT,
    ADD COLUMN IF NOT EXISTS closed_on TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS status ENUM('OPEN', 'CLOSED', 'CANCELLED') DEFAULT 'OPEN';

-- Receipt table
ALTER TABLE rcXreceipt 
    ADD COLUMN IF NOT EXISTS entered_by INT NOT NULL,
    ADD COLUMN IF NOT EXISTS entered_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS modified_by INT,
    ADD COLUMN IF NOT EXISTS modified_on TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS closed_by INT,
    ADD COLUMN IF NOT EXISTS closed_on TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS status ENUM('OPEN', 'CLOSED', 'CANCELLED') DEFAULT 'OPEN';

-- Customer table
ALTER TABLE cuXcustomer 
    ADD COLUMN IF NOT EXISTS entered_by INT NOT NULL,
    ADD COLUMN IF NOT EXISTS entered_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS modified_by INT,
    ADD COLUMN IF NOT EXISTS modified_on TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS closed_by INT,
    ADD COLUMN IF NOT EXISTS closed_on TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS status ENUM('OPEN', 'CLOSED', 'CANCELLED') DEFAULT 'OPEN';

-- Add foreign key constraints for audit fields
ALTER TABLE bkXbooking 
    ADD CONSTRAINT fk_booking_entered_by FOREIGN KEY (entered_by) REFERENCES usXuser(us_usid) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_booking_modified_by FOREIGN KEY (modified_by) REFERENCES usXuser(us_usid) ON DELETE SET NULL,
    ADD CONSTRAINT fk_booking_closed_by FOREIGN KEY (closed_by) REFERENCES usXuser(us_usid) ON DELETE SET NULL;

ALTER TABLE blXbilling 
    ADD CONSTRAINT fk_billing_entered_by FOREIGN KEY (entered_by) REFERENCES usXuser(us_usid) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_billing_modified_by FOREIGN KEY (modified_by) REFERENCES usXuser(us_usid) ON DELETE SET NULL,
    ADD CONSTRAINT fk_billing_closed_by FOREIGN KEY (closed_by) REFERENCES usXuser(us_usid) ON DELETE SET NULL;

ALTER TABLE pyXpayment 
    ADD CONSTRAINT fk_payment_entered_by FOREIGN KEY (entered_by) REFERENCES usXuser(us_usid) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_payment_modified_by FOREIGN KEY (modified_by) REFERENCES usXuser(us_usid) ON DELETE SET NULL,
    ADD CONSTRAINT fk_payment_closed_by FOREIGN KEY (closed_by) REFERENCES usXuser(us_usid) ON DELETE SET NULL;

-- Create database-level security for forensic audit table
-- Prevent application user from modifying audit logs
DELIMITER $$

CREATE TRIGGER prevent_audit_update 
BEFORE UPDATE ON audit_forensic_log
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Forensic audit logs cannot be modified';
END$$

CREATE TRIGGER prevent_audit_delete 
BEFORE DELETE ON audit_forensic_log
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Forensic audit logs cannot be deleted';
END$$

DELIMITER ;

-- Grant minimal permissions for application user
-- REVOKE UPDATE, DELETE ON audit_forensic_log FROM 'app_user'@'%';
-- GRANT INSERT, SELECT ON audit_forensic_log TO 'app_user'@'%';

-- Create audit log cleanup procedure (optional - for very old records)
DELIMITER $$

CREATE PROCEDURE cleanup_old_audit_logs(IN days_to_keep INT)
BEGIN
    -- This procedure should be run by DBA only
    -- It moves old audit logs to archive table rather than deleting
    -- Implementation depends on retention policy
END$$

DELIMITER ;