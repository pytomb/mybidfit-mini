const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function comprehensiveUIAssessment() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'screenshots');
  const assessmentDir = path.join(screenshotsDir, 'ui-assessment');
  if (!fs.existsSync(assessmentDir)) {
    fs.mkdirSync(assessmentDir, { recursive: true });
  }

  const assessmentResults = {
    timestamp: new Date().toISOString(),
    login: { success: false, issues: [] },
    dashboard: { loaded: false, components: [], issues: [] },
    responsive: { breakpoints: {}, issues: [] },
    data: { companies: [], opportunities: [], loading: false },
    console: { errors: [], warnings: [] },
    performance: { navigationTime: 0, loadTime: 0 }
  };

  // Capture console messages
  page.on('console', message => {
    const type = message.type();
    const text = message.text();
    if (type === 'error') {
      assessmentResults.console.errors.push(text);
      console.log(`❌ CONSOLE ERROR: ${text}`);
    } else if (type === 'warning') {
      assessmentResults.console.warnings.push(text);
      console.log(`⚠️ CONSOLE WARNING: ${text}`);
    }
  });

  try {
    console.log('🚀 Starting Comprehensive UI Assessment...\n');
    
    // === LOGIN TESTING ===
    console.log('1️⃣ Testing Login Process...');
    const startTime = performance.now();
    
    await page.goto('http://localhost:3003/login');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: path.join(assessmentDir, '01-login-page.png'),
      fullPage: true 
    });

    // Test login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    
    await page.screenshot({ 
      path: path.join(assessmentDir, '02-login-filled.png'),
      fullPage: true 
    });

    // Submit and wait for dashboard
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL('http://localhost:3003/dashboard', { timeout: 10000 });
      assessmentResults.login.success = true;
      console.log('✓ Login successful - redirected to dashboard');
    } catch (error) {
      assessmentResults.login.issues.push('Failed to redirect to dashboard after login');
      console.log('❌ Login redirection failed');
    }

    // === DASHBOARD ANALYSIS ===
    console.log('\n2️⃣ Analyzing Dashboard Components...');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow for data loading
    
    const navTime = performance.now() - startTime;
    assessmentResults.performance.navigationTime = Math.round(navTime);

    // Full dashboard screenshot
    await page.screenshot({ 
      path: path.join(assessmentDir, '03-dashboard-full.png'),
      fullPage: true 
    });

    // Check for main dashboard components
    const components = [
      { name: 'Header', selector: 'header, .header' },
      { name: 'Navigation', selector: 'nav, .nav, .navbar' },
      { name: 'Company Selector', selector: 'select#company-select, .company-select' },
      { name: 'Opportunities List', selector: '.opportunity, .opportunities, [data-testid*="opportunity"]' },
      { name: 'Search/Filter', selector: 'input[type="search"], .search, .filter' },
      { name: 'Cards/Grid Layout', selector: '.card, .grid-item, .opportunity-card' }
    ];

    for (const component of components) {
      const element = page.locator(component.selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      
      if (isVisible) {
        assessmentResults.dashboard.components.push(component.name);
        console.log(`✓ ${component.name} found`);
        
        // Capture individual component
        try {
          await element.screenshot({ 
            path: path.join(assessmentDir, `component-${component.name.toLowerCase().replace(/\s/g, '-')}.png`)
          });
        } catch (error) {
          console.log(`⚠️ Could not capture ${component.name} screenshot`);
        }
      } else {
        assessmentResults.dashboard.issues.push(`${component.name} not found or not visible`);
        console.log(`❌ ${component.name} not found`);
      }
    }

    // Check for data loading
    const companySelect = page.locator('select#company-select');
    if (await companySelect.isVisible()) {
      const companies = await companySelect.locator('option').allTextContents();
      assessmentResults.data.companies = companies.filter(c => c.trim() !== '');
      console.log(`✓ Found ${assessmentResults.data.companies.length} companies:`, assessmentResults.data.companies);
    }

    // Check for opportunities
    const opportunityElements = await page.locator('.opportunity, [class*="opportunity"], [data-testid*="opportunity"]').count();
    if (opportunityElements > 0) {
      console.log(`✓ Found ${opportunityElements} opportunity elements`);
      assessmentResults.data.opportunities = Array(opportunityElements).fill().map((_, i) => `Opportunity ${i + 1}`);
    } else {
      assessmentResults.dashboard.issues.push('No opportunity elements found');
      console.log('❌ No opportunities found on dashboard');
    }

    // === RESPONSIVE TESTING ===
    console.log('\n3️⃣ Testing Responsive Design...');
    
    const breakpoints = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1440, height: 900 },
      { name: 'Large Desktop', width: 1920, height: 1080 }
    ];

    for (const bp of breakpoints) {
      console.log(`📱 Testing ${bp.name} (${bp.width}x${bp.height})`);
      
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.waitForTimeout(1000); // Allow layout to settle
      
      await page.screenshot({ 
        path: path.join(assessmentDir, `responsive-${bp.name.toLowerCase().replace(/\s/g, '-')}.png`),
        fullPage: true 
      });

      // Check for responsive issues
      const bodyOverflow = await page.evaluate(() => {
        const body = document.body;
        return {
          scrollWidth: body.scrollWidth,
          clientWidth: body.clientWidth,
          hasHorizontalScroll: body.scrollWidth > body.clientWidth
        };
      });

      if (bodyOverflow.hasHorizontalScroll) {
        const issue = `${bp.name}: Horizontal scroll detected (${bodyOverflow.scrollWidth}px > ${bodyOverflow.clientWidth}px)`;
        assessmentResults.responsive.issues.push(issue);
        console.log(`⚠️ ${issue}`);
      } else {
        console.log(`✓ ${bp.name}: No horizontal scroll`);
      }

      assessmentResults.responsive.breakpoints[bp.name] = {
        width: bp.width,
        height: bp.height,
        hasHorizontalScroll: bodyOverflow.hasHorizontalScroll,
        scrollWidth: bodyOverflow.scrollWidth,
        clientWidth: bodyOverflow.clientWidth
      };
    }

    // Reset to desktop for final tests
    await page.setViewportSize({ width: 1920, height: 1080 });

    // === INTERACTION TESTING ===
    console.log('\n4️⃣ Testing Interactions...');
    
    // Test company selector if available
    if (await companySelect.isVisible()) {
      await companySelect.selectOption({ index: 1 });
      await page.waitForTimeout(2000);
      await page.screenshot({ 
        path: path.join(assessmentDir, '04-company-selected.png'),
        fullPage: true 
      });
      console.log('✓ Company selector interaction tested');
    }

    // Test navigation elements
    const navLinks = await page.locator('nav a, .nav a, .navbar a').count();
    if (navLinks > 0) {
      console.log(`✓ Found ${navLinks} navigation links`);
      
      // Test first navigation link
      try {
        const firstLink = page.locator('nav a, .nav a, .navbar a').first();
        const linkText = await firstLink.textContent();
        console.log(`Testing navigation to: ${linkText}`);
        // Note: Not clicking to avoid leaving dashboard, just verifying presence
      } catch (error) {
        console.log('⚠️ Could not test navigation links');
      }
    }

    assessmentResults.dashboard.loaded = true;
    
    // === PERFORMANCE ASSESSMENT ===
    const endTime = performance.now();
    assessmentResults.performance.loadTime = Math.round(endTime - startTime);
    console.log(`\n⏱️ Performance: Navigation took ${assessmentResults.performance.navigationTime}ms, Total assessment took ${assessmentResults.performance.loadTime}ms`);

  } catch (error) {
    console.error('❌ Assessment error:', error.message);
    assessmentResults.dashboard.issues.push(`Assessment error: ${error.message}`);
    
    await page.screenshot({ 
      path: path.join(assessmentDir, 'error-state.png'),
      fullPage: true 
    });
  } finally {
    // Save assessment results
    const reportPath = path.join(assessmentDir, 'assessment-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(assessmentResults, null, 2));
    
    console.log(`\n📊 Assessment Complete!`);
    console.log(`📁 Screenshots saved to: ${assessmentDir}`);
    console.log(`📋 Report saved to: ${reportPath}`);
    
    // Print summary
    console.log(`\n=== ASSESSMENT SUMMARY ===`);
    console.log(`Login Success: ${assessmentResults.login.success ? '✓' : '❌'}`);
    console.log(`Dashboard Loaded: ${assessmentResults.dashboard.loaded ? '✓' : '❌'}`);
    console.log(`Components Found: ${assessmentResults.dashboard.components.length}`);
    console.log(`Companies Available: ${assessmentResults.data.companies.length}`);
    console.log(`Console Errors: ${assessmentResults.console.errors.length}`);
    console.log(`Console Warnings: ${assessmentResults.console.warnings.length}`);
    console.log(`Responsive Issues: ${assessmentResults.responsive.issues.length}`);
    console.log(`Total Issues: ${assessmentResults.login.issues.length + assessmentResults.dashboard.issues.length + assessmentResults.responsive.issues.length}`);
    
    await browser.close();
  }
}

comprehensiveUIAssessment().catch(console.error);