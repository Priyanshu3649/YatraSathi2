-- YatraSathi Payments Module - Accounting Tables
-- Complete redesign for traditional accounting workflows
-- Each transaction type has its own table for audit clarity

-- 1. CONTRA ENTRIES TABLE
CREATE TABLE IF NOT EXISTS contra_entries (
    contra_id INT AUTO_INCREMENT PRIMARY KEY,
    voucher_no VARCHAR(20) NOT NULL UNIQUE,
    entry_date DATE NOT NULL,
    ledger_from VARCHAR(150) NOT NULL,
    ledger_to VARCHAR(150) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    cheque_draft_no VARCHAR(50) NULL,
    narration TEXT NULL,
    total_debit DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(12,2) NOT NULL DEFAULT 0,
    balance_check TINYINT(1) NOT NULL DEFAULT 0, -- 1 if debit = credit
    financial_year VARCHAR(10) NOT NULL,
    accounting_period VARCHAR(7) NOT NULL,
    locked TINYINT(1) NOT NULL DEFAULT 0,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by INT NULL,
    modified_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_voucher_no (voucher_no),
    INDEX idx_entry_date (entry_date),
    INDEX idx_financial_year (financial_year),
    INDEX idx_created_by (created_by)
);

-- 2. PAYMENT ENTRIES TABLE
CREATE TABLE IF NOT EXISTS payment_entries (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    voucher_no VARCHAR(20) NOT NULL UNIQUE,
    entry_date DATE NOT NULL,
    paid_to VARCHAR(150) NOT NULL,
    payment_mode ENUM('Cash','Bank','Cheque','Draft','UPI','Card') NOT NULL DEFAULT 'Cash',
    amount DECIMAL(12,2) NOT NULL,
    cheque_draft_no VARCHAR(50) NULL,
    narration TEXT NULL,
    total_debit DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(12,2) NOT NULL DEFAULT 0,
    balance_check TINYINT(1) NOT NULL DEFAULT 0, -- 1 if debit = credit
    financial_year VARCHAR(10) NOT NULL,
    accounting_period VARCHAR(7) NOT NULL,
    locked TINYINT(1) NOT NULL DEFAULT 0,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by INT NULL,
    modified_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_voucher_no (voucher_no),
    INDEX idx_entry_date (entry_date),
    INDEX idx_financial_year (financial_year),
    INDEX idx_created_by (created_by)
);

-- 3. RECEIPT ENTRIES TABLE
CREATE TABLE IF NOT EXISTS receipt_entries (
    receipt_id INT AUTO_INCREMENT PRIMARY KEY,
    voucher_no VARCHAR(20) NOT NULL UNIQUE,
    entry_date DATE NOT NULL,
    received_from VARCHAR(150) NOT NULL,
    receipt_mode ENUM('Cash','Bank','Cheque','Draft','UPI','Card') NOT NULL DEFAULT 'Cash',
    amount DECIMAL(12,2) NOT NULL,
    cheque_draft_no VARCHAR(50) NULL,
    narration TEXT NULL,
    booking_id VARCHAR(50) NULL, -- Optional reference to booking
    bill_number VARCHAR(50) NULL, -- Optional reference to bill
    customer_ledger VARCHAR(150) NULL, -- Optional customer ledger reference
    total_debit DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(12,2) NOT NULL DEFAULT 0,
    balance_check TINYINT(1) NOT NULL DEFAULT 0, -- 1 if debit = credit
    financial_year VARCHAR(10) NOT NULL,
    accounting_period VARCHAR(7) NOT NULL,
    locked TINYINT(1) NOT NULL DEFAULT 0,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by INT NULL,
    modified_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_voucher_no (voucher_no),
    INDEX idx_entry_date (entry_date),
    INDEX idx_financial_year (financial_year),
    INDEX idx_booking_id (booking_id),
    INDEX idx_bill_number (bill_number),
    INDEX idx_created_by (created_by)
);

-- 4. JOURNAL ENTRIES TABLE
CREATE TABLE IF NOT EXISTS journal_entries (
    journal_id INT AUTO_INCREMENT PRIMARY KEY,
    voucher_no VARCHAR(20) NOT NULL UNIQUE,
    entry_date DATE NOT NULL,
    debit_ledger VARCHAR(150) NOT NULL,
    credit_ledger VARCHAR(150) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    narration TEXT NULL,
    total_debit DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(12,2) NOT NULL DEFAULT 0,
    balance_check TINYINT(1) NOT NULL DEFAULT 0, -- 1 if debit = credit
    financial_year VARCHAR(10) NOT NULL,
    accounting_period VARCHAR(7) NOT NULL,
    locked TINYINT(1) NOT NULL DEFAULT 0,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by INT NULL,
    modified_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_voucher_no (voucher_no),
    INDEX idx_entry_date (entry_date),
    INDEX idx_financial_year (financial_year),
    INDEX idx_created_by (created_by)
);

-- 5. LEDGER GRID ENTRIES TABLE (for detailed line items)
CREATE TABLE IF NOT EXISTS ledger_grid_entries (
    grid_id INT AUTO_INCREMENT PRIMARY KEY,
    entry_type ENUM('contra','payment','receipt','journal') NOT NULL,
    entry_id INT NOT NULL, -- References the main entry table
    voucher_no VARCHAR(20) NOT NULL,
    line_number INT NOT NULL,
    account_name VARCHAR(150) NOT NULL,
    debit_amount DECIMAL(12,2) NULL DEFAULT 0,
    credit_amount DECIMAL(12,2) NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entry_type_id (entry_type, entry_id),
    INDEX idx_voucher_no (voucher_no),
    INDEX idx_account_name (account_name)
);

-- 6. CHART OF ACCOUNTS / LEDGER MASTER TABLE
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    account_code VARCHAR(20) NOT NULL UNIQUE,
    account_name VARCHAR(150) NOT NULL,
    account_type ENUM('Asset','Liability','Income','Expense','Equity') NOT NULL,
    parent_account_id INT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    current_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by INT NULL,
    modified_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_account_code (account_code),
    INDEX idx_account_name (account_name),
    INDEX idx_account_type (account_type),
    INDEX idx_parent_account (parent_account_id),
    FOREIGN KEY (parent_account_id) REFERENCES chart_of_accounts(account_id) ON DELETE SET NULL
);

-- Insert default chart of accounts
INSERT IGNORE INTO chart_of_accounts (account_code, account_name, account_type, created_by) VALUES
-- Assets
('1001', 'Cash in Hand', 'Asset', 1),
('1002', 'Bank Account - SBI', 'Asset', 1),
('1003', 'Bank Account - HDFC', 'Asset', 1),
('1004', 'Accounts Receivable', 'Asset', 1),
('1005', 'Advance to Suppliers', 'Asset', 1),

-- Liabilities
('2001', 'Accounts Payable', 'Liability', 1),
('2002', 'Customer Advances', 'Liability', 1),
('2003', 'TDS Payable', 'Liability', 1),
('2004', 'GST Payable', 'Liability', 1),

-- Income
('3001', 'Service Income', 'Income', 1),
('3002', 'Commission Income', 'Income', 1),
('3003', 'Other Income', 'Income', 1),

-- Expenses
('4001', 'Office Expenses', 'Expense', 1),
('4002', 'Travel Expenses', 'Expense', 1),
('4003', 'Communication Expenses', 'Expense', 1),
('4004', 'Bank Charges', 'Expense', 1),

-- Equity
('5001', 'Capital Account', 'Equity', 1),
('5002', 'Retained Earnings', 'Equity', 1);

-- Create voucher number sequences table
CREATE TABLE IF NOT EXISTS voucher_sequences (
    sequence_id INT AUTO_INCREMENT PRIMARY KEY,
    voucher_type ENUM('contra','payment','receipt','journal') NOT NULL,
    financial_year VARCHAR(10) NOT NULL,
    last_number INT NOT NULL DEFAULT 0,
    prefix VARCHAR(10) NOT NULL,
    UNIQUE KEY unique_type_year (voucher_type, financial_year)
);

-- Insert default voucher sequences for current financial year
INSERT IGNORE INTO voucher_sequences (voucher_type, financial_year, last_number, prefix) VALUES
('contra', '2025-26', 0, 'CON'),
('payment', '2025-26', 0, 'PAY'),
('receipt', '2025-26', 0, 'REC'),
('journal', '2025-26', 0, 'JOU');

-- Add indexes for performance
ALTER TABLE contra_entries ADD INDEX idx_locked (locked);
ALTER TABLE payment_entries ADD INDEX idx_locked (locked);
ALTER TABLE receipt_entries ADD INDEX idx_locked (locked);
ALTER TABLE journal_entries ADD INDEX idx_locked (locked);

-- Add foreign key constraints (optional, for referential integrity)
-- ALTER TABLE contra_entries ADD FOREIGN KEY (created_by) REFERENCES users(us_usid);
-- ALTER TABLE payment_entries ADD FOREIGN KEY (created_by) REFERENCES users(us_usid);
-- ALTER TABLE receipt_entries ADD FOREIGN KEY (created_by) REFERENCES users(us_usid);
-- ALTER TABLE journal_entries ADD FOREIGN KEY (created_by) REFERENCES users(us_usid);

COMMIT;