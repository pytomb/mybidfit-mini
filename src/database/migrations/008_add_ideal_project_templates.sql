-- Migration 008: Ideal Project Templates
-- Captures company preferences and ideal project characteristics
-- Enables personalized opportunity matching and improved scoring based on company preferences

-- Ideal project templates (main template definitions)
CREATE TABLE IF NOT EXISTS ideal_project_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template metadata
    template_name VARCHAR(255) NOT NULL, -- User-friendly name for the template
    template_description TEXT, -- Detailed description of the ideal project
    
    -- Template ownership and sharing
    company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
    created_by_user_id UUID, -- Link to user who created template (if user system exists)
    is_active BOOLEAN DEFAULT true, -- Can be deactivated without deletion
    is_primary BOOLEAN DEFAULT false, -- Primary template for this company
    
    -- Template source and generation
    template_source VARCHAR(50) DEFAULT 'manual' CHECK (template_source IN (
        'manual', 'ai_generated', 'learned_from_feedback', 'imported', 'cloned'
    )),
    source_data JSONB DEFAULT '{}', -- Data used to generate template (feedback, winning projects, etc.)
    
    -- Project characteristics preferences
    preferred_naics_codes JSONB DEFAULT '[]', -- Array of preferred NAICS codes
    preferred_psc_codes JSONB DEFAULT '[]', -- Array of preferred Product Service Codes
    preferred_agencies JSONB DEFAULT '[]', -- Array of preferred government agencies
    preferred_set_asides JSONB DEFAULT '[]', -- Array of preferred set-aside types
    
    -- Financial preferences
    min_contract_value DECIMAL(15,2), -- Minimum contract value of interest
    max_contract_value DECIMAL(15,2), -- Maximum contract value company can handle
    preferred_contract_value_range JSONB DEFAULT '{}', -- Detailed value range preferences
    
    -- Capability and technical preferences
    required_capabilities JSONB DEFAULT '[]', -- Must-have capabilities for opportunities
    preferred_capabilities JSONB DEFAULT '[]', -- Nice-to-have capabilities
    excluded_capabilities JSONB DEFAULT '[]', -- Capabilities to avoid
    technical_requirements JSONB DEFAULT '{}', -- Specific technical criteria
    
    -- Geographic preferences
    preferred_locations JSONB DEFAULT '[]', -- Array of preferred work locations
    excluded_locations JSONB DEFAULT '[]', -- Array of locations to avoid
    remote_work_acceptable BOOLEAN DEFAULT true, -- Can work be done remotely
    travel_requirements_acceptable BOOLEAN DEFAULT true, -- Willing to travel for work
    max_travel_percentage INTEGER CHECK (max_travel_percentage >= 0 AND max_travel_percentage <= 100),
    
    -- Timeline and scheduling preferences
    preferred_project_duration_months INTEGER, -- Ideal project length in months
    min_project_duration_months INTEGER, -- Minimum acceptable project length
    max_project_duration_months INTEGER, -- Maximum manageable project length
    preferred_start_timeframes JSONB DEFAULT '[]', -- When company prefers to start
    excluded_timeframes JSONB DEFAULT '[]', -- When company is not available
    
    -- Competition and market preferences
    preferred_competition_level VARCHAR(50) CHECK (preferred_competition_level IN (
        'low', 'medium', 'high', 'any'
    )), -- Preferred level of competition
    incumbent_advantages_acceptable BOOLEAN DEFAULT true, -- Willing to compete against incumbents
    teaming_preferred BOOLEAN DEFAULT false, -- Prefers teaming opportunities
    prime_contractor_preferred BOOLEAN DEFAULT true, -- Prefers to be prime contractor
    
    -- Risk and compliance preferences
    security_clearance_requirements_acceptable BOOLEAN DEFAULT true,
    max_security_clearance_level VARCHAR(50), -- Highest clearance level company can support
    compliance_requirements_acceptable JSONB DEFAULT '[]', -- Array of acceptable compliance requirements
    excluded_compliance_requirements JSONB DEFAULT '[]', -- Array of compliance requirements to avoid
    
    -- Strategic preferences
    strategic_priorities JSONB DEFAULT '[]', -- Array of strategic business priorities
    growth_objectives JSONB DEFAULT '[]', -- How this fits growth plans
    relationship_building_priority INTEGER CHECK (relationship_building_priority >= 1 AND relationship_building_priority <= 5),
    innovation_opportunity_priority INTEGER CHECK (innovation_opportunity_priority >= 1 AND innovation_opportunity_priority <= 5),
    
    -- Learning and AI improvement data
    match_success_rate DECIMAL(5,2) DEFAULT 0.0, -- Success rate of opportunities matching this template
    feedback_integration_count INTEGER DEFAULT 0, -- How many times template was updated based on feedback
    last_feedback_integration_date TIMESTAMP, -- When template was last updated from feedback
    
    -- Template performance metrics
    opportunities_matched INTEGER DEFAULT 0, -- How many opportunities matched this template
    opportunities_pursued INTEGER DEFAULT 0, -- How many matching opportunities were pursued
    proposals_submitted INTEGER DEFAULT 0, -- How many proposals submitted for matching opportunities
    awards_won INTEGER DEFAULT 0, -- How many awards won for matching opportunities
    
    -- Template weighting and priority
    template_weight DECIMAL(3,2) DEFAULT 1.0 CHECK (template_weight >= 0 AND template_weight <= 1), -- Weight in scoring calculations
    priority_level INTEGER DEFAULT 3 CHECK (priority_level >= 1 AND priority_level <= 5), -- Template priority (5 = highest)
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP -- When template was last used for scoring
);

-- Template matching history (tracks how templates are used in scoring)
CREATE TABLE IF NOT EXISTS template_matching_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Links to template, opportunity, and scoring
    template_id UUID NOT NULL REFERENCES ideal_project_templates(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES gov_opportunities(id) ON DELETE CASCADE,
    score_id UUID REFERENCES gov_opportunity_scores(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
    
    -- Match results
    overall_match_percentage DECIMAL(5,2) NOT NULL CHECK (overall_match_percentage >= 0 AND overall_match_percentage <= 100),
    match_category VARCHAR(20) NOT NULL CHECK (match_category IN ('excellent', 'good', 'fair', 'poor', 'no_match')),
    
    -- Detailed match breakdown
    naics_match_score DECIMAL(5,2) CHECK (naics_match_score >= 0 AND naics_match_score <= 100),
    agency_match_score DECIMAL(5,2) CHECK (agency_match_score >= 0 AND agency_match_score <= 100),
    value_match_score DECIMAL(5,2) CHECK (value_match_score >= 0 AND value_match_score <= 100),
    capability_match_score DECIMAL(5,2) CHECK (capability_match_score >= 0 AND capability_match_score <= 100),
    location_match_score DECIMAL(5,2) CHECK (location_match_score >= 0 AND location_match_score <= 100),
    timeline_match_score DECIMAL(5,2) CHECK (timeline_match_score >= 0 AND timeline_match_score <= 100),
    
    -- Match details and explanations
    match_details JSONB DEFAULT '{}', -- Detailed breakdown of what matched and what didn't
    positive_matches JSONB DEFAULT '[]', -- Array of criteria that matched well
    negative_matches JSONB DEFAULT '[]', -- Array of criteria that didn't match
    missing_criteria JSONB DEFAULT '[]', -- Criteria that couldn't be evaluated due to missing data
    
    -- Impact on scoring
    scoring_boost_applied DECIMAL(5,2) DEFAULT 0.0, -- How much template matching boosted the score
    template_weight_used DECIMAL(3,2), -- Template weight used in this matching
    
    -- Outcome tracking
    opportunity_pursued BOOLEAN, -- Was opportunity pursued after template matching
    template_influence_rating INTEGER CHECK (template_influence_rating >= 1 AND template_influence_rating <= 5), -- How much template influenced decision
    
    -- Matching metadata
    matching_algorithm_version VARCHAR(20) DEFAULT '1.0',
    matching_confidence DECIMAL(3,2) DEFAULT 0.80,
    
    -- Timestamps
    matched_at TIMESTAMP DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate matching records
    UNIQUE(template_id, opportunity_id, score_id)
);

-- Template learning analytics (aggregated insights about template effectiveness)
CREATE TABLE IF NOT EXISTS template_learning_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Analysis scope
    template_id UUID NOT NULL REFERENCES ideal_project_templates(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
    
    -- Analysis period
    analysis_period_start DATE NOT NULL,
    analysis_period_end DATE NOT NULL,
    analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN (
        'monthly_performance', 'quarterly_review', 'annual_summary',
        'effectiveness_analysis', 'improvement_opportunities'
    )),
    
    -- Performance metrics
    total_matches INTEGER DEFAULT 0,
    excellent_matches INTEGER DEFAULT 0,
    good_matches INTEGER DEFAULT 0,
    fair_matches INTEGER DEFAULT 0,
    poor_matches INTEGER DEFAULT 0,
    
    -- Conversion metrics
    match_to_pursuit_conversion DECIMAL(5,2) DEFAULT 0.0, -- % of matches that were pursued
    pursuit_to_proposal_conversion DECIMAL(5,2) DEFAULT 0.0, -- % of pursuits that became proposals
    proposal_to_award_conversion DECIMAL(5,2) DEFAULT 0.0, -- % of proposals that won awards
    
    -- Template optimization insights
    most_successful_criteria JSONB DEFAULT '[]', -- Criteria that correlate with wins
    least_successful_criteria JSONB DEFAULT '[]', -- Criteria that correlate with losses
    suggested_adjustments JSONB DEFAULT '[]', -- AI-generated suggestions for improvement
    
    -- Competitive analysis
    template_vs_market_performance DECIMAL(5,2), -- How template performs vs market average
    competitive_advantages JSONB DEFAULT '[]', -- What makes this template successful
    competitive_disadvantages JSONB DEFAULT '[]', -- Where template needs improvement
    
    -- Learning recommendations
    recommended_naics_additions JSONB DEFAULT '[]',
    recommended_naics_removals JSONB DEFAULT '[]',
    recommended_capability_updates JSONB DEFAULT '[]',
    recommended_value_range_adjustments JSONB DEFAULT '{}',
    
    -- Analytics metadata
    confidence_level DECIMAL(3,2) DEFAULT 0.75,
    data_quality_score DECIMAL(3,2) DEFAULT 0.80,
    sample_size_adequate BOOLEAN DEFAULT true,
    
    -- Timestamps
    generated_at TIMESTAMP DEFAULT NOW(),
    last_applied_at TIMESTAMP, -- When recommendations were last applied
    
    -- Unique constraint for analysis periods
    UNIQUE(template_id, analysis_type, analysis_period_start, analysis_period_end)
);

-- Performance indexes for template queries
CREATE INDEX IF NOT EXISTS idx_ideal_project_templates_company_id ON ideal_project_templates (company_id);
CREATE INDEX IF NOT EXISTS idx_ideal_project_templates_active ON ideal_project_templates (is_active);
CREATE INDEX IF NOT EXISTS idx_ideal_project_templates_primary ON ideal_project_templates (company_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_ideal_project_templates_source ON ideal_project_templates (template_source);
CREATE INDEX IF NOT EXISTS idx_ideal_project_templates_priority ON ideal_project_templates (priority_level DESC);
CREATE INDEX IF NOT EXISTS idx_ideal_project_templates_success_rate ON ideal_project_templates (match_success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_ideal_project_templates_created_at ON ideal_project_templates (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ideal_project_templates_last_used ON ideal_project_templates (last_used_at DESC);

-- Value range indexes for financial filtering
CREATE INDEX IF NOT EXISTS idx_ideal_project_templates_value_range ON ideal_project_templates (min_contract_value, max_contract_value);

-- JSONB indexes for efficient searching
CREATE INDEX IF NOT EXISTS idx_ideal_project_templates_naics ON ideal_project_templates USING GIN (preferred_naics_codes);
CREATE INDEX IF NOT EXISTS idx_ideal_project_templates_psc ON ideal_project_templates USING GIN (preferred_psc_codes);
CREATE INDEX IF NOT EXISTS idx_ideal_project_templates_agencies ON ideal_project_templates USING GIN (preferred_agencies);
CREATE INDEX IF NOT EXISTS idx_ideal_project_templates_capabilities ON ideal_project_templates USING GIN (required_capabilities);
CREATE INDEX IF NOT EXISTS idx_ideal_project_templates_locations ON ideal_project_templates USING GIN (preferred_locations);
CREATE INDEX IF NOT EXISTS idx_ideal_project_templates_priorities ON ideal_project_templates USING GIN (strategic_priorities);

-- Template matching history indexes
CREATE INDEX IF NOT EXISTS idx_template_matching_history_template_id ON template_matching_history (template_id);
CREATE INDEX IF NOT EXISTS idx_template_matching_history_opportunity_id ON template_matching_history (opportunity_id);
CREATE INDEX IF NOT EXISTS idx_template_matching_history_company_id ON template_matching_history (company_id);
CREATE INDEX IF NOT EXISTS idx_template_matching_history_score_id ON template_matching_history (score_id);
CREATE INDEX IF NOT EXISTS idx_template_matching_history_match_percentage ON template_matching_history (overall_match_percentage DESC);
CREATE INDEX IF NOT EXISTS idx_template_matching_history_category ON template_matching_history (match_category);
CREATE INDEX IF NOT EXISTS idx_template_matching_history_matched_at ON template_matching_history (matched_at DESC);
CREATE INDEX IF NOT EXISTS idx_template_matching_history_pursued ON template_matching_history (opportunity_pursued);

-- Template learning analytics indexes
CREATE INDEX IF NOT EXISTS idx_template_learning_analytics_template_id ON template_learning_analytics (template_id);
CREATE INDEX IF NOT EXISTS idx_template_learning_analytics_company_id ON template_learning_analytics (company_id);
CREATE INDEX IF NOT EXISTS idx_template_learning_analytics_period ON template_learning_analytics (analysis_period_start, analysis_period_end);
CREATE INDEX IF NOT EXISTS idx_template_learning_analytics_type ON template_learning_analytics (analysis_type);
CREATE INDEX IF NOT EXISTS idx_template_learning_analytics_generated_at ON template_learning_analytics (generated_at DESC);

-- Full-text search index for template content
CREATE INDEX IF NOT EXISTS idx_ideal_project_templates_search ON ideal_project_templates 
USING GIN (to_tsvector('english', 
    coalesce(template_name, '') || ' ' || 
    coalesce(template_description, '')
));

-- Comments for documentation
COMMENT ON TABLE ideal_project_templates IS 'Company-specific ideal project templates for personalized opportunity matching and scoring';
COMMENT ON COLUMN ideal_project_templates.template_source IS 'How the template was created: manual user input, AI generation, learned from feedback, etc.';
COMMENT ON COLUMN ideal_project_templates.source_data IS 'Data used to generate or update the template (feedback, winning projects, etc.)';
COMMENT ON COLUMN ideal_project_templates.match_success_rate IS 'Historical success rate of opportunities that match this template';
COMMENT ON COLUMN ideal_project_templates.template_weight IS 'Weight of this template in scoring calculations (0-1)';

COMMENT ON TABLE template_matching_history IS 'Historical record of how templates were used to match and score opportunities';
COMMENT ON COLUMN template_matching_history.overall_match_percentage IS 'Overall percentage match between template and opportunity';
COMMENT ON COLUMN template_matching_history.scoring_boost_applied IS 'How much the template matching boosted the overall opportunity score';

COMMENT ON TABLE template_learning_analytics IS 'Aggregated analytics and insights about template effectiveness and optimization opportunities';
COMMENT ON COLUMN template_learning_analytics.match_to_pursuit_conversion IS 'Conversion rate from template matches to actual opportunity pursuit';

-- Add updated_at trigger for main templates table
CREATE OR REPLACE FUNCTION update_ideal_project_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ideal_project_templates_updated_at
    BEFORE UPDATE ON ideal_project_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_ideal_project_templates_updated_at();

-- Insert sample ideal project template for testing
INSERT INTO ideal_project_templates (
    template_name, template_description, company_id, is_primary,
    template_source, preferred_naics_codes, preferred_agencies,
    min_contract_value, max_contract_value, required_capabilities,
    preferred_capabilities, preferred_locations, remote_work_acceptable,
    preferred_project_duration_months, preferred_competition_level,
    security_clearance_requirements_acceptable, strategic_priorities,
    relationship_building_priority, innovation_opportunity_priority,
    template_weight, priority_level
)
SELECT 
    'Federal IT Modernization Projects' as template_name,
    'Ideal projects focus on cloud migration, infrastructure modernization, and system integration for federal agencies. Prefer projects with clear technical requirements and established relationships.' as template_description,
    c.id as company_id,
    true as is_primary,
    'manual' as template_source,
    '["541511", "541512", "541519"]' as preferred_naics_codes,
    '["Department of Technology Services", "General Services Administration", "Department of Veterans Affairs"]' as preferred_agencies,
    1000000.00 as min_contract_value,
    5000000.00 as max_contract_value,
    '["Cloud Migration", "System Integration", "Infrastructure Modernization", "Security Compliance"]' as required_capabilities,
    '["DevOps", "Agile Development", "Data Analytics", "AI/ML Integration"]' as preferred_capabilities,
    '["Washington DC", "Virginia", "Maryland", "Remote"]' as preferred_locations,
    true as remote_work_acceptable,
    18 as preferred_project_duration_months,
    'medium' as preferred_competition_level,
    true as security_clearance_requirements_acceptable,
    '["Federal Market Growth", "Technical Innovation", "Long-term Partnerships"]' as strategic_priorities,
    4 as relationship_building_priority,
    4 as innovation_opportunity_priority,
    0.9 as template_weight,
    4 as priority_level
FROM company_profiles c
LIMIT 1;

-- Insert sample template matching history
INSERT INTO template_matching_history (
    template_id, opportunity_id, company_id, score_id,
    overall_match_percentage, match_category,
    naics_match_score, agency_match_score, value_match_score,
    capability_match_score, location_match_score, timeline_match_score,
    match_details, positive_matches, negative_matches,
    scoring_boost_applied, template_weight_used,
    opportunity_pursued, template_influence_rating
)
SELECT 
    t.id as template_id,
    o.id as opportunity_id,
    t.company_id,
    s.id as score_id,
    89.5 as overall_match_percentage,
    'excellent' as match_category,
    95.0 as naics_match_score,
    100.0 as agency_match_score,
    85.0 as value_match_score,
    92.0 as capability_match_score,
    80.0 as location_match_score,
    75.0 as timeline_match_score,
    '{
        "naics_alignment": "Perfect match on 541511",
        "agency_preference": "DTS is preferred agency",
        "value_fit": "Contract value within ideal range",
        "capability_alignment": "All required capabilities match"
    }' as match_details,
    '["NAICS Code Match", "Preferred Agency", "Cloud Migration Focus", "Federal Experience Required"]' as positive_matches,
    '["Timeline slightly longer than preferred", "Location not explicitly preferred"]' as negative_matches,
    3.5 as scoring_boost_applied,
    0.9 as template_weight_used,
    true as opportunity_pursued,
    5 as template_influence_rating
FROM ideal_project_templates t
CROSS JOIN gov_opportunities o
CROSS JOIN gov_opportunity_scores s
WHERE t.template_name = 'Federal IT Modernization Projects'
  AND o.solicitation_number = 'DTS-2025-IT-001'
  AND s.opportunity_id = o.id
LIMIT 1;

-- Insert sample learning analytics
INSERT INTO template_learning_analytics (
    template_id, company_id, analysis_period_start, analysis_period_end,
    analysis_type, total_matches, excellent_matches, good_matches,
    match_to_pursuit_conversion, pursuit_to_proposal_conversion,
    most_successful_criteria, suggested_adjustments,
    recommended_capability_updates, confidence_level
)
SELECT 
    t.id as template_id,
    t.company_id,
    CURRENT_DATE - INTERVAL '90 days' as analysis_period_start,
    CURRENT_DATE as analysis_period_end,
    'quarterly_review' as analysis_type,
    8 as total_matches,
    3 as excellent_matches,
    4 as good_matches,
    75.0 as match_to_pursuit_conversion,
    80.0 as pursuit_to_proposal_conversion,
    '["NAICS 541511 alignment", "Federal agency preference", "Cloud migration capabilities"]' as most_successful_criteria,
    '["Expand acceptable timeline range", "Add more geographic flexibility", "Consider smaller contract values"]' as suggested_adjustments,
    '["Add DevSecOps to required capabilities", "Consider AI/ML as required for competitive advantage"]' as recommended_capability_updates,
    0.82 as confidence_level
FROM ideal_project_templates t
WHERE t.template_name = 'Federal IT Modernization Projects'
LIMIT 1;