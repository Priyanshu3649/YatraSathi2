const deleteBill = async (req, res) => {
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

    Audit.logAction({
      module: Audit.MODULES.BILLING,
      recordId: bill.bl_id,
      action: Audit.ACTIONS.DELETE,
      req,
      reason: 'Soft deleted by user'
    });

    await transaction.commit();
    res.json({ success: true, message: 'Bill deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};
