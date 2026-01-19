-- Payments Module Complete Redesign - Four Separate Accounting Tables
-- This script creates the four mandatory accounting tables as per specification

-- 1. Contra Entries Table (Cash to Bank, Bank to Cash transfers)
CREATE TABLE contra_entries (
  contra_id INT AUTO_INCREMENT PRIMARY KEY,
  voucher_no VARCHAR(20) NOT NULL UNIQUE,
  entry_date DATE NOT NULL,
  ledger_from VARCHAR(150) NOT NULL,
  ledger_to VARCHAR(150) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  narration TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_voucher_no (voucher_no),
  INDEX idx_entry_date (entry_date),
  INDEX idx_created_by (created_by)
);

-- 2. Payment Entries Table (Money going out)
CREATE TABLE payment_entries (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  voucher_no VARCHAR(20) NOT NULL UNIQUE,
  entry_date DATE NOT NULL,
  paid_to VARCHAR(150) NOT NULL,
  payment_mode ENUM('Cash','Bank','Cheque','Draft') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  narration TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_voucher_no (voucher_no),
  INDEX idx_entry_date (entry_date),
  INDEX idx_created_by (created_by)
);

-- 3. Receipt Entries Table (Money coming in)
CREATE TABLE receipt_entries (
  receipt_id INT AUTO_INCREMENT PRIMARY KEY,
  voucher_no VARCHAR(20) NOT NULL UNIQUE,
  entry_date DATE NOT NULL,
  received_from VARCHAR(150) NOT NULL,
  receipt_mode ENUM('Cash','Bank','Cheque','Draft') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  narration TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_voucher_no (voucher_no),
  INDEX idx_entry_date (entry_date),
  INDEX idx_created_by (created_by)
);

-- 4. Journal Entries Table (Adjustments and other entries)
CREATE TABLE journal_entries (
  journal_id INT AUTO_INCREMENT PRIMARY KEY,
  voucher_no VARCHAR(20) NOT NULL UNIQUE,
  entry_date DATE NOT NULL,
  debit_ledger VARCHAR(150) NOT NULL,
  credit_ledger VARCHAR(150) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  narration TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_voucher_no (voucher_no),
  INDEX idx_entry_date (entry_date),
  INDEX idx_created_by (created_by)
);

-- Create voucher number sequences for auto-increment
CREATE TABLE voucher_sequences (
  entry_type ENUM('CONTRA','PAYMENT','RECEIPT','JOURNAL') PRIMARY KEY,
  current_number INT NOT NULL DEFAULT 0,
  prefix VARCHAR(10) NOT NULL,
  financial_year VARCHAR(7) NOT NULL
);

-- Initialize voucher sequences for current financial year
INSERT INTO voucher_sequences (entry_type, current_number, prefix, financial_year) VALUES
('CONTRA', 0, 'CON', '2025-26'),
('PAYMENT', 0, 'PAY', '2025-26'),
('RECEIPT', 0, 'REC', '2025-26'),
('JOURNAL', 0, 'JOU', '2025-26');

-- Create ledger master table for dropdown lists
CREATE TABLE ledger_master (
  ledger_id INT AUTO_INCREMENT PRIMARY KEY,
  ledger_name VARCHAR(150) NOT NULL UNIQUE,
  ledger_type ENUM('Cash','Bank','Expense','Income','Asset','Liability','Capital') NOT NULL,
  opening_balance DECIMAL(12,2) DEFAULT 0.00,
  current_balance DECIMAL(12,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ledger_name (ledger_name),
  INDEX idx_ledger_type (ledger_type)
);

-- Insert default ledgers
INSERT INTO ledger_master (ledger_name, ledger_type, opening_balance, current_balance) VALUES
('Cash', 'Cash', 0.00, 0.00),
('Bank', 'Bank', 0.00, 0.00),
('Railway Charges', 'Expense', 0.00, 0.00),
('Service Charges', 'Income', 0.00, 0.00),
('Customer Advance', 'Liability', 0.00, 0.00),
('Supplier Payment', 'Expense', 0.00, 0.00),
('Commission Income', 'Income', 0.00, 0.00),
('Office Expenses', 'Expense', 0.00, 0.00);