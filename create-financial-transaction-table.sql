-- ============================================================================
-- FINANCIAL TRANSACTION TABLE - CENTRALIZED REPORTING ENGINE
-- Production-Level Travel ERP System
-- ============================================================================

-- Drop existing table if exists
DROP TABLE IF EXISTS financial_transactions;

-- Create centralized financial transaction table
CREATE TABLE financial_transactions (
    -- Primary Key
    ft_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Transaction Identification
    ft_transaction_no VARCHAR(50) NOT NULL UNIQUE,
    ft_transaction_type ENUM('JOURNAL', 'SALES', 'PURCHASE', 'RECEIPT', 'PAYMENT', 'CONTRA') NOT NULL,
    ft_transaction_date DATE NOT NULL,
    ft_financial_year VARCHAR(10) NOT NULL, -- e.g., '2025-26'
    ft_quarter ENUM('Q1', 'Q2', 'Q3', 'Q4') NOT NULL,
    
    -- Reference Information
    ft_reference_type VARCHAR(50), -- 'BOOKING', 'BILL', 'PAYMENT', 'RECEIPT', etc.
    ft_reference_id BIGINT,
    ft_reference_no VARCHAR(50),
    
    -- Party Information
    ft_customer_id INT,
    ft_customer_name VARCHAR(150),
    ft_vendor_id INT,
    ft_vendor_name VARCHAR(150),
    
    -- Organizational Hierarchy
    ft_branch_id INT,
    ft_branch_name VARCHAR(100),
    ft_employee_id INT,
    ft_employee_name VARCHAR(100),
    ft_department VARCHAR(50),
    
    -- Ledger Information
    ft_debit_ledger_id INT,
    ft_debit_ledger_name VARCHAR(150),
    ft_credit_ledger_id INT,
    ft_credit_ledger_name VARCHAR(150),
    
    -- Financial Amounts (All in INR)
    ft_debit_amount DECIMAL(15,2) DEFAULT 0.00,
    ft_credit_amount DECIMAL(15,2) DEFAULT 0.00,
    ft_gross_amount DECIMAL(15,2) DEFAULT 0.00,
    ft_tax_amount DECIMAL(15,2) DEFAULT 0.00,
    ft_discount_amount DECIMAL(15,2) DEFAULT 0.00,
    ft_commission_amount DECIMAL(15,2) DEFAULT 0.00,
    ft_net_amount DECIMAL(15,2) DEFAULT 0.00,
    
    -- Travel-Specific Fields
    ft_booking_type ENUM('FLIGHT', 'TRAIN', 'HOTEL', 'BUS', 'CAB', 'PACKAGE', 'OTHER'),
    ft_pnr_number VARCHAR(20),
    ft_travel_date DATE,
    ft_passenger_count INT DEFAULT 0,
    
    -- Payment Information
    ft_payment_mode ENUM('CASH', 'CHEQUE', 'NEFT', 'RTGS', 'UPI', 'CARD', 'WALLET', 'OTHER'),
    ft_payment_status ENUM('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED') DEFAULT 'PENDING',
    ft_payment_due_date DATE,
    
    -- Settlement Information
    ft_settlement_status ENUM('UNSETTLED', 'PARTIAL', 'SETTLED') DEFAULT 'UNSETTLED',
    ft_settlement_date DATE,
    ft_outstanding_amount DECIMAL(15,2) DEFAULT 0.00,
    
    -- Narration and Notes
    ft_narration TEXT,
    ft_remarks TEXT,
    
    -- Status and Flags
    ft_status ENUM('DRAFT', 'POSTED', 'CANCELLED', 'REVERSED') DEFAULT 'DRAFT',
    ft_is_reconciled BOOLEAN DEFAULT FALSE,
    ft_is_locked BOOLEAN DEFAULT FALSE,
    ft_is_year_end_closed BOOLEAN DEFAULT FALSE,
    
    -- Audit Fields
    ft_created_by INT NOT NULL,
    ft_created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ft_modified_by INT,
    ft_modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ft_posted_by INT,
    ft_posted_on TIMESTAMP NULL,
    
    -- Indexes for Performance (100,000+ transactions)
    INDEX idx_transaction_date (ft_transaction_date),
    INDEX idx_transaction_type (ft_transaction_type),
    INDEX idx_financial_year (ft_financial_year),
    INDEX idx_quarter (ft_quarter),
    INDEX idx_branch (ft_branch_id),
    INDEX idx_customer (ft_customer_id),
    INDEX idx_vendor (ft_vendor_id),
    INDEX idx_employee (ft_employee_id),
    INDEX idx_reference (ft_reference_type, ft_reference_id),
    INDEX idx_payment_status (ft_payment_status),
    INDEX idx_settlement_status (ft_settlement_status),
    INDEX idx_status (ft_status),
    INDEX idx_booking_type (ft_booking_type),
    
    -- Composite Indexes for Common Queries
    INDEX idx_date_type (ft_transaction_date, ft_transaction_type),
    INDEX idx_date_branch (ft_transaction_date, ft_branch_id),
    INDEX idx_date_customer (ft_transaction_date, ft_customer_id),
    INDEX idx_date_status (ft_transaction_date, ft_status),
    INDEX idx_year_quarter (ft_financial_year, ft_quarter),
    
    -- Foreign Key Constraints
    FOREIGN KEY (ft_branch_id) REFERENCES branches(br_id) ON DELETE RESTRICT,
    FOREIGN KEY (ft_customer_id) REFERENCES customerstvl(cu_usid) ON DELETE RESTRICT,
    FOREIGN KEY (ft_employee_id) REFERENCES employeestvl(em_usid) ON DELETE RESTRICT,
    
    -- Check Constraints
    CONSTRAINT chk_amounts CHECK (
        ft_debit_amount >= 0 AND 
        ft_credit_amount >= 0 AND 
        ft_gross_amount >= 0 AND
        ft_net_amount >= 0
    ),
    CONSTRAINT chk_debit_credit CHECK (
        (ft_debit_amount > 0 AND ft_credit_amount = 0) OR
        (ft_credit_amount > 0 AND ft_debit_amount = 0) OR
        (ft_debit_amount = 0 AND ft_credit_amount = 0)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- REPORT AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE report_audit_log (
    ral_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ral_report_type VARCHAR(50) NOT NULL,
    ral_report_name VARCHAR(150) NOT NULL,
    ral_period_type ENUM('DAILY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM') NOT NULL,
    ral_start_date DATE NOT NULL,
    ral_end_date DATE NOT NULL,
    ral_filters JSON,
    ral_export_type ENUM('JSON', 'EXCEL', 'PDF') NOT NULL,
    ral_record_count INT DEFAULT 0,
    ral_execution_time_ms INT,
    ral_file_path VARCHAR(255),
    ral_generated_by INT NOT NULL,
    ral_generated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ral_ip_address VARCHAR(45),
    
    INDEX idx_report_type (ral_report_type),
    INDEX idx_generated_by (ral_generated_by),
    INDEX idx_generated_on (ral_generated_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- REPORT TEMPLATES TABLE (Save & Reuse Reports)
-- ============================================================================

CREATE TABLE report_templates (
    rt_id INT AUTO_INCREMENT PRIMARY KEY,
    rt_name VARCHAR(150) NOT NULL,
    rt_description TEXT,
    rt_report_type VARCHAR(50) NOT NULL,
    rt_period_type ENUM('DAILY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM') NOT NULL,
    rt_filters JSON,
    rt_columns JSON,
    rt_sort_order JSON,
    rt_is_public BOOLEAN DEFAULT FALSE,
    rt_created_by INT NOT NULL,
    rt_created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rt_modified_by INT,
    rt_modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_created_by (rt_created_by),
    INDEX idx_report_type (rt_report_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SCHEDULED REPORTS TABLE (Auto-Email Reports)
-- ============================================================================

CREATE TABLE scheduled_reports (
    sr_id INT AUTO_INCREMENT PRIMARY KEY,
    sr_template_id INT NOT NULL,
    sr_schedule_type ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY') NOT NULL,
    sr_schedule_time TIME NOT NULL,
    sr_schedule_day INT, -- Day of week (1-7) or day of month (1-31)
    sr_recipients JSON NOT NULL, -- Array of email addresses
    sr_export_format ENUM('EXCEL', 'PDF') NOT NULL,
    sr_is_active BOOLEAN DEFAULT TRUE,
    sr_last_run TIMESTAMP NULL,
    sr_next_run TIMESTAMP NULL,
    sr_created_by INT NOT NULL,
    sr_created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sr_template_id) REFERENCES report_templates(rt_id) ON DELETE CASCADE,
    INDEX idx_next_run (sr_next_run),
    INDEX idx_is_active (sr_is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- MONTHLY SNAPSHOT TABLE (Performance Optimization)
-- ============================================================================

CREATE TABLE monthly_financial_snapshot (
    mfs_id INT AUTO_INCREMENT PRIMARY KEY,
    mfs_year_month VARCHAR(7) NOT NULL, -- 'YYYY-MM'
    mfs_branch_id INT,
    mfs_total_sales DECIMAL(15,2) DEFAULT 0.00,
    mfs_total_purchases DECIMAL(15,2) DEFAULT 0.00,
    mfs_total_receipts DECIMAL(15,2) DEFAULT 0.00,
    mfs_total_payments DECIMAL(15,2) DEFAULT 0.00,
    mfs_net_profit DECIMAL(15,2) DEFAULT 0.00,
    mfs_customer_outstanding DECIMAL(15,2) DEFAULT 0.00,
    mfs_vendor_outstanding DECIMAL(15,2) DEFAULT 0.00,
    mfs_booking_count INT DEFAULT 0,
    mfs_snapshot_data JSON,
    mfs_is_locked BOOLEAN DEFAULT FALSE,
    mfs_created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_month_branch (mfs_year_month, mfs_branch_id),
    INDEX idx_year_month (mfs_year_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- FINANCIAL YEAR CLOSING TABLE
-- ============================================================================

CREATE TABLE financial_year_closing (
    fyc_id INT AUTO_INCREMENT PRIMARY KEY,
    fyc_financial_year VARCHAR(10) NOT NULL UNIQUE,
    fyc_start_date DATE NOT NULL,
    fyc_end_date DATE NOT NULL,
    fyc_is_closed BOOLEAN DEFAULT FALSE,
    fyc_closed_by INT,
    fyc_closed_on TIMESTAMP NULL,
    fyc_opening_balance DECIMAL(15,2) DEFAULT 0.00,
    fyc_closing_balance DECIMAL(15,2) DEFAULT 0.00,
    fyc_total_revenue DECIMAL(15,2) DEFAULT 0.00,
    fyc_total_expense DECIMAL(15,2) DEFAULT 0.00,
    fyc_net_profit DECIMAL(15,2) DEFAULT 0.00,
    fyc_remarks TEXT,
    
    INDEX idx_financial_year (fyc_financial_year),
    INDEX idx_is_closed (fyc_is_closed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- INSERT SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert current financial year
INSERT INTO financial_year_closing (fyc_financial_year, fyc_start_date, fyc_end_date, fyc_is_closed)
VALUES ('2025-26', '2025-04-01', '2026-03-31', FALSE);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Outstanding Receivables
CREATE OR REPLACE VIEW v_outstanding_receivables AS
SELECT 
    ft_customer_id,
    ft_customer_name,
    ft_branch_id,
    ft_branch_name,
    SUM(CASE WHEN ft_transaction_type = 'SALES' THEN ft_net_amount ELSE 0 END) as total_sales,
    SUM(CASE WHEN ft_transaction_type = 'RECEIPT' THEN ft_net_amount ELSE 0 END) as total_receipts,
    SUM(CASE WHEN ft_transaction_type = 'SALES' THEN ft_net_amount ELSE 0 END) - 
    SUM(CASE WHEN ft_transaction_type = 'RECEIPT' THEN ft_net_amount ELSE 0 END) as outstanding_amount,
    MAX(ft_transaction_date) as last_transaction_date
FROM financial_transactions
WHERE ft_status = 'POSTED' 
  AND ft_customer_id IS NOT NULL
GROUP BY ft_customer_id, ft_customer_name, ft_branch_id, ft_branch_name
HAVING outstanding_amount > 0;

-- View: Outstanding Payables
CREATE OR REPLACE VIEW v_outstanding_payables AS
SELECT 
    ft_vendor_id,
    ft_vendor_name,
    ft_branch_id,
    ft_branch_name,
    SUM(CASE WHEN ft_transaction_type = 'PURCHASE' THEN ft_net_amount ELSE 0 END) as total_purchases,
    SUM(CASE WHEN ft_transaction_type = 'PAYMENT' THEN ft_net_amount ELSE 0 END) as total_payments,
    SUM(CASE WHEN ft_transaction_type = 'PURCHASE' THEN ft_net_amount ELSE 0 END) - 
    SUM(CASE WHEN ft_transaction_type = 'PAYMENT' THEN ft_net_amount ELSE 0 END) as outstanding_amount,
    MAX(ft_transaction_date) as last_transaction_date
FROM financial_transactions
WHERE ft_status = 'POSTED' 
  AND ft_vendor_id IS NOT NULL
GROUP BY ft_vendor_id, ft_vendor_name, ft_branch_id, ft_branch_name
HAVING outstanding_amount > 0;

-- ============================================================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
-- ============================================================================

DELIMITER //

-- Procedure: Calculate Aging Buckets
CREATE PROCEDURE sp_calculate_aging(
    IN p_as_of_date DATE,
    IN p_party_type ENUM('CUSTOMER', 'VENDOR')
)
BEGIN
    IF p_party_type = 'CUSTOMER' THEN
        SELECT 
            ft_customer_id as party_id,
            ft_customer_name as party_name,
            SUM(CASE 
                WHEN DATEDIFF(p_as_of_date, ft_transaction_date) BETWEEN 0 AND 30 
                THEN ft_outstanding_amount ELSE 0 
            END) as bucket_0_30,
            SUM(CASE 
                WHEN DATEDIFF(p_as_of_date, ft_transaction_date) BETWEEN 31 AND 60 
                THEN ft_outstanding_amount ELSE 0 
            END) as bucket_31_60,
            SUM(CASE 
                WHEN DATEDIFF(p_as_of_date, ft_transaction_date) BETWEEN 61 AND 90 
                THEN ft_outstanding_amount ELSE 0 
            END) as bucket_61_90,
            SUM(CASE 
                WHEN DATEDIFF(p_as_of_date, ft_transaction_date) > 90 
                THEN ft_outstanding_amount ELSE 0 
            END) as bucket_90_plus,
            SUM(ft_outstanding_amount) as total_outstanding
        FROM financial_transactions
        WHERE ft_status = 'POSTED'
          AND ft_customer_id IS NOT NULL
          AND ft_outstanding_amount > 0
          AND ft_transaction_date <= p_as_of_date
        GROUP BY ft_customer_id, ft_customer_name;
    ELSE
        SELECT 
            ft_vendor_id as party_id,
            ft_vendor_name as party_name,
            SUM(CASE 
                WHEN DATEDIFF(p_as_of_date, ft_transaction_date) BETWEEN 0 AND 30 
                THEN ft_outstanding_amount ELSE 0 
            END) as bucket_0_30,
            SUM(CASE 
                WHEN DATEDIFF(p_as_of_date, ft_transaction_date) BETWEEN 31 AND 60 
                THEN ft_outstanding_amount ELSE 0 
            END) as bucket_31_60,
            SUM(CASE 
                WHEN DATEDIFF(p_as_of_date, ft_transaction_date) BETWEEN 61 AND 90 
                THEN ft_outstanding_amount ELSE 0 
            END) as bucket_61_90,
            SUM(CASE 
                WHEN DATEDIFF(p_as_of_date, ft_transaction_date) > 90 
                THEN ft_outstanding_amount ELSE 0 
            END) as bucket_90_plus,
            SUM(ft_outstanding_amount) as total_outstanding
        FROM financial_transactions
        WHERE ft_status = 'POSTED'
          AND ft_vendor_id IS NOT NULL
          AND ft_outstanding_amount > 0
          AND ft_transaction_date <= p_as_of_date
        GROUP BY ft_vendor_id, ft_vendor_name;
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to application user
-- GRANT SELECT, INSERT, UPDATE ON financial_transactions TO 'yatrasathi_user'@'localhost';
-- GRANT SELECT, INSERT ON report_audit_log TO 'yatrasathi_user'@'localhost';
-- GRANT ALL ON report_templates TO 'yatrasathi_user'@'localhost';
-- GRANT ALL ON scheduled_reports TO 'yatrasathi_user'@'localhost';

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================