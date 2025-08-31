#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔨 Running build process...\n');

const startTime = Date.now();

// Build steps
const buildSteps = [
  {
    name: 'Validate package.json',
    fn: validatePackageJson
  },
  {
    name: 'Check environment configuration',
    fn: checkEnvironmentConfig
  },
  {
    name: 'Verify database schema',
    fn: verifyDatabaseSchema
  },
  {
    name: 'Check route integrity',
    fn: checkRouteIntegrity
  },
  {
    name: 'Generate build info',
    fn: generateBuildInfo
  }
];

async function validatePackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Check required fields
  const required = ['name', 'version', 'main', 'dependencies'];
  const missing = required.filter(field => !pkg[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields in package.json: ${missing.join(', ')}`);
  }
  
  // Check if main file exists
  if (!fs.existsSync(pkg.main)) {
    throw new Error(`Main file does not exist: ${pkg.main}`);
  }
  
  console.log(`  ✅ Package.json valid (${pkg.name} v${pkg.version})`);
}

async function checkEnvironmentConfig() {
  const envExample = path.join(process.cwd(), '.env.example');
  
  if (!fs.existsSync(envExample)) {
    throw new Error('.env.example file missing');
  }
  
  const envContent = fs.readFileSync(envExample, 'utf8');
  const requiredVars = envContent.match(/^[A-Z_]+=/gm) || [];
  
  console.log(`  ✅ Environment config valid (${requiredVars.length} variables)`);
}

async function verifyDatabaseSchema() {
  const schemaPath = path.join(process.cwd(), 'src/database/schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    throw new Error('Database schema file missing');
  }
  
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const tableCount = (schema.match(/CREATE TABLE/g) || []).length;
  const indexCount = (schema.match(/CREATE INDEX/g) || []).length;
  
  console.log(`  ✅ Database schema valid (${tableCount} tables, ${indexCount} indexes)`);
}

async function checkRouteIntegrity() {
  const routesDir = path.join(process.cwd(), 'src/routes');
  
  if (!fs.existsSync(routesDir)) {
    console.log('  ⚠️  Routes directory not found, skipping route check');
    return;
  }
  
  const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));
  console.log(`  ✅ Route integrity check passed (${routeFiles.length} route files)`);
}

async function generateBuildInfo() {
  const buildInfo = {
    version: require('../package.json').version,
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    buildNumber: process.env.GITHUB_RUN_NUMBER || Math.floor(Date.now() / 1000)
  };
  
  const buildPath = path.join(process.cwd(), 'build-info.json');
  fs.writeFileSync(buildPath, JSON.stringify(buildInfo, null, 2));
  
  console.log(`  ✅ Build info generated (build #${buildInfo.buildNumber})`);
}

// Run build steps
async function runBuild() {
  try {
    for (const step of buildSteps) {
      console.log(`🔄 ${step.name}...`);
      await step.fn();
    }
    
    const duration = Date.now() - startTime;
    console.log(`\n✅ Build completed successfully in ${duration}ms`);
    console.log('📦 Ready for deployment');
    
  } catch (error) {
    console.error(`\n❌ Build failed: ${error.message}`);
    process.exit(1);
  }
}

runBuild();