const { test, expect } = require('@playwright/test');
const { chromium } = require('playwright');

// E2E Testing: Complete login → dashboard workflow validation
// Following ui-comprehensive-tester methodology with Playwright MCP integration
test.describe('Login to Dashboard Workflow', () => {
  let page, context, browser;
  
  test.beforeAll(async () => {
    browser = await chromium.launch();
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
  });

  test.afterAll(async () => {
    if (context) await context.close();
    if (browser) await browser.close();
  });

  test.beforeEach(async () => {
    page = await context.newPage();
    
    // Capture console messages and network requests for debugging
    page.on('console', message => {
      if (message.type() === 'error') {
        console.log(`CONSOLE ERROR: ${message.text()}`);
      }
    });
    
    page.on('requestfailed', request => {
      console.log(`FAILED REQUEST: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });
  });

  test.afterEach(async () => {
    if (page) await page.close();
  });

  // CRITICAL TEST: Complete login → dashboard workflow
  // This would have caught our authentication and data loading issues
  test('should complete full login to dashboard workflow with real data', async () => {
    console.log('🔍 Starting E2E login workflow test...');

    // Step 1: Navigate to login page
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    
    // Visual validation: Login page should be properly rendered
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Take baseline screenshot
    await page.screenshot({ path: 'test/screenshots/01-login-page.png', fullPage: true });

    // Step 2: Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    
    // Step 3: Submit login
    const loginPromise = page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await loginPromise;
    console.log('✅ Successfully navigated to dashboard');

    // Step 4: Wait for dashboard to load completely
    await page.waitForLoadState('networkidle');
    
    // Wait for data to load (dynamic content)
    await page.waitForTimeout(3000);

    // Step 5: Validate dashboard elements are present
    await expect(page.locator('text=Welcome back, test@example.com')).toBeVisible({timeout: 5000});
    
    // Validate company selector is present and functional
    const companySelector = page.locator('select#company-select, select[data-testid="company-select"], select');
    await expect(companySelector.first()).toBeVisible({timeout: 5000});
    
    // Validate opportunities section is present
    await expect(page.locator('text=Personalized Opportunities')).toBeVisible();
    
    // Validate Quick Actions section is present
    await expect(page.locator('text=Quick Actions')).toBeVisible();
    
    // Step 6: Take dashboard screenshot for visual validation
    await page.screenshot({ path: 'test/screenshots/02-dashboard-loaded.png', fullPage: true });
    console.log('✅ Dashboard screenshot captured');

    // Step 7: Validate real data is displayed
    // Check for opportunity cards
    const opportunityCards = page.locator('[class*="opportunity"], [data-testid*="opportunity"], .card');
    const cardCount = await opportunityCards.count();
    expect(cardCount).toBeGreaterThan(0); // Should have at least one opportunity
    
    // Check for match scores (should not be placeholder data)
    const matchScores = page.locator('text=/Match Score.*%/');
    const scoreCount = await matchScores.count();
    expect(scoreCount).toBeGreaterThan(0); // Should have match scores displayed
    
    console.log(`✅ Found ${cardCount} opportunity cards and ${scoreCount} match scores`);
  });

  // Responsive Design Validation
  test('should render correctly across different screen sizes', async () => {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1440, height: 900, name: 'desktop' }
    ];

    for (const viewport of viewports) {
      console.log(`📱 Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:3004/login');
      await page.waitForLoadState('networkidle');

      // Check for horizontal scrolling issues
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
      expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1); // Allow 1px tolerance

      // Login and test dashboard responsiveness
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpass123');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Take responsive screenshot
      await page.screenshot({ 
        path: `test/screenshots/03-dashboard-${viewport.name}.png`, 
        fullPage: true 
      });

      // Validate key elements are still visible and accessible
      await expect(page.locator('text=Welcome back')).toBeVisible();
      
      console.log(`✅ ${viewport.name} viewport test passed`);
    }
  });

  // Console Error Validation
  test('should have no console errors during workflow', async () => {
    const consoleErrors = [];
    
    page.on('console', message => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    // Complete login workflow
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Validate no console errors occurred
    expect(consoleErrors).toHaveLength(0);
    console.log('✅ No console errors detected during workflow');
  });

  // Network Request Validation
  test('should make successful API calls during dashboard load', async () => {
    const apiCalls = [];
    const failedRequests = [];

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method()
        });
      }
    });

    page.on('requestfailed', request => {
      if (request.url().includes('/api/')) {
        failedRequests.push({
          url: request.url(),
          error: request.failure()?.errorText
        });
      }
    });

    // Complete login workflow
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Validate API calls
    expect(failedRequests).toHaveLength(0); // No failed API requests
    
    // Should have made login, profile, companies, and opportunities API calls
    const loginCall = apiCalls.find(call => call.url.includes('/auth/login'));
    const profileCall = apiCalls.find(call => call.url.includes('/users/profile'));
    const companiesCall = apiCalls.find(call => call.url.includes('/users/companies'));
    
    expect(loginCall).toBeDefined();
    expect(loginCall.status).toBe(200);
    expect(profileCall.status).toBe(200);
    expect(companiesCall.status).toBe(200);
    
    console.log(`✅ Made ${apiCalls.length} successful API calls`);
  });

  // Interactive Elements Validation
  test('should have functional interactive elements', async () => {
    // Login to dashboard
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Test company selector functionality (if available)
    const companySelector = page.locator('select').first();
    if (await companySelector.isVisible()) {
      await companySelector.selectOption({ index: 1 });
      await page.waitForTimeout(1000); // Wait for data to update
      console.log('✅ Company selector is functional');
    }

    // Test navigation elements
    const homeLink = page.locator('a[href="/"], a:has-text("Home")');
    if (await homeLink.isVisible()) {
      await expect(homeLink).toBeEnabled();
    }

    // Test logout functionality
    const logoutButton = page.locator('text=Logout, button:has-text("Logout")');
    if (await logoutButton.isVisible()) {
      await expect(logoutButton).toBeEnabled();
    }

    console.log('✅ Interactive elements validation completed');
  });

  // Data Loading Validation
  test('should display real data from API, not mock data', async () => {
    // Login to dashboard
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check that we're not showing placeholder/mock data
    const pageContent = await page.content();
    
    // Should not contain obvious mock data indicators
    expect(pageContent).not.toContain('Mock Company');
    expect(pageContent).not.toContain('Sample Opportunity');
    expect(pageContent).not.toContain('Lorem ipsum');
    
    // Should contain actual company names from sample data
    const hasRealCompanyData = pageContent.includes('TechFlow') || 
                              pageContent.includes('SecureNet') || 
                              pageContent.includes('DataBridge');
    expect(hasRealCompanyData).toBe(true);
    
    console.log('✅ Real data validation passed');
  });

  // Time-Categorized Test: Comprehensive (10-60s) - Full workflow validation
  test('[COMPREHENSIVE] should handle complete user journey with error scenarios', async () => {
    console.log('🔍 Starting comprehensive user journey test...');

    // Test 1: Failed login attempt
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error or stay on login page
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    expect(currentUrl).toContain('login');
    
    // Test 2: Successful login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Test 3: Dashboard functionality
    await expect(page.locator('text=Welcome back')).toBeVisible();
    
    // Test 4: Take final validation screenshot
    await page.screenshot({ 
      path: 'test/screenshots/04-comprehensive-test-final.png', 
      fullPage: true 
    });

    console.log('✅ Comprehensive user journey test completed successfully');
  });
});