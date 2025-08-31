const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function captureScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  try {
    console.log('Navigating to frontend homepage...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Capture homepage
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-homepage.png'), 
      fullPage: true 
    });
    console.log('✓ Homepage screenshot captured');

    // Check for console errors
    const consoleErrors = [];
    page.on('console', message => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    // Try to navigate to registration
    const registerLink = await page.locator('a[href="/register"]').first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ 
        path: path.join(screenshotsDir, '02-register.png'), 
        fullPage: true 
      });
      console.log('✓ Registration page screenshot captured');
    }

    // Go to login page
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '03-login.png'), 
      fullPage: true 
    });
    console.log('✓ Login page screenshot captured');

    // Try to login with test credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '04-login-filled.png'), 
      fullPage: true 
    });
    console.log('✓ Login form filled screenshot captured');

    // Submit login
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '05-dashboard.png'), 
      fullPage: true 
    });
    console.log('✓ Dashboard screenshot captured');

    // Console errors summary
    if (consoleErrors.length > 0) {
      console.log('\n⚠️ Console errors detected:');
      consoleErrors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
    } else {
      console.log('\n✓ No console errors detected');
    }

  } catch (error) {
    console.error('Screenshot capture failed:', error.message);
  } finally {
    await browser.close();
  }
}

captureScreenshots().catch(console.error);