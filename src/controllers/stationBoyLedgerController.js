const stationBoyLedgerService = require('../services/stationBoyLedgerService');

const getLedger = async (req, res) => {
  try {
    const { id } = req.params;
    const { fromDate, toDate } = req.query;

    const ledger = await stationBoyLedgerService.getStationBoyVintageLedger(id, fromDate, toDate);

    res.json(ledger);
  } catch (error) {
    console.error('Error fetching station boy ledger:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLedger
};
