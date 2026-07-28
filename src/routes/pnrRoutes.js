const express = require('express');
const router = express.Router();
const pnrController = require('../controllers/pnrController');

// Manual PNR Sync route
router.post('/:pnrNumber/sync', pnrController.syncPnr);

module.exports = router;
