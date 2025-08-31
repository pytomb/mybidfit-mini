#!/usr/bin/env node

const { Database } = require('../src/database/connection');
const { logger } = require('../src/utils/logger');

async function createSampleData() {
  const db = Database.getInstance();
  
  try {
    await db.connect();
    logger.info('Creating sample data for MyBidFit...');

    // 1. Create sample companies
    logger.info('Creating sample companies...');
    
    const companies = [
      {
        name: 'TechFlow Solutions',
        description: 'Full-stack software development and cloud infrastructure specialists with expertise in government contracting.',
        website: 'https://techflowsolutions.com',
        size_category: 'medium',
        founded_year: 2018,
        headquarters_city: 'Arlington',
        headquarters_state: 'VA',
        headquarters_country: 'USA',
        service_regions: ['DC Metro', 'Virginia', 'Maryland', 'Remote'],
        industries: ['Software Development', 'Cloud Computing', 'Cybersecurity', 'Data Analytics'],
        capabilities: ['Full-Stack Development', 'AWS/Azure/GCP', 'DevOps/CI-CD', 'API Integration', 'Security Compliance'],
        technologies: ['React', 'Node.js', 'Python', 'Docker', 'Kubernetes', 'PostgreSQL'],
        certifications: ['ISO 27001', 'SOC 2', 'AWS Certified', 'FedRAMP Ready'],
        credibility_score: 92.5,
        total_projects: 47,
        years_experience: 6,
        team_size: 23,
        annual_revenue_category: '1-10M'
      },
      {
        name: 'DataBridge Analytics',
        description: 'Specialized data science and business intelligence consultancy serving federal agencies and Fortune 500 companies.',
        website: 'https://databridge-analytics.com',
        size_category: 'small',
        founded_year: 2020,
        headquarters_city: 'San Antonio',
        headquarters_state: 'TX',
        headquarters_country: 'USA',
        service_regions: ['Texas', 'Southwest US', 'Remote'],
        industries: ['Data Science', 'Business Intelligence', 'Machine Learning', 'Federal Consulting'],
        capabilities: ['Data Analytics', 'Machine Learning', 'Data Visualization', 'Statistical Modeling', 'Predictive Analytics'],
        technologies: ['Python', 'R', 'Tableau', 'Power BI', 'Apache Spark', 'TensorFlow'],
        certifications: ['Tableau Certified', 'Microsoft Certified', 'GSA Schedule'],
        credibility_score: 88.3,
        total_projects: 28,
        years_experience: 4,
        team_size: 12,
        annual_revenue_category: '<1M'
      },
      {
        name: 'SecureNet Consulting',
        description: 'Cybersecurity specialists focusing on government and healthcare sectors with comprehensive security solutions.',
        website: 'https://securenet-consulting.com',
        size_category: 'medium',
        founded_year: 2015,
        headquarters_city: 'Colorado Springs',
        headquarters_state: 'CO',
        headquarters_country: 'USA',
        service_regions: ['Colorado', 'Mountain West', 'Nationwide'],
        industries: ['Cybersecurity', 'Healthcare IT', 'Government Contracting', 'Compliance'],
        capabilities: ['Security Audits', 'Penetration Testing', 'Compliance Management', 'Risk Assessment', 'HIPAA/FISMA'],
        technologies: ['Nessus', 'Metasploit', 'Splunk', 'CrowdStrike', 'Azure Sentinel'],
        certifications: ['CISSP', 'CEH', 'CISA', 'FedRAMP Authorized', 'HIPAA Compliant'],
        credibility_score: 94.7,
        total_projects: 63,
        years_experience: 9,
        team_size: 31,
        annual_revenue_category: '1-10M'
      }
    ];

    const companyInsertPromises = companies.map(company => {
      return db.query(`
        INSERT INTO companies (
          name, description, website, size_category, founded_year,
          headquarters_city, headquarters_state, headquarters_country, service_regions,
          industries, capabilities, technologies, certifications,
          credibility_score, total_projects, years_experience, team_size, annual_revenue_category
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING id, name
      `, [
        company.name, company.description, company.website, company.size_category, company.founded_year,
        company.headquarters_city, company.headquarters_state, company.headquarters_country, company.service_regions,
        company.industries, company.capabilities, company.technologies, company.certifications,
        company.credibility_score, company.total_projects, company.years_experience, company.team_size, company.annual_revenue_category
      ]);
    });

    const companyResults = await Promise.all(companyInsertPromises);
    logger.info(`Created ${companyResults.length} companies`);

    // 2. Create sample opportunities
    logger.info('Creating sample opportunities...');
    
    const opportunities = [
      {
        title: 'Enterprise Data Analytics Platform Development',
        description: 'Design and develop a comprehensive data analytics platform for a federal agency. Must handle large-scale data processing, real-time analytics, and comply with FedRAMP requirements.',
        buyer_organization: 'Department of Defense',
        buyer_type: 'government',
        industry: 'Software Development',
        project_value_min: 2000000,
        project_value_max: 3500000,
        duration_months: 18,
        location: 'Arlington, VA',
        required_capabilities: ['Full-Stack Development', 'Data Analytics', 'Cloud Computing', 'Security Compliance'],
        preferred_capabilities: ['Machine Learning', 'Real-time Processing', 'DevOps/CI-CD'],
        required_certifications: ['FedRAMP Ready', 'Security Clearance'],
        required_experience_years: 5,
        submission_deadline: '2024-03-15',
        project_start_date: '2024-05-01',
        source: 'sam.gov',
        difficulty_level: 'hard',
        competition_level: 'high'
      },
      {
        title: 'Healthcare Data Security Audit and Compliance',
        description: 'Comprehensive security audit of healthcare data systems, HIPAA compliance assessment, and implementation of security improvements for a major hospital network.',
        buyer_organization: 'Regional Medical Center',
        buyer_type: 'private',
        industry: 'Healthcare IT',
        project_value_min: 150000,
        project_value_max: 300000,
        duration_months: 6,
        location: 'Denver, CO',
        required_capabilities: ['Security Audits', 'HIPAA/FISMA', 'Risk Assessment', 'Compliance Management'],
        preferred_capabilities: ['Penetration Testing', 'Healthcare IT'],
        required_certifications: ['CISSP', 'HIPAA Compliant'],
        required_experience_years: 7,
        submission_deadline: '2024-02-28',
        project_start_date: '2024-04-01',
        source: 'rfpdb',
        difficulty_level: 'medium',
        competition_level: 'medium'
      },
      {
        title: 'Small Business Digital Transformation Initiative',
        description: 'Help small businesses adopt cloud technologies and modern data analytics. Includes training, implementation, and ongoing support for digital transformation initiatives.',
        buyer_organization: 'Small Business Development Corporation',
        buyer_type: 'nonprofit',
        industry: 'Business Consulting',
        project_value_min: 75000,
        project_value_max: 125000,
        duration_months: 12,
        location: 'San Antonio, TX',
        required_capabilities: ['Cloud Computing', 'Business Consulting', 'Data Analytics'],
        preferred_capabilities: ['Training and Education', 'Change Management'],
        required_certifications: ['AWS Certified'],
        required_experience_years: 3,
        submission_deadline: '2024-04-30',
        project_start_date: '2024-06-15',
        source: 'manual',
        difficulty_level: 'easy',
        competition_level: 'low'
      },
      {
        title: 'AI-Powered Customer Service Platform',
        description: 'Develop an AI-driven customer service platform with natural language processing, automated ticket routing, and predictive analytics for customer satisfaction.',
        buyer_organization: 'Enterprise Software Corp',
        buyer_type: 'private',
        industry: 'Software Development',
        project_value_min: 800000,
        project_value_max: 1200000,
        duration_months: 14,
        location: 'Remote (US-based team)',
        required_capabilities: ['Machine Learning', 'API Integration', 'Full-Stack Development'],
        preferred_capabilities: ['Natural Language Processing', 'Predictive Analytics'],
        required_certifications: ['SOC 2'],
        required_experience_years: 4,
        submission_deadline: '2024-03-01',
        project_start_date: '2024-05-15',
        source: 'rfpdb',
        difficulty_level: 'hard',
        competition_level: 'high'
      }
    ];

    const opportunityInsertPromises = opportunities.map(opp => {
      return db.query(`
        INSERT INTO opportunities (
          title, description, buyer_organization, buyer_type, industry,
          project_value_min, project_value_max, duration_months, location,
          required_capabilities, preferred_capabilities, required_certifications, required_experience_years,
          submission_deadline, project_start_date, source, difficulty_level, competition_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING id, title
      `, [
        opp.title, opp.description, opp.buyer_organization, opp.buyer_type, opp.industry,
        opp.project_value_min, opp.project_value_max, opp.duration_months, opp.location,
        opp.required_capabilities, opp.preferred_capabilities, opp.required_certifications, opp.required_experience_years,
        opp.submission_deadline, opp.project_start_date, opp.source, opp.difficulty_level, opp.competition_level
      ]);
    });

    const opportunityResults = await Promise.all(opportunityInsertPromises);
    logger.info(`Created ${opportunityResults.length} opportunities`);

    // 3. Create some scoring results (AI analysis simulation)
    logger.info('Creating sample scoring results...');
    
    const scoringData = [
      { companyId: companyResults[0].rows[0].id, opportunityId: opportunityResults[0].rows[0].id, score: 96.2, confidence: 92.5 },
      { companyId: companyResults[0].rows[0].id, opportunityId: opportunityResults[3].rows[0].id, score: 89.1, confidence: 87.3 },
      { companyId: companyResults[1].rows[0].id, opportunityId: opportunityResults[0].rows[0].id, score: 84.7, confidence: 79.2 },
      { companyId: companyResults[2].rows[0].id, opportunityId: opportunityResults[1].rows[0].id, score: 94.8, confidence: 91.4 },
    ];

    const scoringInsertPromises = scoringData.map(score => {
      return db.query(`
        INSERT INTO scoring_results (
          company_id, opportunity_id, overall_score, confidence_level,
          meets_hard_constraints, supporting_evidence, analyzed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id
      `, [
        score.companyId, score.opportunityId, score.score, score.confidence,
        true, JSON.stringify([
          { type: 'capability_match', evidence: 'Strong alignment with required technical capabilities' },
          { type: 'experience', evidence: 'Relevant project experience in similar domain' },
          { type: 'certifications', evidence: 'Holds required security and compliance certifications' }
        ])
      ]);
    });

    const scoringResults = await Promise.all(scoringInsertPromises);
    logger.info(`Created ${scoringResults.length} scoring results`);

    // 4. Create sample judge scores for Panel of Judges system
    logger.info('Creating sample judge scores...');
    
    for (let i = 0; i < scoringResults.length; i++) {
      const scoringResultId = scoringResults[i].rows[0].id;
      
      const judgeScores = [
        { judge_type: 'technical', score: Math.floor(Math.random() * 2) + 4, verdict: 'O', reasoning: 'Strong technical capabilities align well with project requirements. Proven track record in similar technologies.' },
        { judge_type: 'domain', score: Math.floor(Math.random() * 2) + 4, verdict: 'O', reasoning: 'Excellent domain expertise and understanding of industry-specific challenges and regulations.' },
        { judge_type: 'value', score: Math.floor(Math.random() * 2) + 4, verdict: 'O', reasoning: 'Competitive pricing structure with clear value proposition and ROI justification.' },
        { judge_type: 'innovation', score: Math.floor(Math.random() * 2) + 3, verdict: 'O', reasoning: 'Demonstrates innovative approaches while maintaining focus on proven methodologies.' },
        { judge_type: 'relationship', score: Math.floor(Math.random() * 2) + 4, verdict: 'O', reasoning: 'Strong references and history of successful client relationships in similar engagements.' }
      ];

      const judgeInsertPromises = judgeScores.map(judge => {
        return db.query(`
          INSERT INTO judge_scores (
            scoring_result_id, judge_type, score, verdict, confidence, reasoning
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [scoringResultId, judge.judge_type, judge.score, judge.verdict, Math.random() * 15 + 85, judge.reasoning]);
      });

      await Promise.all(judgeInsertPromises);
    }

    logger.info('Created judge scores for Panel of Judges system');

    // 5. Link companies to the test user
    logger.info('Linking companies to test user...');
    
    // Update the test user we created earlier to be associated with the first company
    await db.query(`
      UPDATE users 
      SET company_name = $1 
      WHERE email = 'test@example.com'
    `, [companyResults[0].rows[0].name]);

    logger.info('✅ Sample data creation completed successfully!');
    
    // Print summary
    console.log('\n🎉 MyBidFit Sample Data Summary:');
    console.log('================================');
    console.log(`✅ Companies: ${companyResults.length}`);
    console.log(`✅ Opportunities: ${opportunityResults.length}`);
    console.log(`✅ AI Scoring Results: ${scoringResults.length}`);
    console.log(`✅ Test User: test@example.com (password: testpass123)`);
    console.log('\n🚀 Ready for testing! Login and explore the dashboard.');

  } catch (error) {
    logger.error('Failed to create sample data:', error);
    throw error;
  } finally {
    await db.disconnect();
  }
}

// Run the script
if (require.main === module) {
  createSampleData()
    .then(() => {
      logger.info('Sample data creation script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Sample data creation script failed:', error);
      process.exit(1);
    });
}

module.exports = { createSampleData };