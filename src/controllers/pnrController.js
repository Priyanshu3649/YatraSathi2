const { syncPnrStatus } = require('../services/pnrSyncService');

/**
 * Manually trigger a PNR status sync from the frontend
 */
exports.syncPnr = async (req, res) => {
  try {
    const { pnrNumber } = req.params;
    
    if (!pnrNumber || pnrNumber.length !== 10) {
      return res.status(400).json({ success: false, message: 'Invalid PNR number' });
    }

    const result = await syncPnrStatus(pnrNumber);
    
    if (result.success) {
      res.json({ success: true, status: result.status, message: 'PNR synced successfully!' });
    } else {
      res.status(500).json({ success: false, message: result.error || 'Failed to sync PNR' });
    }
  } catch (error) {
    console.error('Manual sync PNR error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during sync' });
  }
};
