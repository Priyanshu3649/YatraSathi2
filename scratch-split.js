const splitBill = async (req, res) => {
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
    for (let i = 0; i < splits.length; i++) {
      const split = splits[i];
      
      const billData = parentBill.toJSON();
      delete billData.bl_id; // Remove primary key
      
      // Use alphabetical suffix: A, B, C...
      const suffix = String.fromCharCode(65 + i);
      const parentBaseNo = parentBill.bl_bill_no || parentBill.bl_entry_no;
      billData.bl_entry_no = `${parentBill.bl_entry_no}-${suffix}`;
      billData.bl_sub_bill_no = `${parentBaseNo}-${suffix}`;
      // Do not change bl_bill_no so it stays the same base ID, or wait...
      // The requirement says: Sub Bill No is [Bill ID]-A. Bill ID is strictly numeric immutable ID.
      // So bl_bill_no is the base ID, bl_sub_bill_no is [bl_bill_no]-[suffix]
      billData.bl_bill_no = parentBill.bl_bill_no; 
      billData.bl_total_amount = split.amount;
      billData.bl_parent_bill_id = parentBill.bl_id;
      billData.bl_is_split = false; // The children themselves are not split
      
      // Zero out structural charges so the total adds up cleanly without confusion
      billData.bl_railway_fare = 0;
      billData.bl_sb_incentive = 0;
      billData.bl_service_charge = 0;
      billData.bl_platform_fee = 0;
      billData.bl_misc_charges = 0;
      billData.bl_delivery_charge = 0;
      billData.bl_gst = 0;
      billData.bl_surcharge = 0;
      billData.bl_discount = 0;
      billData.bl_advance_amount = 0; // Don't duplicate advances

      const childBill = await BillTVL.create(billData, { transaction });
      childBills.push(childBill);

      // Update passengers to map to this sub-bill
      if (split.passengerIds && split.passengerIds.length > 0) {
        await sequelizeTVL.query(
          `UPDATE psXpassenger SET bl_bill_no = :subBillNo WHERE ps_psid IN (:passengerIds)`,
          {
            replacements: { subBillNo: childBill.bl_sub_bill_no, passengerIds: split.passengerIds },
            transaction
          }
        );
      }
    }
    
    parentBill.bl_is_split = true;
    parentBill.status = 'Disabled'; // hide parent bill
    await parentBill.save({ transaction });
    
    // Log Forensic Audit
    Audit.logAction({
      module: Audit.MODULES.BILLING,
      recordId: parentBill.bl_id,
      action: Audit.ACTIONS.UPDATE,
      req,
      fieldName: 'bl_is_split',
      oldValue: false,
      newValue: true,
      reason: `Split into ${splits.length} bills`
    });

    await transaction.commit();
    res.json({ success: true, message: 'Bill split successfully', childBills });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};
