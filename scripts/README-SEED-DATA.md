# Enhanced Seed Data System

The MyBidFit platform includes a comprehensive seed data system designed specifically for government contracting workflows. This system provides realistic, production-ready data for development, testing, and staging environments.

## 🌱 System Overview

### Core Components
- **SeedDataManager** (`seed-manager.js`) - Main orchestration class
- **Seed Configuration** (`seed-config.js`) - Centralized data templates and settings
- **Legacy Scripts** - Existing seed scripts for compatibility
- **Environment-Aware** - Different data sets for different environments

### Government Contracting Focus
- **NAICS Codes** - Real government contracting industry codes
- **Set-Aside Categories** - SDVOSB, WOSB, HUBZone, 8(a), etc.
- **Realistic Certifications** - FedRAMP, ISO 27001, CMMI, etc.
- **Government Agencies** - Real federal agencies and departments
- **Contracting Data** - UEI numbers, CAGE codes, past performance

## 🚀 Quick Start

### Basic Seeding (Development)
```bash
# Seed all data (users + profiles)
npm run db:seed:enhanced

# Seed with fresh start (clear existing data)
npm run db:seed:full

# Verify seeded data
npm run db:seed:verify
```

### Selective Seeding
```bash
# Seed only users
npm run db:seed:users

# Seed only company profiles  
npm run db:seed:profiles

# Clear all existing data
npm run db:seed:clear
```

### Command Line Interface
```bash
# Direct usage with options
node scripts/seed-manager.js all --clear --opportunities

# Environment-specific seeding
NODE_ENV=staging node scripts/seed-manager.js all

# Verification only
node scripts/seed-manager.js verify
```

## 📊 Data Types and Structure

### Users (5 realistic accounts)
- **Admin Account**: `admin@mybidfit.com` - Platform administrator
- **Demo Account**: `demo@contractor.com` - Full-featured demo user  
- **Contractor Accounts**: Various company representatives
- **Secure Passwords**: All follow validation rules (12+ chars, complexity)
- **Roles**: Admin and user roles properly assigned

### Company Profiles (3 detailed profiles)
- **Demo Contracting Solutions**
  - NAICS: 541511, 541512, 541513 (Computer systems design)
  - Certifications: 8(a), SDVOSB, WOSB, HUBZone
  - Realistic past performance with government contracts
  - UEI and CAGE code examples

- **Tech Solutions LLC**
  - Focus: Custom software development
  - Certifications: ISO 27001, SOC 2 Type II, FedRAMP Ready
  - Past performance in API development

- **Data Analytics Corp**
  - Focus: Advanced analytics and BI
  - Certifications: ISO 9001, CMMI Level 3
  - Past performance in fraud detection systems

### Government Opportunities (5 realistic RFPs)
- **IT Infrastructure Modernization** - $2.5M, DTS
- **Data Analytics Platform** - $1.8M, DPM  
- **Cybersecurity Assessment** - $950K, DHS
- **Software Development** - $1.2M, GSA
- **Cloud Infrastructure** - $3.2M, OMB

## ⚙️ Environment Configuration

### Development
```javascript
{
  clearOnSeed: false,
  includeOpportunities: true,
  userCount: 'standard', // 5 users
  profileDepth: 'detailed', // Full profiles
  logLevel: 'info'
}
```

### Test
```javascript
{
  clearOnSeed: true,
  includeOpportunities: false, // Use mock data
  userCount: 'minimal', // 2 users
  profileDepth: 'standard',
  logLevel: 'warn'
}
```

### Staging
```javascript
{
  clearOnSeed: false,
  includeOpportunities: true,
  userCount: 'extensive', // 10+ users
  profileDepth: 'detailed',
  logLevel: 'info'
}
```

### Production
```javascript
{
  clearOnSeed: false,
  includeOpportunities: false, // Real data only
  userCount: 'minimal', // Admin users only
  profileDepth: 'minimal',
  logLevel: 'error'
}
```

## 🎯 Government Contracting Data

### NAICS Codes Included
- **541511** - Custom Computer Programming Services
- **541512** - Computer Systems Design Services  
- **541513** - Computer Facilities Management Services
- **541611** - Administrative Management Consulting
- **541330** - Engineering Services
- **518210** - Data Processing and Hosting

### Set-Aside Categories
- **Total_Small_Business** - General small business
- **SDVOSB** - Service-Disabled Veteran-Owned
- **WOSB** - Women-Owned Small Business
- **HUBZone** - Historically Underutilized Business Zone
- **8(a)** - SBA 8(a) Business Development
- **VOSB** - Veteran-Owned Small Business

### Common Certifications
- **Security**: ISO 27001, SOC 2 Type II, FedRAMP
- **Quality**: ISO 9001, CMMI Level 3/5
- **Compliance**: Section 508, FISMA, NIST Framework
- **Small Business**: 8(a), SDVOSB, WOSB, HUBZone

### Realistic Capabilities
- **Software**: Custom development, web apps, APIs, databases
- **Infrastructure**: Cloud migration, system integration, DevOps
- **Security**: Assessments, penetration testing, compliance
- **Data**: Analytics, BI, visualization, machine learning
- **Consulting**: Strategy, digital transformation, project management

## 🔧 Technical Implementation

### SeedDataManager Class Methods
```javascript
const seedManager = new SeedDataManager();

await seedManager.init();           // Initialize database connection
await seedManager.clearAll();       // Clear existing data
await seedManager.seedUsers();      // Create user accounts
await seedManager.seedCompanyProfiles(); // Create company profiles
await seedManager.seedOpportunities();   // Create opportunities (if table exists)
await seedManager.verifyData();     // Verify seeded data
await seedManager.cleanup();        // Close connections

// All-in-one seeding
await seedManager.seedAll({
  clearExisting: true,
  skipOpportunities: false
});
```

### Configuration System
```javascript
const { getEnvironmentConfig, generateCompanyData } = require('./seed-config');

// Get environment-specific settings
const config = getEnvironmentConfig('development');

// Generate realistic company data
const companyData = generateCompanyData('medium', 'software');
```

### Data Validation
All seeded data is designed to pass the enhanced validation middleware:
- **Email formats** - Valid email addresses
- **Password complexity** - 12+ characters with complexity requirements
- **NAICS codes** - 6-digit format validation  
- **Business types** - Valid enum values
- **JSON fields** - Properly formatted for JSONB storage

## 🔍 Verification and Testing

### Automatic Verification
The system includes built-in verification that checks:
- User account creation and password hashing
- Company profile creation with all required fields
- Data integrity and foreign key relationships
- JSON field formatting and validation
- Authentication token generation

### Manual Verification
```bash
# Check seeded data counts
npm run db:seed:verify

# Test authentication with seeded users
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@contractor.com","password":"ContractorDemo2024!"}'

# Test profile retrieval
curl -X GET http://localhost:3001/api/profiles/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Integration with Tests
The seed data system integrates with the testing infrastructure:
- **Supertest tests** use seeded accounts for authentication
- **Integration tests** rely on seeded company profiles
- **API tests** use seeded data for realistic scenarios

## 📈 Usage Examples

### Development Workflow
```bash
# Start fresh development environment
npm run db:migrate
npm run db:seed:full

# Verify everything works
npm run db:seed:verify
npm test

# Start development server
npm run dev
```

### Testing Workflow  
```bash
# Tests automatically use test-specific data
npm test

# Manual test data reset
npm run test:data:reset

# Custom test data creation
NODE_ENV=test npm run db:seed:enhanced
```

### Staging Deployment
```bash
# Staging environment with extensive data
NODE_ENV=staging npm run db:seed:enhanced

# Verify staging data
NODE_ENV=staging npm run db:seed:verify
```

## 🛡️ Security Considerations

### Password Security
- All seeded passwords follow complexity requirements
- Passwords are properly hashed with bcrypt (12 rounds)
- No plaintext passwords stored in code
- Different passwords per environment

### Data Isolation
- Test environment always clears existing data
- Production seeding is minimal and safe
- Environment-specific configurations prevent accidents
- Clear separation between real and demo data

### Access Control
- Admin accounts have proper role assignments
- Demo accounts have realistic permissions
- No elevated privileges for test accounts
- Proper user role enforcement

## 🔄 Migration and Updates

### Updating Seed Data
1. Modify data in `seed-config.js` or `seed-manager.js`
2. Test changes in development: `npm run db:seed:full`
3. Verify with: `npm run db:seed:verify`
4. Update staging environment if needed

### Adding New Data Types
1. Add data templates to `seed-config.js`
2. Add seeding methods to `SeedDataManager`
3. Add CLI commands for selective seeding
4. Update package.json scripts as needed

### Schema Changes
If database schema changes affect seeded data:
1. Update seeding queries in `seed-manager.js`
2. Update validation in seed data to match new schema
3. Test migration + seeding workflow
4. Update documentation

## 🚨 Troubleshooting

### Common Issues

#### "User already exists" errors
```bash
# Clear existing data first
npm run db:seed:clear
npm run db:seed:enhanced
```

#### Database connection issues
```bash
# Check database is running and env vars are set
npm run db:migrate
npm run db:seed:verify
```

#### Validation errors on seeded data
```bash
# Check that seeded data matches current validation schemas
node scripts/test-validation.js
npm run db:seed:verify
```

#### Foreign key constraint errors
```bash
# Ensure proper seeding order (users → profiles → opportunities)
npm run db:seed:clear
npm run db:seed:users
npm run db:seed:profiles
```

### Debug Mode
```bash
# Enable detailed logging
LOG_LEVEL=debug npm run db:seed:enhanced

# Check database state
npm run db:seed:verify

# Test with single components
npm run db:seed:users
npm run db:seed:verify
```

## 📝 Maintenance

### Regular Tasks
- **Monthly**: Review seeded data for realism and accuracy
- **With schema changes**: Update seeding scripts accordingly  
- **With validation changes**: Ensure seeded data passes new rules
- **Before releases**: Verify seeding works in all environments

### Performance Monitoring
- Seeding should complete in under 30 seconds
- Monitor for foreign key constraint violations
- Check for duplicate data creation
- Verify cleanup processes work correctly

This enhanced seed data system provides a robust foundation for MyBidFit development with realistic government contracting data that supports comprehensive testing and demonstration scenarios.