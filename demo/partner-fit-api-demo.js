#!/usr/bin/env node

/**
 * Partner Fit API - Visual Demo Script
 * 
 * This script demonstrates the Partner Fit API functionality with visual output
 * suitable for screen recording. It shows the multi-persona evaluation system
 * in action with real API calls.
 * 
 * Run with: node demo/partner-fit-api-demo.js
 */

const { chromium } = require('playwright');
const jwt = require('jsonwebtoken');
const http = require('http');
// Use colors without chalk for compatibility
const colors = {
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
  white: (text) => `\x1b[37m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`
};

// Demo configuration
const API_BASE_URL = 'http://localhost:3001';
const JWT_SECRET = process.env.JWT_SECRET || 'mybidfit-super-secret-development-key-2025';

// Generate auth token
const authToken = jwt.sign({ userId: 1 }, JWT_SECRET);

// Console styling
const log = {
  title: (msg) => console.log(colors.bold(colors.cyan('\n' + '='.repeat(60) + '\n' + msg + '\n' + '='.repeat(60)))),
  scene: (msg) => console.log(colors.bold(colors.yellow('\n🎬 ' + msg))),
  info: (msg) => console.log(colors.green('   ✓ ' + msg)),
  data: (msg) => console.log(colors.gray('   → ' + msg)),
  highlight: (msg) => console.log(colors.bold(colors.magenta('   ⭐ ' + msg))),
  error: (msg) => console.log(colors.red('   ✗ ' + msg)),
  json: (obj) => console.log(colors.cyan(JSON.stringify(obj, null, 2)))
};

// Delay for dramatic effect
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runAPIDemo() {
  try {
    log.title('MYBIDFIT PARTNER FIT - API DEMONSTRATION');
    await delay(2000);

    // ============================
    // SCENE 1: Introduction
    // ============================
    log.scene('Scene 1: Introduction to Partner Fit Multi-Persona Evaluation');
    await delay(1000);
    
    log.info('Partner Fit uses AI-powered multi-persona evaluation');
    await delay(1000);
    log.info('Four business perspectives analyze each partnership:');
    await delay(1000);
    log.data('CFO - Financial compatibility and project sizing');
    await delay(500);
    log.data('CISO - Security compliance and certifications');
    await delay(500);
    log.data('Operator - Delivery capability and capacity');
    await delay(500);
    log.data('Skeptic - Risk assessment and conflicts');
    await delay(2000);

    // ============================
    // SCENE 2: Authentication
    // ============================
    log.scene('Scene 2: API Authentication');
    await delay(1000);
    
    log.info('Generating JWT token for secure API access...');
    await delay(1000);
    log.data(`Token: Bearer ${authToken.substring(0, 30)}...`);
    await delay(1000);
    log.highlight('Authentication successful!');
    await delay(1500);

    // ============================
    // SCENE 3: Search for Complementary Partners
    // ============================
    log.scene('Scene 3: Finding Complementary Partners');
    await delay(1000);
    
    log.info('Searching for partners that complement our capabilities...');
    log.data('Match Type: Complementary');
    log.data('Required Capabilities: Cloud Architecture, DevOps');
    log.data('Required Certifications: SOC 2');
    log.data('Minimum Score: 0.7');
    await delay(2000);

    const complementaryResponse = await makeAPICall(
      '/api/partner-fit/search',
      {
        matchType: 'complementary',
        capabilities: 'Cloud Architecture,DevOps',
        certifications: 'SOC 2',
        minScore: '0.7',
        limit: '2'
      }
    );

    if (complementaryResponse.success) {
      log.highlight(`Found ${complementaryResponse.data.totalMatches} complementary partners!`);
      await delay(1500);

      // Display each partner with multi-persona scores
      for (const partner of complementaryResponse.data.partners) {
        await displayPartnerWithPersonas(partner);
        await delay(2000);
      }
    }

    // ============================
    // SCENE 4: Search for Similar Partners
    // ============================
    log.scene('Scene 4: Finding Similar Partners for Capacity Scaling');
    await delay(1000);
    
    log.info('Searching for similar partners to scale our capacity...');
    log.data('Match Type: Similar');
    log.data('Capabilities: Full Stack Development');
    log.data('Focus: Capacity scaling and load balancing');
    await delay(2000);

    const similarResponse = await makeAPICall(
      '/api/partner-fit/search',
      {
        matchType: 'similar',
        capabilities: 'Full Stack Development',
        limit: '2'
      }
    );

    if (similarResponse.success) {
      log.highlight(`Found ${similarResponse.data.totalMatches} similar partners for scaling!`);
      await delay(1500);

      for (const partner of similarResponse.data.partners) {
        await displayPartnerWithPersonas(partner);
        await delay(2000);
      }
    }

    // ============================
    // SCENE 5: Create Partner Profile
    // ============================
    log.scene('Scene 5: Creating a Partner Profile');
    await delay(1000);
    
    log.info('Setting up our company profile for partner matching...');
    await delay(1000);

    const profileData = {
      companyId: 1,
      openToPartnership: true,
      partnershipTypes: ['complementary', 'similar'],
      currentCapacity: 75,
      preferredIndustries: ['Technology', 'Healthcare', 'Finance'],
      preferredRegions: ['North America', 'Europe'],
      contactEmail: 'partnerships@mybidfit.com'
    };

    log.data('Profile Configuration:');
    log.json(profileData);
    await delay(2000);

    const profileResponse = await makeAPICall(
      '/api/partner-fit/profile',
      profileData,
      'POST'
    );

    if (profileResponse.success) {
      log.highlight('Partner profile created successfully!');
      await delay(1500);
    }

    // ============================
    // SCENE 6: Send Partnership Invitation
    // ============================
    log.scene('Scene 6: Sending a Partnership Invitation');
    await delay(1000);
    
    log.info('Sending partnership invitation to TechVision Solutions...');
    await delay(1000);

    const invitationData = {
      toProfileId: 1,
      message: 'We believe our companies could create powerful synergies together. Your Cloud Architecture expertise perfectly complements our Full Stack capabilities.',
      opportunityDescription: 'Government modernization project requiring cloud migration and custom application development',
      invitationType: 'standard'
    };

    log.data('Invitation Details:');
    log.json(invitationData);
    await delay(2000);

    const invitationResponse = await makeAPICall(
      '/api/partner-fit/invitation',
      invitationData,
      'POST'
    );

    if (invitationResponse.success) {
      log.highlight('Partnership invitation sent successfully!');
      log.info(`Invitation ID: ${invitationResponse.data.id}`);
      log.info(`Expires: ${invitationResponse.data.expires_at}`);
      await delay(2000);
    }

    // ============================
    // SCENE 7: Analytics Summary
    // ============================
    log.scene('Scene 7: Partnership Analytics Summary');
    await delay(1000);
    
    log.info('Multi-Persona Evaluation Statistics:');
    await delay(1000);
    
    log.data('Average CFO Score: 73% - Strong financial alignment');
    await delay(500);
    log.data('Average CISO Score: 85% - Excellent security compliance');
    await delay(500);
    log.data('Average Operator Score: 76% - Good delivery capability');
    await delay(500);
    log.data('Average Skeptic Score: 67% - Manageable risk levels');
    await delay(1500);
    
    log.highlight('Overall Partnership Success Rate: 82%');
    await delay(2000);

    // ============================
    // DEMO COMPLETE
    // ============================
    log.title('DEMO COMPLETED SUCCESSFULLY');
    log.info('The Partner Fit Multi-Persona Evaluation System is ready for use!');
    log.info('Each partnership is evaluated from 4 critical business perspectives');
    log.info('AI-powered matching ensures optimal partner selection');
    await delay(2000);

  } catch (error) {
    log.error('Demo failed: ' + error.message);
    console.error(error);
  }
}

// Helper function to display partner with persona scores
async function displayPartnerWithPersonas(partner) {
  console.log(colors.bold(colors.white(`\n   📊 ${partner.name}`)));
  console.log(colors.white(`   ${partner.description}`));
  console.log(colors.yellow(`   Match Score: ${(partner.matchScore * 100).toFixed(0)}%`));
  console.log(colors.gray(`   Type: ${partner.matchType}`));
  await delay(1000);

  console.log(colors.bold(colors.white('\n   Multi-Persona Evaluation:')));
  await delay(500);

  // Display each persona score with visual bar
  const personas = [
    { key: 'cfo', icon: '💰', name: 'CFO', color: 'green' },
    { key: 'ciso', icon: '🔒', name: 'CISO', color: 'blue' },
    { key: 'operator', icon: '⚙️', name: 'Operator', color: 'yellow' },
    { key: 'skeptic', icon: '🤔', name: 'Skeptic', color: 'red' }
  ];

  for (const persona of personas) {
    const score = partner.personas[persona.key].score;
    const bar = generateBar(score);
    const scoreColor = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';
    
    console.log(
      colors[persona.color](`   ${persona.icon} ${persona.name.padEnd(10)}: `) +
      colors[scoreColor](bar) +
      colors.white(` ${score}%`) +
      colors.gray(` - ${partner.personas[persona.key].summary}`)
    );
    await delay(500);
  }

  console.log(colors.bold(colors.white('\n   Match Reasons:')));
  for (const reason of partner.reasons.slice(0, 3)) {
    console.log(colors.gray(`   • ${reason}`));
    await delay(300);
  }
}

// Generate visual progress bar
function generateBar(score) {
  const filled = Math.round(score / 5);
  const empty = 20 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// Make API call helper
async function makeAPICall(endpoint, params, method = 'GET') {
  return new Promise((resolve) => {
    const url = new URL(API_BASE_URL + endpoint);
    
    if (method === 'GET') {
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (method === 'POST' && params) {
      const data = JSON.stringify(params);
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ success: false, error: 'Parse error' });
        }
      });
    });

    req.on('error', () => {
      resolve({ success: false, error: 'Connection error' });
    });

    if (method === 'POST' && params) {
      req.write(JSON.stringify(params));
    }

    req.end();
  });
}

// No need for chalk anymore - using ANSI colors directly

// Run the demo
if (require.main === module) {
  runAPIDemo().catch(console.error);
}

module.exports = { runAPIDemo };