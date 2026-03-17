-- Add comprehensive cancellation fields to BillingMaster table
-- For production-level billing cancellation module

ALTER TABLE blXbilling 
ADD COLUMN is_cancelled TINYINT(1) DEFAULT 0 COMMENT 'Flag indicating if bill is cancelled' AFTER bl_status,
ADD COLUMN cancelled_on DATETIME NULL COMMENT 'Timestamp when bill was cancelled' AFTER is_cancelled,
ADD COLUMN cancelled_by INT NULL COMMENT 'User ID who cancelled the bill' AFTER cancelled_on,
ADD COLUMN cancellation_date DATE NULL COMMENT 'Effective date of cancellation' AFTER cancelled_by,
ADD COLUMN total_cancel_charges DECIMAL(10,2) DEFAULT 0 COMMENT 'Total cancellation charges (railway + agent)' AFTER bl_agent_cancellation_charge,
ADD COLUMN refund_amount DECIMAL(10,2) DEFAULT 0 COMMENT 'Refund amount after cancellation' AFTER total_cancel_charges,
ADD COLUMN payment_status ENUM('UNPAID', 'PARTIALLY_PAID', 'FULLY_PAID', 'REFUND_DUE') DEFAULT 'UNPAID' COMMENT 'Payment status for cancelled bill' AFTER refund_amount;

-- Add foreign key constraint for cancelled_by user
ALTER TABLE blXbilling
ADD CONSTRAINT fk_blXbilling_cancelled_by
FOREIGN KEY (cancelled_by) REFERENCES usXuser(us_usid) ON DELETE SET NULL;

-- Add indexes for better query performance on cancelled bills
CREATE INDEX idx_bl_is_cancelled ON blXbilling(is_cancelled);
CREATE INDEX idx_bl_cancelled_on ON blXbilling(cancelled_on);
CREATE INDEX idx_bl_cancelled_by ON blXbilling(cancelled_by);
CREATE INDEX idx_bl_payment_status ON blXbilling(payment_status);

-- Update existing records (set defaults)
UPDATE blXbilling 
SET is_cancelled = CASE WHEN bl_status = 'CANCELLED' THEN 1 ELSE 0 END,
    cancelled_on = bl_modified_at,
    cancelled_by = bl_modified_by,
    total_cancel_charges = COALESCE(bl_railway_cancellation_charge, 0) + COALESCE(bl_agent_cancellation_charge, 0),
    refund_amount = 0, -- Calculate based on payment logic
    payment_status = 'UNPAID'
WHERE bl_status = 'CANCELLED';
