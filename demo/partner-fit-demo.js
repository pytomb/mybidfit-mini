#!/usr/bin/env node

/**
 * Partner Fit Feature - Interactive Demo Script
 * 
 * This script creates a visual walkthrough of the Partner Fit functionality
 * suitable for screen recording and demonstration purposes.
 * 
 * Run with: node demo/partner-fit-demo.js
 */

const { chromium } = require('playwright');
const jwt = require('jsonwebtoken');
const { logger } = require('../src/utils/logger');

// Demo configuration
const DEMO_CONFIG = {
  baseUrl: 'http://localhost:3001',
  slowMo: 500, // Slow down actions by 500ms for visibility
  headless: false, // Show browser window
  viewport: { width: 1920, height: 1080 }, // Full HD for recording
  recordVideo: {
    dir: './demo/recordings', // Save video recordings
    size: { width: 1920, height: 1080 }
  }
};

// Demo user credentials
const DEMO_USER = {
  email: 'demo@mybidfit.com',
  password: 'Demo123!',
  companyName: 'TechInnovate Solutions',
  userId: 1
};

// Generate JWT token for API calls
const authToken = jwt.sign(
  { userId: DEMO_USER.userId }, 
  process.env.JWT_SECRET || 'mybidfit-super-secret-development-key-2025'
);

async function runPartnerFitDemo() {
  let browser;
  let context;
  let page;

  try {
    console.log('🎬 Starting Partner Fit Demo...\n');
    console.log('📹 Browser will open in headed mode for recording');
    console.log('💡 Tip: Use OBS Studio or similar to record the browser window\n');

    // Launch browser in headed mode
    browser = await chromium.launch({
      headless: DEMO_CONFIG.headless,
      slowMo: DEMO_CONFIG.slowMo,
      args: ['--start-maximized']
    });

    // Create context with video recording
    context = await browser.newContext({
      viewport: DEMO_CONFIG.viewport,
      recordVideo: DEMO_CONFIG.recordVideo,
      // Add auth token to localStorage for API calls
      storageState: {
        cookies: [],
        origins: [{
          origin: DEMO_CONFIG.baseUrl,
          localStorage: [{
            name: 'authToken',
            value: authToken
          }]
        }]
      }
    });

    page = await context.newPage();

    // ============================
    // SCENE 1: Landing Page
    // ============================
    await demonstrateStep(page, '🏠 Scene 1: MyBidFit Landing Page', async () => {
      await page.goto(DEMO_CONFIG.baseUrl);
      await page.waitForTimeout(2000); // Pause for recording
      
      // Highlight the Partner Fit feature
      await highlightElement(page, 'text=Partner Discovery');
      await page.waitForTimeout(1500);
    });

    // ============================
    // SCENE 2: Login Flow
    // ============================
    await demonstrateStep(page, '🔐 Scene 2: User Authentication', async () => {
      // Navigate to login
      await page.click('text=Login');
      await page.waitForTimeout(1000);

      // Fill login form with typing effect
      await typeWithEffect(page, 'input[name="email"]', DEMO_USER.email);
      await page.waitForTimeout(500);
      await typeWithEffect(page, 'input[name="password"]', DEMO_USER.password);
      await page.waitForTimeout(500);

      // Submit login
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(2000);
    });

    // ============================
    // SCENE 3: Partner Fit Dashboard
    // ============================
    await demonstrateStep(page, '🤝 Scene 3: Partner Discovery Dashboard', async () => {
      // Navigate to Partner Fit section
      await page.goto(`${DEMO_CONFIG.baseUrl}/partner-fit`);
      await page.waitForTimeout(2000);

      // Show the main dashboard
      await scrollSlowly(page, 300);
      await page.waitForTimeout(1500);
    });

    // ============================
    // SCENE 4: Search for Complementary Partners
    // ============================
    await demonstrateStep(page, '🔍 Scene 4: Finding Complementary Partners', async () => {
      // Open search filters
      await page.click('button:has-text("Search Partners")');
      await page.waitForTimeout(1000);

      // Select complementary match type
      await page.click('input[value="complementary"]');
      await highlightElement(page, 'label:has-text("Complementary Partners")');
      await page.waitForTimeout(1000);

      // Add capability filters
      await page.click('text=Select Capabilities');
      await page.waitForTimeout(500);
      await page.click('text=Cloud Architecture');
      await page.click('text=DevOps');
      await page.waitForTimeout(1000);

      // Add certification filter
      await page.click('text=Select Certifications');
      await page.waitForTimeout(500);
      await page.click('text=SOC 2');
      await page.waitForTimeout(1000);

      // Execute search
      await page.click('button:has-text("Find Partners")');
      await page.waitForTimeout(2000);
    });

    // ============================
    // SCENE 5: Multi-Persona Evaluation Results
    // ============================
    await demonstrateStep(page, '📊 Scene 5: Multi-Persona Partner Evaluation', async () => {
      // Wait for results to load
      await page.waitForSelector('.partner-card', { timeout: 5000 });
      
      // Click on first partner to expand details
      const firstPartner = await page.locator('.partner-card').first();
      await firstPartner.click();
      await page.waitForTimeout(1500);

      // Highlight multi-persona scores
      await highlightElement(page, '.cfo-score');
      await page.waitForTimeout(1000);
      
      await highlightElement(page, '.ciso-score');
      await page.waitForTimeout(1000);
      
      await highlightElement(page, '.operator-score');
      await page.waitForTimeout(1000);
      
      await highlightElement(page, '.skeptic-score');
      await page.waitForTimeout(1500);

      // Show match reasoning
      await scrollSlowly(page, 200);
      await highlightElement(page, '.match-reasons');
      await page.waitForTimeout(2000);
    });

    // ============================
    // SCENE 6: Similar Partners Search
    // ============================
    await demonstrateStep(page, '🔄 Scene 6: Finding Similar Partners for Scaling', async () => {
      // Change to similar partners
      await page.click('input[value="similar"]');
      await highlightElement(page, 'label:has-text("Similar Partners")');
      await page.waitForTimeout(1000);

      // Update search
      await page.click('button:has-text("Find Partners")');
      await page.waitForTimeout(2000);

      // Show scaling-focused results
      await page.waitForSelector('.partner-card');
      await scrollSlowly(page, 300);
      await page.waitForTimeout(1500);
    });

    // ============================
    // SCENE 7: Send Partnership Invitation
    // ============================
    await demonstrateStep(page, '✉️ Scene 7: Sending Partnership Invitation', async () => {
      // Click on a partner
      const partner = await page.locator('.partner-card').first();
      await partner.click();
      await page.waitForTimeout(1000);

      // Click invite button
      await page.click('button:has-text("Send Partnership Invitation")');
      await page.waitForTimeout(1000);

      // Fill invitation form
      await typeWithEffect(
        page, 
        'textarea[name="message"]', 
        'We are excited about the potential synergies between our companies. Your expertise in Cloud Architecture perfectly complements our Full Stack Development capabilities. Let\'s discuss how we can collaborate on upcoming government contracts.'
      );
      await page.waitForTimeout(1500);

      // Send invitation
      await page.click('button:has-text("Send Invitation")');
      await page.waitForTimeout(2000);

      // Show success message
      await page.waitForSelector('.success-message');
      await highlightElement(page, '.success-message');
      await page.waitForTimeout(2000);
    });

    // ============================
    // SCENE 8: API Demo (Developer View)
    // ============================
    await demonstrateStep(page, '💻 Scene 8: API Integration Demo', async () => {
      // Open developer console view
      await page.goto(`${DEMO_CONFIG.baseUrl}/api-explorer`);
      await page.waitForTimeout(1500);

      // Show API endpoint
      await typeWithEffect(
        page, 
        'input[name="endpoint"]', 
        '/api/partner-fit/search?matchType=complementary&capabilities=Cloud%20Architecture&limit=5'
      );
      await page.waitForTimeout(1000);

      // Add authorization header
      await page.click('button:has-text("Add Header")');
      await typeWithEffect(page, 'input[name="header-key"]', 'Authorization');
      await typeWithEffect(page, 'input[name="header-value"]', `Bearer ${authToken.substring(0, 20)}...`);
      await page.waitForTimeout(1000);

      // Execute API call
      await page.click('button:has-text("Send Request")');
      await page.waitForTimeout(1500);

      // Show JSON response with multi-persona data
      await page.waitForSelector('.json-response');
      await scrollSlowly(page, 400);
      await highlightElement(page, '.personas-section');
      await page.waitForTimeout(2500);
    });

    // ============================
    // SCENE 9: Summary Statistics
    // ============================
    await demonstrateStep(page, '📈 Scene 9: Partnership Analytics Dashboard', async () => {
      await page.goto(`${DEMO_CONFIG.baseUrl}/partner-fit/analytics`);
      await page.waitForTimeout(2000);

      // Highlight key metrics
      await highlightElement(page, '.total-matches');
      await page.waitForTimeout(1000);
      
      await highlightElement(page, '.avg-match-score');
      await page.waitForTimeout(1000);
      
      await highlightElement(page, '.invitations-sent');
      await page.waitForTimeout(1000);
      
      await highlightElement(page, '.partnerships-formed');
      await page.waitForTimeout(2000);
    });

    // ============================
    // DEMO COMPLETE
    // ============================
    console.log('\n✅ Demo completed successfully!');
    console.log('📹 Video saved to: ./demo/recordings/');
    console.log('🎬 Demo duration: ~3 minutes');

    // Keep browser open for final screenshot
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    throw error;
  } finally {
    // Close browser
    if (context) {
      await context.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}

// ============================
// HELPER FUNCTIONS
// ============================

async function demonstrateStep(page, title, action) {
  console.log(`\n${title}`);
  console.log('─'.repeat(50));
  
  // Add visual indicator on page
  await page.evaluate((stepTitle) => {
    const indicator = document.createElement('div');
    indicator.id = 'demo-indicator';
    indicator.innerHTML = `<h2>${stepTitle}</h2>`;
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 25px;
      border-radius: 10px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 18px;
      z-index: 10000;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.5s ease-out;
    `;
    
    // Remove previous indicator
    const existing = document.getElementById('demo-indicator');
    if (existing) existing.remove();
    
    document.body.appendChild(indicator);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      indicator.style.animation = 'slideOut 0.5s ease-out';
      setTimeout(() => indicator.remove(), 500);
    }, 5000);
  }, title);

  await action();
}

async function typeWithEffect(page, selector, text) {
  await page.click(selector);
  await page.type(selector, text, { delay: 50 }); // Type with visible delay
}

async function highlightElement(page, selector) {
  try {
    await page.evaluate((sel) => {
      const element = document.querySelector(sel) || 
                     Array.from(document.querySelectorAll('*')).find(el => el.textContent.includes(sel.replace('text=', '')));
      
      if (element) {
        element.style.transition = 'all 0.3s ease';
        element.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.8)';
        element.style.border = '3px solid #667eea';
        element.style.borderRadius = '8px';
        element.style.padding = '10px';
        
        setTimeout(() => {
          element.style.boxShadow = '';
          element.style.border = '';
          element.style.borderRadius = '';
          element.style.padding = '';
        }, 2000);
      }
    }, selector);
  } catch (e) {
    // Ignore if element not found
  }
}

async function scrollSlowly(page, distance) {
  await page.evaluate(async (scrollDistance) => {
    const scrollStep = 5;
    const scrollDelay = 10;
    let scrolled = 0;
    
    while (scrolled < scrollDistance) {
      window.scrollBy(0, scrollStep);
      scrolled += scrollStep;
      await new Promise(resolve => setTimeout(resolve, scrollDelay));
    }
  }, distance);
}

// Add CSS animations
async function injectDemoStyles(page) {
  await page.addStyleTag({
    content: `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      .demo-highlight {
        animation: pulse 1s ease-in-out infinite;
      }
    `
  });
}

// ============================
// RUN THE DEMO
// ============================
if (require.main === module) {
  runPartnerFitDemo().catch(console.error);
}

module.exports = { runPartnerFitDemo };