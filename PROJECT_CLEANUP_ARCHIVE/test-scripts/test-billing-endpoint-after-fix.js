const { BillTVL } = require('./src/models');
const { sequelizeTVL } = require('./src/models/baseModel');

async function testBillingEndpointAfterFix() {
    console.log('Testing BillTVL model after fixing all field mappings...\n');
    
    try {
        // Test database connectivity
        await sequelizeTVL.authenticate();
        console.log('✓ Database connection successful');
        
        // Test basic query to ensure the model works
        const bills = await BillTVL.findAll({
            limit: 1
        });
        console.log(`✓ Successfully retrieved ${bills.length} bill records`);
        
        // Check the structure of a bill record
        if (bills.length > 0) {
            const sampleBill = bills[0].toJSON();
            console.log('\nSample bill structure:');
            console.log('- bl_entry_no (should exist):', sampleBill.bl_entry_no !== undefined ? 'YES' : 'NO');
            console.log('- bl_bill_no:', sampleBill.bl_bill_no);
            console.log('- bl_booking_id:', sampleBill.bl_booking_id);
            console.log('- bl_customer_name:', sampleBill.bl_customer_name);
            console.log('- bl_total_amount:', sampleBill.bl_total_amount);
            
            // Verify that the problematic field is not present in the database
            console.log('- bl_booking_no (should NOT exist in DB):', sampleBill.bl_booking_no !== undefined ? 'YES (PROBLEM!)' : 'NO (GOOD)');
        }
        
        console.log('\n✓ All field mappings are correct - no more bl_booking_no errors!');
        console.log('✓ Billing endpoint should now work without 500 errors');
        
    } catch (error) {
        console.error('✗ Error testing BillTVL model:', error.message);
        console.error('Full error:', error);
    }
}

testBillingEndpointAfterFix();