const cron = require('node-cron');
const { Op } = require('sequelize');
const { Pnr } = require('../models');
const { syncPnrStatus } = require('../services/pnrSyncService');

/**
 * Request 1: Initial Capture
 * Runs every 15 minutes. 
 * Looks for newly entered PNRs (departure_time is null) and captures their initial status.
 */
const syncNewPnrs = async () => {
  try {
    const newPnrs = await Pnr.findAll({
      where: {
        pn_pnrnum: { [Op.ne]: null },
        pn_departure_time: null
      }
    });

    for (const pnr of newPnrs) {
      await new Promise(r => setTimeout(r, 1000)); // Rate limiting
      await syncPnrStatus(pnr.pn_pnrnum);
    }
  } catch (error) {
    console.error('Error syncing new PNRs:', error);
  }
};

/**
 * Request 2: Pre-Departure Check
 * Runs every 30 minutes. 
 * Looks for PNRs exactly 4 hours before their recorded departure time, 
 * ensuring it hasn't been auto-synced for chart prep yet (pn_chartdt is null).
 */
const syncPreDeparturePnrs = async () => {
  try {
    const now = new Date();
    
    // We want to trigger if the departure time is within the next 4 hours
    // Or if the departure time has passed (within the last 6 hours) but we missed it
    const upperLimit = new Date(now.getTime() + (4.5 * 60 * 60 * 1000)); // Now + 4.5 hours
    const lowerLimit = new Date(now.getTime() - (6 * 60 * 60 * 1000));   // Now - 6 hours

    const upcomingPnrs = await Pnr.findAll({
      where: {
        pn_pnrnum: { [Op.ne]: null },
        pn_chartdt: null, // Ensure we only do this once
        pn_departure_time: {
          [Op.between]: [lowerLimit, upperLimit]
        }
      }
    });

    for (const pnr of upcomingPnrs) {
      await new Promise(r => setTimeout(r, 1000));
      const res = await syncPnrStatus(pnr.pn_pnrnum);
      
      // Mark this automated chart sync as complete regardless of success,
      // so it doesn't loop infinitely and drain the 5-request quota.
      if (res) {
        await Pnr.update(
          { pn_chartdt: new Date() },
          { where: { pn_pnrnum: pnr.pn_pnrnum } }
        );
      }
    }
  } catch (error) {
    console.error('Error syncing pre-departure PNRs:', error);
  }
};

const initCronJobs = () => {
  console.log('Initializing Cost-Optimized PNR Tracking Cron Jobs (Max 5 Limit)...');

  // Sync pre-departure PNRs every 30 minutes (minute 0 and 30)
  cron.schedule('*/30 * * * *', () => {
    console.log('Running pre-departure PNR sync job (Automatic Request 2)...');
    syncPreDeparturePnrs();
  });

  // Sync new PNRs every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    console.log('Running initial capture PNR sync job (Automatic Request 1)...');
    syncNewPnrs();
  });
};

module.exports = {
  initCronJobs
};
