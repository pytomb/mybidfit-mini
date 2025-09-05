-- Migration 006: Government Opportunity Scoring System
-- Extends existing Panel of Judges architecture for government opportunity scoring
-- Supports both objective and relative scoring with explainability and version tracking

-- Government opportunity scores table (stores Panel of Judges scoring results)
CREATE TABLE IF NOT EXISTS gov_opportunity_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to government opportunity and company
    opportunity_id UUID NOT NULL REFERENCES gov_opportunities(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
    
    -- Scoring metadata
    scoring_version VARCHAR(20) DEFAULT '1.0', -- Track scoring algorithm versions
    scored_at TIMESTAMP DEFAULT NOW(),
    scoring_type VARCHAR(50) DEFAULT 'panel_of_judges', -- 'panel_of_judges', 'ml_model', 'hybrid'
    
    -- Overall scoring results
    overall_score DECIMAL(5,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    fit_category VARCHAR(20) NOT NULL CHECK (fit_category IN ('excellent', 'good', 'fair', 'poor')),
    
    -- Individual judge scores (following existing Panel of Judges pattern)
    technical_judge_score DECIMAL(5,2) CHECK (technical_judge_score >= 0 AND technical_judge_score <= 100),
    domain_judge_score DECIMAL(5,2) CHECK (domain_judge_score >= 0 AND domain_judge_score <= 100),
    value_judge_score DECIMAL(5,2) CHECK (value_judge_score >= 0 AND value_judge_score <= 100),
    innovation_judge_score DECIMAL(5,2) CHECK (innovation_judge_score >= 0 AND innovation_judge_score <= 100),
    relationship_judge_score DECIMAL(5,2) CHECK (relationship_judge_score >= 0 AND relationship_judge_score <= 100),
    
    -- Scoring explanations and evidence
    scoring_explanation JSONB DEFAULT '{}', -- Detailed explanations from each judge
    evidence_summary JSONB DEFAULT '{}', -- Key evidence points that influenced scoring
    
    -- Risk and opportunity indicators
    risk_factors JSONB DEFAULT '[]', -- Array of identified risks
    opportunity_factors JSONB DEFAULT '[]', -- Array of opportunity strengths
    competitive_analysis JSONB DEFAULT '{}', -- Analysis of competitive positioning
    
    -- Recommendation and next steps
    recommendation VARCHAR(50) NOT NULL CHECK (recommendation IN ('pursue_actively', 'pursue_with_caution', 'monitor', 'skip')),
    suggested_actions JSONB DEFAULT '[]', -- Array of recommended actions
    
    -- Confidence and quality metrics
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1), -- 0-1 confidence level
    data_quality_score DECIMAL(3,2) CHECK (data_quality_score >= 0 AND data_quality_score <= 1), -- Quality of input data
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate scores for same opp/company/version
    UNIQUE(opportunity_id, company_id, scoring_version)
);

-- Government opportunity scoring factors (stores detailed scoring breakdown)
CREATE TABLE IF NOT EXISTS gov_opportunity_scoring_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to main score record
    score_id UUID NOT NULL REFERENCES gov_opportunity_scores(id) ON DELETE CASCADE,
    
    -- Factor details
    factor_category VARCHAR(50) NOT NULL, -- 'technical', 'financial', 'competitive', 'strategic'
    factor_name VARCHAR(255) NOT NULL, -- Specific factor name
    factor_description TEXT, -- Human-readable description
    
    -- Factor scoring
    factor_score DECIMAL(5,2) NOT NULL CHECK (factor_score >= 0 AND factor_score <= 100),
    factor_weight DECIMAL(3,2) NOT NULL CHECK (factor_weight >= 0 AND factor_weight <= 1),
    weighted_contribution DECIMAL(5,2) GENERATED ALWAYS AS (factor_score * factor_weight) STORED,
    
    -- Supporting data
    evidence JSONB DEFAULT '{}', -- Supporting evidence for this factor
    data_sources JSONB DEFAULT '[]', -- Sources of data used
    
    -- Judge attribution
    judge_name VARCHAR(50), -- Which judge evaluated this factor
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

-- Government opportunity scoring history (track score changes over time)
CREATE TABLE IF NOT EXISTS gov_opportunity_scoring_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to opportunity and company
    opportunity_id UUID NOT NULL REFERENCES gov_opportunities(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
    
    -- Historical score data
    previous_score DECIMAL(5,2) NOT NULL,
    new_score DECIMAL(5,2) NOT NULL,
    score_change DECIMAL(5,2) GENERATED ALWAYS AS (new_score - previous_score) STORED,
    
    -- Change metadata
    change_reason VARCHAR(255), -- Why did the score change
    changed_factors JSONB DEFAULT '[]', -- Which factors contributed to change
    
    -- Context
    triggered_by VARCHAR(100), -- 'manual_review', 'data_update', 'algorithm_change', 'feedback'
    triggered_by_user_id UUID, -- If manual change, who made it
    
    -- Timestamps
    changed_at TIMESTAMP DEFAULT NOW()
);

-- Performance indexes for scoring queries
CREATE INDEX IF NOT EXISTS idx_gov_opp_scores_opportunity_id ON gov_opportunity_scores (opportunity_id);
CREATE INDEX IF NOT EXISTS idx_gov_opp_scores_company_id ON gov_opportunity_scores (company_id);
CREATE INDEX IF NOT EXISTS idx_gov_opp_scores_overall_score ON gov_opportunity_scores (overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_gov_opp_scores_fit_category ON gov_opportunity_scores (fit_category);
CREATE INDEX IF NOT EXISTS idx_gov_opp_scores_recommendation ON gov_opportunity_scores (recommendation);
CREATE INDEX IF NOT EXISTS idx_gov_opp_scores_scored_at ON gov_opportunity_scores (scored_at);
CREATE INDEX IF NOT EXISTS idx_gov_opp_scores_scoring_version ON gov_opportunity_scores (scoring_version);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_gov_opp_scores_company_fit ON gov_opportunity_scores (company_id, fit_category, overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_gov_opp_scores_opp_recommendation ON gov_opportunity_scores (opportunity_id, recommendation, overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_gov_opp_scores_company_scored_at ON gov_opportunity_scores (company_id, scored_at DESC);

-- JSONB indexes for efficient searching
CREATE INDEX IF NOT EXISTS idx_gov_opp_scores_explanation ON gov_opportunity_scores USING GIN (scoring_explanation);
CREATE INDEX IF NOT EXISTS idx_gov_opp_scores_evidence ON gov_opportunity_scores USING GIN (evidence_summary);
CREATE INDEX IF NOT EXISTS idx_gov_opp_scores_risk_factors ON gov_opportunity_scores USING GIN (risk_factors);
CREATE INDEX IF NOT EXISTS idx_gov_opp_scores_actions ON gov_opportunity_scores USING GIN (suggested_actions);

-- Scoring factors indexes
CREATE INDEX IF NOT EXISTS idx_gov_opp_scoring_factors_score_id ON gov_opportunity_scoring_factors (score_id);
CREATE INDEX IF NOT EXISTS idx_gov_opp_scoring_factors_category ON gov_opportunity_scoring_factors (factor_category);
CREATE INDEX IF NOT EXISTS idx_gov_opp_scoring_factors_name ON gov_opportunity_scoring_factors (factor_name);
CREATE INDEX IF NOT EXISTS idx_gov_opp_scoring_factors_judge ON gov_opportunity_scoring_factors (judge_name);

-- History indexes
CREATE INDEX IF NOT EXISTS idx_gov_opp_scoring_history_opp_id ON gov_opportunity_scoring_history (opportunity_id);
CREATE INDEX IF NOT EXISTS idx_gov_opp_scoring_history_company_id ON gov_opportunity_scoring_history (company_id);
CREATE INDEX IF NOT EXISTS idx_gov_opp_scoring_history_changed_at ON gov_opportunity_scoring_history (changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_gov_opp_scoring_history_triggered_by ON gov_opportunity_scoring_history (triggered_by);

-- Unique index to prevent score duplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_gov_opp_scores_unique_scoring 
ON gov_opportunity_scores (opportunity_id, company_id, scoring_version);

-- Comments for documentation
COMMENT ON TABLE gov_opportunity_scores IS 'Government opportunity scores from Panel of Judges system with explainability and version tracking';
COMMENT ON COLUMN gov_opportunity_scores.scoring_version IS 'Version of scoring algorithm used, allows for A/B testing and algorithm evolution';
COMMENT ON COLUMN gov_opportunity_scores.scoring_explanation IS 'Detailed JSON explanations from each judge with reasoning and evidence';
COMMENT ON COLUMN gov_opportunity_scores.evidence_summary IS 'Key evidence points that influenced the overall scoring decision';
COMMENT ON COLUMN gov_opportunity_scores.competitive_analysis IS 'Analysis of competitive positioning and market dynamics';
COMMENT ON COLUMN gov_opportunity_scores.confidence_score IS 'Confidence level of the scoring (0-1), based on data quality and model certainty';
COMMENT ON COLUMN gov_opportunity_scores.data_quality_score IS 'Quality assessment of input data used for scoring';

COMMENT ON TABLE gov_opportunity_scoring_factors IS 'Detailed breakdown of individual factors contributing to opportunity scores';
COMMENT ON COLUMN gov_opportunity_scoring_factors.factor_weight IS 'Weight of this factor in overall score calculation (0-1)';
COMMENT ON COLUMN gov_opportunity_scoring_factors.weighted_contribution IS 'Calculated contribution of this factor to overall score';

COMMENT ON TABLE gov_opportunity_scoring_history IS 'Historical tracking of score changes for analysis and auditing';
COMMENT ON COLUMN gov_opportunity_scoring_history.score_change IS 'Calculated change in score (new - previous)';

-- Add updated_at trigger for main scores table
CREATE OR REPLACE FUNCTION update_gov_opportunity_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gov_opportunity_scores_updated_at
    BEFORE UPDATE ON gov_opportunity_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_gov_opportunity_scores_updated_at();

-- Insert sample scoring data for testing (builds on Migration 005 sample opportunities)
INSERT INTO gov_opportunity_scores (
    opportunity_id, company_id, overall_score, fit_category, 
    technical_judge_score, domain_judge_score, value_judge_score, innovation_judge_score, relationship_judge_score,
    scoring_explanation, evidence_summary, risk_factors, opportunity_factors,
    recommendation, suggested_actions, confidence_score, data_quality_score
) 
SELECT 
    o.id as opportunity_id,
    c.id as company_id,
    85.5 as overall_score,
    'excellent' as fit_category,
    88.0 as technical_judge_score,
    92.0 as domain_judge_score,
    81.0 as value_judge_score,
    84.0 as innovation_judge_score,
    79.0 as relationship_judge_score,
    '{
        "technical_judge": "Strong technical capabilities in cloud migration and infrastructure modernization. Company demonstrates proven experience with federal systems.",
        "domain_judge": "Excellent match for IT modernization. NAICS codes align perfectly with opportunity requirements. Strong past performance in similar engagements.",
        "value_judge": "Competitive pricing structure. Good value proposition for federal client. Cost estimates within reasonable range.",
        "innovation_judge": "Solid technical approach with some innovative elements. Good use of modern cloud architectures.",
        "relationship_judge": "Moderate existing relationships with federal agencies. Room for improvement in agency-specific networking."
    }' as scoring_explanation,
    '{
        "key_strengths": ["Federal experience", "Cloud expertise", "Security clearances", "Relevant NAICS codes"],
        "matching_capabilities": ["Infrastructure modernization", "Cloud migration", "System integration"],
        "past_performance": "Strong track record with 3 similar federal projects in last 2 years"
    }' as evidence_summary,
    '["Competitive market with established incumbents", "Required security clearances may limit team scaling"]' as risk_factors,
    '["Perfect NAICS code match", "Strong technical capabilities", "Federal system experience", "Competitive team size"]' as opportunity_factors,
    'pursue_actively' as recommendation,
    '["Submit proposal with emphasis on federal experience", "Highlight cloud migration expertise", "Develop agency-specific partnerships", "Prepare detailed security compliance documentation"]' as suggested_actions,
    0.87 as confidence_score,
    0.92 as data_quality_score
FROM gov_opportunities o
CROSS JOIN company_profiles c
WHERE o.solicitation_number = 'DTS-2025-IT-001'
  AND c.id = (SELECT id FROM company_profiles LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM gov_opportunity_scores WHERE opportunity_id = o.id AND company_id = c.id)
LIMIT 1;

-- Insert sample scoring factors for the test score
INSERT INTO gov_opportunity_scoring_factors (
    score_id, factor_category, factor_name, factor_description,
    factor_score, factor_weight, evidence, judge_name
)
SELECT 
    s.id as score_id,
    'technical' as factor_category,
    'Cloud Migration Expertise' as factor_name,
    'Assessment of company capability in cloud migration and modernization' as factor_description,
    88.0 as factor_score,
    0.25 as factor_weight,
    '{"relevant_projects": 12, "cloud_certifications": ["AWS Solutions Architect", "Azure Expert"], "team_experience": "5+ years average"}' as evidence,
    'technical_judge' as judge_name
FROM gov_opportunity_scores s
WHERE s.overall_score = 85.5
LIMIT 1;

INSERT INTO gov_opportunity_scoring_factors (
    score_id, factor_category, factor_name, factor_description,
    factor_score, factor_weight, evidence, judge_name
)
SELECT 
    s.id as score_id,
    'domain' as factor_category,
    'NAICS Code Alignment' as factor_name,
    'How well company NAICS codes match opportunity requirements' as factor_description,
    95.0 as factor_score,
    0.20 as factor_weight,
    '{"primary_naics": "541511", "secondary_naics": "541512", "match_quality": "exact", "industry_focus": "IT services"}' as evidence,
    'domain_judge' as judge_name
FROM gov_opportunity_scores s
WHERE s.overall_score = 85.5
LIMIT 1;

INSERT INTO gov_opportunity_scoring_factors (
    score_id, factor_category, factor_name, factor_description,
    factor_score, factor_weight, evidence, judge_name
)
SELECT 
    s.id as score_id,
    'financial' as factor_category,
    'Contract Value Fit' as factor_name,
    'Assessment of contract value relative to company capacity' as factor_description,
    81.0 as factor_score,
    0.20 as factor_weight,
    '{"contract_range": "2-3M", "company_capacity": "5M annual", "utilization_impact": "40-60%", "cash_flow_fit": "good"}' as evidence,
    'value_judge' as judge_name
FROM gov_opportunity_scores s
WHERE s.overall_score = 85.5
LIMIT 1;

INSERT INTO gov_opportunity_scoring_factors (
    score_id, factor_category, factor_name, factor_description,
    factor_score, factor_weight, evidence, judge_name
)
SELECT 
    s.id as score_id,
    'strategic' as factor_category,
    'Federal Experience' as factor_name,
    'Previous experience working with federal agencies and compliance' as factor_description,
    84.0 as factor_score,
    0.15 as factor_weight,
    '{"federal_contracts": 5, "agencies_worked_with": ["DOD", "GSA"], "clearance_holders": 8, "compliance_experience": "strong"}' as evidence,
    'innovation_judge' as judge_name
FROM gov_opportunity_scores s
WHERE s.overall_score = 85.5
LIMIT 1;

INSERT INTO gov_opportunity_scoring_factors (
    score_id, factor_category, factor_name, factor_description,
    factor_score, factor_weight, evidence, judge_name
)
SELECT 
    s.id as score_id,
    'competitive' as factor_category,
    'Market Position' as factor_name,
    'Competitive positioning and relationship advantages' as factor_description,
    72.0 as factor_score,
    0.20 as factor_weight,
    '{"incumbent_advantage": false, "agency_relationships": "developing", "teaming_opportunities": 3, "competitive_differentiators": ["agile methodology", "cloud expertise"]}' as evidence,
    'relationship_judge' as judge_name
FROM gov_opportunity_scores s
WHERE s.overall_score = 85.5
LIMIT 1;