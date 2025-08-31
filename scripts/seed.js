#!/usr/bin/env node

const { Database } = require('../src/database/connection');
const { logger } = require('../src/utils/logger');
const bcrypt = require('bcrypt');

// Mock data for seeding
const mockSuppliers = [
  {
    name: 'TechFlow Solutions',
    description: 'Full-stack software development and cloud infrastructure specialists',
    website: 'https://techflow.example.com',
    size_category: 'medium',
    founded_year: 2018,
    headquarters_city: 'Austin',
    headquarters_state: 'TX',
    headquarters_country: 'USA',
    service_regions: ['USA', 'Canada', 'UK'],
    industries: ['software', 'fintech', 'healthcare'],
    capabilities: ['full-stack development', 'cloud architecture', 'DevOps', 'AI/ML'],
    technologies: ['React', 'Node.js', 'AWS', 'Python', 'PostgreSQL'],
    certifications: ['SOC2', 'ISO 27001', 'AWS Partner'],
    credibility_score: 88.5,
    total_projects: 45,
    years_experience: 6,
    team_size: 25,
    annual_revenue_category: '1-10M'
  },
  {
    name: 'DataCore Analytics',
    description: 'Advanced data analytics and business intelligence solutions',
    website: 'https://datacore.example.com',
    size_category: 'small',
    founded_year: 2020,
    headquarters_city: 'San Francisco',
    headquarters_state: 'CA',
    headquarters_country: 'USA',
    service_regions: ['USA', 'Mexico'],
    industries: ['data analytics', 'retail', 'manufacturing'],
    capabilities: ['data visualization', 'predictive analytics', 'ETL pipelines', 'machine learning'],
    technologies: ['Python', 'Tableau', 'Apache Spark', 'TensorFlow', 'MySQL'],
    certifications: ['Microsoft Gold Partner', 'Tableau Partner'],
    credibility_score: 92.0,
    total_projects: 28,
    years_experience: 4,
    team_size: 12,
    annual_revenue_category: '<1M'
  },
  {
    name: 'SecureNet Systems',
    description: 'Cybersecurity and compliance solutions for enterprise',
    website: 'https://securenet.example.com',
    size_category: 'large',
    founded_year: 2015,
    headquarters_city: 'Washington',
    headquarters_state: 'DC',
    headquarters_country: 'USA',
    service_regions: ['USA', 'Canada', 'EU'],
    industries: ['cybersecurity', 'government', 'defense'],
    capabilities: ['penetration testing', 'compliance auditing', 'incident response', 'security consulting'],
    technologies: ['Splunk', 'Wireshark', 'Kali Linux', 'SIEM', 'PKI'],
    certifications: ['FedRAMP', 'CISSP', 'CISA', 'SOC2'],
    credibility_score: 95.2,
    total_projects: 120,
    years_experience: 9,
    team_size: 75,
    annual_revenue_category: '10-100M'
  }
];

const mockOpportunities = [
  {
    title: 'Government AI Platform Development',
    description: 'Build a secure AI-powered data analysis platform for federal agency',
    buyer_organization: 'Department of Health Services',
    buyer_type: 'government',
    industry: 'healthcare',
    project_value_min: 500000,
    project_value_max: 2000000,
    duration_months: 18,
    location: 'Remote/Washington DC',
    required_capabilities: ['AI/ML', 'secure development', 'federal compliance'],
    preferred_capabilities: ['healthcare domain knowledge', 'data visualization'],
    required_certifications: ['FedRAMP', 'SOC2'],
    required_experience_years: 5,
    evaluation_criteria: {
      'technical_approach': 40,
      'team_experience': 30,
      'security_compliance': 20,
      'cost': 10
    },
    submission_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    project_start_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    source: 'sam.gov',
    difficulty_level: 'expert',
    competition_level: 'high'
  },
  {
    title: 'E-commerce Analytics Dashboard',
    description: 'Develop real-time analytics dashboard for retail operations',
    buyer_organization: 'RetailMax Corporation',
    buyer_type: 'private',
    industry: 'retail',
    project_value_min: 150000,
    project_value_max: 400000,
    duration_months: 8,
    location: 'Chicago, IL',
    required_capabilities: ['data visualization', 'real-time analytics', 'web development'],
    preferred_capabilities: ['retail domain knowledge', 'mobile development'],
    required_certifications: [],
    required_experience_years: 3,
    evaluation_criteria: {
      'solution_quality': 50,
      'timeline': 25,
      'cost': 25
    },
    submission_deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    project_start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    source: 'rfpdb',
    difficulty_level: 'medium',
    competition_level: 'medium'
  }
];

async function seedDatabase() {
  const db = Database.getInstance();
  
  try {
    logger.info('🌱 Starting database seeding...');
    
    await db.connect();
    logger.info('✅ Database connection established');
    
    // Clear existing data
    logger.info('🧹 Clearing existing data...');
    await db.query('TRUNCATE TABLE judge_scores, partnership_recommendations, scoring_results, event_recommendations, opportunities, companies, users RESTART IDENTITY CASCADE');
    
    // Seed users
    logger.info('👥 Seeding users...');
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    const users = [
      {
        email: 'admin@mybidfit.com',
        password_hash: hashedPassword,
        role: 'admin',
        first_name: 'Admin',
        last_name: 'User',
        company_name: 'MyBidFit'
      },
      {
        email: 'demo@supplier.com',
        password_hash: hashedPassword,
        role: 'user',
        first_name: 'Demo',
        last_name: 'Supplier',
        company_name: 'Demo Tech Solutions'
      }
    ];
    
    for (const user of users) {
      await db.query(`
        INSERT INTO users (email, password_hash, role, first_name, last_name, company_name)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [user.email, user.password_hash, user.role, user.first_name, user.last_name, user.company_name]);
    }
    
    logger.info(`✅ Seeded ${users.length} users`);
    
    // Seed companies
    logger.info('🏢 Seeding companies...');
    for (const company of mockSuppliers) {
      await db.query(`
        INSERT INTO companies (
          name, description, website, size_category, founded_year,
          headquarters_city, headquarters_state, headquarters_country,
          service_regions, industries, capabilities, technologies, certifications,
          credibility_score, total_projects, years_experience, team_size, annual_revenue_category
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [
        company.name, company.description, company.website, company.size_category, company.founded_year,
        company.headquarters_city, company.headquarters_state, company.headquarters_country,
        company.service_regions, company.industries, company.capabilities, company.technologies, company.certifications,
        company.credibility_score, company.total_projects, company.years_experience, company.team_size, company.annual_revenue_category
      ]);
    }
    
    logger.info(`✅ Seeded ${mockSuppliers.length} companies`);
    
    // Seed opportunities
    logger.info('🎯 Seeding opportunities...');
    for (const opportunity of mockOpportunities) {
      await db.query(`
        INSERT INTO opportunities (
          title, description, buyer_organization, buyer_type, industry,
          project_value_min, project_value_max, duration_months, location,
          required_capabilities, preferred_capabilities, required_certifications, required_experience_years,
          evaluation_criteria, submission_deadline, project_start_date, source, difficulty_level, competition_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `, [
        opportunity.title, opportunity.description, opportunity.buyer_organization, opportunity.buyer_type, opportunity.industry,
        opportunity.project_value_min, opportunity.project_value_max, opportunity.duration_months, opportunity.location,
        opportunity.required_capabilities, opportunity.preferred_capabilities, opportunity.required_certifications, opportunity.required_experience_years,
        JSON.stringify(opportunity.evaluation_criteria), opportunity.submission_deadline, opportunity.project_start_date,
        opportunity.source, opportunity.difficulty_level, opportunity.competition_level
      ]);
    }
    
    logger.info(`✅ Seeded ${mockOpportunities.length} opportunities`);
    
    // Verify seeding
    const companiesResult = await db.query('SELECT COUNT(*) FROM companies');
    const opportunitiesResult = await db.query('SELECT COUNT(*) FROM opportunities');
    const usersResult = await db.query('SELECT COUNT(*) FROM users');
    
    logger.info(`📊 Database seeded successfully:`);
    logger.info(`   - ${usersResult.rows[0].count} users`);
    logger.info(`   - ${companiesResult.rows[0].count} companies`);
    logger.info(`   - ${opportunitiesResult.rows[0].count} opportunities`);
    
  } catch (error) {
    logger.error('💥 Database seeding failed:', error.message);
    process.exit(1);
  } finally {
    await db.disconnect();
    logger.info('🔌 Database connection closed');
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };