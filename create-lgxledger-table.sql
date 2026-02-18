-- Create lgXledger table for financial ledger entries
-- This table corresponds to the Ledger model in the application

CREATE TABLE IF NOT EXISTS lgXledger (
  lg_lgid BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Ledger ID (Primary Key)',
  lg_usid VARCHAR(15) NOT NULL COMMENT 'Customer User ID',
  lg_entry_type VARCHAR(10) NOT NULL COMMENT 'Entry Type: DEBIT (booking) | CREDIT (payment)',
  lg_entry_ref VARCHAR(50) NOT NULL COMMENT 'Entry Reference (PNR number / Payment ID / etc.)',
  lg_amount DECIMAL(15, 2) NOT NULL COMMENT 'Transaction Amount',
  lg_opening_bal DECIMAL(15, 2) DEFAULT 0 NOT NULL COMMENT 'Opening Balance (before this transaction)',
  lg_closing_bal DECIMAL(15, 2) DEFAULT 0 NOT NULL COMMENT 'Closing Balance (after this transaction)',
  lg_pnid BIGINT NULL COMMENT 'PNR ID (if entry is related to PNR)',
  lg_ptid BIGINT NULL COMMENT 'Payment ID (if entry is related to payment)',
  lg_paid BIGINT NULL COMMENT 'Payment Allocation ID (if entry is from allocation)',
  lg_fyear VARCHAR(10) NULL COMMENT 'Financial Year',
  lg_remarks TEXT NULL COMMENT 'Ledger Entry Remarks',
  
  -- Audit fields
  edtm TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Entry Date Time',
  eby VARCHAR(50) COMMENT 'Entered By',
  mdtm TIMESTAMP NULL COMMENT 'Modification Date Time',
  mby VARCHAR(50) COMMENT 'Modified By',
  
  -- Indexes for performance
  INDEX idx_lg_usid (lg_usid),
  INDEX idx_lg_entry_type (lg_entry_type),
  INDEX idx_lg_pnid (lg_pnid),
  INDEX idx_lg_ptid (lg_ptid),
  INDEX idx_lg_fyear (lg_fyear),
  INDEX idx_edtm (edtm)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ledger / Audit Table for Financial Transactions';