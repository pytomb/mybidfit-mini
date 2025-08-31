const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function debugLogin() {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  // Capture console messages
  const consoleMessages = [];
  page.on('console', message => {
    consoleMessages.push(`${message.type()}: ${message.text()}`);
    console.log(`CONSOLE ${message.type()}: ${message.text()}`);
  });

  // Capture network requests and responses
  const networkLogs = [];
  page.on('request', request => {
    networkLogs.push(`REQUEST: ${request.method()} ${request.url()}`);
    console.log(`REQUEST: ${request.method()} ${request.url()}`);
  });

  page.on('response', response => {
    networkLogs.push(`RESPONSE: ${response.status()} ${response.url()}`);
    console.log(`RESPONSE: ${response.status()} ${response.url()}`);
    
    // Log response body for API calls
    if (response.url().includes('/api/auth/login')) {
      response.text().then(body => {
        console.log('LOGIN RESPONSE BODY:', body);
        networkLogs.push(`LOGIN RESPONSE BODY: ${body}`);
      }).catch(err => {
        console.log('Could not read response body:', err.message);
      });
    }
  });

  try {
    console.log('🔍 Starting login debugging...');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: path.join(screenshotsDir, 'debug-login-page.png') });

    console.log('📧 Filling login form...');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    
    await page.screenshot({ path: path.join(screenshotsDir, 'debug-form-filled.png') });

    console.log('🚀 Submitting login...');
    await page.click('button[type="submit"]');
    
    // Wait for any changes and take screenshots
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotsDir, 'debug-after-submit.png') });

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Check for error messages
    const errorElement = await page.locator('.error').first();
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      console.log('❌ Error message:', errorText);
    }

    // Check localStorage for token
    const token = await page.evaluate(() => localStorage.getItem('token'));
    console.log('Token in localStorage:', token ? 'Present' : 'Not present');
    
    if (token) {
      console.log('Token value:', token.substring(0, 20) + '...');
    }

    // Wait a bit more to see if there's delayed navigation
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, 'debug-final-state.png') });

  } catch (error) {
    console.error('❌ Debug script error:', error.message);
    await page.screenshot({ path: path.join(screenshotsDir, 'debug-error.png') });
  } finally {
    // Write logs to file
    const logPath = path.join(screenshotsDir, 'debug-logs.txt');
    const allLogs = [
      '=== CONSOLE MESSAGES ===',
      ...consoleMessages,
      '\n=== NETWORK LOGS ===',
      ...networkLogs
    ].join('\n');
    
    fs.writeFileSync(logPath, allLogs);
    console.log(`📝 Logs written to ${logPath}`);
    
    await browser.close();
  }
}

debugLogin().catch(console.error);