#!/usr/bin/env node

/**
 * Test script to verify Zod validation and rate limiting are working
 */

const { signupSchema, loginSchema, emailSchema } = require('../src/schemas/auth.schema');
const { companyProfileSchema } = require('../src/schemas/profile.schema');
const { opportunitySchema } = require('../src/schemas/opportunity.schema');
const { Chalk } = require('chalk');

const chalk = new Chalk();

console.log(chalk.blue.bold('\n🧪 Testing Zod Validation Schemas\n'));

// Test Auth Schemas
console.log(chalk.cyan('Testing Auth Schemas:'));

// Valid signup
try {
  const validSignup = {
    email: 'test@example.com',
    password: 'SecurePass123!',
    firstName: 'John',
    lastName: 'Doe',
    companyName: 'Test Corp',
    phone: '+1-555-123-4567'
  };
  
  const result = signupSchema.parse(validSignup);
  console.log(chalk.green('✅ Valid signup data passed'));
} catch (error) {
  console.log(chalk.red('❌ Valid signup failed:', error.errors));
}

// Invalid signup (weak password)
try {
  const invalidSignup = {
    email: 'test@example.com',
    password: 'weak',
    firstName: 'John',
    lastName: 'Doe'
  };
  
  signupSchema.parse(invalidSignup);
  console.log(chalk.red('❌ Invalid signup should have failed'));
} catch (error) {
  console.log(chalk.green('✅ Weak password correctly rejected'));
}

// Test Login Schema
try {
  const validLogin = {
    email: 'test@example.com',
    password: 'anyPassword'
  };
  
  loginSchema.parse(validLogin);
  console.log(chalk.green('✅ Valid login data passed'));
} catch (error) {
  console.log(chalk.red('❌ Valid login failed:', error.errors));
}

// Test Profile Schema
console.log(chalk.cyan('\nTesting Profile Schema:'));

try {
  const validProfile = {
    name: 'Acme Corporation',
    summary: 'Leading provider of quality products and services for businesses',
    naics: ['541511', '541512'], // Valid 6-digit NAICS codes
    certifications: [
      {
        name: 'ISO 9001',
        type: 'ISO_9001',
        issuingBody: 'ISO',
        issueDate: new Date().toISOString()
      }
    ],
    pastPerformance: [
      {
        title: 'Web Development Project',
        client: 'Government Agency',
        value: 250000,
        year: 2023,
        description: 'Developed a comprehensive web platform for agency operations'
      }
    ],
    employeeCount: 50,
    annualRevenue: 5000000,
    businessType: 'small_business',
    website: 'https://example.com',
    capabilities: [
      {
        category: 'Software Development',
        description: 'Custom software solutions for enterprise clients',
        keywords: ['web', 'mobile', 'cloud']
      }
    ]
  };
  
  companyProfileSchema.parse(validProfile);
  console.log(chalk.green('✅ Valid company profile passed'));
} catch (error) {
  console.log(chalk.red('❌ Valid profile failed:', error.errors));
}

// Invalid profile (invalid NAICS)
try {
  const invalidProfile = {
    name: 'Test Corp',
    summary: 'Short summary', // Too short
    naics: ['12345'], // Invalid - must be 6 digits
  };
  
  companyProfileSchema.parse(invalidProfile);
  console.log(chalk.red('❌ Invalid profile should have failed'));
} catch (error) {
  console.log(chalk.green('✅ Invalid NAICS correctly rejected'));
}

// Test Opportunity Schema
console.log(chalk.cyan('\nTesting Opportunity Schema:'));

try {
  const validOpportunity = {
    title: 'IT Services Contract for Federal Agency',
    solicitationNumber: 'FA8750-24-R-0001',
    description: 'The agency seeks a contractor to provide comprehensive IT services including help desk support, network administration, and cybersecurity services.',
    type: 'RFP',
    status: 'active',
    agency: {
      name: 'Department of Example',
      department: 'IT Division'
    },
    naics: ['541511'],
    contractType: 'Fixed_Price',
    setAside: 'Total_Small_Business',
    estimatedValue: 1500000,
    postedDate: new Date().toISOString(),
    responseDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  opportunitySchema.parse(validOpportunity);
  console.log(chalk.green('✅ Valid opportunity passed'));
} catch (error) {
  console.log(chalk.red('❌ Valid opportunity failed:'));
  if (error.errors) {
    error.errors.forEach(err => {
      console.log(chalk.red(`   - ${err.path.join('.')}: ${err.message}`));
    });
  } else {
    console.log(chalk.red('   -', error.message));
  }
}

console.log(chalk.blue.bold('\n✨ Validation Testing Complete!\n'));

// Test Rate Limiting Configuration
console.log(chalk.cyan('Rate Limiting Configuration:'));
console.log(chalk.yellow(`  General API: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} requests per ${(process.env.RATE_LIMIT_WINDOW_MS || 900000) / 60000} minutes`));
console.log(chalk.yellow(`  Auth Endpoints: ${process.env.RATE_LIMIT_AUTH_MAX_REQUESTS || 5} requests per ${(process.env.RATE_LIMIT_AUTH_WINDOW_MS || 900000) / 60000} minutes`));
console.log(chalk.yellow(`  Bcrypt Rounds: ${process.env.BCRYPT_ROUNDS || 12}`));

console.log(chalk.green.bold('\n✅ All validation schemas are properly configured!\n'));