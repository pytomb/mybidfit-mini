-- Migration 009: Opportunity Watchlists and Alerts
-- Enables companies to create watchlists for tracking government opportunities
-- Supports automated alerts, deadline reminders, and opportunity status monitoring

-- Opportunity watchlists (main watchlist definitions)
CREATE TABLE IF NOT EXISTS opportunity_watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Watchlist metadata
    watchlist_name VARCHAR(255) NOT NULL, -- User-friendly name for the watchlist
    watchlist_description TEXT, -- Detailed description of watchlist purpose
    
    -- Ownership and permissions
    company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
    created_by_user_id UUID, -- User who created the watchlist
    is_active BOOLEAN DEFAULT true, -- Can be deactivated without deletion
    is_shared BOOLEAN DEFAULT false, -- Can other company users access this watchlist
    
    -- Watchlist configuration
    watchlist_type VARCHAR(50) DEFAULT 'manual' CHECK (watchlist_type IN (
        'manual', 'smart_filter', 'ai_curated', 'template_based', 'competitive_intelligence'
    )),
    auto_add_criteria JSONB DEFAULT '{}', -- Criteria for automatically adding opportunities
    max_opportunities INTEGER DEFAULT 100, -- Maximum opportunities in this watchlist
    
    -- Alert and notification settings
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    dashboard_notifications BOOLEAN DEFAULT true,
    slack_notifications BOOLEAN DEFAULT false,
    notification_frequency VARCHAR(20) DEFAULT 'real_time' CHECK (notification_frequency IN (
        'real_time', 'daily', 'weekly', 'bi_weekly', 'monthly', 'disabled'
    )),
    
    -- Alert trigger settings
    alert_on_new_opportunities BOOLEAN DEFAULT true,
    alert_on_deadline_approaching BOOLEAN DEFAULT true,
    alert_on_status_changes BOOLEAN DEFAULT true,
    alert_on_scoring_changes BOOLEAN DEFAULT true,
    alert_on_competitive_changes BOOLEAN DEFAULT false,
    deadline_alert_days_before INTEGER DEFAULT 7, -- Alert X days before deadline
    
    -- Watchlist performance metrics
    opportunities_count INTEGER DEFAULT 0, -- Current number of opportunities
    opportunities_pursued INTEGER DEFAULT 0, -- Opportunities that were pursued
    proposals_submitted INTEGER DEFAULT 0, -- Proposals submitted from this watchlist
    awards_won INTEGER DEFAULT 0, -- Awards won from watchlist opportunities
    
    -- Smart filtering and AI settings
    smart_filter_config JSONB DEFAULT '{}', -- Configuration for smart filtering
    ai_curation_enabled BOOLEAN DEFAULT false, -- Use AI to curate opportunities
    ai_curation_criteria JSONB DEFAULT '{}', -- AI curation parameters
    learning_from_interactions BOOLEAN DEFAULT true, -- Learn from user interactions
    
    -- Display and sorting preferences
    default_sort_order VARCHAR(50) DEFAULT 'due_date_asc' CHECK (default_sort_order IN (
        'due_date_asc', 'due_date_desc', 'score_desc', 'score_asc', 
        'value_desc', 'value_asc', 'created_desc', 'created_asc'
    )),
    display_preferences JSONB DEFAULT '{}', -- UI display configuration
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_accessed_at TIMESTAMP DEFAULT NOW() -- When watchlist was last viewed
);

-- Watchlist items (opportunities in watchlists)
CREATE TABLE IF NOT EXISTS watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Links to watchlist and opportunity
    watchlist_id UUID NOT NULL REFERENCES opportunity_watchlists(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES gov_opportunities(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
    
    -- Item metadata
    added_by_user_id UUID, -- User who added this opportunity to watchlist
    added_method VARCHAR(50) DEFAULT 'manual' CHECK (added_method IN (
        'manual', 'smart_filter', 'ai_recommendation', 'bulk_import', 'template_match'
    )),
    
    -- Item status and tracking
    item_status VARCHAR(50) DEFAULT 'watching' CHECK (item_status IN (
        'watching', 'evaluating', 'pursuing', 'proposal_prepared', 
        'proposal_submitted', 'won', 'lost', 'withdrawn', 'archived'
    )),
    priority_level INTEGER DEFAULT 3 CHECK (priority_level >= 1 AND priority_level <= 5),
    
    -- User annotations and notes
    user_notes TEXT, -- Free-form notes about this opportunity
    custom_tags JSONB DEFAULT '[]', -- Array of custom tags
    custom_rating INTEGER CHECK (custom_rating >= 1 AND custom_rating <= 5), -- User's personal rating
    
    -- Decision tracking
    decision_status VARCHAR(50) CHECK (decision_status IN (
        'undecided', 'go', 'no_go', 'maybe', 'need_more_info'
    )),
    decision_reason TEXT, -- Why this decision was made
    decision_date TIMESTAMP, -- When decision was made
    decision_by_user_id UUID, -- Who made the decision
    
    -- Collaboration and team features
    assigned_to_user_id UUID, -- User responsible for this opportunity
    team_members JSONB DEFAULT '[]', -- Array of team member IDs working on this
    collaboration_notes JSONB DEFAULT '[]', -- Array of team collaboration notes
    
    -- Alert and reminder settings (item-specific overrides)
    custom_alert_settings JSONB DEFAULT '{}', -- Override watchlist alert settings
    reminder_date TIMESTAMP, -- Custom reminder date
    reminder_notes TEXT, -- Notes for the reminder
    
    -- Performance tracking
    time_in_watchlist INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (COALESCE(updated_at, NOW()) - created_at)) / 86400
    ) STORED, -- Days in watchlist
    view_count INTEGER DEFAULT 0, -- How many times this item was viewed
    last_viewed_at TIMESTAMP, -- When item was last viewed
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicates
    UNIQUE(watchlist_id, opportunity_id)
);

-- Watchlist alerts (generated alerts and notifications)
CREATE TABLE IF NOT EXISTS watchlist_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Alert context
    watchlist_id UUID NOT NULL REFERENCES opportunity_watchlists(id) ON DELETE CASCADE,
    watchlist_item_id UUID REFERENCES watchlist_items(id) ON DELETE CASCADE, -- Optional specific item
    opportunity_id UUID NOT NULL REFERENCES gov_opportunities(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
    
    -- Alert details
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'deadline_approaching', 'opportunity_closing', 'status_change', 
        'scoring_change', 'new_opportunity', 'competitive_update',
        'document_update', 'amendment_posted', 'qa_period_ending'
    )),
    alert_priority VARCHAR(20) DEFAULT 'medium' CHECK (alert_priority IN ('low', 'medium', 'high', 'critical')),
    alert_title VARCHAR(255) NOT NULL,
    alert_message TEXT NOT NULL,
    alert_data JSONB DEFAULT '{}', -- Structured alert data
    
    -- Delivery tracking
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN (
        'pending', 'sent', 'delivered', 'read', 'dismissed', 'failed'
    )),
    delivery_method VARCHAR(50) DEFAULT 'dashboard' CHECK (delivery_method IN (
        'dashboard', 'email', 'slack', 'sms', 'webhook', 'in_app'
    )),
    delivery_attempts INTEGER DEFAULT 0,
    last_delivery_attempt TIMESTAMP,
    delivery_error_message TEXT,
    
    -- User interaction
    read_at TIMESTAMP, -- When alert was read
    dismissed_at TIMESTAMP, -- When alert was dismissed
    acted_upon_at TIMESTAMP, -- When user took action based on alert
    action_taken VARCHAR(100), -- What action was taken
    
    -- Alert scheduling
    scheduled_for TIMESTAMP DEFAULT NOW(), -- When alert should be sent
    expires_at TIMESTAMP, -- When alert expires and should be cleaned up
    
    -- Alert effectiveness tracking
    click_through_rate DECIMAL(5,2), -- For email/notification alerts
    user_engagement_score INTEGER CHECK (user_engagement_score >= 1 AND user_engagement_score <= 5),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Watchlist analytics (performance and usage analytics)
CREATE TABLE IF NOT EXISTS watchlist_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Analytics scope
    watchlist_id UUID NOT NULL REFERENCES opportunity_watchlists(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
    
    -- Analysis period
    analysis_period_start DATE NOT NULL,
    analysis_period_end DATE NOT NULL,
    analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN (
        'weekly_summary', 'monthly_summary', 'quarterly_review',
        'performance_analysis', 'effectiveness_report'
    )),
    
    -- Watchlist activity metrics
    opportunities_added INTEGER DEFAULT 0,
    opportunities_removed INTEGER DEFAULT 0,
    total_opportunities_tracked INTEGER DEFAULT 0,
    average_time_in_watchlist DECIMAL(8,2) DEFAULT 0.0, -- Average days
    
    -- Engagement metrics
    total_views INTEGER DEFAULT 0,
    unique_viewers INTEGER DEFAULT 0,
    average_views_per_opportunity DECIMAL(8,2) DEFAULT 0.0,
    most_viewed_opportunity_id UUID,
    
    -- Decision metrics
    go_decisions INTEGER DEFAULT 0,
    no_go_decisions INTEGER DEFAULT 0,
    undecided_count INTEGER DEFAULT 0,
    decision_speed_average_days DECIMAL(8,2) DEFAULT 0.0,
    
    -- Performance metrics
    opportunities_pursued INTEGER DEFAULT 0,
    proposals_submitted INTEGER DEFAULT 0,
    awards_won INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- Alert effectiveness
    alerts_generated INTEGER DEFAULT 0,
    alerts_read INTEGER DEFAULT 0,
    alerts_acted_upon INTEGER DEFAULT 0,
    alert_effectiveness_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- ROI and value metrics
    total_opportunity_value DECIMAL(15,2) DEFAULT 0.0,
    pursued_opportunity_value DECIMAL(15,2) DEFAULT 0.0,
    won_opportunity_value DECIMAL(15,2) DEFAULT 0.0,
    
    -- Smart filtering effectiveness (if enabled)
    smart_filter_precision DECIMAL(5,2), -- % of auto-added opps that were kept
    smart_filter_recall DECIMAL(5,2), -- % of manually added opps that filter would catch
    ai_recommendation_acceptance_rate DECIMAL(5,2),
    
    -- Top performers and insights
    most_successful_opportunity_types JSONB DEFAULT '[]',
    most_successful_agencies JSONB DEFAULT '[]',
    optimal_watchlist_size INTEGER,
    recommended_improvements JSONB DEFAULT '[]',
    
    -- Analytics metadata
    data_quality_score DECIMAL(3,2) DEFAULT 0.85,
    confidence_level DECIMAL(3,2) DEFAULT 0.80,
    
    -- Timestamps
    generated_at TIMESTAMP DEFAULT NOW(),
    
    -- Unique constraint for analysis periods
    UNIQUE(watchlist_id, analysis_type, analysis_period_start, analysis_period_end)
);

-- Performance indexes for watchlist queries
CREATE INDEX IF NOT EXISTS idx_opportunity_watchlists_company_id ON opportunity_watchlists (company_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_watchlists_active ON opportunity_watchlists (is_active);
CREATE INDEX IF NOT EXISTS idx_opportunity_watchlists_type ON opportunity_watchlists (watchlist_type);
CREATE INDEX IF NOT EXISTS idx_opportunity_watchlists_created_at ON opportunity_watchlists (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunity_watchlists_last_accessed ON opportunity_watchlists (last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunity_watchlists_notifications ON opportunity_watchlists (notifications_enabled, notification_frequency);

-- Watchlist items indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_items_watchlist_id ON watchlist_items (watchlist_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_opportunity_id ON watchlist_items (opportunity_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_company_id ON watchlist_items (company_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_status ON watchlist_items (item_status);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_priority ON watchlist_items (priority_level DESC);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_decision_status ON watchlist_items (decision_status);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_assigned_to ON watchlist_items (assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_created_at ON watchlist_items (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_last_viewed ON watchlist_items (last_viewed_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_watchlist_items_watchlist_status ON watchlist_items (watchlist_id, item_status);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_company_priority ON watchlist_items (company_id, priority_level DESC);

-- Alert indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_alerts_watchlist_id ON watchlist_alerts (watchlist_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_alerts_opportunity_id ON watchlist_alerts (opportunity_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_alerts_company_id ON watchlist_alerts (company_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_alerts_type ON watchlist_alerts (alert_type);
CREATE INDEX IF NOT EXISTS idx_watchlist_alerts_priority ON watchlist_alerts (alert_priority);
CREATE INDEX IF NOT EXISTS idx_watchlist_alerts_delivery_status ON watchlist_alerts (delivery_status);
CREATE INDEX IF NOT EXISTS idx_watchlist_alerts_scheduled_for ON watchlist_alerts (scheduled_for);
CREATE INDEX IF NOT EXISTS idx_watchlist_alerts_expires_at ON watchlist_alerts (expires_at);
CREATE INDEX IF NOT EXISTS idx_watchlist_alerts_created_at ON watchlist_alerts (created_at DESC);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_analytics_watchlist_id ON watchlist_analytics (watchlist_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_analytics_company_id ON watchlist_analytics (company_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_analytics_period ON watchlist_analytics (analysis_period_start, analysis_period_end);
CREATE INDEX IF NOT EXISTS idx_watchlist_analytics_type ON watchlist_analytics (analysis_type);
CREATE INDEX IF NOT EXISTS idx_watchlist_analytics_generated_at ON watchlist_analytics (generated_at DESC);

-- JSONB indexes for efficient searching
CREATE INDEX IF NOT EXISTS idx_opportunity_watchlists_auto_add_criteria ON opportunity_watchlists USING GIN (auto_add_criteria);
CREATE INDEX IF NOT EXISTS idx_opportunity_watchlists_smart_filter_config ON opportunity_watchlists USING GIN (smart_filter_config);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_custom_tags ON watchlist_items USING GIN (custom_tags);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_team_members ON watchlist_items USING GIN (team_members);
CREATE INDEX IF NOT EXISTS idx_watchlist_alerts_alert_data ON watchlist_alerts USING GIN (alert_data);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_opportunity_watchlists_search ON opportunity_watchlists 
USING GIN (to_tsvector('english', 
    coalesce(watchlist_name, '') || ' ' || 
    coalesce(watchlist_description, '')
));

CREATE INDEX IF NOT EXISTS idx_watchlist_items_search ON watchlist_items 
USING GIN (to_tsvector('english', 
    coalesce(user_notes, '') || ' ' || 
    coalesce(decision_reason, '')
));

-- Comments for documentation
COMMENT ON TABLE opportunity_watchlists IS 'User-created watchlists for tracking and monitoring government opportunities with automated alerts';
COMMENT ON COLUMN opportunity_watchlists.watchlist_type IS 'How watchlist is populated: manual curation, smart filters, AI recommendations, etc.';
COMMENT ON COLUMN opportunity_watchlists.auto_add_criteria IS 'JSON criteria for automatically adding opportunities to smart watchlists';
COMMENT ON COLUMN opportunity_watchlists.ai_curation_enabled IS 'Whether AI should automatically curate opportunities for this watchlist';

COMMENT ON TABLE watchlist_items IS 'Individual opportunities tracked within watchlists with user annotations and decision tracking';
COMMENT ON COLUMN watchlist_items.time_in_watchlist IS 'Calculated field showing days opportunity has been in watchlist';
COMMENT ON COLUMN watchlist_items.collaboration_notes IS 'Array of team collaboration notes with timestamps and user attribution';

COMMENT ON TABLE watchlist_alerts IS 'Generated alerts and notifications for watchlist items with delivery tracking';
COMMENT ON COLUMN watchlist_alerts.alert_data IS 'Structured data about the alert including before/after values, deadlines, etc.';
COMMENT ON COLUMN watchlist_alerts.delivery_method IS 'How the alert was or should be delivered to the user';

COMMENT ON TABLE watchlist_analytics IS 'Analytics and performance metrics for watchlists including ROI and effectiveness tracking';
COMMENT ON COLUMN watchlist_analytics.smart_filter_precision IS 'Percentage of auto-added opportunities that were actually pursued';
COMMENT ON COLUMN watchlist_analytics.win_rate IS 'Percentage of pursued opportunities that resulted in contract awards';

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_opportunity_watchlists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_opportunity_watchlists_updated_at
    BEFORE UPDATE ON opportunity_watchlists
    FOR EACH ROW
    EXECUTE FUNCTION update_opportunity_watchlists_updated_at();

CREATE OR REPLACE FUNCTION update_watchlist_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_watchlist_items_updated_at
    BEFORE UPDATE ON watchlist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_watchlist_items_updated_at();

-- Trigger to update watchlist opportunity count
CREATE OR REPLACE FUNCTION update_watchlist_opportunity_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE opportunity_watchlists 
        SET opportunities_count = opportunities_count + 1,
            updated_at = NOW()
        WHERE id = NEW.watchlist_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE opportunity_watchlists 
        SET opportunities_count = opportunities_count - 1,
            updated_at = NOW()
        WHERE id = OLD.watchlist_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_watchlist_opportunity_count_trigger
    AFTER INSERT OR DELETE ON watchlist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_watchlist_opportunity_count();

-- Insert sample watchlist for testing
INSERT INTO opportunity_watchlists (
    watchlist_name, watchlist_description, company_id, is_active,
    watchlist_type, notifications_enabled, email_notifications,
    alert_on_deadline_approaching, deadline_alert_days_before,
    default_sort_order, ai_curation_enabled
)
SELECT 
    'Federal IT Opportunities' as watchlist_name,
    'High-priority federal IT opportunities focusing on cloud migration and infrastructure modernization projects' as watchlist_description,
    c.id as company_id,
    true as is_active,
    'smart_filter' as watchlist_type,
    true as notifications_enabled,
    true as email_notifications,
    true as alert_on_deadline_approaching,
    10 as deadline_alert_days_before,
    'due_date_asc' as default_sort_order,
    true as ai_curation_enabled
FROM company_profiles c
LIMIT 1;

-- Insert sample watchlist items
INSERT INTO watchlist_items (
    watchlist_id, opportunity_id, company_id, added_method,
    item_status, priority_level, user_notes, custom_tags,
    custom_rating, decision_status
)
SELECT 
    w.id as watchlist_id,
    o.id as opportunity_id,
    w.company_id,
    'smart_filter' as added_method,
    'evaluating' as item_status,
    4 as priority_level,
    'Excellent match for our cloud migration capabilities. High potential for win given our federal experience. Need to analyze competition and develop teaming strategy.' as user_notes,
    '["cloud_migration", "federal", "high_value", "strategic"]' as custom_tags,
    4 as custom_rating,
    'go' as decision_status
FROM opportunity_watchlists w
CROSS JOIN gov_opportunities o
WHERE w.watchlist_name = 'Federal IT Opportunities'
  AND o.solicitation_number = 'DTS-2025-IT-001'
LIMIT 1;

-- Insert sample alert
INSERT INTO watchlist_alerts (
    watchlist_id, watchlist_item_id, opportunity_id, company_id,
    alert_type, alert_priority, alert_title, alert_message,
    alert_data, delivery_status, delivery_method, scheduled_for
)
SELECT 
    w.id as watchlist_id,
    wi.id as watchlist_item_id,
    wi.opportunity_id,
    w.company_id,
    'deadline_approaching' as alert_type,
    'high' as alert_priority,
    'Proposal Deadline Approaching - IT Infrastructure Modernization' as alert_title,
    'The proposal deadline for "IT Infrastructure Modernization Services" is approaching in 10 days. Current status: Evaluating. Priority: High (4/5).' as alert_message,
    '{
        "days_until_deadline": 10,
        "opportunity_title": "IT Infrastructure Modernization Services",
        "current_status": "evaluating",
        "priority_level": 4,
        "estimated_value": "2-3M",
        "action_required": "Move to proposal preparation phase"
    }' as alert_data,
    'pending' as delivery_status,
    'email' as delivery_method,
    NOW() + INTERVAL '1 hour' as scheduled_for
FROM opportunity_watchlists w
JOIN watchlist_items wi ON w.id = wi.watchlist_id
WHERE w.watchlist_name = 'Federal IT Opportunities'
LIMIT 1;

-- Insert sample analytics
INSERT INTO watchlist_analytics (
    watchlist_id, company_id, analysis_period_start, analysis_period_end,
    analysis_type, opportunities_added, total_opportunities_tracked,
    total_views, go_decisions, opportunities_pursued, win_rate,
    total_opportunity_value, won_opportunity_value
)
SELECT 
    w.id as watchlist_id,
    w.company_id,
    CURRENT_DATE - INTERVAL '30 days' as analysis_period_start,
    CURRENT_DATE as analysis_period_end,
    'monthly_summary' as analysis_type,
    5 as opportunities_added,
    5 as total_opportunities_tracked,
    47 as total_views,
    3 as go_decisions,
    2 as opportunities_pursued,
    50.0 as win_rate,
    12500000.00 as total_opportunity_value,
    3000000.00 as won_opportunity_value
FROM opportunity_watchlists w
WHERE w.watchlist_name = 'Federal IT Opportunities'
LIMIT 1;