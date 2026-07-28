const fs = require('fs');
let code = fs.readFileSync('src/controllers/billingController.js', 'utf8');

const oldBlock = `    const childBills = [];
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
    }`;

const newBlock = `    const childBills = [];
    const parentBaseNo = parentBill.bl_bill_no || parentBill.bl_entry_no;
    const parentTotalForRatio = parseFloat(parentBill.bl_total_amount) || 1;
    
    // Fetch all passengers linked to this bill for auto-distribution
    let allPassengers = [];
    try {
      const [rows] = await sequelizeTVL.query(
        \`SELECT ps_psid FROM psXpassenger WHERE bl_bill_no = :billNo\`,
        { replacements: { billNo: parentBill.bl_entry_no || parentBill.bl_bill_no }, transaction }
      );
      allPassengers = rows.map(r => r.ps_psid);
    } catch (e) { /* passengers may not exist */ }

    const paxPerSplit = allPassengers.length > 0 ? Math.floor(allPassengers.length / splits.length) : 0;
    let remainingPax = [...allPassengers];

    for (let i = 0; i < splits.length; i++) {
      const split = splits[i];
      const splitAmount = parseFloat(split.amount);
      const ratio = parentTotalForRatio > 0 ? splitAmount / parentTotalForRatio : 1 / splits.length;
      
      const billData = parentBill.toJSON();
      delete billData.bl_id;
      
      const suffix = String.fromCharCode(65 + i); // A, B, C...
      billData.bl_entry_no = \`\${parentBill.bl_entry_no}-\${suffix}\`;
      billData.bl_sub_bill_no = \`\${parentBaseNo}-\${suffix}\`;
      billData.bl_bill_no = parentBill.bl_bill_no;
      billData.bl_total_amount = splitAmount;
      billData.bl_parent_bill_id = parentBill.bl_id;
      billData.bl_is_split = false;
      
      // Distribute financial fields proportionally
      const financialFields = [
        'bl_railway_fare', 'bl_sb_incentive', 'bl_service_charge',
        'bl_platform_fee', 'bl_misc_charges', 'bl_delivery_charge',
        'bl_gst', 'bl_surcharge', 'bl_discount', 'bl_advance_amount',
        'bl_cancellation_charges'
      ];
      financialFields.forEach(field => {
        const val = parseFloat(parentBill[field] || 0);
        billData[field] = Math.round(val * ratio * 100) / 100;
      });

      const childBill = await BillTVL.create(billData, { transaction });
      childBills.push(childBill);

      // Determine which passengers go to this split
      const assignedPaxIds = split.passengerIds && split.passengerIds.length > 0
        ? split.passengerIds
        : (i === splits.length - 1
            ? remainingPax.splice(0)
            : remainingPax.splice(0, paxPerSplit));

      if (assignedPaxIds && assignedPaxIds.length > 0) {
        await sequelizeTVL.query(
          \`UPDATE psXpassenger SET bl_bill_no = :subBillNo WHERE ps_psid IN (:passengerIds)\`,
          {
            replacements: { subBillNo: childBill.bl_entry_no, passengerIds: assignedPaxIds },
            transaction
          }
        );
      }
    }`;

if (code.includes(oldBlock)) {
  code = code.replace(oldBlock, newBlock);
  fs.writeFileSync('src/controllers/billingController.js', code);
  console.log('Backend split logic patched successfully');
} else {
  console.log('Could not find old block - attempting partial match');
  // Check partial match
  const partial = 'billData.bl_railway_fare = 0;';
  console.log('Contains partial:', code.includes(partial));
}
