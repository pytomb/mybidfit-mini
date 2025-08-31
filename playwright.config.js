const { defineConfig, devices } = require('@playwright/test');

// Playwright Configuration for MyBidFit E2E Testing
// Optimized for ui-comprehensive-tester methodology
module.exports = defineConfig({
  testDir: './test/e2e',
  outputDir: 'test/screenshots',
  
  // Global timeout settings
  timeout: 30000,
  expect: {
    timeout: 5000
  },

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test/reports/html' }],
    ['json', { outputFile: 'test/reports/test-results.json' }],
    ['line']
  ],

  // Global test configuration
  use: {
    // Base URL for testing
    baseURL: 'http://localhost:3004',
    
    // Browser settings
    headless: process.env.CI ? true : false,
    viewport: { width: 1920, height: 1080 },
    
    // Test settings
    actionTimeout: 10000,
    navigationTimeout: 10000,
    
    // Screenshots and traces
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // Network settings
    ignoreHTTPSErrors: true
  },

  // Project configurations for different browsers and viewports
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox-desktop', 
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] }
    },
    {
      name: 'tablet',
      use: { ...devices['iPad Pro'] }
    }
  ],

  // Local dev server configuration
  webServer: process.env.CI ? undefined : [
    {
      command: 'cd frontend && npm run dev',
      port: 3004,
      reuseExistingServer: !process.env.CI,
      timeout: 120000
    },
    {
      command: 'PORT=3002 npm run dev',
      port: 3002, 
      reuseExistingServer: !process.env.CI,
      timeout: 120000
    }
  ]
});