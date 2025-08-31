const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function captureDashboard() {
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
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');

    // Login with test credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    
    // Submit login and wait for navigation
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('http://localhost:3004/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Wait for any loading states to finish
    await page.waitForTimeout(2000);
    
    // Capture the actual dashboard
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'dashboard-real.png'), 
      fullPage: true 
    });
    console.log('✓ Dashboard screenshot captured');

    // Check for any error messages or loading states
    const loadingElements = await page.locator('.loading').count();
    const errorElements = await page.locator('.error').count();
    
    console.log(`Loading elements: ${loadingElements}`);
    console.log(`Error elements: ${errorElements}`);

    // Try to capture company dropdown state
    const companySelect = page.locator('select#company-select');
    if (await companySelect.isVisible()) {
      console.log('✓ Company selector found');
      const companies = await companySelect.locator('option').allTextContents();
      console.log('Available companies:', companies.slice(1)); // Skip first empty option
    }

  } catch (error) {
    console.error('Dashboard capture failed:', error.message);
    
    // Take a screenshot of current state for debugging
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'error-state.png'), 
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

captureDashboard().catch(console.error);