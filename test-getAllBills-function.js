/**
 * Test the getAllBills function directly with mocked request/response
 */

const { BillTVL } = require('./src/models');
const { sequelizeTVL } = require('./config/db');

// Import the billing controller to test the function directly
const billingController = require('./src/controllers/billingController');

async function testGetAllBillsFunction() {
    console.log('🧪 Testing getAllBills function directly...\n');

    try {
        // Mock request object with admin user
        const mockReq = {
            user: {
                us_usertype: 'admin', // Simulate admin user
                us_roid: 'ADM',       // Or role ID
                us_usid: 'ADM001'
            }
        };

        // Mock response object
        let responseData = null;
        let statusCode = null;
        let errorMessage = null;
        
        const mockRes = {
            json: (data) => {
                responseData = data;
            },
            status: (code) => {
                statusCode = code;
                return {
                    json: (data) => {
                        responseData = data;
                        if (statusCode >= 400) {
                            errorMessage = data.message || data.error?.message || 'Unknown error';
                        }
                    }
                };
            }
        };

        console.log('✅ Mock request/response objects created');
        console.log(`👤 User type: ${mockReq.user.us_usertype}, Role ID: ${mockReq.user.us_roid}`);

        // Call the getAllBills function directly
        await billingController.getAllBills(mockReq, mockRes);

        console.log(`📊 Response status: ${statusCode}`);
        console.log(`📦 Response data keys: ${responseData ? Object.keys(responseData) : 'None'}`);
        
        if (errorMessage) {
            console.log(`❌ Error message: ${errorMessage}`);
        }

        if (responseData) {
            console.log(`✅ Response structure: ${JSON.stringify(Object.keys(responseData), null, 2)}`);
            
            if (responseData.data && responseData.data.bills) {
                console.log(`✅ Bills retrieved: ${responseData.data.bills.length}`);
                if (responseData.data.bills.length > 0) {
                    console.log('✅ Sample bill data structure:');
                    const sampleBill = responseData.data.bills[0];
                    console.log(JSON.stringify(Object.keys(sampleBill), null, 2));
                }
            } else if (Array.isArray(responseData)) {
                console.log(`✅ Bills retrieved as array: ${responseData.length}`);
            } else if (responseData.bills) {
                console.log(`✅ Bills retrieved: ${responseData.bills.length}`);
            }
        }

        if (statusCode === 500) {
            console.log('❌ 500 Internal Server Error - function still has issues');
        } else if (statusCode === 403 || statusCode === 401) {
            console.log('✅ Proper authentication/authorization error returned');
        } else if (statusCode === 200) {
            console.log('✅ Success! Endpoint is working correctly');
        } else {
            console.log(`✅ Different status code (${statusCode}) but not 500`);
        }

        console.log('\n✅ getAllBills function test completed!');

    } catch (error) {
        console.error('❌ Error during function test:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

testGetAllBillsFunction();