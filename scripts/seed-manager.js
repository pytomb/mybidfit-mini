#!/usr/bin/env node

/**
 * Enhanced Seed Data Manager for MyBidFit
 * 
 * Provides unified seed data management across different environments
 * with government contracting specific data that works with enhanced validation
 */

const { Database } = require('../src/database/connection');
const { logger } = require('../src/utils/logger');
const bcrypt = require('bcrypt');
const fs = require('fs/promises');
const path = require('path');

class SeedDataManager {
  constructor() {
    this.db = null;
    this.environment = process.env.NODE_ENV || 'development';
    this.seedDataDir = path.join(__dirname, 'data');
  }

  /**
   * Initialize database connection
   */
  async init() {
    this.db = Database.getInstance();
    await this.db.connect();
    logger.info(`🌱 Seed Data Manager initialized for ${this.environment} environment`);
  }

  /**
   * Clean up database connection
   */
  async cleanup() {
    if (this.db) {
      await this.db.disconnect();
      logger.info('🔌 Seed Data Manager disconnected');
    }
  }

  /**
   * Clear all existing data
   */
  async clearAll() {
    logger.info('🧹 Clearing all existing data...');
    
    const tables = [
      'company_profiles',
      'users', 
      'opportunities',
      'suppliers',
      'users_suppliers',
      'waitlist'
    ];

    for (const table of tables) {
      try {
        await this.db.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
        logger.info(`   ✅ Cleared ${table}`);
      } catch (error) {
        logger.warn(`   ⚠️ Could not clear ${table}: ${error.message}`);
      }
    }
  }

  /**
   * Seed users with proper validation
   */
  async seedUsers() {
    logger.info('👥 Seeding users...');

    const users = [
      {
        email: 'admin@mybidfit.com',
        password: 'MyBidFit2024!',
        firstName: 'System',
        lastName: 'Administrator',
        companyName: 'MyBidFit Platform',
        role: 'admin'
      },
      {
        email: 'demo@contractor.com', 
        password: 'ContractorDemo2024!',
        firstName: 'Demo',
        lastName: 'Contractor',
        companyName: 'Demo Contracting Solutions',
        role: 'user'
      },
      {
        email: 'john@techsolutions.com',
        password: 'TechSolutions2024!', 
        firstName: 'John',
        lastName: 'Smith',
        companyName: 'Tech Solutions LLC',
        role: 'user'
      },
      {
        email: 'sarah@dataanalytics.com',
        password: 'DataAnalytics2024!',
        firstName: 'Sarah',
        lastName: 'Johnson', 
        companyName: 'Data Analytics Corp',
        role: 'user'
      },
      {
        email: 'mike@securesystems.com',
        password: 'SecureSystems2024!',
        firstName: 'Mike',
        lastName: 'Davis',
        companyName: 'Secure Systems Inc',
        role: 'user'
      }
    ];

    for (const user of users) {
      try {
        const hashedPassword = await bcrypt.hash(user.password, 12);
        
        const result = await this.db.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, company_name, role, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
           ON CONFLICT (email) DO NOTHING
           RETURNING id, email`,
          [user.email, hashedPassword, user.firstName, user.lastName, user.companyName, user.role]
        );

        if (result.rows.length > 0) {
          logger.info(`   ✅ Created user: ${user.email}`);
        } else {
          logger.info(`   📝 User already exists: ${user.email}`);
        }
      } catch (error) {
        logger.error(`   ❌ Failed to create user ${user.email}:`, error.message);
      }
    }
  }

  /**
   * Seed company profiles with government contracting context
   */
  async seedCompanyProfiles() {
    logger.info('🏢 Seeding company profiles...');

    const profiles = [
      {
        userEmail: 'demo@contractor.com',
        profile: {
          name: 'Demo Contracting Solutions',
          summary: 'Full-service government contracting company specializing in IT services and consulting',
          description: 'Demo Contracting Solutions provides comprehensive IT services to federal, state, and local government agencies. With over 10 years of experience, we deliver mission-critical solutions that help government organizations achieve their objectives efficiently and securely.',
          naics: ['541511', '541512', '541513'], // Computer systems design services
          uei: 'DEMO123456789012',
          cageCode: 'DEMO1',
          businessType: 'LLC',
          employeeCount: 45,
          annualRevenue: 5000000,
          certifications: ['8(a)', 'SDVOSB', 'WOSB', 'SBA HUBZone'],
          capabilities: [
            'Software Development',
            'System Integration', 
            'Cloud Computing',
            'Cybersecurity',
            'Data Analytics',
            'IT Consulting',
            'Project Management'
          ],
          pastPerformance: [
            {
              project: 'Federal Agency Portal Modernization',
              client: 'Department of Technology',
              duration: '18 months',
              value: 1200000,
              description: 'Modernized citizen-facing portal with enhanced security and accessibility features'
            },
            {
              project: 'Data Migration and Integration',
              client: 'State Revenue Department', 
              duration: '12 months',
              value: 800000,
              description: 'Migrated legacy systems to cloud-based infrastructure with real-time integration'
            }
          ],
          website: 'https://democontracting.com',
          linkedIn: 'https://linkedin.com/company/demo-contracting',
          address: {
            street: '100 Government Way',
            city: 'Washington',
            state: 'DC',
            zipCode: '20001'
          },
          serviceAreas: ['Washington DC', 'Virginia', 'Maryland', 'Remote'],
          keywords: ['government', 'contracting', 'IT services', 'cloud', 'security']
        }
      },
      {
        userEmail: 'john@techsolutions.com',
        profile: {
          name: 'Tech Solutions LLC',
          summary: 'Innovative technology solutions for government and commercial clients',
          description: 'Tech Solutions LLC specializes in custom software development and system integration for government agencies. We focus on delivering scalable, secure solutions that meet strict compliance requirements while improving operational efficiency.',
          naics: ['541511', '541618'], // Computer systems design, other management consulting
          uei: 'TECH123456789012',
          businessType: 'LLC',
          employeeCount: 25,
          annualRevenue: 3500000,
          certifications: ['ISO 27001', 'SOC 2 Type II', 'FedRAMP Ready'],
          capabilities: [
            'Custom Software Development',
            'API Development',
            'Database Design',
            'Cloud Architecture',
            'DevOps',
            'Quality Assurance'
          ],
          pastPerformance: [
            {
              project: 'API Gateway Implementation',
              client: 'Federal Communications Commission',
              duration: '9 months', 
              value: 450000,
              description: 'Implemented secure API gateway for inter-agency data sharing'
            }
          ],
          website: 'https://techsolutionsllc.com',
          address: {
            street: '500 Tech Plaza',
            city: 'Arlington',
            state: 'VA',
            zipCode: '22202'
          },
          serviceAreas: ['Virginia', 'Maryland', 'Washington DC'],
          keywords: ['software', 'development', 'API', 'cloud', 'federal']
        }
      },
      {
        userEmail: 'sarah@dataanalytics.com',
        profile: {
          name: 'Data Analytics Corp',
          summary: 'Advanced data analytics and business intelligence for government decision-making',
          description: 'Data Analytics Corp provides cutting-edge data analytics solutions that help government agencies make data-driven decisions. Our expertise includes predictive analytics, data visualization, and custom reporting solutions.',
          naics: ['541511', '541990'], // Computer systems design, other professional services
          uei: 'DATA123456789012',
          businessType: 'Corporation',
          employeeCount: 35,
          annualRevenue: 4200000,
          certifications: ['ISO 9001', 'CMMI Level 3'],
          capabilities: [
            'Data Analytics',
            'Business Intelligence',
            'Predictive Modeling',
            'Data Visualization',
            'Statistical Analysis',
            'Machine Learning'
          ],
          pastPerformance: [
            {
              project: 'Fraud Detection System',
              client: 'Department of Revenue',
              duration: '15 months',
              value: 950000,
              description: 'Developed ML-based fraud detection system reducing false positives by 60%'
            }
          ],
          website: 'https://dataanalyticscorp.com',
          address: {
            street: '200 Analytics Drive',
            city: 'Rockville',
            state: 'MD',
            zipCode: '20850'
          },
          serviceAreas: ['Maryland', 'Virginia', 'Washington DC', 'Remote'],
          keywords: ['data', 'analytics', 'machine learning', 'visualization', 'intelligence']
        }
      }
    ];

    for (const item of profiles) {
      try {
        // Get user ID
        const userResult = await this.db.query('SELECT id FROM users WHERE email = $1', [item.userEmail]);
        if (userResult.rows.length === 0) {
          logger.warn(`   ⚠️ User not found: ${item.userEmail}`);
          continue;
        }

        const userId = userResult.rows[0].id;
        
        // Check if profile already exists
        const existingProfile = await this.db.query('SELECT id FROM company_profiles WHERE user_id = $1', [userId]);
        if (existingProfile.rows.length > 0) {
          logger.info(`   📝 Profile already exists for: ${item.userEmail}`);
          continue;
        }

        const p = item.profile;
        const result = await this.db.query(`
          INSERT INTO company_profiles (
            user_id, name, summary, description, naics, uei, cage_code,
            employee_count, annual_revenue, business_type, certifications,
            past_performance, capabilities, website, linkedin, address,
            service_areas, keywords, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
          ) RETURNING id, name
        `, [
          userId,
          p.name,
          p.summary,
          p.description || null,
          JSON.stringify(p.naics),
          p.uei || null,
          p.cageCode || null,
          p.employeeCount || null,
          p.annualRevenue || null,
          p.businessType || null,
          JSON.stringify(p.certifications || []),
          JSON.stringify(p.pastPerformance || []),
          JSON.stringify(p.capabilities || []),
          p.website || null,
          p.linkedIn || null,
          JSON.stringify(p.address || {}),
          JSON.stringify(p.serviceAreas || []),
          JSON.stringify(p.keywords || [])
        ]);

        logger.info(`   ✅ Created profile: ${result.rows[0].name}`);
      } catch (error) {
        logger.error(`   ❌ Failed to create profile for ${item.userEmail}:`, error.message);
      }
    }
  }

  /**
   * Seed government opportunities
   */
  async seedOpportunities() {
    logger.info('🎯 Seeding government opportunities...');

    const opportunities = [
      {
        title: 'IT Infrastructure Modernization',
        description: 'Comprehensive IT infrastructure modernization for federal agency including cloud migration and security enhancement',
        agency: 'Department of Technology Services',
        naicsCode: '541511',
        setAside: 'Total_Small_Business',
        estimatedValue: 2500000,
        responseDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        location: 'Washington, DC',
        contactEmail: 'contracting@dts.gov',
        requirements: [
          'Security clearance required for key personnel',
          'Minimum 5 years government contracting experience',
          'FedRAMP certified cloud services',
          'NIST cybersecurity framework compliance'
        ],
        keywords: ['IT infrastructure', 'cloud migration', 'cybersecurity', 'modernization']
      },
      {
        title: 'Data Analytics Platform Development',
        description: 'Development of advanced data analytics platform for performance measurement and business intelligence',
        agency: 'Department of Performance Management',
        naicsCode: '541511',
        setAside: 'SDVOSB',
        estimatedValue: 1800000,
        responseDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        location: 'Remote/Multiple Locations',
        contactEmail: 'procurement@dpm.gov',
        requirements: [
          'Experience with government data systems',
          'Section 508 compliance mandatory',
          'Agile development methodology',
          'Data visualization expertise'
        ],
        keywords: ['data analytics', 'business intelligence', 'visualization', 'performance']
      },
      {
        title: 'Cybersecurity Assessment Services',
        description: 'Comprehensive cybersecurity assessment and penetration testing services for critical infrastructure',
        agency: 'Department of Homeland Security',
        naicsCode: '541690',
        setAside: 'WOSB',
        estimatedValue: 950000,
        responseDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        location: 'Various Federal Facilities',
        contactEmail: 'security@dhs.gov',
        requirements: [
          'Top Secret security clearance required',
          'CISSP or equivalent certifications',
          'Experience with federal security frameworks',
          'Penetration testing tools proficiency'
        ],
        keywords: ['cybersecurity', 'penetration testing', 'assessment', 'critical infrastructure']
      },
      {
        title: 'Software Development and Maintenance',
        description: 'Ongoing software development and maintenance services for legacy system modernization',
        agency: 'General Services Administration',
        naicsCode: '541511',
        setAside: 'HUBZone',
        estimatedValue: 1200000,
        responseDeadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), // 40 days from now
        location: 'Washington, DC Metro Area',
        contactEmail: 'development@gsa.gov',
        requirements: [
          'Legacy system integration experience',
          'Modern web development frameworks',
          'Database migration expertise',
          'User experience design capabilities'
        ],
        keywords: ['software development', 'legacy modernization', 'web applications', 'maintenance']
      },
      {
        title: 'Cloud Infrastructure Services',
        description: 'Cloud infrastructure design, implementation, and management services for multi-agency platform',
        agency: 'Office of Management and Budget',
        naicsCode: '518210',
        setAside: 'Total_Small_Business',
        estimatedValue: 3200000,
        responseDeadline: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000), // 50 days from now
        location: 'National - Remote Work Possible',
        contactEmail: 'cloud@omb.gov',
        requirements: [
          'AWS/Azure/GCP certifications required',
          'FedRAMP experience mandatory',
          'Multi-tenant architecture experience',
          'DevOps and automation expertise'
        ],
        keywords: ['cloud infrastructure', 'AWS', 'Azure', 'multi-agency', 'FedRAMP']
      }
    ];

    // Note: We don't have an opportunities table in the current schema
    // This would need to be created or we could store these in a JSON field
    // For now, let's just log that this data would be available

    logger.info(`   📋 Would seed ${opportunities.length} government opportunities`);
    logger.info('   ℹ️ Opportunity seeding requires opportunities table schema');
    
    // If opportunities table exists, we could seed it:
    /*
    for (const opp of opportunities) {
      try {
        await this.db.query(`
          INSERT INTO opportunities (title, description, agency, naics_code, set_aside, 
                                   estimated_value, response_deadline, location, contact_email,
                                   requirements, keywords, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        `, [
          opp.title, opp.description, opp.agency, opp.naicsCode, opp.setAside,
          opp.estimatedValue, opp.responseDeadline, opp.location, opp.contactEmail,
          JSON.stringify(opp.requirements), JSON.stringify(opp.keywords)
        ]);
        
        logger.info(`   ✅ Created opportunity: ${opp.title}`);
      } catch (error) {
        logger.error(`   ❌ Failed to create opportunity ${opp.title}:`, error.message);
      }
    }
    */
  }

  /**
   * Verify seeded data
   */
  async verifyData() {
    logger.info('🔍 Verifying seeded data...');

    const verification = {
      users: 0,
      profiles: 0,
      opportunities: 0
    };

    try {
      const userCount = await this.db.query('SELECT COUNT(*) as count FROM users');
      verification.users = parseInt(userCount.rows[0].count);

      const profileCount = await this.db.query('SELECT COUNT(*) as count FROM company_profiles');
      verification.profiles = parseInt(profileCount.rows[0].count);

      // Check if opportunities table exists
      try {
        const oppCount = await this.db.query('SELECT COUNT(*) as count FROM opportunities');
        verification.opportunities = parseInt(oppCount.rows[0].count);
      } catch (error) {
        verification.opportunities = 'Table not found';
      }

      logger.info('📊 Seed Data Summary:');
      logger.info(`   👥 Users: ${verification.users}`);
      logger.info(`   🏢 Company Profiles: ${verification.profiles}`);
      logger.info(`   🎯 Opportunities: ${verification.opportunities}`);

      return verification;
    } catch (error) {
      logger.error('❌ Data verification failed:', error);
      throw error;
    }
  }

  /**
   * Run complete seeding process
   */
  async seedAll(options = {}) {
    const { clearExisting = false, skipOpportunities = true } = options;

    try {
      await this.init();

      if (clearExisting) {
        await this.clearAll();
      }

      await this.seedUsers();
      await this.seedCompanyProfiles();
      
      if (!skipOpportunities) {
        await this.seedOpportunities();
      }

      const verification = await this.verifyData();
      
      logger.info('✅ Seed data process completed successfully!');
      return verification;

    } catch (error) {
      logger.error('💥 Seed data process failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  const seedManager = new SeedDataManager();
  
  try {
    switch (command) {
      case 'clear':
        await seedManager.init();
        await seedManager.clearAll();
        break;
        
      case 'users':
        await seedManager.init();
        await seedManager.seedUsers();
        await seedManager.verifyData();
        break;
        
      case 'profiles':
        await seedManager.init();
        await seedManager.seedCompanyProfiles();
        await seedManager.verifyData();
        break;
        
      case 'verify':
        await seedManager.init();
        await seedManager.verifyData();
        break;
        
      case 'all':
      default:
        await seedManager.seedAll({
          clearExisting: args.includes('--clear'),
          skipOpportunities: !args.includes('--opportunities')
        });
        break;
    }
    
    console.log('\n🎉 MyBidFit seed data management completed!');
    
  } catch (error) {
    console.error('💥 Seed data management failed:', error.message);
    process.exit(1);
  } finally {
    await seedManager.cleanup();
    process.exit(0);
  }
}

// Export for programmatic use
module.exports = { SeedDataManager };

// Run if called directly
if (require.main === module) {
  main();
}