const fs = require('fs');

let code = fs.readFileSync('src/controllers/billingController.js', 'utf8');

const newCodeToAppend = `

// --- V2 IMPLEMENTATIONS ---
const fetchBookingForBilling = async (req, res) => {
  const { BookingTVL, PassengerTVL } = require('../models');
  try {
    const { id } = req.params;
    const isPnr = isNaN(id) || id.length === 10;
    
    let booking;
    if (isPnr) {
      booking = await BookingTVL.findOne({ where: { bk_pnr: id } });
    } else {
      booking = await BookingTVL.findByPk(id);
    }
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking or PNR not found' });
    }
    
    const passengers = await PassengerTVL.findAll({
      where: { ps_bkid: booking.bk_bkid, ps_active: 1 }
    });
    
    const data = {
      bl_booking_id: booking.bk_bkid,
      bl_pnr: booking.bk_pnr,
      bl_customer_name: booking.bk_contact_name || (passengers[0] ? \\\`\\\${passengers[0].ps_fname} \\\${passengers[0].ps_lname}\\\`.trim() : ''),
      bl_customer_phone: booking.bk_contact_phone || '',
      bl_from_station: booking.bk_src || '',
      bl_to_station: booking.bk_dest || '',
      bl_train_no: booking.bk_train || '',
      bl_class: booking.bk_class || '',
      bl_journey_date: booking.bk_date,
      passengers: passengers.map(p => ({
        id: p.ps_psid,
        name: \\\`\\\${p.ps_fname} \\\${p.ps_lname}\\\`.trim(),
        coach: p.ps_coach,
        berth: p.ps_berthalloc || p.ps_berthpref
      }))
    };
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const splitBillV2 = async (req, res) => {
  const { sequelizeTVL, BillTVL, PassengerTVL, ForensicAuditLog, Ledger } = require('../models');
  const Audit = require('../utils/auditLog');
  const transaction = await sequelizeTVL.transaction();
  try {
    const { id } = req.params;
    const { splits } = req.body;
    
    if (!splits || splits.length < 2) {
      throw new Error('Must provide at least 2 split groups');
    }

    const parentBill = await BillTVL.findByPk(id, { transaction });
    if (!parentBill) throw new Error('Bill not found');
    if (parentBill.status === 'CANCELLED' || parentBill.status === 'CAN') throw new Error('Cannot split cancelled bill');
    if (parentBill.bl_is_split) throw new Error('Bill is already split');
    if (parentBill.is_deleted) throw new Error('Cannot split deleted bill');
    
    const parentTotal = parseFloat(parentBill.bl_total_amount);
    const splitTotal = splits.reduce((sum, s) => sum + parseFloat(s.amount), 0);
    
    if (Math.abs(parentTotal - splitTotal) > 0.01) {
      throw new Error('Split amounts must equal the original bill amount');
    }

    const childBills = [];
    const parentBaseNo = parentBill.bl_bill_no || parentBill.bl_entry_no;
    
    for (let i = 0; i < splits.length; i++) {
      const split = splits[i];
      
      const billData = parentBill.toJSON();
      delete billData.bl_id;
      
      const suffix = String.fromCharCode(65 + i);
      billData.bl_entry_no = \\\`\\\${parentBill.bl_entry_no}-\\\${suffix}\\\`;
      billData.bl_sub_bill_no = \\\`\\\${parentBaseNo}-\\\${suffix}\\\`;
      billData.bl_bill_no = parentBill.bl_bill_no; 
      billData.bl_total_amount = split.amount;
      billData.bl_parent_bill_id = parentBill.bl_id;
      billData.bl_is_split = false; 
      
      billData.bl_railway_fare = 0;
      billData.bl_sb_incentive = 0;
      billData.bl_service_charge = 0;
      billData.bl_platform_fee = 0;
      billData.bl_misc_charges = 0;
      billData.bl_delivery_charge = 0;
      billData.bl_gst = 0;
      billData.bl_surcharge = 0;
      billData.bl_discount = 0;
      billData.bl_advance_amount = 0;

      const childBill = await BillTVL.create(billData, { transaction });
      childBills.push(childBill);

      if (split.passengerIds && split.passengerIds.length > 0) {
        await sequelizeTVL.query(
          \\\`UPDATE psXpassenger SET bl_bill_no = :subBillNo WHERE ps_psid IN (:passengerIds)\\\`,
          {
            replacements: { subBillNo: childBill.bl_sub_bill_no, passengerIds: split.passengerIds },
            transaction
          }
        );
      }
    }
    
    parentBill.bl_is_split = true;
    parentBill.status = 'Disabled'; 
    parentBill.is_deleted = 1;
    await parentBill.save({ transaction });
    
    if (Audit && Audit.logAction) {
      Audit.logAction({
        module: Audit.MODULES?.BILLING || 'BILLING',
        recordId: parentBill.bl_id,
        action: Audit.ACTIONS?.UPDATE || 'UPDATE',
        req,
        fieldName: 'bl_is_split',
        oldValue: false,
        newValue: true,
        reason: \\\`Split into \\\${splits.length} bills\\\`
      });
    }

    await transaction.commit();
    res.json({ success: true, message: 'Bill split successfully', childBills });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};

const mergeBillV2 = async (req, res) => {
  const { sequelizeTVL, BillTVL } = require('../models');
  const Audit = require('../utils/auditLog');
  const transaction = await sequelizeTVL.transaction();
  try {
    const { billIds } = req.body;
    if (!billIds || billIds.length < 2) {
      throw new Error('Must provide at least 2 bill IDs to merge');
    }

    const bills = await BillTVL.findAll({
      where: { bl_id: billIds },
      transaction
    });

    if (bills.length !== billIds.length) {
      throw new Error('One or more bills not found');
    }
    
    const customerNames = [...new Set(bills.map(b => b.bl_customer_name))];
    if (customerNames.length > 1) {
      throw new Error('Cannot merge bills belonging to different customers');
    }

    const superBillId = Date.now();

    for (const b of bills) {
      if (b.status === 'CANCELLED' || b.status === 'CAN') throw new Error(\\\`Bill \\\${b.bl_id} is cancelled\\\`);
      if (b.is_deleted) throw new Error(\\\`Bill \\\${b.bl_id} is deleted\\\`);
      
      b.super_bill_id = superBillId;
      await b.save({ transaction });
      
      if (Audit && Audit.logAction) {
        Audit.logAction({
          module: Audit.MODULES?.BILLING || 'BILLING',
          recordId: b.bl_id,
          action: Audit.ACTIONS?.UPDATE || 'UPDATE',
          req,
          fieldName: 'super_bill_id',
          oldValue: null,
          newValue: superBillId,
          reason: \\\`Merged for printing under Super Bill \\\${superBillId}\\\`
        });
      }
    }

    await transaction.commit();
    res.json({ success: true, message: 'Bills merged for printing', superBillId });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteBillV2 = async (req, res) => {
  const { sequelizeTVL, BillTVL } = require('../models');
  const Audit = require('../utils/auditLog');
  const transaction = await sequelizeTVL.transaction();
  try {
    const { id } = req.params;
    const bill = await BillTVL.findByPk(id, { transaction });
    
    if (!bill) throw new Error('Bill not found');
    if (bill.status === 'CANCELLED' || bill.status === 'CAN') {
      throw new Error('Cannot delete a cancelled bill');
    }
    if (bill.is_deleted) {
      throw new Error('Bill is already deleted');
    }

    bill.status = 'Disabled';
    bill.is_deleted = 1;
    await bill.save({ transaction });

    if (Audit && Audit.logAction) {
      Audit.logAction({
        module: Audit.MODULES?.BILLING || 'BILLING',
        recordId: bill.bl_id,
        action: Audit.ACTIONS?.DELETE || 'DELETE',
        req,
        reason: 'Soft deleted by user'
      });
    }

    await transaction.commit();
    res.json({ success: true, message: 'Bill deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};

const cancelBillV2 = async (req, res) => {
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

    const cancelData = {
      railwayCharges: railChg,
      agentCharges: agentChg,
      totalCancelCharges: totalCancel,
      refundAmount,
      cancelledPassengers, 
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
    bill.is_deleted = 1; 
    
    await bill.save({ transaction });

    if (cancelledPassengers.length > 0) {
      await sequelizeTVL.query(
        \\\`UPDATE psXpassenger SET bl_bill_no = NULL WHERE ps_psid IN (:passengerIds)\\\`,
        {
          replacements: { passengerIds: cancelledPassengers },
          transaction
        }
      );
    }
    
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
          lg_particulars: \\\`Refund for Cancelled Bill \\\${bill.bl_bill_no}\\\`,
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
};
`;

// Inject into module.exports
let exportBlock = code.substring(code.lastIndexOf('module.exports = {'));
exportBlock = exportBlock.replace('splitBill,', 'splitBill: splitBillV2,')
                        .replace('mergeBill,', 'mergeBill: mergeBillV2,')
                        .replace('deleteBill,', 'deleteBill: deleteBillV2,')
                        .replace('cancelBill,', 'cancelBill: cancelBillV2,')
                        .replace('module.exports = {', 'module.exports = {\n  fetchBookingForBilling,');

code = code.substring(0, code.lastIndexOf('module.exports = {')) + newCodeToAppend + exportBlock;

fs.writeFileSync('src/controllers/billingController.js', code);
