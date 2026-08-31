const { ServiceCharge, ServiceChargeDefault, CustomerTVL } = require('../models');
const { Op } = require('sequelize');

/**
 * Service Charge Resolution Engine
 * Matches customer-specific or default rules and calculates the final charge.
 */
class ServiceChargeService {
  /**
   * Resolves and calculates the service charge for a given context.
   * @param {Object} options - { customerId, serviceType, travelClass, passengerCount, baseFare }
   * @returns {Promise<number>} The calculated service charge amount
   */
  async getServiceCharge({ customerId, serviceType, travelClass, passengerCount, baseFare = 0 }) {
    console.log(`🔍 Resolving service charge: Customer=${customerId}, Type=${serviceType}, Class=${travelClass}, Pax=${passengerCount}`);
    
    // Normalize travelClass
    const normalizedClass = (travelClass || '').toUpperCase();
    const classAliases = {
      '3A': '3AC', '3AC': '3AC',
      '2A': '2AC', '2AC': '2AC',
      '1A': '1AC', '1AC': '1AC',
      'SL': 'SL',
      'CC': 'CC',
      'EC': 'EC',
      'FC': 'FC',
      '2S': '2S'
    };
    const targetClass = classAliases[normalizedClass] || normalizedClass;
    const typeKey = (serviceType || 'RESERVATION').toLowerCase() === 'cancellation' ? 'cancellation' : 'reservation';

    // 1. Direct matrix lookup from CustomerTVL.cu_servicecharge_config
    if (customerId) {
      try {
        const customer = await CustomerTVL.findOne({
          where: {
            [Op.or]: [
              { cu_cusid: customerId },
              { cu_usid: customerId },
              { cu_custno: customerId }
            ]
          }
        });

        if (customer && customer.cu_servicecharge_config) {
          let config = customer.cu_servicecharge_config;
          if (typeof config === 'string') {
            try { config = JSON.parse(config); } catch (e) { config = null; }
          }

          if (config && config[typeKey] && config[typeKey][targetClass]) {
            const row = config[typeKey][targetClass];
            const paxIndex = Math.min(Math.max(parseInt(passengerCount) - 1, 0), 5);
            const val = parseFloat(row.pax?.[paxIndex] ?? row.pax?.[0] ?? 0);

            if (val > 0) {
              if (row.type === 'PERCENTAGE' && baseFare > 0) {
                const calculated = (baseFare * val) / 100;
                console.log(`✅ Matched Customer Matrix PERCENTAGE: ${val}% of ${baseFare} = ${calculated}`);
                return calculated;
              }
              console.log(`✅ Matched Customer Matrix FLAT: ${val}`);
              return val;
            }
          }
        }
      } catch (err) {
        console.warn('Matrix lookup fallback to standard rules:', err.message);
      }
    }

    // 2. Try to find customer-specific rules from ServiceCharge table
    let rules = await ServiceCharge.findAll({
      where: {
        customer_id: customerId,
        service_type: serviceType,
        travel_class: targetClass === '3AC' ? '3A' : targetClass === '2AC' ? '2A' : targetClass === '1AC' ? '1A' : targetClass,
        is_active: true
      }
    });

    // 3. Fallback to default rules if no customer rule found
    if (!rules || rules.length === 0) {
      console.log('ℹ️ No customer-specific rules found, checking defaults...');
      rules = await ServiceChargeDefault.findAll({
        where: {
          service_type: serviceType,
          travel_class: targetClass === '3AC' ? '3A' : targetClass === '2AC' ? '2A' : targetClass === '1AC' ? '1A' : targetClass,
          is_active: true
        }
      });
    }

    if (!rules || rules.length === 0) {
      console.log('⚠️ No matching service charge rules found (Default or Customer).');
      return 0;
    }

    // 3. Match the specific rule based on passenger range
    // Sort by range width (narrowest first) to fulfill "most specific" requirement
    const matchedRule = rules
      .filter(rule => 
        passengerCount >= rule.passenger_min && 
        (rule.passenger_max === null || passengerCount <= rule.passenger_max)
      )
      .sort((a, b) => {
        const rangeA = a.passenger_max === null ? Infinity : (a.passenger_max - a.passenger_min);
        const rangeB = b.passenger_max === null ? Infinity : (b.passenger_max - b.passenger_min);
        return rangeA - rangeB;
      })[0];

    if (!matchedRule) {
      console.log(`⚠️ No rule matched for passenger count: ${passengerCount}`);
      return 0;
    }

    // 4. Calculate final amount based on charge_mode
    const amount = parseFloat(matchedRule.amount);
    if (matchedRule.charge_mode === 'FIXED') {
      console.log(`✅ Matched FIXED rule: ${amount}`);
      return amount;
    } else if (matchedRule.charge_mode === 'PER_PASSENGER') {
      const total = amount * passengerCount;
      console.log(`✅ Matched PER_PASSENGER rule: ${amount} * ${passengerCount} = ${total}`);
      return total;
    }

    return 0;
  }
}

module.exports = new ServiceChargeService();
