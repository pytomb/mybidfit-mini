-- Migration 007: Opportunity Feedback System
-- Captures user feedback on opportunities, scoring accuracy, and system recommendations
-- Enables continuous learning and improvement of the Panel of Judges scoring algorithms

-- Government opportunity feedback table (main feedback collection)
CREATE TABLE IF NOT EXISTS gov_opportunity_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to opportunity, company, and scoring
    opportunity_id UUID NOT NULL REFERENCES gov_opportunities(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
    score_id UUID REFERENCES gov_opportunity_scores(id) ON DELETE SET NULL, -- Optional link to specific score
    
    -- Feedback provider
    user_id UUID, -- Link to user who provided feedback (if user system exists)
    feedback_source VARCHAR(50) DEFAULT 'user_interface', -- 'user_interface', 'api', 'bulk_import', 'system_inference'
    
    -- Feedback metadata
    feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN (
        'opportunity_relevance', 'scoring_accuracy', 'recommendation_quality',
        'missing_information', 'system_suggestion', 'outcome_reporting'
    )),
    feedback_category VARCHAR(50) NOT NULL CHECK (feedback_category IN (
        'positive', 'negative', 'suggestion', 'correction', 'outcome', 'neutral'
    )),
    
    -- Core feedback content
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5), -- 1-5 star rating
    feedback_text TEXT, -- Free-form feedback text
    feedback_structured JSONB DEFAULT '{}', -- Structured feedback data
    
    -- Specific feedback areas
    scoring_accuracy_rating INTEGER CHECK (scoring_accuracy_rating >= 1 AND scoring_accuracy_rating <= 5),
    recommendation_helpfulness INTEGER CHECK (recommendation_helpfulness >= 1 AND recommendation_helpfulness <= 5),
    opportunity_relevance_rating INTEGER CHECK (opportunity_relevance_rating >= 1 AND opportunity_relevance_rating <= 5),
    
    -- Judge-specific feedback
    technical_judge_feedback JSONB DEFAULT '{}',
    domain_judge_feedback JSONB DEFAULT '{}',
    value_judge_feedback JSONB DEFAULT '{}',
    innovation_judge_feedback JSONB DEFAULT '{}',
    relationship_judge_feedback JSONB DEFAULT '{}',
    
    -- Outcome and results tracking
    opportunity_pursued BOOLEAN, -- Did company pursue this opportunity
    proposal_submitted BOOLEAN, -- Was a proposal submitted
    award_received BOOLEAN, -- Was the contract awarded to this company
    actual_outcome JSONB DEFAULT '{}', -- Detailed outcome information
    
    -- Improvement suggestions
    suggested_score_adjustment DECIMAL(5,2), -- What score would user give
    suggested_recommendation VARCHAR(50), -- What recommendation would user give
    missing_factors JSONB DEFAULT '[]', -- Factors the system missed
    incorrect_factors JSONB DEFAULT '[]', -- Factors the system got wrong
    
    -- Processing and response
    feedback_status VARCHAR(50) DEFAULT 'new' CHECK (feedback_status IN (
        'new', 'reviewing', 'processed', 'integrated', 'rejected', 'requires_followup'
    )),
    system_response TEXT, -- System's response or actions taken
    processed_at TIMESTAMP, -- When feedback was processed
    processed_by VARCHAR(100), -- Who or what processed the feedback
    
    -- Metadata and tracking
    confidence_in_feedback INTEGER CHECK (confidence_in_feedback >= 1 AND confidence_in_feedback <= 5),
    feedback_context JSONB DEFAULT '{}', -- Context about when/why feedback was provided
    related_feedback_ids JSONB DEFAULT '[]', -- Array of related feedback IDs
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Feedback impact tracking (tracks how feedback affects scoring improvements)
CREATE TABLE IF NOT EXISTS feedback_impact_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to original feedback
    feedback_id UUID NOT NULL REFERENCES gov_opportunity_feedback(id) ON DELETE CASCADE,
    
    -- Impact details
    impact_type VARCHAR(50) NOT NULL CHECK (impact_type IN (
        'algorithm_adjustment', 'weight_modification', 'factor_addition', 
        'factor_removal', 'training_data_update', 'judge_logic_improvement'
    )),
    impact_description TEXT NOT NULL,
    
    -- Before/after tracking
    before_state JSONB DEFAULT '{}', -- State before the change
    after_state JSONB DEFAULT '{}', -- State after the change
    
    -- Impact measurement
    affected_scores_count INTEGER DEFAULT 0, -- How many scores were affected
    impact_severity VARCHAR(20) DEFAULT 'minor' CHECK (impact_severity IN ('minor', 'moderate', 'major', 'critical')),
    
    -- Implementation details
    implemented_at TIMESTAMP DEFAULT NOW(),
    implemented_by VARCHAR(100),
    rollback_possible BOOLEAN DEFAULT true,
    rollback_instructions TEXT,
    
    -- Results tracking
    improvement_measured BOOLEAN DEFAULT false,
    improvement_metrics JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

-- Feedback analytics and patterns (aggregated insights from feedback)
CREATE TABLE IF NOT EXISTS feedback_analytics_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Analysis period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN (
        'weekly_summary', 'monthly_summary', 'quarterly_summary',
        'judge_performance', 'feedback_trends', 'improvement_opportunities'
    )),
    
    -- Aggregate metrics
    total_feedback_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    positive_feedback_percentage DECIMAL(5,2),
    negative_feedback_percentage DECIMAL(5,2),
    
    -- Judge performance metrics
    judge_accuracy_scores JSONB DEFAULT '{}', -- Accuracy by judge
    most_criticized_judge VARCHAR(50),
    best_performing_judge VARCHAR(50),
    
    -- Common feedback themes
    common_complaints JSONB DEFAULT '[]', -- Most common negative themes
    common_suggestions JSONB DEFAULT '[]', -- Most common improvement suggestions
    missing_factor_patterns JSONB DEFAULT '[]', -- Frequently missing factors
    
    -- Opportunity patterns
    most_problematic_opportunity_types JSONB DEFAULT '[]',
    highest_rated_opportunity_types JSONB DEFAULT '[]',
    
    -- Improvement tracking
    implemented_improvements INTEGER DEFAULT 0,
    pending_improvements INTEGER DEFAULT 0,
    measured_improvements JSONB DEFAULT '{}',
    
    -- Analysis metadata
    generated_at TIMESTAMP DEFAULT NOW(),
    generated_by VARCHAR(100) DEFAULT 'system',
    confidence_level DECIMAL(3,2) DEFAULT 0.80,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Unique constraint for analysis periods
    UNIQUE(analysis_type, period_start, period_end)
);

-- Performance indexes for feedback queries
CREATE INDEX IF NOT EXISTS idx_gov_opp_feedback_opportunity_id ON gov_opportunity_feedback (opportunity_id);
CREATE INDEX IF NOT EXISTS idx_gov_opp_feedback_company_id ON gov_opportunity_feedback (company_id);
CREATE INDEX IF NOT EXISTS idx_gov_opp_feedback_score_id ON gov_opportunity_feedback (score_id);
CREATE INDEX IF NOT EXISTS idx_gov_opp_feedback_type ON gov_opportunity_feedback (feedback_type);
CREATE INDEX IF NOT EXISTS idx_gov_opp_feedback_category ON gov_opportunity_feedback (feedback_category);
CREATE INDEX IF NOT EXISTS idx_gov_opp_feedback_status ON gov_opportunity_feedback (feedback_status);
CREATE INDEX IF NOT EXISTS idx_gov_opp_feedback_rating ON gov_opportunity_feedback (feedback_rating);
CREATE INDEX IF NOT EXISTS idx_gov_opp_feedback_created_at ON gov_opportunity_feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gov_opp_feedback_source ON gov_opportunity_feedback (feedback_source);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_gov_opp_feedback_opp_company ON gov_opportunity_feedback (opportunity_id, company_id);
CREATE INDEX IF NOT EXISTS idx_gov_opp_feedback_status_created ON gov_opportunity_feedback (feedback_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gov_opp_feedback_type_rating ON gov_opportunity_feedback (feedback_type, feedback_rating);
CREATE INDEX IF NOT EXISTS idx_gov_opp_feedback_outcome_tracking ON gov_opportunity_feedback (opportunity_pursued, proposal_submitted, award_received);

-- JSONB indexes for efficient searching
CREATE INDEX IF NOT EXISTS idx_gov_opp_feedback_structured ON gov_opportunity_feedback USING GIN (feedback_structured);
CREATE INDEX IF NOT EXISTS idx_gov_opp_feedback_technical_judge ON gov_opportunity_feedback USING GIN (technical_judge_feedback);
CREATE INDEX IF NOT EXISTS idx_gov_opp_feedback_domain_judge ON gov_opportunity_feedback USING GIN (domain_judge_feedback);
CREATE INDEX IF NOT EXISTS idx_gov_opp_feedback_missing_factors ON gov_opportunity_feedback USING GIN (missing_factors);
CREATE INDEX IF NOT EXISTS idx_gov_opp_feedback_context ON gov_opportunity_feedback USING GIN (feedback_context);

-- Impact tracking indexes
CREATE INDEX IF NOT EXISTS idx_feedback_impact_feedback_id ON feedback_impact_tracking (feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_impact_type ON feedback_impact_tracking (impact_type);
CREATE INDEX IF NOT EXISTS idx_feedback_impact_severity ON feedback_impact_tracking (impact_severity);
CREATE INDEX IF NOT EXISTS idx_feedback_impact_implemented_at ON feedback_impact_tracking (implemented_at DESC);

-- Analytics summary indexes
CREATE INDEX IF NOT EXISTS idx_feedback_analytics_period ON feedback_analytics_summary (period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_feedback_analytics_type ON feedback_analytics_summary (analysis_type);
CREATE INDEX IF NOT EXISTS idx_feedback_analytics_generated_at ON feedback_analytics_summary (generated_at DESC);

-- Full-text search index for feedback content
CREATE INDEX IF NOT EXISTS idx_gov_opp_feedback_search ON gov_opportunity_feedback 
USING GIN (to_tsvector('english', 
    coalesce(feedback_text, '') || ' ' || 
    coalesce(system_response, '')
));

-- Comments for documentation
COMMENT ON TABLE gov_opportunity_feedback IS 'User feedback on government opportunities, scoring accuracy, and system recommendations for continuous improvement';
COMMENT ON COLUMN gov_opportunity_feedback.feedback_structured IS 'Structured feedback data in JSON format for programmatic analysis';
COMMENT ON COLUMN gov_opportunity_feedback.technical_judge_feedback IS 'Specific feedback about technical judge performance and accuracy';
COMMENT ON COLUMN gov_opportunity_feedback.actual_outcome IS 'Detailed information about what actually happened with this opportunity';
COMMENT ON COLUMN gov_opportunity_feedback.missing_factors IS 'Array of factors the scoring system failed to consider';
COMMENT ON COLUMN gov_opportunity_feedback.incorrect_factors IS 'Array of factors the scoring system evaluated incorrectly';

COMMENT ON TABLE feedback_impact_tracking IS 'Tracks how user feedback leads to improvements in the scoring algorithms and system performance';
COMMENT ON COLUMN feedback_impact_tracking.before_state IS 'Snapshot of system state before implementing feedback-driven changes';
COMMENT ON COLUMN feedback_impact_tracking.after_state IS 'Snapshot of system state after implementing feedback-driven changes';

COMMENT ON TABLE feedback_analytics_summary IS 'Aggregated analytics and insights derived from user feedback patterns and trends';
COMMENT ON COLUMN feedback_analytics_summary.judge_accuracy_scores IS 'Performance metrics for each judge based on user feedback';
COMMENT ON COLUMN feedback_analytics_summary.common_complaints IS 'Most frequently mentioned issues and problems';

-- Add updated_at trigger for main feedback table
CREATE OR REPLACE FUNCTION update_gov_opportunity_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gov_opportunity_feedback_updated_at
    BEFORE UPDATE ON gov_opportunity_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_gov_opportunity_feedback_updated_at();

-- Insert sample feedback data for testing (builds on existing sample opportunities and scores)
INSERT INTO gov_opportunity_feedback (
    opportunity_id, company_id, score_id, feedback_type, feedback_category,
    feedback_rating, feedback_text, scoring_accuracy_rating, 
    recommendation_helpfulness, opportunity_relevance_rating,
    feedback_structured, technical_judge_feedback, domain_judge_feedback,
    opportunity_pursued, proposal_submitted, suggested_score_adjustment,
    confidence_in_feedback, feedback_context
)
SELECT 
    s.opportunity_id,
    s.company_id,
    s.id as score_id,
    'scoring_accuracy' as feedback_type,
    'positive' as feedback_category,
    4 as feedback_rating,
    'The scoring was quite accurate overall. Technical assessment was spot on, but the relationship score seemed a bit low given our emerging partnerships with federal agencies.' as feedback_text,
    4 as scoring_accuracy_rating,
    5 as recommendation_helpfulness,
    5 as opportunity_relevance_rating,
    '{
        "specific_feedback": "Technical judge scored appropriately, relationship judge may have incomplete data",
        "areas_of_agreement": ["Technical capabilities", "NAICS alignment", "Contract value fit"],
        "areas_of_disagreement": ["Relationship strength", "Competitive positioning"]
    }' as feedback_structured,
    '{"accuracy": "high", "comment": "Excellent assessment of our cloud migration capabilities"}' as technical_judge_feedback,
    '{"accuracy": "high", "comment": "Perfect match on NAICS codes and domain expertise"}' as domain_judge_feedback,
    true as opportunity_pursued,
    true as proposal_submitted,
    87.0 as suggested_score_adjustment,
    4 as confidence_in_feedback,
    '{
        "feedback_trigger": "after_proposal_submission",
        "user_role": "business_development",
        "time_since_scoring": "3_days",
        "additional_context": "User had recent federal agency meetings not reflected in system data"
    }' as feedback_context
FROM gov_opportunity_scores s
WHERE s.overall_score = 85.5
LIMIT 1;

-- Insert a sample feedback analytics summary
INSERT INTO feedback_analytics_summary (
    period_start, period_end, analysis_type,
    total_feedback_count, average_rating, positive_feedback_percentage,
    negative_feedback_percentage, judge_accuracy_scores,
    most_criticized_judge, best_performing_judge,
    common_suggestions, implemented_improvements, confidence_level
) VALUES (
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE,
    'weekly_summary',
    12,
    4.2,
    75.0,
    16.7,
    '{
        "technical_judge": 4.3,
        "domain_judge": 4.6,
        "value_judge": 4.1,
        "innovation_judge": 3.9,
        "relationship_judge": 3.7
    }',
    'relationship_judge',
    'domain_judge',
    '[
        "Improve relationship data collection",
        "Add more competitive intelligence",
        "Consider regional market factors",
        "Include past performance weighting"
    ]',
    2,
    0.85
);

-- Insert sample impact tracking record
INSERT INTO feedback_impact_tracking (
    feedback_id, impact_type, impact_description,
    before_state, after_state, affected_scores_count,
    impact_severity, implemented_by, improvement_measured,
    improvement_metrics
)
SELECT 
    f.id as feedback_id,
    'weight_modification' as impact_type,
    'Increased weight of relationship judge based on user feedback about incomplete agency relationship data' as impact_description,
    '{"relationship_judge_weight": 0.15, "relationship_data_sources": ["crm", "public_records"]}' as before_state,
    '{"relationship_judge_weight": 0.20, "relationship_data_sources": ["crm", "public_records", "user_input", "meeting_logs"]}' as after_state,
    5 as affected_scores_count,
    'moderate' as impact_severity,
    'scoring_algorithm_v1.1' as implemented_by,
    true as improvement_measured,
    '{"accuracy_improvement": 0.08, "user_satisfaction_increase": 0.15, "false_positive_reduction": 0.12}' as improvement_metrics
FROM gov_opportunity_feedback f
WHERE f.feedback_text LIKE '%relationship score%'
LIMIT 1;