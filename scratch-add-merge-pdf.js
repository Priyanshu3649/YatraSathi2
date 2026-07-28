const fs = require('fs');
let code = fs.readFileSync('src/controllers/billingController.js', 'utf8');

const mergeController = `
const { generateMergedBillsPDF } = require('../utils/mergedBillPdfGenerator');

/**
 * POST /api/billing/merge-pdf
 * Body: { billIds: [1, 2, 3] }
 * Generates a combined PDF for selected bills WITHOUT modifying any DB records.
 */
const mergeBillsPDF = async (req, res) => {
  try {
    const { billIds } = req.body;

    if (!billIds || !Array.isArray(billIds) || billIds.length < 1) {
      return res.status(400).json({ success: false, error: 'Provide at least 1 bill ID in billIds array' });
    }
    if (billIds.length > 50) {
      return res.status(400).json({ success: false, error: 'Cannot merge more than 50 bills at once' });
    }

    // Fetch all bills (no DB modification — read-only)
    const bills = await BillTVL.findAll({ where: { bl_id: billIds } });

    if (bills.length === 0) {
      return res.status(404).json({ success: false, error: 'No bills found for the provided IDs' });
    }

    // Sort bills in the order requested
    const billMap = new Map(bills.map(b => [b.bl_id, b]));
    const orderedBills = billIds
      .map(id => billMap.get(id) || billMap.get(parseInt(id)))
      .filter(Boolean);

    // Build payload for each bill (parallel fetch)
    const payloads = await Promise.all(
      orderedBills.map(async (bill) => {
        const booking = bill.bl_booking_id ? await BookingTVL.findByPk(bill.bl_booking_id) : null;
        return getBillPrintPayload(bill, booking, req.user);
      })
    );

    // Generate the merged PDF (pure generation, no DB writes)
    const pdfBuffer = await generateMergedBillsPDF(payloads);

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = 'Merged_Bills_' + timestamp + '_' + billIds.length + 'bills.pdf';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('X-Merge-Bill-Count', billIds.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('mergeBillsPDF error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate merged PDF' });
  }
};
`;

// Inject before module.exports
const exportMarker = 'module.exports = {';
if (code.includes(mergeController.trim().substring(0, 40))) {
  console.log('Already patched');
} else {
  code = code.replace(exportMarker, mergeController + '\n' + exportMarker);
  // Also add mergeBillsPDF to exports
  code = code.replace(
    'getCancellationHistory\n};',
    'getCancellationHistory,\n  mergeBillsPDF\n};'
  );
  fs.writeFileSync('src/controllers/billingController.js', code);
  console.log('mergeBillsPDF controller added successfully');
}
