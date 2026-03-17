/**
 * Test Script: Cancellation Modal Keyboard Navigation
 * 
 * This script tests the keyboard navigation functionality in the billing cancellation modal.
 * 
 * Test Cases:
 * 1. Modal opens with first field focused
 * 2. Tab key moves through fields in correct order
 * 3. Shift+Tab moves backwards through fields
 * 4. Enter key moves to next field
 * 5. Tab from last field shows confirmation dialog
 * 6. Escape key closes modal
 * 7. Confirmation dialog keyboard navigation
 */

const puppeteer = require('puppeteer');

const API_BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';

async function testCancellationModalKeyboardNavigation() {
  let browser;
  
  try {
    console.log('🚀 Starting Cancellation Modal Keyboard Navigation Tests...\n');
    
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 50,
      args: ['--window-size=1920,1080']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Login
    console.log('🔐 Step 1: Logging in...');
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'admin@example.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    console.log('✅ Login successful\n');
    
    // Navigate to Billing page
    console.log('📄 Step 2: Navigating to Billing page...');
    await page.goto(`${FRONTEND_URL}/billing`);
    await page.waitForSelector('.erp-table', { timeout: 10000 });
    console.log('✅ Billing page loaded\n');
    
    // Wait for bills to load
    await page.waitForTimeout(2000);
    
    // Find a bill to cancel
    console.log('🔍 Step 3: Finding a bill to test cancellation...');
    const billRow = await page.$('.erp-table tbody tr');
    if (!billRow) {
      console.log('❌ No bills found. Please create a bill first.');
      return;
    }
    
    // Click on the bill row to select it
    await billRow.click();
    await page.waitForTimeout(500);
    
    // Open action menu and click cancel
    const actionMenuButton = await page.$('button[title="Actions"]');
    if (actionMenuButton) {
      await actionMenuButton.click();
      await page.waitForTimeout(500);
      
      // Click cancel option
      const cancelOption = await page.$('button:has-text("Cancel Bill")');
      if (cancelOption) {
        await cancelOption.click();
      } else {
        // Try alternative selector
        const buttons = await page.$$('button');
        for (const button of buttons) {
          const text = await page.evaluate(el => el.textContent, button);
          if (text.includes('Cancel')) {
            await button.click();
            break;
          }
        }
      }
    }
    
    console.log('✅ Cancellation modal opened\n');
    
    // Wait for modal to appear
    await page.waitForSelector('.erp-modal', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    // Test 1: Check if first field is focused
    console.log('🧪 Test 1: Checking if first field is auto-focused...');
    const focusedElement = await page.evaluate(() => {
      const activeEl = document.activeElement;
      return {
        tagName: activeEl.tagName,
        name: activeEl.name,
        type: activeEl.type
      };
    });
    
    if (focusedElement.name === 'railwayCancellationCharge') {
      console.log('✅ First field (Railway Cancellation Charge) is auto-focused');
    } else {
      console.log('❌ First field is NOT focused. Current focus:', focusedElement);
    }
    console.log('');
    
    // Test 2: Tab navigation through fields
    console.log('🧪 Test 2: Testing Tab navigation through fields...');
    const expectedTabOrder = [
      'railwayCancellationCharge',
      'agentCancellationCharge',
      'stationBoyCharges',
      'cancellationDate',
      'cancellationRemarks'
    ];
    
    for (let i = 0; i < expectedTabOrder.length - 1; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      
      const currentFocus = await page.evaluate(() => document.activeElement.name);
      const expectedField = expectedTabOrder[i + 1];
      
      if (currentFocus === expectedField) {
        console.log(`✅ Tab ${i + 1}: Moved to ${expectedField}`);
      } else {
        console.log(`❌ Tab ${i + 1}: Expected ${expectedField}, got ${currentFocus}`);
      }
    }
    console.log('');
    
    // Test 3: Shift+Tab reverse navigation
    console.log('🧪 Test 3: Testing Shift+Tab reverse navigation...');
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);
    
    const reverseFocus = await page.evaluate(() => document.activeElement.name);
    if (reverseFocus === 'cancellationDate') {
      console.log('✅ Shift+Tab moved backwards correctly');
    } else {
      console.log(`❌ Shift+Tab failed. Expected cancellationDate, got ${reverseFocus}`);
    }
    console.log('');
    
    // Test 4: Enter key navigation
    console.log('🧪 Test 4: Testing Enter key navigation...');
    // Focus first field
    await page.focus('input[name="railwayCancellationCharge"]');
    await page.type('input[name="railwayCancellationCharge"]', '100');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    
    const enterFocus = await page.evaluate(() => document.activeElement.name);
    if (enterFocus === 'agentCancellationCharge') {
      console.log('✅ Enter key moved to next field');
    } else {
      console.log(`❌ Enter key navigation failed. Expected agentCancellationCharge, got ${enterFocus}`);
    }
    console.log('');
    
    // Test 5: Tab from last field shows confirmation dialog
    console.log('🧪 Test 5: Testing Tab from last field shows confirmation dialog...');
    await page.focus('textarea[name="cancellationRemarks"]');
    await page.type('textarea[name="cancellationRemarks"]', 'Test cancellation');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    const confirmDialogVisible = await page.evaluate(() => {
      const dialogs = document.querySelectorAll('.erp-modal');
      return dialogs.length > 1; // Should have 2 modals (main + confirmation)
    });
    
    if (confirmDialogVisible) {
      console.log('✅ Confirmation dialog appeared after Tab from last field');
      
      // Close confirmation dialog
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('❌ Confirmation dialog did NOT appear');
    }
    console.log('');
    
    // Test 6: Escape key closes modal
    console.log('🧪 Test 6: Testing Escape key closes modal...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    const modalClosed = await page.evaluate(() => {
      return document.querySelectorAll('.erp-modal').length === 0;
    });
    
    if (modalClosed) {
      console.log('✅ Escape key closed the modal');
    } else {
      console.log('❌ Modal is still open after Escape');
    }
    console.log('');
    
    // Test 7: Keyboard shortcuts help text
    console.log('🧪 Test 7: Checking keyboard shortcuts help text...');
    // Reopen modal
    await billRow.click();
    await page.waitForTimeout(500);
    if (actionMenuButton) {
      await actionMenuButton.click();
      await page.waitForTimeout(500);
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('Cancel')) {
          await button.click();
          break;
        }
      }
    }
    await page.waitForSelector('.erp-modal', { timeout: 5000 });
    
    const helpTextExists = await page.evaluate(() => {
      const helpSection = Array.from(document.querySelectorAll('strong')).find(
        el => el.textContent.includes('Keyboard Shortcuts')
      );
      return !!helpSection;
    });
    
    if (helpTextExists) {
      console.log('✅ Keyboard shortcuts help text is displayed');
    } else {
      console.log('❌ Keyboard shortcuts help text is missing');
    }
    console.log('');
    
    console.log('✅ All keyboard navigation tests completed!\n');
    
    // Keep browser open for manual inspection
    console.log('Browser will remain open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if puppeteer is installed
try {
  require.resolve('puppeteer');
  testCancellationModalKeyboardNavigation();
} catch (e) {
  console.log('⚠️  Puppeteer is not installed. Install it with: npm install puppeteer');
  console.log('\nAlternatively, test manually:');
  console.log('1. Open billing page');
  console.log('2. Select a bill and click Cancel');
  console.log('3. Test keyboard navigation:');
  console.log('   - Tab through fields');
  console.log('   - Shift+Tab backwards');
  console.log('   - Enter to move to next field');
  console.log('   - Tab from last field to show confirmation');
  console.log('   - Escape to close modal');
}
