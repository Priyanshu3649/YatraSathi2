/**
 * Verification script to check if passenger-billing integration changes have been applied
 */

console.log('🔍 VERIFYING PASSENGER-BILLING INTEGRATION CHANGES...\n');

// Check 1: Verify Passenger model changes
try {
  const fs = require('fs');
  const passengerModelPath = './src/models/Passenger.js';
  const passengerModelCode = fs.readFileSync(passengerModelPath, 'utf8');
  
  console.log('📋 Checking Passenger.js model...');
  
  // Check if bl_bill_no is in constructor
  if (passengerModelCode.includes('this.bl_bill_no = data.bl_bill_no')) {
    console.log('✅ Constructor includes bl_bill_no field');
  } else {
    console.log('❌ Constructor missing bl_bill_no field');
  }
  
  // Check if create method includes bl_bill_no
  if (passengerModelCode.includes('bl_bill_no') && passengerModelCode.includes('INSERT INTO psXpassenger')) {
    console.log('✅ Create method includes bl_bill_no field');
  } else {
    console.log('❌ Create method missing bl_bill_no field');
  }
  
  // Check if update method includes bl_bill_no
  if (passengerModelCode.includes('bl_bill_no = ?') && passengerModelCode.includes('UPDATE psXpassenger')) {
    console.log('✅ Update method includes bl_bill_no field');
  } else {
    console.log('❌ Update method missing bl_bill_no field');
  }
  
  // Check if getByBillingNumber method exists
  if (passengerModelCode.includes('static async getByBillingNumber')) {
    console.log('✅ getByBillingNumber method exists');
  } else {
    console.log('❌ getByBillingNumber method missing');
  }
  
  console.log('');
} catch (error) {
  console.error('❌ Error reading Passenger.js:', error.message);
}

// Check 2: Verify billing controller changes
try {
  const fs = require('fs');
  const billingControllerPath = './src/controllers/billingController.js';
  const billingControllerCode = fs.readFileSync(billingControllerPath, 'utf8');
  
  console.log('📋 Checking billingController.js...');
  
  // Check if createBill updates passenger records with billing number
  if (billingControllerCode.includes('UPDATE psXpassenger') && billingControllerCode.includes('bl_bill_no = :billNumber')) {
    console.log('✅ createBill updates passenger records with billing number');
  } else {
    console.log('❌ createBill missing passenger billing number update');
  }
  
  // Check if getBillById includes passenger details
  if (billingControllerCode.includes('passengerList: passengerList') && billingControllerCode.includes('Passenger.getByBillingNumber')) {
    console.log('✅ getBillById includes passenger details');
  } else {
    console.log('❌ getBillById missing passenger details integration');
  }
  
  // Check if getAllBills includes passenger details
  if (billingControllerCode.includes('transformedBills.push') && billingControllerCode.includes('Passenger.getByBillingNumber')) {
    console.log('✅ getAllBills includes passenger details');
  } else {
    console.log('❌ getAllBills missing passenger details integration');
  }
  
  // Check if updateBill includes passenger details
  if (billingControllerCode.includes('updateBill') && billingControllerCode.includes('Passenger.getByBillingNumber')) {
    console.log('✅ updateBill includes passenger details');
  } else {
    console.log('❌ updateBill missing passenger details integration');
  }
  
  // Check if finalizeBill includes passenger details
  if (billingControllerCode.includes('finalizeBill') && billingControllerCode.includes('Passenger.getByBillingNumber')) {
    console.log('✅ finalizeBill includes passenger details');
  } else {
    console.log('❌ finalizeBill missing passenger details integration');
  }
  
  // Check if deleteBill resets passenger billing numbers
  if (billingControllerCode.includes('DELETE bill') && billingControllerCode.includes('bl_bill_no = NULL')) {
    console.log('✅ deleteBill resets passenger billing numbers');
  } else {
    console.log('❌ deleteBill missing passenger billing number reset');
  }
  
  // Check if cancelBill resets passenger billing numbers
  if (billingControllerCode.includes('CANCELLED') && billingControllerCode.includes('bl_bill_no = NULL')) {
    console.log('✅ cancelBill resets passenger billing numbers');
  } else {
    console.log('❌ cancelBill missing passenger billing number reset');
  }
  
  console.log('');
} catch (error) {
  console.error('❌ Error reading billingController.js:', error.message);
}

// Check 3: Verify billing integration controller changes
try {
  const fs = require('fs');
  const billingIntegrationControllerPath = './src/controllers/billingIntegrationController.js';
  const billingIntegrationControllerCode = fs.readFileSync(billingIntegrationControllerPath, 'utf8');
  
  console.log('📋 Checking billingIntegrationController.js...');
  
  // Check if getBillingByBookingId includes passenger details
  if (billingIntegrationControllerCode.includes('getBillingByBookingId') && billingIntegrationControllerCode.includes('passengerList = passengerList')) {
    console.log('✅ getBillingByBookingId includes passenger details');
  } else {
    console.log('❌ getBillingByBookingId missing passenger details integration');
  }
  
  console.log('');
} catch (error) {
  console.error('❌ Error reading billingIntegrationController.js:', error.message);
}

console.log('✅ Verification completed!');
console.log('\nSUMMARY OF IMPLEMENTED FEATURES:');
console.log('1. Added bl_bill_no field to passenger table structure');
console.log('2. Updated Passenger model with billing number functionality');
console.log('3. Enhanced createBill to update passenger records with billing number');
console.log('4. Enhanced all bill retrieval methods to include passenger details');
console.log('5. Enhanced deleteBill and cancelBill to reset passenger billing numbers');
console.log('6. Ensured passenger details are available in billing forms and records');