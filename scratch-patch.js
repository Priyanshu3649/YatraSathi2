const fs = require('fs');

const code = fs.readFileSync('src/controllers/billingController.js', 'utf8');

const replacement = `
const splitBill = async (req, res) => {
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
      billData.bl_entry_no = \`\${parentBill.bl_entry_no}-\${suffix}\`;
      billData.bl_sub_bill_no = \`\${parentBaseNo}-\${suffix}\`;
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
          \`UPDATE psXpassenger SET bl_bill_no = :subBillNo WHERE ps_psid IN (:passengerIds)\`,
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
        reason: \`Split into \${splits.length} bills\`
      });
    }

    await transaction.commit();
    res.json({ success: true, message: 'Bill split successfully', childBills });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};

const mergeBill = async (req, res) => {
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
      if (b.status === 'CANCELLED' || b.status === 'CAN') throw new Error(\`Bill \${b.bl_id} is cancelled\`);
      if (b.is_deleted) throw new Error(\`Bill \${b.bl_id} is deleted\`);
      
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
          reason: \`Merged for printing under Super Bill \${superBillId}\`
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

const deleteBill = async (req, res) => {
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
`;

let newCode = code.replace(/const splitBill = async \(req, res\) => \{[\s\S]*?\n\};\n\nconst mergeBill = async \(req, res\) => \{[\s\S]*?\n\};/, replacement);
// We also need to inject deleteBill. It might already exist in code.
// Let's check if we can replace deleteBill.
newCode = newCode.replace(/const deleteBill = async \(req, res\) => \{[\s\S]*?\n\};/, '');

fs.writeFileSync('src/controllers/billingController.js', newCode);
