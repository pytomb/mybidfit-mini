const { defineConfig, devices } = require('@playwright/test');

// Simple Playwright Configuration for Frontend Testing Only
module.exports = defineConfig({
  testDir: './test/e2e',
  outputDir: 'test/screenshots',
  
  // Global timeout settings
  timeout: 30000,
  expect: {
    timeout: 5000
  },

  // Test execution settings
  fullyParallel: false,
  retries: 0,
  workers: 1,

  // Reporter configuration
  reporter: [['line']],

  // Global test configuration
  use: {
    // No base URL - testing static files
    headless: true,
    viewport: { width: 1920, height: 1080 },
    
    // Test settings
    actionTimeout: 10000,
    navigationTimeout: 15000,
    
    // Screenshots and traces
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  },

  // Single project for frontend testing
  projects: [
    {
      name: 'chromium-frontend',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});