-- Analytics tracking table for A/B testing and user behavior
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Event information
    event_name VARCHAR(100) NOT NULL, -- 'page_visit', 'analysis_started', 'analysis_completed', etc.
    experience_type VARCHAR(50) DEFAULT 'full', -- 'simple', 'full'
    
    -- Analysis results (when applicable)
    score INTEGER, -- Opportunity score when analysis completed
    error_message TEXT, -- Error message if analysis failed
    
    -- Session and context data
    session_data JSONB, -- Additional event context
    user_agent TEXT,
    ip_address INET,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add usage tracking fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS analysis_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_analysis_at TIMESTAMP;

-- Indexes for analytics performance
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events (user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events (event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_experience_type ON analytics_events (experience_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events (created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_user_event ON analytics_events (user_id, event_name);

-- Comments for documentation
COMMENT ON TABLE analytics_events IS 'User behavior tracking for A/B testing and analytics';
COMMENT ON COLUMN analytics_events.experience_type IS 'Track which UI experience the user is using - simple MVP vs full platform';
COMMENT ON COLUMN analytics_events.session_data IS 'JSON data containing event-specific context and metadata';