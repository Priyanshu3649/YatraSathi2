// Test script for UI Reconstruction
const puppeteer = require('puppeteer');

async function testUIReconstruction() {
  let browser;
  try {
    console.log('🧪 Testing UI Reconstruction...\n');
    
    browser = await puppeteer.launch({ 
      headless: false, 
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Navigate to the frontend
    console.log('1. Navigating to frontend...');
    await page.goto('http://localhost:3004');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Try to navigate to payments (assuming we need to login first)
    console.log('2. Looking for payments/accounting access...');
    
    // Take a screenshot
    await page.screenshot({ path: 'ui-test-screenshot.png', fullPage: true });
    console.log('✅ Screenshot saved as ui-test-screenshot.png');
    
    // Check if we can access the payments module directly
    try {
      await page.goto('http://localhost:3004/payments');
      await page.waitForTimeout(2000);
      
      // Look for the green menu screen
      const menuContainer = await page.$('.accounting-menu-container');
      if (menuContainer) {
        console.log('✅ Found accounting menu container');
        
        // Check background color
        const bgColor = await page.evaluate(() => {
          const element = document.querySelector('.accounting-menu-container');
          return window.getComputedStyle(element).backgroundColor;
        });
        
        console.log('Menu background color:', bgColor);
        
        // Check for menu items
        const menuItems = await page.$$('.menu-item');
        console.log(`✅ Found ${menuItems.length} menu items`);
        
        // Test keyboard navigation
        console.log('3. Testing keyboard navigation...');
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(500);
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(500);
        
        // Try to select Contra entry
        await page.keyboard.press('ArrowUp');
        await page.keyboard.press('ArrowUp');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        
        // Check if form opened
        const formContainer = await page.$('.accounting-form-container');
        if (formContainer) {
          console.log('✅ Accounting form opened successfully');
          
          // Check form background color
          const formBgColor = await page.evaluate(() => {
            const element = document.querySelector('.accounting-form-container');
            return window.getComputedStyle(element).backgroundColor;
          });
          
          console.log('Form background color:', formBgColor);
          
          // Take screenshot of form
          await page.screenshot({ path: 'accounting-form-screenshot.png', fullPage: true });
          console.log('✅ Form screenshot saved as accounting-form-screenshot.png');
          
        } else {
          console.log('❌ Accounting form did not open');
        }
        
      } else {
        console.log('❌ Accounting menu container not found');
      }
      
    } catch (error) {
      console.log('⚠️  Could not access payments directly, might need authentication');
    }
    
    console.log('\n🎉 UI Reconstruction test completed!');
    console.log('Check the screenshots to verify the classic accounting style.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if puppeteer is available
try {
  require('puppeteer');
  testUIReconstruction();
} catch (error) {
  console.log('⚠️  Puppeteer not available. Install with: npm install puppeteer');
  console.log('You can manually test by visiting: http://localhost:3004/payments');
}