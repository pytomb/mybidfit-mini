#!/usr/bin/env node

const { Database } = require('../src/database/connection');
const { logger } = require('../src/utils/logger');

/**
 * Production-ready data seeding script for MyBidFit platform
 * Creates realistic supplier profiles, opportunities, and partner fit data
 */

async function seedProductionData() {
  const db = Database.getInstance();
  
  try {
    logger.info('🌱 Starting production data seeding...');
    
    await db.connect();
    logger.info('✅ Database connected');
    
    // Clear existing data
    logger.info('🧹 Clearing existing data...');
    await db.query('DELETE FROM partner_activity_log');
    await db.query('DELETE FROM partner_invitations');
    await db.query('DELETE FROM partner_matches');
    await db.query('DELETE FROM partner_profiles');
    await db.query('DELETE FROM event_recommendations');
    await db.query('DELETE FROM partnership_recommendations');
    await db.query('DELETE FROM judge_scores');
    await db.query('DELETE FROM scoring_results');
    await db.query('DELETE FROM opportunities');
    await db.query('DELETE FROM companies');
    await db.query('DELETE FROM users WHERE email NOT LIKE \'%@mybidfit.com\'');
    
    // Seed realistic companies/suppliers
    logger.info('🏢 Seeding supplier companies...');
    
    const companies = [
      {
        name: 'CloudTech Solutions',
        description: 'Enterprise cloud migration and infrastructure specialists',
        website: 'https://cloudtechsolutions.com',
        size_category: 'medium',
        founded_year: 2015,
        headquarters_city: 'Austin',
        headquarters_state: 'Texas',
        headquarters_country: 'United States',
        service_regions: ['North America', 'Remote'],
        industries: ['Healthcare', 'Finance', 'E-commerce'],
        capabilities: ['Cloud Migration', 'AWS/Azure', 'DevOps', 'Kubernetes', 'API Development'],
        technologies: ['React', 'Node.js', 'Python', 'PostgreSQL', 'Docker'],
        certifications: ['AWS Certified', 'Azure Certified', 'SOC 2', 'ISO 27001'],
        credibility_score: 85.5,
        total_projects: 127,
        years_experience: 9,
        team_size: 45,
        annual_revenue_category: '1-10M'
      },
      {
        name: 'SecureGov Systems',
        description: 'Government contracting specialists for secure IT infrastructure',
        website: 'https://securegovsystems.com',
        size_category: 'large',
        founded_year: 2008,
        headquarters_city: 'Washington',
        headquarters_state: 'DC',
        headquarters_country: 'United States',
        service_regions: ['North America'],
        industries: ['Government', 'Defense', 'Public Safety'],
        capabilities: ['Cybersecurity', 'Government Contracting', 'FISMA Compliance', 'Network Security'],
        technologies: ['Java', 'C++', '.NET', 'Oracle', 'VMware'],
        certifications: ['FedRAMP', 'FISMA', 'NIST', 'Security Clearance'],
        credibility_score: 92.3,
        total_projects: 89,
        years_experience: 16,
        team_size: 120,
        annual_revenue_category: '10-100M'
      },
      {
        name: 'HealthTech Innovations',
        description: 'Healthcare technology and HIPAA-compliant solutions',
        website: 'https://healthtechinnovations.com',
        size_category: 'medium',
        founded_year: 2018,
        headquarters_city: 'Boston',
        headquarters_state: 'Massachusetts',
        headquarters_country: 'United States',
        service_regions: ['North America', 'Europe'],
        industries: ['Healthcare', 'Medical Devices', 'Telemedicine'],
        capabilities: ['HIPAA Compliance', 'Medical Software', 'Telemedicine', 'EHR Integration'],
        technologies: ['React', 'Node.js', 'FHIR', 'HL7', 'MongoDB'],
        certifications: ['HIPAA', 'SOC 2', 'FDA 510k', 'HITECH'],
        credibility_score: 88.7,
        total_projects: 76,
        years_experience: 6,
        team_size: 38,
        annual_revenue_category: '1-10M'
      },
      {
        name: 'FinTech Partners LLC',
        description: 'Financial services technology and compliance solutions',
        website: 'https://fintechpartners.com',
        size_category: 'medium',
        founded_year: 2012,
        headquarters_city: 'New York',
        headquarters_state: 'New York',
        headquarters_country: 'United States',
        service_regions: ['North America', 'Europe'],
        industries: ['Finance', 'Banking', 'Insurance'],
        capabilities: ['PCI Compliance', 'Payment Processing', 'Risk Management', 'Blockchain'],
        technologies: ['Java', 'Spring', 'Kafka', 'Redis', 'Kubernetes'],
        certifications: ['PCI DSS', 'SOX', 'ISO 27001', 'GDPR'],
        credibility_score: 91.2,
        total_projects: 94,
        years_experience: 12,
        team_size: 67,
        annual_revenue_category: '10-100M'
      },
      {
        name: 'AgileWeb Developers',
        description: 'Full-stack web development and digital transformation',
        website: 'https://agilewebdev.com',
        size_category: 'small',
        founded_year: 2019,
        headquarters_city: 'Denver',
        headquarters_state: 'Colorado',
        headquarters_country: 'United States',
        service_regions: ['North America', 'Remote'],
        industries: ['E-commerce', 'SaaS', 'Startups'],
        capabilities: ['Full-Stack Development', 'UI/UX Design', 'E-commerce', 'Mobile Apps'],
        technologies: ['React', 'Vue.js', 'Node.js', 'MongoDB', 'Firebase'],
        certifications: ['Google Cloud', 'Shopify Partner', 'AWS'],
        credibility_score: 78.9,
        total_projects: 52,
        years_experience: 5,
        team_size: 18,
        annual_revenue_category: '<1M'
      }
    ];
    
    const companyIds = [];
    for (const company of companies) {
      const result = await db.query(`
        INSERT INTO companies (
          name, description, website, size_category, founded_year,
          headquarters_city, headquarters_state, headquarters_country,
          service_regions, industries, capabilities, technologies, certifications,
          credibility_score, total_projects, years_experience, team_size, annual_revenue_category
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING id
      `, [
        company.name, company.description, company.website, company.size_category, company.founded_year,
        company.headquarters_city, company.headquarters_state, company.headquarters_country,
        company.service_regions, company.industries, company.capabilities, company.technologies, company.certifications,
        company.credibility_score, company.total_projects, company.years_experience, company.team_size, company.annual_revenue_category
      ]);
      companyIds.push(result.rows[0].id);
    }
    
    logger.info(`✅ Seeded ${companies.length} companies`);
    
    // Seed realistic opportunities
    logger.info('🎯 Seeding opportunities...');
    
    const opportunities = [
      {
        title: 'Healthcare Data Platform Modernization',
        description: 'Modernize legacy healthcare data systems with cloud-native architecture and HIPAA compliance',
        buyer_organization: 'Regional Medical Center',
        buyer_type: 'private',
        industry: 'Healthcare',
        project_value_min: 500000,
        project_value_max: 1200000,
        duration_months: 18,
        location: 'Boston, MA',
        required_capabilities: ['Cloud Migration', 'HIPAA Compliance', 'Medical Software', 'API Development'],
        preferred_capabilities: ['EHR Integration', 'Telemedicine'],
        required_certifications: ['HIPAA', 'SOC 2'],
        required_experience_years: 5,
        source: 'rfpdb',
        difficulty_level: 'medium',
        competition_level: 'medium'
      },
      {
        title: 'Federal IT Infrastructure Security Upgrade',
        description: 'Comprehensive cybersecurity infrastructure upgrade for federal agency',
        buyer_organization: 'Department of Veterans Affairs',
        buyer_type: 'government',
        industry: 'Government',
        project_value_min: 2000000,
        project_value_max: 5000000,
        duration_months: 24,
        location: 'Washington, DC',
        required_capabilities: ['Cybersecurity', 'Government Contracting', 'FISMA Compliance', 'Network Security'],
        preferred_capabilities: ['Security Clearance', 'Cloud Security'],
        required_certifications: ['FedRAMP', 'FISMA', 'Security Clearance'],
        required_experience_years: 10,
        source: 'sam.gov',
        difficulty_level: 'hard',
        competition_level: 'high'
      },
      {
        title: 'E-commerce Platform Development',
        description: 'Build scalable e-commerce platform with modern payment processing',
        buyer_organization: 'Retail Innovations Inc',
        buyer_type: 'private',
        industry: 'E-commerce',
        project_value_min: 200000,
        project_value_max: 500000,
        duration_months: 12,
        location: 'Remote',
        required_capabilities: ['Full-Stack Development', 'E-commerce', 'Payment Processing'],
        preferred_capabilities: ['UI/UX Design', 'Mobile Apps'],
        required_certifications: ['PCI DSS'],
        required_experience_years: 3,
        source: 'manual',
        difficulty_level: 'easy',
        competition_level: 'low'
      }
    ];
    
    const opportunityIds = [];
    for (const opportunity of opportunities) {
      const result = await db.query(`
        INSERT INTO opportunities (
          title, description, buyer_organization, buyer_type, industry,
          project_value_min, project_value_max, duration_months, location,
          required_capabilities, preferred_capabilities, required_certifications,
          required_experience_years, source, difficulty_level, competition_level,
          submission_deadline, project_start_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING id
      `, [
        opportunity.title, opportunity.description, opportunity.buyer_organization, opportunity.buyer_type, opportunity.industry,
        opportunity.project_value_min, opportunity.project_value_max, opportunity.duration_months, opportunity.location,
        opportunity.required_capabilities, opportunity.preferred_capabilities, opportunity.required_certifications,
        opportunity.required_experience_years, opportunity.source, opportunity.difficulty_level, opportunity.competition_level,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)   // 60 days from now
      ]);
      opportunityIds.push(result.rows[0].id);
    }
    
    logger.info(`✅ Seeded ${opportunities.length} opportunities`);
    
    // Seed partner profiles for each company
    logger.info('🤝 Seeding partner profiles...');
    
    const partnerProfileIds = [];
    for (let i = 0; i < companyIds.length; i++) {
      const companyId = companyIds[i];
      const company = companies[i];
      
      const result = await db.query(`
        INSERT INTO partner_profiles (
          company_id, open_to_partnership, partnership_types, prime_sub_preference,
          current_capacity, typical_project_size, preferred_industries, preferred_regions,
          preferred_company_sizes, min_partnership_size, max_partnership_size,
          successful_partnerships, average_partnership_rating, contact_method,
          contact_email, response_time_hours, profile_completeness, profile_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING id
      `, [
        companyId,
        true, // open_to_partnership
        ['complementary', 'similar'], // partnership_types
        'both', // prime_sub_preference
        Math.floor(Math.random() * 50) + 25, // current_capacity (25-75%)
        company.annual_revenue_category === '<1M' ? '<100k' : 
        company.annual_revenue_category === '1-10M' ? '500k-1M' : '1M+',
        company.industries, // preferred_industries
        company.service_regions, // preferred_regions
        ['small', 'medium', 'large'], // preferred_company_sizes
        50000, // min_partnership_size
        company.size_category === 'large' ? 5000000 : 1000000, // max_partnership_size
        Math.floor(Math.random() * 10) + 3, // successful_partnerships
        4.2 + Math.random() * 0.8, // average_partnership_rating (4.2-5.0)
        'email', // contact_method
        `partnerships@${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
        24, // response_time_hours
        85 + Math.floor(Math.random() * 15), // profile_completeness (85-100%)
        true // profile_verified
      ]);
      partnerProfileIds.push(result.rows[0].id);
    }
    
    logger.info(`✅ Seeded ${companyIds.length} partner profiles`);
    
    // Create some sample partner matches for demonstration
    logger.info('🔗 Creating sample partner matches...');
    
    // Create complementary matches (different capabilities, same industry)
    for (let i = 0; i < Math.min(3, partnerProfileIds.length - 1); i++) {
      await db.query(`
        INSERT INTO partner_matches (
          seeker_id, partner_id, opportunity_id, match_type, match_score,
          cfo_score, ciso_score, operator_score, skeptic_score,
          match_reasons, top_strengths, potential_risks,
          capability_overlap, capability_gaps_filled, combined_capability_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        partnerProfileIds[i], // seeker_id (first few partner profiles)
        partnerProfileIds[i + 1], // partner_id (next partner profile)  
        opportunityIds[0], // opportunity_id
        'complementary',
        0.75 + Math.random() * 0.25, // match_score (0.75-1.0)
        0.8 + Math.random() * 0.2, // cfo_score
        0.85 + Math.random() * 0.15, // ciso_score
        0.78 + Math.random() * 0.22, // operator_score
        0.65 + Math.random() * 0.35, // skeptic_score
        JSON.stringify([
          { reason: 'Complementary capabilities fill project requirements', weight: 0.3 },
          { reason: 'Strong industry experience alignment', weight: 0.25 },
          { reason: 'Geographic compatibility for project delivery', weight: 0.2 }
        ]),
        ['Strong technical expertise', 'Proven industry track record', 'Available capacity'],
        ['Different company cultures', 'Coordination complexity'],
        ['Project Management', 'Quality Assurance'],
        ['Cloud Migration', 'Security Compliance'],
        0.88
      ]);
    }
    
    logger.info(`✅ Created sample partner matches`);
    
    // Summary
    const companiesCount = await db.query('SELECT COUNT(*) FROM companies');
    const opportunitiesCount = await db.query('SELECT COUNT(*) FROM opportunities');
    const partnerProfilesCount = await db.query('SELECT COUNT(*) FROM partner_profiles');
    const partnerMatchesCount = await db.query('SELECT COUNT(*) FROM partner_matches');
    
    logger.info('📊 Production data seeded successfully:');
    logger.info(`   - ${companiesCount.rows[0].count} companies`);
    logger.info(`   - ${opportunitiesCount.rows[0].count} opportunities`);
    logger.info(`   - ${partnerProfilesCount.rows[0].count} partner profiles`);
    logger.info(`   - ${partnerMatchesCount.rows[0].count} partner matches`);
    
    return {
      companies: parseInt(companiesCount.rows[0].count),
      opportunities: parseInt(opportunitiesCount.rows[0].count),
      partnerProfiles: parseInt(partnerProfilesCount.rows[0].count),
      partnerMatches: parseInt(partnerMatchesCount.rows[0].count)
    };
    
  } catch (error) {
    logger.error('💥 Production data seeding failed:', error);
    throw error;
  } finally {
    await db.disconnect();
    logger.info('🔌 Database connection closed');
  }
}

// Run seeding
if (require.main === module) {
  seedProductionData()
    .then((results) => {
      logger.info('✅ Production data seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Production data seeding failed');
      process.exit(1);
    });
}

module.exports = { seedProductionData };