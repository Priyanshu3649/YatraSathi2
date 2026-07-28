const fs = require('fs');
let code = fs.readFileSync('src/controllers/billingController.js', 'utf8');

const cancelReplacement = `const cancelBill = async (req, res) => {
  const { sequelizeTVL, BillTVL, PassengerTVL, Receipt, Ledger, BookingTVL } = require('../models');
  const CustomerLedgerService = require('../services/CustomerLedgerService');
  const Audit = require('../utils/auditLog');
  const transaction = await sequelizeTVL.transaction();
  
  try {
    const { id } = req.params;
    const { railwayCharges, agentCharges, cancelledPassengers, reason } = req.body;
    
    if (!cancelledPassengers || cancelledPassengers.length === 0) {
      throw new Error('At least one passenger must be selected for cancellation');
    }
    if (railwayCharges === undefined || agentCharges === undefined) {
      throw new Error('Railway and Agent cancellation charges are required');
    }
    
    const bill = await BillTVL.findByPk(id, { transaction });
    if (!bill) throw new Error('Bill not found');
    if (bill.status !== 'OPEN' && bill.status !== 'FINAL') {
      throw new Error('Only active bills can be cancelled');
    }
    
    const railChg = parseFloat(railwayCharges) || 0;
    const agentChg = parseFloat(agentCharges) || 0;
    const totalCancel = railChg + agentChg;
    const originalTotal = parseFloat(bill.bl_total_amount);
    
    if (totalCancel > originalTotal) {
      throw new Error('Cancellation charges cannot exceed original bill amount');
    }
    
    const refundAmount = originalTotal - totalCancel;

    // Attach cancellation form data
    const cancelData = {
      railwayCharges: railChg,
      agentCharges: agentChg,
      totalCancelCharges: totalCancel,
      refundAmount,
      cancelledPassengers, // Array of passenger IDs
      reason
    };

    bill.status = 'CANCELLED';
    bill.bl_status = 'CANCELLED';
    bill.is_cancelled = 1;
    bill.cancellation_data = cancelData;
    bill.bl_railway_cancellation_charge = railChg;
    bill.bl_agent_cancellation_charge = agentChg;
    bill.total_cancel_charges = totalCancel;
    bill.refund_amount = refundAmount;
    bill.is_deleted = 1; // Requirement: "Remove the original active bill from active billing record views"
    
    await bill.save({ transaction });

    // Update passengers
    if (cancelledPassengers.length > 0) {
      await sequelizeTVL.query(
        \`UPDATE psXpassenger SET bl_bill_no = NULL WHERE ps_psid IN (:passengerIds)\`,
        {
          replacements: { passengerIds: cancelledPassengers },
          transaction
        }
      );
    }
    
    // YatraSathi Customer Ledger: Write REFUND entry
    try {
      const customerUsid = bill.bl_usid || bill.bl_customer_id;
      if (customerUsid && refundAmount > 0) {
        const lastLedger = await Ledger.findOne({
          where: { lg_usid: customerUsid },
          order: [['lg_lgid', 'DESC']],
          transaction
        });
        const openingBal = lastLedger ? parseFloat(lastLedger.lg_closing_bal) || 0 : 0;
        const closingBal = openingBal + refundAmount;
        
        await Ledger.create({
          lg_usid: customerUsid,
          lg_date: new Date(),
          lg_particulars: \`Refund for Cancelled Bill \${bill.bl_bill_no}\`,
          lg_credit: refundAmount,
          lg_debit: 0,
          lg_opening_bal: openingBal,
          lg_closing_bal: closingBal,
          lg_ref_no: bill.bl_bill_no,
          lg_ref_type: 'BILL_REFUND'
        }, { transaction });
      }
    } catch (ledgerErr) {
      console.error('Ledger error on cancel:', ledgerErr);
    }

    if (typeof Audit !== 'undefined' && Audit.logAction) {
      Audit.logAction({
        module: Audit.MODULES?.BILLING || 'BILLING',
        recordId: bill.bl_id,
        action: Audit.ACTIONS?.UPDATE || 'UPDATE',
        req,
        reason: 'Bill cancelled'
      });
    }

    await transaction.commit();
    res.json({ success: true, message: 'Bill cancelled successfully', refundAmount });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};`;

function replaceFunction(codeStr, funcName, newImpl, endSignature) {
  const startIdx = codeStr.indexOf(`const ${funcName} = async`);
  if (startIdx === -1) return codeStr;
  let endIdx = codeStr.indexOf(endSignature, startIdx);
  if (endIdx !== -1) {
    return codeStr.substring(0, startIdx) + newImpl + '\n\n' + codeStr.substring(endIdx);
  }
  return codeStr;
}

code = replaceFunction(code, 'cancelBill', cancelReplacement, 'const searchBills = async');
fs.writeFileSync('src/controllers/billingController.js', code);
