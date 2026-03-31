-- ============================================================
-- NORMALIZATION & PERFORMANCE OPTIMIZATION SCRIPT
-- YatraSathi TVL_001 Database
-- ============================================================
-- Changes:
--   1. bkXbooking.bk_status  → ENUM with 3-char codes
--   2. blXbilling.bl_status  → ENUM with 3-char codes
--   3. blXbilling.payment_status → ENUM with 3-char codes
--   4. Drop 20+ duplicate indexes on bkXbooking.bk_bkno
--   5. Drop duplicate indexes on bk_status, bk_usid, bk_agent, bk_trvldt, bk_reqdt
--   6. Add missing composite indexes for common query patterns
--   7. Tighten oversized varchar columns
-- ============================================================

USE TVL_001;

-- ============================================================
-- SECTION 1: STATUS CODE NORMALIZATION
-- Full word → 3-char code mapping:
--   DRAFT       → DRF
--   CONFIRMED   → CNF
--   CANCELLED   → CAN
--   PENDING     → PND
--   PAID        → PAD
--   FINAL       → FNL
--   INACTIVE    → INA
--   OPEN        → OPN
--   CLOSED      → CLS
-- ============================================================

-- ── 1a. bkXbooking.bk_status (varchar → ENUM with codes) ──

-- Migrate existing data first
UPDATE bkXbooking SET bk_status = 'CNF' WHERE bk_status = 'CONFIRMED';
UPDATE bkXbooking SET bk_status = 'CAN' WHERE bk_status = 'CANCELLED';
UPDATE bkXbooking SET bk_status = 'PND' WHERE bk_status = 'PENDING';
UPDATE bkXbooking SET bk_status = 'DRF' WHERE bk_status = 'DRAFT';
UPDATE bkXbooking SET bk_status = 'INA' WHERE bk_status = 'INACTIVE';

-- Convert column to ENUM (3 chars max → saves ~12 bytes per row vs varchar(15))
ALTER TABLE bkXbooking
  MODIFY COLUMN bk_status ENUM('DRF','CNF','CAN','PND','PAD','FNL','INA') NOT NULL DEFAULT 'DRF';

-- ── 1b. bkXbooking.status (ENUM → short codes) ──
UPDATE bkXbooking SET status = 'OPN' WHERE status = 'OPEN';
UPDATE bkXbooking SET status = 'CLS' WHERE status = 'CLOSED';
UPDATE bkXbooking SET status = 'CAN' WHERE status = 'CANCELLED';

ALTER TABLE bkXbooking
  MODIFY COLUMN status ENUM('OPN','CLS','CAN') DEFAULT 'OPN';

-- ── 1c. blXbilling.bl_status (ENUM → short codes) ──
UPDATE blXbilling SET bl_status = 'DRF' WHERE bl_status = 'DRAFT';
UPDATE blXbilling SET bl_status = 'CNF' WHERE bl_status = 'CONFIRMED';
UPDATE blXbilling SET bl_status = 'CAN' WHERE bl_status = 'CANCELLED';
UPDATE blXbilling SET bl_status = 'PND' WHERE bl_status = 'PENDING';
UPDATE blXbilling SET bl_status = 'PAD' WHERE bl_status = 'PAID';
UPDATE blXbilling SET bl_status = 'FNL' WHERE bl_status = 'FINAL';

ALTER TABLE blXbilling
  MODIFY COLUMN bl_status ENUM('DRF','CNF','CAN','PND','PAD','FNL') NOT NULL DEFAULT 'DRF';

-- ── 1d. blXbilling.status (ENUM → short codes) ──
UPDATE blXbilling SET status = 'OPN' WHERE status = 'OPEN';
UPDATE blXbilling SET status = 'CLS' WHERE status = 'CLOSED';
UPDATE blXbilling SET status = 'CAN' WHERE status = 'CANCELLED';

ALTER TABLE blXbilling
  MODIFY COLUMN status ENUM('OPN','CLS','CAN') DEFAULT 'OPN';

-- ── 1e. blXbilling.payment_status (ENUM → short codes) ──
UPDATE blXbilling SET payment_status = 'UPD' WHERE payment_status = 'UNPAID';
UPDATE blXbilling SET payment_status = 'PPD' WHERE payment_status = 'PARTIALLY_PAID';
UPDATE blXbilling SET payment_status = 'FPD' WHERE payment_status = 'FULLY_PAID';
UPDATE blXbilling SET payment_status = 'RFD' WHERE payment_status = 'REFUND_DUE';

ALTER TABLE blXbilling
  MODIFY COLUMN payment_status ENUM('UPD','PPD','FPD','RFD') DEFAULT 'UPD';

-- ── 1f. cuXcustomer.status ──
UPDATE cuXcustomer SET status = 'OPN' WHERE status = 'OPEN';
UPDATE cuXcustomer SET status = 'CLS' WHERE status = 'CLOSED';
UPDATE cuXcustomer SET status = 'CAN' WHERE status = 'CANCELLED';

ALTER TABLE cuXcustomer
  MODIFY COLUMN status ENUM('OPN','CLS','CAN') DEFAULT 'OPN';

-- ============================================================
-- SECTION 2: DROP DUPLICATE INDEXES ON bkXbooking
-- bk_bkno has 24 identical unique indexes — keep only PRIMARY + 1 unique
-- ============================================================

-- Drop the 23 redundant bk_bkno duplicates (keep bk_bkno as the canonical one)
ALTER TABLE bkXbooking
  DROP INDEX bk_xbooking_bk_bkno,
  DROP INDEX bk_bkno_2,
  DROP INDEX bk_bkno_3,
  DROP INDEX bk_bkno_4,
  DROP INDEX bk_bkno_5,
  DROP INDEX bk_bkno_6,
  DROP INDEX bk_bkno_7,
  DROP INDEX bk_bkno_8,
  DROP INDEX bk_bkno_9,
  DROP INDEX bk_bkno_10,
  DROP INDEX bk_bkno_11,
  DROP INDEX bk_bkno_12,
  DROP INDEX bk_bkno_13,
  DROP INDEX bk_bkno_14,
  DROP INDEX bk_bkno_15,
  DROP INDEX bk_bkno_16,
  DROP INDEX bk_bkno_17,
  DROP INDEX bk_bkno_18,
  DROP INDEX bk_bkno_19,
  DROP INDEX bk_bkno_20,
  DROP INDEX bk_bkno_21,
  DROP INDEX bk_bkno_22,
  DROP INDEX bk_bkno_23;

-- Drop duplicate single-column indexes (keep the composite/better-named ones)
-- bk_status: keep idx_bk_status, drop idx_status + idx_booking_status
ALTER TABLE bkXbooking
  DROP INDEX idx_status,
  DROP INDEX idx_booking_status;

-- bk_usid: keep idx_bk_usid, drop idx_usid + idx_booking_customer
ALTER TABLE bkXbooking
  DROP INDEX idx_usid,
  DROP INDEX idx_booking_customer;

-- bk_agent: keep idx_bk_agent, drop idx_booking_agent
ALTER TABLE bkXbooking
  DROP INDEX idx_booking_agent;

-- bk_trvldt: keep idx_bk_trvldt, drop idx_trvldt
ALTER TABLE bkXbooking
  DROP INDEX idx_trvldt;

-- bk_reqdt: keep idx_bk_reqdt, drop idx_booking_date
ALTER TABLE bkXbooking
  DROP INDEX idx_booking_date;

-- ============================================================
-- SECTION 3: ADD MISSING INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================

-- blXbilling: index on bl_status (most-filtered column, currently missing)
ALTER TABLE blXbilling
  ADD INDEX idx_bl_bl_status (bl_status);

-- blXbilling: composite for the main list query (status + date DESC)
ALTER TABLE blXbilling
  ADD INDEX idx_bl_status_date (bl_status, bl_billing_date DESC);

-- blXbilling: customer search columns
ALTER TABLE blXbilling
  ADD INDEX idx_bl_customer_name (bl_customer_name(30)),
  ADD INDEX idx_bl_customer_phone (bl_customer_phone);

-- blXbilling: bill number lookup
ALTER TABLE blXbilling
  ADD INDEX idx_bl_bill_no (bl_bill_no);

-- bkXbooking: composite for the main list query (status + reqdt DESC)
ALTER TABLE bkXbooking
  ADD INDEX idx_bk_status_reqdt (bk_status, bk_reqdt DESC);

-- psXpassenger: composite for booking+active (most common passenger query)
ALTER TABLE psXpassenger
  ADD INDEX idx_ps_bkid_active (ps_bkid, ps_active);

-- ============================================================
-- SECTION 4: TIGHTEN OVERSIZED VARCHAR COLUMNS
-- ============================================================

-- bkXbooking: bk_status was varchar(15), now ENUM — already done above
-- bkXbooking: eby/mby/bk_agent are varchar(15) — fine as-is
-- blXbilling: bl_from_station / bl_to_station are varchar(50) — trim to 10 (station codes)
ALTER TABLE blXbilling
  MODIFY COLUMN bl_from_station VARCHAR(10),
  MODIFY COLUMN bl_to_station   VARCHAR(10);

-- ============================================================
-- SECTION 5: VERIFY
-- ============================================================

SELECT 'bkXbooking.bk_status type:' AS info,  COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='TVL_001' AND TABLE_NAME='bkXbooking' AND COLUMN_NAME='bk_status'
UNION ALL
SELECT 'blXbilling.bl_status type:', COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='TVL_001' AND TABLE_NAME='blXbilling' AND COLUMN_NAME='bl_status'
UNION ALL
SELECT 'blXbilling.payment_status type:', COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='TVL_001' AND TABLE_NAME='blXbilling' AND COLUMN_NAME='payment_status';

SELECT COUNT(*) AS bkXbooking_index_count FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA='TVL_001' AND TABLE_NAME='bkXbooking';

SELECT COUNT(*) AS blXbilling_index_count FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA='TVL_001' AND TABLE_NAME='blXbilling';
