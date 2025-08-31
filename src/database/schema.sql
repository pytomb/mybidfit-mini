-- MyBidFit Database Schema
-- Complete schema for supplier-opportunity matching with Panel of Judges

-- Drop existing tables (for development)
DROP TABLE IF EXISTS judge_scores CASCADE;
DROP TABLE IF EXISTS partnership_recommendations CASCADE;
DROP TABLE IF EXISTS scoring_results CASCADE;
DROP TABLE IF EXISTS event_recommendations CASCADE;
DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (authentication and profiles)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Companies table (suppliers and their capabilities)
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    size_category VARCHAR(50), -- 'small', 'medium', 'large', 'enterprise'
    founded_year INTEGER,
    
    -- Geographic information
    headquarters_city VARCHAR(100),
    headquarters_state VARCHAR(50),
    headquarters_country VARCHAR(50),
    service_regions TEXT[], -- Array of regions they serve
    
    -- Core capabilities and industries
    industries TEXT[], -- Array of industries they serve
    capabilities TEXT[], -- Array of their core capabilities
    technologies TEXT[], -- Array of technologies they use
    certifications TEXT[], -- Array of certifications they hold
    
    -- Metadata for scoring
    credibility_score DECIMAL(5,2) DEFAULT 0,
    total_projects INTEGER DEFAULT 0,
    years_experience INTEGER,
    team_size INTEGER,
    
    -- Financial information
    annual_revenue_category VARCHAR(50), -- '<1M', '1-10M', '10-100M', '100M+'
    
    -- AI extraction metadata
    data_sources JSONB, -- URLs and sources of information
    last_analysis TIMESTAMP,
    analysis_confidence DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Opportunities table (RFPs, contracts, projects)
CREATE TABLE opportunities (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    buyer_organization VARCHAR(255),
    buyer_type VARCHAR(50), -- 'government', 'private', 'nonprofit'
    
    -- Requirements and constraints
    industry VARCHAR(100),
    project_value_min DECIMAL(12,2),
    project_value_max DECIMAL(12,2),
    duration_months INTEGER,
    location VARCHAR(255),
    
    -- Requirements arrays
    required_capabilities TEXT[],
    preferred_capabilities TEXT[],
    required_certifications TEXT[],
    required_experience_years INTEGER,
    
    -- Evaluation criteria
    evaluation_criteria JSONB, -- JSON object with criteria and weights
    submission_deadline TIMESTAMP,
    project_start_date TIMESTAMP,
    
    -- Metadata
    source VARCHAR(100), -- 'sam.gov', 'rfpdb', 'manual'
    source_url VARCHAR(500),
    difficulty_level VARCHAR(50), -- 'easy', 'medium', 'hard', 'expert'
    competition_level VARCHAR(50), -- 'low', 'medium', 'high'
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Scoring results table (AI analysis results)
CREATE TABLE scoring_results (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    opportunity_id INTEGER REFERENCES opportunities(id) ON DELETE CASCADE,
    
    -- Overall scoring
    overall_score DECIMAL(5,2) NOT NULL,
    confidence_level DECIMAL(5,2),
    
    -- Constraint checks
    meets_hard_constraints BOOLEAN DEFAULT false,
    constraint_failures TEXT[],
    
    -- Evidence and citations
    supporting_evidence JSONB, -- Array of evidence with citations
    improvement_suggestions TEXT[],
    
    -- Analysis metadata
    analysis_version VARCHAR(50),
    analyzed_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(company_id, opportunity_id)
);

-- Judge scores table (Panel of Judges individual scores)
CREATE TABLE judge_scores (
    id SERIAL PRIMARY KEY,
    scoring_result_id INTEGER REFERENCES scoring_results(id) ON DELETE CASCADE,
    
    judge_type VARCHAR(50) NOT NULL, -- 'technical', 'domain', 'value', 'innovation', 'relationship'
    score INTEGER CHECK (score >= 1 AND score <= 5), -- 1-5 scale
    verdict VARCHAR(10) CHECK (verdict IN ('X', 'O')), -- X = reject, O = approve
    confidence DECIMAL(5,2),
    
    -- Judge reasoning
    reasoning TEXT NOT NULL,
    evidence_citations TEXT[],
    recommendations TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Partnership recommendations table (supplier-to-supplier matching)
CREATE TABLE partnership_recommendations (
    id SERIAL PRIMARY KEY,
    company_a_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    company_b_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Partnership scoring
    complementarity_score DECIMAL(5,2),
    coverage_score DECIMAL(5,2),
    relationship_score DECIMAL(5,2),
    overall_partnership_score DECIMAL(5,2),
    
    -- Partnership details
    partnership_type VARCHAR(50), -- 'strategic', 'project-based', 'referral'
    shared_capabilities TEXT[],
    complementary_capabilities TEXT[],
    geographic_synergy BOOLEAN DEFAULT false,
    
    -- Value analysis
    estimated_value_increase DECIMAL(5,2), -- Percentage increase in opportunity success
    recommended_for_opportunities INTEGER[], -- Array of opportunity IDs
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Prevent duplicate partnerships
    UNIQUE(company_a_id, company_b_id)
);

-- Event recommendations table (networking and business development)
CREATE TABLE event_recommendations (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Event information
    event_name VARCHAR(255),
    event_type VARCHAR(100), -- 'conference', 'networking', 'trade-show', 'workshop'
    event_date TIMESTAMP,
    location VARCHAR(255),
    cost_estimate DECIMAL(10,2),
    
    -- Recommendation scoring
    relevance_score DECIMAL(5,2),
    roi_estimate DECIMAL(5,2),
    networking_potential DECIMAL(5,2),
    
    -- Target attendees analysis
    buyer_organizations TEXT[],
    potential_partners TEXT[],
    industry_focus TEXT[],
    
    -- ROI projections
    estimated_leads INTEGER,
    estimated_meetings INTEGER,
    estimated_opportunities INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_companies_industries ON companies USING GIN (industries);
CREATE INDEX idx_companies_capabilities ON companies USING GIN (capabilities);
CREATE INDEX idx_companies_certifications ON companies USING GIN (certifications);
CREATE INDEX idx_companies_service_regions ON companies USING GIN (service_regions);

CREATE INDEX idx_opportunities_industry ON opportunities (industry);
CREATE INDEX idx_opportunities_buyer_type ON opportunities (buyer_type);
CREATE INDEX idx_opportunities_deadline ON opportunities (submission_deadline);
CREATE INDEX idx_opportunities_active ON opportunities (is_active);
CREATE INDEX idx_opportunities_required_caps ON opportunities USING GIN (required_capabilities);

CREATE INDEX idx_scoring_results_company ON scoring_results (company_id);
CREATE INDEX idx_scoring_results_opportunity ON scoring_results (opportunity_id);
CREATE INDEX idx_scoring_results_score ON scoring_results (overall_score);

CREATE INDEX idx_judge_scores_result ON judge_scores (scoring_result_id);
CREATE INDEX idx_judge_scores_type ON judge_scores (judge_type);

CREATE INDEX idx_partnerships_companies ON partnership_recommendations (company_a_id, company_b_id);
CREATE INDEX idx_partnerships_score ON partnership_recommendations (overall_partnership_score);

CREATE INDEX idx_events_company ON event_recommendations (company_id);
CREATE INDEX idx_events_roi ON event_recommendations (roi_estimate);

-- Insert some initial data
INSERT INTO users (email, password_hash, role, first_name, last_name, company_name) VALUES
('admin@mybidfit.com', '$2b$10$hash', 'admin', 'Admin', 'User', 'MyBidFit'),
('demo@supplier.com', '$2b$10$hash', 'user', 'Demo', 'Supplier', 'Demo Tech Solutions');

COMMENT ON TABLE companies IS 'Supplier companies with their capabilities and metadata';
COMMENT ON TABLE opportunities IS 'Business opportunities, RFPs, and contracts';
COMMENT ON TABLE scoring_results IS 'AI analysis results for company-opportunity matches';
COMMENT ON TABLE judge_scores IS 'Individual scores from the Panel of Judges system';
COMMENT ON TABLE partnership_recommendations IS 'Supplier-to-supplier partnership suggestions';
COMMENT ON TABLE event_recommendations IS 'Networking and business development event suggestions';