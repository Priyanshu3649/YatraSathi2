-- SQL TRIGGERS FOR PAYMENT SYSTEM AUTOMATION
-- These triggers ensure ledger entries are automatically created when payments and allocations occur

-- TRIGGER 1: Auto-post ledger entry when payment is inserted
DELIMITER $$

CREATE TRIGGER tr_payment_insert_ledger
AFTER INSERT ON ptPayment
FOR EACH ROW
BEGIN
    -- Insert ledger entry for payment received
    INSERT INTO lgLedger (
        lg_usid,
        lg_entry_type,
        lg_entry_ref,
        lg_amount,
        lg_opening_bal,
        lg_closing_bal,
        lg_ptid,
        lg_fyear,
        lg_remarks,
        edtm,
        eby,
        mdtm,
        mby
    )
    SELECT
        NEW.pt_usid,
        'CREDIT',
        CONCAT('PAYMENT-', NEW.pt_ptid),
        NEW.pt_amount,
        COALESCE(prev_balance.lg_closing_bal, 0) as lg_opening_bal,
        COALESCE(prev_balance.lg_closing_bal, 0) + NEW.pt_amount as lg_closing_bal,
        NEW.pt_ptid,
        NEW.pt_acct_period,
        CONCAT('Payment received via ', NEW.pt_mode, ' - Ref: ', COALESCE(NEW.pt_refno, 'N/A')),
        NOW(),
        NEW.eby,
        NOW(),
        NEW.mby
    FROM (
        SELECT lg_closing_bal 
        FROM lgLedger 
        WHERE lg_usid = NEW.pt_usid 
        ORDER BY edtm DESC 
        LIMIT 1
    ) AS prev_balance;
END$$

-- TRIGGER 2: Auto-post ledger entry when payment allocation is inserted
CREATE TRIGGER tr_payment_alloc_insert_ledger
AFTER INSERT ON paPaymentAlloc
FOR EACH ROW
BEGIN
    DECLARE customer_id VARCHAR(15);
    DECLARE payment_amount DECIMAL(15,2);
    
    -- Get customer ID and payment amount from the payment record
    SELECT pt_usid, pt_amount INTO customer_id, payment_amount
    FROM ptPayment
    WHERE pt_ptid = NEW.pa_ptid;
    
    -- Insert ledger entry for allocation
    INSERT INTO lgLedger (
        lg_usid,
        lg_entry_type,
        lg_entry_ref,
        lg_amount,
        lg_opening_bal,
        lg_closing_bal,
        lg_pnid,
        lg_ptid,
        lg_paid,
        lg_fyear,
        lg_remarks,
        edtm,
        eby,
        mdtm,
        mby
    )
    SELECT
        customer_id,
        'CREDIT', -- Allocation is credit to PNR account
        CONCAT('ALLOC-', NEW.pa_paid),
        NEW.pa_amount,
        COALESCE(prev_balance.lg_closing_bal, 0) as lg_opening_bal,
        COALESCE(prev_balance.lg_closing_bal, 0) + NEW.pa_amount as lg_closing_bal,
        NEW.pa_pnid,
        NEW.pa_ptid,
        NEW.pa_paid,
        (SELECT pt_acct_period FROM ptPayment WHERE pt_ptid = NEW.pa_ptid),
        CONCAT('Payment allocation to PNR ', NEW.pa_pnr),
        NOW(),
        NEW.eby,
        NOW(),
        NEW.eby
    FROM (
        SELECT lg_closing_bal 
        FROM lgLedger 
        WHERE lg_usid = customer_id 
        ORDER BY edtm DESC 
        LIMIT 1
    ) AS prev_balance;
END$$

-- TRIGGER 3: Auto-update PNR status when allocation is inserted
CREATE TRIGGER tr_payment_alloc_update_pnr_status
AFTER INSERT ON paPaymentAlloc
FOR EACH ROW
BEGIN
    DECLARE total_paid DECIMAL(15,2);
    DECLARE total_amount DECIMAL(15,2);
    DECLARE pending_amount DECIMAL(15,2);
    
    -- Calculate total paid for this PNR
    SELECT COALESCE(SUM(pa_amount), 0) INTO total_paid
    FROM paPaymentAlloc
    WHERE pa_pnid = NEW.pa_pnid;
    
    -- Get total PNR amount
    SELECT pn_totamt INTO total_amount
    FROM pnPnr
    WHERE pn_pnid = NEW.pa_pnid;
    
    -- Calculate pending amount
    SET pending_amount = total_amount - total_paid;
    
    -- Update PNR status based on payment status
    UPDATE pnPnr
    SET 
        pn_paidamt = total_paid,
        pn_pendingamt = pending_amount,
        pn_payment_status = CASE 
            WHEN pending_amount <= 0 AND total_paid > 0 THEN 'PAID'
            WHEN pending_amount > 0 AND total_paid > 0 THEN 'PARTIAL'
            ELSE 'UNPAID'
        END,
        mdtm = NOW(),
        mby = (SELECT eby FROM paPaymentAlloc WHERE pa_paid = NEW.pa_paid LIMIT 1)
    WHERE pn_pnid = NEW.pa_pnid;
END$$

-- TRIGGER 4: Auto-update payment unallocated amount when allocation is inserted
CREATE TRIGGER tr_payment_alloc_update_payment
AFTER INSERT ON paPaymentAlloc
FOR EACH ROW
BEGIN
    DECLARE total_allocated DECIMAL(15,2);
    
    -- Calculate total allocated for this payment
    SELECT COALESCE(SUM(pa_amount), 0) INTO total_allocated
    FROM paPaymentAlloc
    WHERE pa_ptid = NEW.pa_ptid;
    
    -- Update payment record
    UPDATE ptPayment
    SET 
        pt_unallocated_amt = pt_amount - total_allocated,
        pt_status = CASE 
            WHEN (pt_amount - total_allocated) <= 0 THEN 'ADJUSTED'
            ELSE 'RECEIVED'
        END,
        mdtm = NOW(),
        mby = NEW.eby
    WHERE pt_ptid = NEW.pa_ptid;
END$$

-- TRIGGER 5: Handle refund entries (negative allocations)
CREATE TRIGGER tr_payment_alloc_refund_ledger
AFTER INSERT ON paPaymentAlloc
FOR EACH ROW
BEGIN
    -- If this is a refund (negative amount), create debit entry
    IF NEW.pa_amount < 0 THEN
        INSERT INTO lgLedger (
            lg_usid,
            lg_entry_type,
            lg_entry_ref,
            lg_amount,
            lg_opening_bal,
            lg_closing_bal,
            lg_pnid,
            lg_ptid,
            lg_paid,
            lg_fyear,
            lg_remarks,
            edtm,
            eby,
            mdtm,
            mby
        )
        SELECT
            (SELECT pt_usid FROM ptPayment WHERE pt_ptid = NEW.pa_ptid),
            'DEBIT', -- Refund is debit (money going out)
            CONCAT('REFUND-', NEW.pa_paid),
            ABS(NEW.pa_amount),
            COALESCE(prev_balance.lg_closing_bal, 0) as lg_opening_bal,
            COALESCE(prev_balance.lg_closing_bal, 0) - ABS(NEW.pa_amount) as lg_closing_bal,
            NEW.pa_pnid,
            NEW.pa_ptid,
            NEW.pa_paid,
            (SELECT pt_acct_period FROM ptPayment WHERE pt_ptid = NEW.pa_ptid),
            CONCAT('Refund for PNR ', NEW.pa_pnr),
            NOW(),
            NEW.eby,
            NOW(),
            NEW.eby
        FROM (
            SELECT lg_closing_bal 
            FROM lgLedger 
            WHERE lg_usid = (SELECT pt_usid FROM ptPayment WHERE pt_ptid = NEW.pa_ptid)
            ORDER BY edtm DESC 
            LIMIT 1
        ) AS prev_balance;
    END IF;
END$$

DELIMITER ;