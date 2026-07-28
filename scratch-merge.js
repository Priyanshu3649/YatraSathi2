const mergeBill = async (req, res) => {
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

    // Generate a new Super Bill ID. We can use Date.now() or a dedicated sequence table.
    // For simplicity, generate a unique numeric ID based on timestamp
    const superBillId = Date.now();

    for (const b of bills) {
      if (b.status === 'CANCELLED' || b.status === 'CAN') throw new Error(`Bill ${b.bl_id} is cancelled`);
      if (b.is_deleted) throw new Error(`Bill ${b.bl_id} is deleted`);
      
      b.super_bill_id = superBillId;
      await b.save({ transaction });
      
      Audit.logAction({
        module: Audit.MODULES.BILLING,
        recordId: b.bl_id,
        action: Audit.ACTIONS.UPDATE,
        req,
        fieldName: 'super_bill_id',
        oldValue: null,
        newValue: superBillId,
        reason: `Merged for printing under Super Bill ${superBillId}`
      });
    }

    await transaction.commit();
    
    // Instead of generating a new physical bill record, we just return the superBillId
    // The frontend can then call a print API with this superBillId to generate the PDF
    res.json({ success: true, message: 'Bills merged for printing', superBillId });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};
