const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function finalDashboardInspection() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotsDir = path.join(__dirname, 'screenshots', 'final-inspection');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Enable verbose logging
  page.on('console', message => {
    console.log(`BROWSER: ${message.type()} - ${message.text()}`);
  });

  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`API: ${response.status()} ${response.url()}`);
    }
  });

  try {
    console.log('🔍 Final Dashboard Inspection...\n');
    
    // Navigate to login
    console.log('1. Navigating to login...');
    await page.goto('http://localhost:3003/login');
    await page.waitForLoadState('networkidle');
    
    // Login
    console.log('2. Logging in...');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard with extended timeout
    console.log('3. Waiting for dashboard...');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Give React time to render data
    console.log('4. Allowing time for data rendering...');
    await page.waitForTimeout(5000);
    
    // Capture dashboard
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'dashboard-final.png'),
      fullPage: true 
    });
    
    // Check DOM structure
    console.log('5. Analyzing DOM structure...');
    
    const domAnalysis = await page.evaluate(() => {
      const analysis = {
        sections: [],
        companySelector: null,
        opportunities: [],
        quickActions: [],
        allText: document.body.innerText
      };
      
      // Check for sections
      const sections = document.querySelectorAll('section');
      sections.forEach((section, i) => {
        const header = section.querySelector('.section-header h2');
        analysis.sections.push({
          index: i,
          headerText: header ? header.textContent : 'No header',
          innerHTML: section.innerHTML.substring(0, 200) + '...'
        });
      });
      
      // Check company selector
      const companySelect = document.querySelector('select#company-select');
      if (companySelect) {
        const options = Array.from(companySelect.options).map(opt => opt.textContent);
        analysis.companySelector = {
          present: true,
          options: options,
          visible: companySelect.offsetHeight > 0
        };
      }
      
      // Check for opportunity cards
      const oppCards = document.querySelectorAll('.card-grid .card');
      oppCards.forEach((card, i) => {
        const title = card.querySelector('h3');
        const matchScore = card.querySelector('.match-score');
        if (matchScore) {
          analysis.opportunities.push({
            index: i,
            title: title ? title.textContent : 'No title',
            hasMatchScore: true
          });
        } else if (title && (title.textContent.includes('AI Analysis') || title.textContent.includes('Find Partners'))) {
          analysis.quickActions.push({
            index: i,
            title: title.textContent
          });
        }
      });
      
      return analysis;
    });
    
    console.log('\n📊 DOM Analysis Results:');
    console.log(`Sections found: ${domAnalysis.sections.length}`);
    domAnalysis.sections.forEach(section => {
      console.log(`  Section ${section.index}: "${section.headerText}"`);
    });
    
    console.log(`\nCompany Selector:`, domAnalysis.companySelector ? 
      `Found with ${domAnalysis.companySelector.options.length} options: ${domAnalysis.companySelector.options.join(', ')}` : 
      'Not found');
    
    console.log(`Opportunities: ${domAnalysis.opportunities.length} found`);
    domAnalysis.opportunities.forEach(opp => {
      console.log(`  Opportunity ${opp.index}: "${opp.title}"`);
    });
    
    console.log(`Quick Actions: ${domAnalysis.quickActions.length} found`);
    domAnalysis.quickActions.forEach(action => {
      console.log(`  Action ${action.index}: "${action.title}"`);
    });
    
    // Save text content for analysis
    fs.writeFileSync(
      path.join(screenshotsDir, 'dashboard-text.txt'), 
      domAnalysis.allText
    );
    
    // Test specific selectors our assessment was looking for
    console.log('\n🔍 Testing Specific Selectors:');
    
    const selectorTests = [
      { name: 'Welcome Section', selector: '.section-header h2', text: 'Welcome back' },
      { name: 'Company Selector', selector: 'select#company-select' },
      { name: 'Quick Actions Header', selector: '.section-header h2', text: 'Quick Actions' },
      { name: 'Card Grid', selector: '.card-grid' },
      { name: 'Match Score Cards', selector: '.match-score' }
    ];
    
    for (const test of selectorTests) {
      let element;
      if (test.text) {
        element = page.locator(test.selector).filter({ hasText: test.text }).first();
      } else {
        element = page.locator(test.selector).first();
      }
      
      const isVisible = await element.isVisible().catch(() => false);
      const count = await page.locator(test.selector).count();
      
      console.log(`${test.name}: ${isVisible ? '✅ Visible' : '❌ Not visible'} (${count} total found)`);
    }
    
    // Interactive testing
    console.log('\n🎮 Interactive Testing:');
    
    // Test company selector if available
    const companySelect = page.locator('select#company-select');
    if (await companySelect.isVisible()) {
      const optionCount = await companySelect.locator('option').count();
      console.log(`Company selector has ${optionCount} options`);
      
      if (optionCount > 1) {
        console.log('Testing company selection...');
        await companySelect.selectOption({ index: 1 });
        await page.waitForTimeout(3000);
        
        await page.screenshot({ 
          path: path.join(screenshotsDir, 'after-company-selection.png'),
          fullPage: true 
        });
      }
    }
    
    // Test responsive on key breakpoints
    console.log('\n📱 Quick Responsive Test:');
    
    const breakpoints = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Desktop', width: 1440, height: 900 }
    ];
    
    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, `responsive-${bp.name.toLowerCase()}.png`),
        fullPage: true 
      });
      
      console.log(`${bp.name} (${bp.width}x${bp.height}): Screenshot captured`);
    }
    
    console.log(`\n✅ Final inspection complete!`);
    console.log(`📁 Results saved to: ${screenshotsDir}`);
    
  } catch (error) {
    console.error('❌ Inspection error:', error.message);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'error-inspection.png'),
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

finalDashboardInspection().catch(console.error);