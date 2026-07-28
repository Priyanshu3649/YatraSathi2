require('dotenv').config();
const { configure, checkPNRStatus } = require('railkit');
const { Pnr, sequelizeTVL } = require('../models');

// Configure railkit
if (process.env.RAILKIT_API_KEY) {
  configure(process.env.RAILKIT_API_KEY);
}

/**
 * Syncs the PNR status for a given PNR number using the RailKit API
 * @param {string} pnrNumber - The 10-digit PNR number
 * @returns {Promise<Object>} Object indicating success and the new status
 */
const syncPnrStatus = async (pnrNumber) => {
  try {
    if (!pnrNumber || pnrNumber.length !== 10) {
      throw new Error("Invalid PNR number. Must be 10 digits.");
    }

    // 0. Check database limit first
    const pnrRecord = await Pnr.findOne({ where: { pn_pnrnum: pnrNumber } });
    
    if (pnrRecord) {
      if (pnrRecord.pn_api_request_count >= 5) {
        return { 
          success: false, 
          status: pnrRecord.pn_status,
          error: 'API_LIMIT_REACHED',
          message: 'Maximum API limit (5 requests) has been reached for this PNR.' 
        };
      }
    }

    // 1. Fetch from RailKit
    const result = await checkPNRStatus(pnrNumber);
    if (!result.success) {
      throw new Error(`RailKit API Error: ${result.error || 'Failed to fetch'}`);
    }

    // 2. Parse passengers to build a status string
    const data = result.data;
    let statusParts = [];
    
    // Add Chart status
    if (data.chart && data.chart.status) {
      statusParts.push(`[${data.chart.status}]`);
    }

    // Add passenger details
    if (data.passengers && data.passengers.length > 0) {
      data.passengers.forEach(p => {
        const details = p.current && p.current.details ? p.current.details : (p.current ? p.current.status : 'N/A');
        statusParts.push(`${p.serialNumber}: ${details}`);
      });
    }

    const finalStatusString = statusParts.join(' | ') || 'Status Unknown';

    // 3. Extract exact departure time
    let parsedDepartureTime = null;
    if (data.journey && data.journey.dateOfJourney) {
      const parsedDate = new Date(data.journey.dateOfJourney);
      if (!isNaN(parsedDate.getTime())) {
        parsedDepartureTime = parsedDate;
      }
    }

    // 4. Update the database (pnXpnr)
    if (pnrRecord) {
      const updateData = { 
        pn_status: finalStatusString,
        pn_api_request_count: (pnrRecord.pn_api_request_count || 0) + 1
      };
      
      // Only set departure time on the first sync if it doesn't already exist
      if (parsedDepartureTime && !pnrRecord.pn_departure_time) {
        updateData.pn_departure_time = parsedDepartureTime;
      }
      
      await Pnr.update(updateData, { where: { pn_pnrnum: pnrNumber } });
    } else {
      console.warn(`PNR ${pnrNumber} fetched successfully, but not found in the local database to update.`);
    }

    return { success: true, status: finalStatusString, updated: !!pnrRecord };
  } catch (error) {
    console.error(`Error syncing PNR ${pnrNumber}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  syncPnrStatus
};
