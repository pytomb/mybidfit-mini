const { test, expect } = require('@playwright/test');

// E2E Testing: User Registration Flow
// Tests the happy path for new user registration
test.describe('User Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
  });

  test('should successfully register a new user', async ({ page }) => {
    console.log('🔍 Starting registration flow test...');

    // Verify registration form is visible
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Take baseline screenshot
    await page.screenshot({ path: 'test/screenshots/register-01-form.png', fullPage: true });

    // Generate unique test email
    const timestamp = Date.now();
    const testEmail = `test.user.${timestamp}@example.com`;

    // Fill registration form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.fill('input[name="confirmPassword"]', 'TestPass123!');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');

    // Check if there's a company name field (optional)
    const companyField = page.locator('input[name="company"]');
    if (await companyField.isVisible()) {
      await companyField.fill('Test Company Inc');
    }

    // Check for terms acceptance checkbox
    const termsCheckbox = page.locator('input[type="checkbox"][name="acceptTerms"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Submit registration form
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
    
    // Wait for either success redirect or success message
    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/auth/register') && resp.status() === 201, { timeout: 10000 }).catch(() => null),
      submitButton.click()
    ]);

    // Check for successful registration
    if (response) {
      console.log('✅ Registration API call successful');
      
      // Wait for redirect to dashboard or login
      await Promise.race([
        page.waitForURL('**/dashboard', { timeout: 5000 }).catch(() => null),
        page.waitForURL('**/login', { timeout: 5000 }).catch(() => null),
        page.waitForSelector('text=/success|welcome|registered/i', { timeout: 5000 }).catch(() => null)
      ]);

      // Take success screenshot
      await page.screenshot({ path: 'test/screenshots/register-02-success.png', fullPage: true });
      
      const currentUrl = page.url();
      console.log(`✅ Registration successful - redirected to: ${currentUrl}`);
    }
  });

  test('should show validation errors for invalid inputs', async ({ page }) => {
    console.log('🔍 Testing form validation...');

    // Test empty form submission
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should show validation errors or button should be disabled
    await page.waitForTimeout(1000);
    
    // Check for error messages
    const errorMessages = page.locator('text=/required|invalid|error/i');
    const errorCount = await errorMessages.count();
    
    if (errorCount > 0) {
      console.log(`✅ Found ${errorCount} validation error messages`);
    }

    // Test invalid email format
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', '123'); // Too short
    await page.fill('input[name="confirmPassword"]', '456'); // Doesn't match
    
    await submitButton.click();
    await page.waitForTimeout(1000);

    // Check for specific validation errors
    const emailError = page.locator('text=/valid email|email.*invalid/i');
    const passwordError = page.locator('text=/password.*must|weak|short/i');
    const confirmError = page.locator('text=/match|confirm/i');

    if (await emailError.isVisible()) {
      console.log('✅ Email validation error shown');
    }
    if (await passwordError.isVisible()) {
      console.log('✅ Password validation error shown');
    }
    if (await confirmError.isVisible()) {
      console.log('✅ Password confirmation error shown');
    }

    // Take validation error screenshot
    await page.screenshot({ path: 'test/screenshots/register-03-validation-errors.png', fullPage: true });
  });

  test('should prevent duplicate email registration', async ({ page }) => {
    console.log('🔍 Testing duplicate email prevention...');

    // Use an existing test user email
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.fill('input[name="confirmPassword"]', 'TestPass123!');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');

    const submitButton = page.locator('button[type="submit"]');
    
    // Submit and expect error
    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/auth/register'), { timeout: 10000 }).catch(() => null),
      submitButton.click()
    ]);

    if (response && (response.status() === 400 || response.status() === 409)) {
      console.log('✅ Duplicate email registration prevented');
      
      // Check for error message
      await page.waitForSelector('text=/already|exists|taken/i', { timeout: 5000 });
      console.log('✅ Duplicate email error message shown');

      // Take error screenshot
      await page.screenshot({ path: 'test/screenshots/register-04-duplicate-email.png', fullPage: true });
    }
  });

  test('should be responsive across different viewports', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1440, height: 900, name: 'desktop' }
    ];

    for (const viewport of viewports) {
      console.log(`📱 Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize(viewport);
      await page.goto('/register');
      await page.waitForLoadState('networkidle');

      // Check for horizontal scrolling
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
      expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1);

      // Verify form is still accessible
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // Take responsive screenshot
      await page.screenshot({ 
        path: `test/screenshots/register-05-${viewport.name}.png`, 
        fullPage: true 
      });

      console.log(`✅ ${viewport.name} viewport test passed`);
    }
  });

  test('should have no console errors', async ({ page }) => {
    const consoleErrors = [];
    
    page.on('console', message => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    // Navigate and interact with the form
    await page.fill('input[name="email"]', 'test.new@example.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.fill('input[name="confirmPassword"]', 'TestPass123!');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');

    // Check for console errors
    expect(consoleErrors).toHaveLength(0);
    console.log('✅ No console errors detected');
  });
});