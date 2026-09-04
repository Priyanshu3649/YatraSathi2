const { ServiceCharge, ServiceChargeDefault, CustomerTVL } = require('../models');
const { Op } = require('sequelize');

/**
 * Service Charge Resolution Engine
 * Matches customer-specific or default rules and calculates the final charge.
 */
class ServiceChargeService {
  /**
   * Resolves and calculates the service charge for a given context.
   * @param {Object} options - { customerId, customerName, phone, serviceType, travelClass, passengerCount, baseFare }
   * @returns {Promise<number>} The calculated service charge amount
   */
  async getServiceCharge({ customerId, customerName, phone, serviceType = 'RESERVATION', travelClass = '3A', passengerCount = 1, baseFare = 0 }) {
    console.log(`🔍 Resolving service charge: CustomerId=${customerId}, CustomerName=${customerName}, Phone=${phone}, Type=${serviceType}, Class=${travelClass}, Pax=${passengerCount}`);
    
    // Normalize travelClass
    const normalizedClass = (travelClass || '').toUpperCase().trim();
    const classAliases = {
      '3A': '3AC', '3AC': '3AC', '3E': '3AC',
      '2A': '2AC', '2AC': '2AC',
      '1A': '1AC', '1AC': '1AC',
      'SL': 'SL', 'SLEEPER': 'SL',
      'CC': 'CC', 'CHAIR CAR': 'CC',
      'EC': 'EC', 'EXECUTIVE': 'EC',
      'FC': 'FC', 'FIRST CLASS': 'FC',
      '2S': '2S', 'SECOND SITTING': '2S'
    };
    const targetClass = classAliases[normalizedClass] || normalizedClass;
    const typeKey = (serviceType || 'RESERVATION').toLowerCase() === 'cancellation' ? 'cancellation' : 'reservation';
    const paxCount = Math.max(parseInt(passengerCount, 10) || 1, 1);

    // 1. Direct matrix lookup from CustomerTVL.cu_servicecharge_config
    let customer = null;
    const searchConditions = [];
    if (customerId) {
      searchConditions.push({ cu_cusid: customerId });
      searchConditions.push({ cu_usid: customerId });
      searchConditions.push({ cu_custno: customerId });
    }
    if (customerName) {
      searchConditions.push({ cu_name: customerName });
      searchConditions.push({ cu_name: { [Op.like]: `%${customerName}%` } });
      searchConditions.push({ us_fname: { [Op.like]: `%${customerName}%` } });
    }
    if (phone) {
      searchConditions.push({ us_phone: phone });
    }

    if (searchConditions.length > 0) {
      try {
        customer = await CustomerTVL.findOne({
          where: { [Op.or]: searchConditions }
        });
      } catch (err) {
        console.warn('Customer lookup in service charge error:', err.message);
      }
    }

    if (customer && customer.cu_servicecharge_config) {
      let config = customer.cu_servicecharge_config;
      if (typeof config === 'string') {
        try { config = JSON.parse(config); } catch (e) { config = null; }
      }

      if (config && config[typeKey] && config[typeKey][targetClass]) {
        const row = config[typeKey][targetClass];
        // Index 0 for 1 pax, 1 for 2 pax, ..., 5 for 6+ pax
        const paxIndex = Math.min(paxCount - 1, 5);
        const ratePerPax = parseFloat(row.pax?.[paxIndex] ?? row.pax?.[0] ?? 0);

        if (ratePerPax > 0) {
          if (row.type === 'PERCENTAGE' && baseFare > 0) {
            const calculated = (baseFare * ratePerPax) / 100;
            console.log(`✅ Matched Customer Matrix PERCENTAGE: ${ratePerPax}% of ${baseFare} = ${calculated}`);
            return calculated;
          }
          // The 6 fields in config are the rate per passenger
          const totalServiceCharge = ratePerPax * paxCount;
          console.log(`✅ Matched Customer Matrix FLAT: rate=${ratePerPax} * pax=${paxCount} = ${totalServiceCharge}`);
          return totalServiceCharge;
        }
      }
    }

    // 2. Try to find customer-specific rules from ServiceCharge table
    const custIdForRules = customer ? (customer.cu_usid || customer.cu_cusid) : customerId;
    let rules = [];
    if (custIdForRules) {
      rules = await ServiceCharge.findAll({
        where: {
          customer_id: custIdForRules,
          service_type: serviceType,
          travel_class: targetClass === '3AC' ? '3A' : targetClass === '2AC' ? '2A' : targetClass === '1AC' ? '1A' : targetClass,
          is_active: true
        }
      });
    }

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

    // 4. Match the specific rule based on passenger range
    const matchedRule = rules
      .filter(rule => 
        paxCount >= rule.passenger_min && 
        (rule.passenger_max === null || paxCount <= rule.passenger_max)
      )
      .sort((a, b) => {
        const rangeA = a.passenger_max === null ? Infinity : (a.passenger_max - a.passenger_min);
        const rangeB = b.passenger_max === null ? Infinity : (b.passenger_max - b.passenger_min);
        return rangeA - rangeB;
      })[0];

    if (!matchedRule) {
      console.log(`⚠️ No rule matched for passenger count: ${paxCount}`);
      return 0;
    }

    // 5. Calculate final amount based on charge_mode
    const amount = parseFloat(matchedRule.amount);
    if (matchedRule.charge_mode === 'FIXED') {
      console.log(`✅ Matched FIXED rule: ${amount}`);
      return amount;
    } else if (matchedRule.charge_mode === 'PER_PASSENGER') {
      const total = amount * paxCount;
      console.log(`✅ Matched PER_PASSENGER rule: ${amount} * ${paxCount} = ${total}`);
      return total;
    }

    return 0;
  }
}

module.exports = new ServiceChargeService();
