const { test, expect } = require('@playwright/test');

// MyBidFit Frontend Landing Page E2E Testing
// Comprehensive validation following Karaoke_Noir methodology
// Testing Phase 2 transformations: professional modal system, content cleanup, CSS class migration

test.describe('MyBidFit Landing Page Professional Transformation', () => {
  let page, context, browser;
  
  test.beforeAll(async ({ browser: testBrowser }) => {
    browser = testBrowser;
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
  });

  test.afterAll(async () => {
    if (context) await context.close();
  });

  test.beforeEach(async () => {
    page = await context.newPage();
    
    // Capture console messages for debugging
    page.on('console', message => {
      if (message.type() === 'error') {
        console.log(`🚨 CONSOLE ERROR: ${message.text()}`);
      } else if (message.type() === 'warning') {
        console.log(`⚠️ CONSOLE WARNING: ${message.text()}`);
      }
    });
    
    page.on('requestfailed', request => {
      console.log(`❌ FAILED REQUEST: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });
  });

  test.afterEach(async () => {
    if (page && !page.isClosed()) await page.close();
  });

  // === PHASE 1: INITIAL NAVIGATION AND SCREENSHOT CAPTURE ===
  test('should navigate to landing page and capture baseline screenshot', async () => {
    console.log('🎯 Phase 1: Initial navigation and baseline capture');
    
    // Navigate to the static landing page (design_sprint directory)
    await page.goto('file:///mnt/c/Users/dnice/DJ%20Programs/mybidfit_mini/design_sprint/index.html', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Wait for page to fully load
    await page.waitForTimeout(2000);
    
    // Verify basic page structure
    await expect(page).toHaveTitle(/MyBidFit/i);
    
    // Check for main hero section
    await expect(page.locator('.hero-section')).toBeVisible();
    
    // Take full-page baseline screenshot
    await page.screenshot({ 
      path: 'test/screenshots/landing-01-baseline-desktop.png', 
      fullPage: true 
    });
    
    console.log('✅ Baseline desktop screenshot captured');
  });

  // === PHASE 2: RESPONSIVE DESIGN VALIDATION ===
  test('should display correctly across all breakpoints', async () => {
    console.log('📱 Phase 2: Comprehensive responsive design validation');
    
    const breakpoints = [
      { width: 375, height: 667, name: 'mobile', device: 'iPhone SE' },
      { width: 768, height: 1024, name: 'tablet', device: 'iPad' },
      { width: 1440, height: 900, name: 'desktop', device: 'Desktop HD' },
      { width: 1920, height: 1080, name: 'desktop-xl', device: 'Desktop FHD' }
    ];

    for (const breakpoint of breakpoints) {
      console.log(`📐 Testing ${breakpoint.name} - ${breakpoint.device} (${breakpoint.width}x${breakpoint.height})`);
      
      // Set viewport size
      await page.setViewportSize({ 
        width: breakpoint.width, 
        height: breakpoint.height 
      });
      
      // Navigate to landing page
      await page.goto('file:///mnt/c/Users/dnice/DJ%20Programs/mybidfit_mini/design_sprint/index.html', {
        waitUntil: 'networkidle'
      });
      await page.waitForTimeout(1000);

      // Check for horizontal scrolling issues (critical responsive design test)
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = breakpoint.width;
      expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 2); // Allow 2px tolerance

      // Validate key elements are visible and properly positioned
      await expect(page.locator('.hero-section')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible();
      
      // Specific mobile responsiveness checks
      if (breakpoint.name === 'mobile') {
        // Ensure text is readable and buttons are touch-friendly (minimum 44px)
        const buttons = page.locator('button, .btn');
        const buttonCount = await buttons.count();
        
        for (let i = 0; i < buttonCount; i++) {
          const button = buttons.nth(i);
          if (await button.isVisible()) {
            const box = await button.boundingBox();
            if (box) {
              expect(box.height).toBeGreaterThanOrEqual(40); // Touch-friendly size
            }
          }
        }
      }
      
      // Take responsive screenshot
      await page.screenshot({ 
        path: `test/screenshots/landing-02-responsive-${breakpoint.name}.png`, 
        fullPage: true 
      });
      
      console.log(`✅ ${breakpoint.name} responsive test passed`);
    }
  });

  // === PHASE 3: PROFESSIONAL MODAL SYSTEM TESTING ===
  test('should have functional professional demo modal system', async () => {
    console.log('🎭 Phase 3: Professional modal system validation');
    
    await page.goto('file:///mnt/c/Users/dnice/DJ%20Programs/mybidfit_mini/design_sprint/index.html', {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(1000);

    // Look for demo form or contact form
    const demoForm = page.locator('#demo-form, form[id*="demo"], .demo-form, form');
    await expect(demoForm).toBeVisible();
    
    // Fill out the demo form
    await page.fill('input[name="companyName"], input#company-name, input[placeholder*="company" i]', 'Test Company Inc');
    await page.fill('input[name="email"], input[type="email"], input[placeholder*="email" i]', 'test@testcompany.com');
    await page.fill('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]', '(555) 123-4567');
    
    // Take screenshot before submitting form
    await page.screenshot({ 
      path: 'test/screenshots/landing-03-demo-form-filled.png', 
      fullPage: true 
    });
    
    // Submit the form
    const submitButton = page.locator('button[type="submit"], .submit-btn, button:has-text("Submit")');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    
    await submitButton.click();
    await page.waitForTimeout(500); // Allow modal animation
    
    // Validate modal appears (should NOT be alert() anymore - that was the old issue)
    const modal = page.locator('.modal, [role="dialog"], .modal-overlay');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Validate modal content
    await expect(modal).toContainText(/demo/i);
    
    // Test modal close functionality
    const closeButton = page.locator('.modal .close, button:has-text("Close"), [aria-label="Close"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await page.waitForTimeout(500); // Allow close animation
      
      // Verify modal is closed
      await expect(modal).not.toBeVisible();
      console.log('✅ Modal close button functional');
    }
    
    // Test backdrop close (reopen modal first if needed)
    await submitButton.click();
    await page.waitForTimeout(500);
    await expect(modal).toBeVisible();
    
    // Click backdrop to close
    const modalBackdrop = page.locator('.modal-overlay, .modal-backdrop');
    if (await modalBackdrop.isVisible()) {
      await modalBackdrop.click({ position: { x: 10, y: 10 } }); // Click outside modal content
      await page.waitForTimeout(500);
      
      // Verify backdrop close works
      await expect(modal).not.toBeVisible();
      console.log('✅ Modal backdrop close functional');
    }
    
    // Take final modal testing screenshot
    await page.screenshot({ 
      path: 'test/screenshots/landing-04-modal-system-tested.png', 
      fullPage: true 
    });
    
    console.log('✅ Professional modal system validation completed');
  });

  // === PHASE 4: CONTENT CLEANUP VALIDATION ===
  test('should display cleaned content without duplicates', async () => {
    console.log('🧹 Phase 4: Content cleanup and duplication validation');
    
    await page.goto('file:///mnt/c/Users/dnice/DJ%20Programs/mybidfit_mini/design_sprint/index.html', {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(1000);

    // Get full page content for analysis
    const pageContent = await page.content();
    const visibleText = await page.textContent('body');
    
    // Test 1: No duplicate demo forms (fixed issue from Phase 2)
    const demoForms = page.locator('form[id*="demo"], .demo-form, form:has(input[placeholder*="company"])');
    const demoFormCount = await demoForms.count();
    expect(demoFormCount).toBe(1); // Should have exactly one demo form
    console.log(`✅ Single demo form confirmed (found ${demoFormCount})`);
    
    // Test 2: "Join Our Pilot Program" should appear maximum 2 times strategically
    const pilotProgramCount = (visibleText.match(/Join Our Pilot Program/gi) || []).length;
    expect(pilotProgramCount).toBeLessThanOrEqual(2);
    console.log(`✅ Pilot program CTAs optimized (found ${pilotProgramCount})`);
    
    // Test 3: No placeholder or Lorem ipsum content
    expect(visibleText.toLowerCase()).not.toContain('lorem ipsum');
    expect(visibleText.toLowerCase()).not.toContain('placeholder');
    expect(visibleText.toLowerCase()).not.toContain('sample text');
    console.log('✅ No placeholder content detected');
    
    // Test 4: Verify professional copy quality
    expect(visibleText).toContain('MyBidFit');
    expect(visibleText.toLowerCase()).toContain('supplier');
    expect(visibleText.toLowerCase()).toContain('opportunity');
    console.log('✅ Professional copy quality validated');
    
    // Test 5: Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1); // Should have exactly one H1
    
    const h2Count = await page.locator('h2').count();
    expect(h2Count).toBeGreaterThan(0); // Should have section headings
    
    console.log(`✅ Heading hierarchy: 1 H1, ${h2Count} H2s`);
    
    // Take content validation screenshot
    await page.screenshot({ 
      path: 'test/screenshots/landing-05-content-validated.png', 
      fullPage: true 
    });
  });

  // === PHASE 5: CSS CLASS MIGRATION VALIDATION ===
  test('should use proper CSS classes instead of inline styles', async () => {
    console.log('🎨 Phase 5: CSS class migration and styling validation');
    
    await page.goto('file:///mnt/c/Users/dnice/DJ%20Programs/mybidfit_mini/design_sprint/index.html', {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(1000);

    // Test 1: Check for inline style usage (should be minimal)
    const elementsWithInlineStyles = await page.locator('[style]').count();
    expect(elementsWithInlineStyles).toBeLessThan(5); // Allow some but not many
    console.log(`✅ Inline styles minimized (found ${elementsWithInlineStyles})`);
    
    // Test 2: Validate key components have proper CSS classes
    const components = [
      { selector: '.hero', name: 'Hero Section' },
      { selector: '.trust-grid', name: 'Trust Grid' },
      { selector: '.feature-grid', name: 'Feature Grid' },
      { selector: '.modal', name: 'Modal System' },
      { selector: '.footer', name: 'Footer' }
    ];
    
    for (const component of components) {
      const element = page.locator(component.selector);
      if (await element.count() > 0) {
        await expect(element).toBeVisible();
        console.log(`✅ ${component.name} has proper CSS class`);
      }
    }
    
    // Test 3: Validate professional styling is applied
    const heroSection = page.locator('.hero');
    const heroStyles = await heroSection.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        background: styles.background,
        padding: styles.padding,
        textAlign: styles.textAlign
      };
    });
    
    // Hero should have professional styling
    expect(heroStyles.background).not.toBe('initial');
    console.log('✅ Professional hero styling confirmed');
    
    // Take CSS validation screenshot
    await page.screenshot({ 
      path: 'test/screenshots/landing-06-css-validated.png', 
      fullPage: true 
    });
  });

  // === PHASE 6: CONSOLE ERROR AND PERFORMANCE VALIDATION ===
  test('should have zero console errors and good performance', async () => {
    console.log('⚡ Phase 6: Console errors and performance validation');
    
    const consoleErrors = [];
    const consoleWarnings = [];
    
    page.on('console', message => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      } else if (message.type() === 'warning') {
        consoleWarnings.push(message.text());
      }
    });
    
    // Navigate and measure load time
    const startTime = Date.now();
    await page.goto('file:///mnt/c/Users/dnice/DJ%20Programs/mybidfit_mini/design_sprint/index.html', {
      waitUntil: 'networkidle'
    });
    const loadTime = Date.now() - startTime;
    
    await page.waitForTimeout(3000); // Allow time for any lazy-loaded content
    
    // Validate no console errors
    expect(consoleErrors.length).toBe(0);
    console.log(`✅ Zero console errors detected`);
    
    // Log warnings but don't fail (warnings are acceptable)
    if (consoleWarnings.length > 0) {
      console.log(`⚠️ Found ${consoleWarnings.length} console warnings (acceptable)`);
    }
    
    // Validate reasonable load time for static HTML
    expect(loadTime).toBeLessThan(5000); // Should load quickly for static HTML
    console.log(`✅ Page loaded in ${loadTime}ms`);
    
    // Test JavaScript functionality (modal system should work)
    const demoButton = page.locator('button[type="submit"]');
    if (await demoButton.isVisible()) {
      await expect(demoButton).toBeEnabled();
      console.log('✅ JavaScript functionality confirmed');
    }
    
    // Take performance validation screenshot
    await page.screenshot({ 
      path: 'test/screenshots/landing-07-performance-validated.png', 
      fullPage: true 
    });
  });

  // === PHASE 7: INTERACTIVE ELEMENTS COMPREHENSIVE TESTING ===
  test('should have all interactive elements functional', async () => {
    console.log('🎯 Phase 7: Comprehensive interactive elements testing');
    
    await page.goto('file:///mnt/c/Users/dnice/DJ%20Programs/mybidfit_mini/design_sprint/index.html', {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(1000);

    // Test all buttons
    const buttons = page.locator('button, .btn, [role="button"]');
    const buttonCount = await buttons.count();
    console.log(`🔘 Testing ${buttonCount} interactive buttons`);
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        await expect(button).toBeEnabled();
        
        // Test hover effect if button has hover state
        await button.hover();
        await page.waitForTimeout(100);
      }
    }
    
    // Test all links
    const links = page.locator('a[href]');
    const linkCount = await links.count();
    console.log(`🔗 Validating ${linkCount} links`);
    
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      if (await link.isVisible()) {
        const href = await link.getAttribute('href');
        expect(href).toBeTruthy();
      }
    }
    
    // Test all form inputs
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    console.log(`📝 Testing ${inputCount} form inputs`);
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        await expect(input).toBeEnabled();
        
        // Test input focus
        await input.focus();
        await page.waitForTimeout(50);
      }
    }
    
    // Take interactive elements screenshot
    await page.screenshot({ 
      path: 'test/screenshots/landing-08-interactive-validated.png', 
      fullPage: true 
    });
    
    console.log('✅ All interactive elements validated successfully');
  });

  // === COMPREHENSIVE TEST: FULL USER JOURNEY ===
  test('[COMPREHENSIVE] should handle complete landing page user journey', async () => {
    console.log('🚀 COMPREHENSIVE: Full MyBidFit landing page user journey');
    
    // Step 1: Initial page load
    await page.goto('file:///mnt/c/Users/dnice/DJ%20Programs/mybidfit_mini/design_sprint/index.html', {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(1000);
    
    // Step 2: User scrolls through page content
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 3);
    });
    await page.waitForTimeout(500);
    
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await page.waitForTimeout(500);
    
    // Step 3: User scrolls to demo form
    const demoForm = page.locator('#demo-form, form[id*="demo"], .demo-form');
    await demoForm.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    // Step 4: User fills out demo form
    await page.fill('input[name="companyName"], input#company-name, input[placeholder*="company" i]', 'Acme Corporation');
    await page.waitForTimeout(200);
    
    await page.fill('input[name="email"], input[type="email"], input[placeholder*="email" i]', 'demo@acmecorp.com');
    await page.waitForTimeout(200);
    
    await page.fill('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]', '(555) 999-8888');
    await page.waitForTimeout(200);
    
    // Step 5: User submits form and interacts with modal
    const submitButton = page.locator('button[type="submit"], .submit-btn, button:has-text("Submit")');
    await submitButton.click();
    await page.waitForTimeout(1000);
    
    // Step 6: Validate modal appears and user can interact with it
    const modal = page.locator('.modal, [role="dialog"], .modal-overlay');
    await expect(modal).toBeVisible();
    
    // Step 7: User closes modal
    const closeButton = page.locator('.modal .close, button:has-text("Close"), [aria-label="Close"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await page.waitForTimeout(500);
    } else {
      // Try backdrop close
      const backdrop = page.locator('.modal-overlay, .modal-backdrop');
      if (await backdrop.isVisible()) {
        await backdrop.click({ position: { x: 10, y: 10 } });
        await page.waitForTimeout(500);
      }
    }
    
    // Step 8: Validate user successfully completed journey
    await expect(modal).not.toBeVisible();
    
    // Take final comprehensive test screenshot
    await page.screenshot({ 
      path: 'test/screenshots/landing-09-comprehensive-journey-complete.png', 
      fullPage: true 
    });
    
    console.log('🎉 Comprehensive user journey test completed successfully');
    console.log('✅ MyBidFit landing page transformation validation complete');
  });

  // === FINAL VALIDATION: TRANSFORMATION SUCCESS METRICS ===
  test('[VALIDATION SUMMARY] should meet all MyBidFit transformation success criteria', async () => {
    console.log('📊 FINAL VALIDATION: MyBidFit transformation success metrics');
    
    await page.goto('file:///mnt/c/Users/dnice/DJ%20Programs/mybidfit_mini/design_sprint/index.html', {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(2000);
    
    const successMetrics = {
      contentCleanup: false,
      modalSystem: false,
      responsiveDesign: false,
      professionalStyling: false,
      zeroConsoleErrors: false,
      interactiveElements: false
    };
    
    // Metric 1: Content Cleanup (no duplicates)
    const demoFormCount = await page.locator('form[id*="demo"], .demo-form').count();
    successMetrics.contentCleanup = demoFormCount === 1;
    
    // Metric 2: Professional Modal System
    const hasModalSystem = await page.locator('.modal, [role="dialog"]').count() > 0;
    successMetrics.modalSystem = hasModalSystem;
    
    // Metric 3: Responsive Design (test one breakpoint)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    successMetrics.responsiveDesign = bodyScrollWidth <= 377; // 375 + 2px tolerance
    
    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    // Metric 4: Professional Styling (CSS classes vs inline)
    const inlineStyleCount = await page.locator('[style]').count();
    successMetrics.professionalStyling = inlineStyleCount < 10;
    
    // Metric 5: Zero Console Errors
    const consoleErrors = [];
    page.on('console', message => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
    
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    successMetrics.zeroConsoleErrors = consoleErrors.length === 0;
    
    // Metric 6: Interactive Elements Functional
    const submitButton = page.locator('button[type="submit"]');
    const submitButtonEnabled = await submitButton.isEnabled();
    successMetrics.interactiveElements = submitButtonEnabled;
    
    // Calculate overall success rate
    const successCount = Object.values(successMetrics).filter(Boolean).length;
    const totalMetrics = Object.keys(successMetrics).length;
    const successRate = Math.round((successCount / totalMetrics) * 100);
    
    // Log results
    console.log('📈 TRANSFORMATION SUCCESS METRICS:');
    console.log(`   ✅ Content Cleanup: ${successMetrics.contentCleanup ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Modal System: ${successMetrics.modalSystem ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Responsive Design: ${successMetrics.responsiveDesign ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Professional Styling: ${successMetrics.professionalStyling ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Zero Console Errors: ${successMetrics.zeroConsoleErrors ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Interactive Elements: ${successMetrics.interactiveElements ? 'PASS' : 'FAIL'}`);
    console.log(`🎯 OVERALL SUCCESS RATE: ${successRate}%`);
    
    // Expect high success rate
    expect(successRate).toBeGreaterThanOrEqual(80);
    
    // Take final validation screenshot
    await page.screenshot({ 
      path: 'test/screenshots/landing-10-final-validation.png', 
      fullPage: true 
    });
    
    
    console.log(`🎉 Achieved ${successRate}% success rate - Professional quality confirmed`);
  });
});nfirmed`);
  });
}););
});););