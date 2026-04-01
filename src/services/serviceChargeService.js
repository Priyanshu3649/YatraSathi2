const { ServiceCharge, ServiceChargeDefault } = require('../models');

/**
 * Service Charge Resolution Engine
 * Matches customer-specific or default rules and calculates the final charge.
 */
class ServiceChargeService {
  /**
   * Resolves and calculates the service charge for a given context.
   * @param {Object} options - { customerId, serviceType, travelClass, passengerCount }
   * @returns {Promise<number>} The calculated service charge amount
   */
  async getServiceCharge({ customerId, serviceType, travelClass, passengerCount }) {
    console.log(`🔍 Resolving service charge: Customer=${customerId}, Type=${serviceType}, Class=${travelClass}, Pax=${passengerCount}`);
    
    // 1. Try to find customer-specific rules
    let rules = await ServiceCharge.findAll({
      where: {
        customer_id: customerId,
        service_type: serviceType,
        travel_class: travelClass,
        is_active: true
      }
    });

    // 2. Fallback to default rules if no customer rule found
    if (!rules || rules.length === 0) {
      console.log('ℹ️ No customer-specific rules found, checking defaults...');
      rules = await ServiceChargeDefault.findAll({
        where: {
          service_type: serviceType,
          travel_class: travelClass,
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
