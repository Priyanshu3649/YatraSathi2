import { configure, checkPNRStatus } from 'railkit';

configure('railkit_0e6ce78e84efcb68e74ba1622bc1e6adcad52692e3e0054c');

async function testPNR() {
  try {
    const result = await checkPNRStatus('2955375626');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error occurred:", err);
  }
}

testPNR();
