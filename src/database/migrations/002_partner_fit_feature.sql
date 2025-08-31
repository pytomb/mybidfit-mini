-- MyBidFit Partner Fit Feature Migration
-- Adds tables for enhanced partner discovery and matching capabilities

-- Partner profiles table (enhanced company profiles for partner matching)
CREATE TABLE IF NOT EXISTS partner_profiles (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    
    -- Partner-specific details
    open_to_partnership BOOLEAN DEFAULT true,
    partnership_types TEXT[], -- 'complementary', 'similar', 'both'
    prime_sub_preference VARCHAR(20), -- 'prime', 'sub', 'both', 'none'
    
    -- Availability and capacity
    current_capacity INTEGER, -- Percentage of capacity available (0-100)
    availability_start DATE,
    availability_end DATE,
    typical_project_size VARCHAR(50), -- '<100k', '100k-500k', '500k-1M', '1M+'
    
    -- Partnership preferences
    preferred_industries TEXT[],
    preferred_regions TEXT[],
    preferred_company_sizes TEXT[], -- 'small', 'medium', 'large'
    min_partnership_size DECIMAL(12,2),
    max_partnership_size DECIMAL(12,2),
    
    -- Past partnership data
    successful_partnerships INTEGER DEFAULT 0,
    average_partnership_rating DECIMAL(3,2), -- 1.00 to 5.00
    
    -- Communication preferences
    contact_method VARCHAR(50) DEFAULT 'email', -- 'email', 'phone', 'platform'
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    response_time_hours INTEGER DEFAULT 24,
    
    -- Profile completeness
    profile_completeness INTEGER DEFAULT 0, -- 0-100 percentage
    profile_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(company_id)
);

-- Partner matches table (specific partner-to-partner matching results)
CREATE TABLE IF NOT EXISTS partner_matches (
    id SERIAL PRIMARY KEY,
    seeker_id INTEGER REFERENCES partner_profiles(id) ON DELETE CASCADE,
    partner_id INTEGER REFERENCES partner_profiles(id) ON DELETE CASCADE,
    opportunity_id INTEGER REFERENCES opportunities(id),
    
    -- Match type and scoring
    match_type VARCHAR(20) NOT NULL, -- 'complementary' or 'similar'
    match_score DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
    
    -- Multi-persona scores (using MyBidFit's 4-persona approach)
    cfo_score DECIMAL(3,2), -- Financial alignment
    ciso_score DECIMAL(3,2), -- Security/compliance alignment
    operator_score DECIMAL(3,2), -- Operational compatibility
    skeptic_score DECIMAL(3,2), -- Risk assessment
    
    -- Match reasoning (explainable AI)
    match_reasons JSONB NOT NULL, -- Array of {reason, weight, evidence}
    top_strengths TEXT[], -- Top 3 strengths of this partnership
    potential_risks TEXT[], -- Identified risks or concerns
    
    -- Capability analysis
    capability_overlap TEXT[], -- Shared capabilities
    capability_gaps_filled TEXT[], -- What each partner brings
    combined_capability_score DECIMAL(3,2), -- How well they cover requirements together
    
    -- Status tracking
    match_status VARCHAR(50) DEFAULT 'suggested', -- 'suggested', 'viewed', 'contacted', 'partnered', 'declined'
    viewed_at TIMESTAMP,
    contacted_at TIMESTAMP,
    partnership_formed_at TIMESTAMP,
    
    -- Feedback
    seeker_rating INTEGER CHECK (seeker_rating >= 1 AND seeker_rating <= 5),
    partner_rating INTEGER CHECK (partner_rating >= 1 AND partner_rating <= 5),
    feedback_notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Prevent duplicate matches
    UNIQUE(seeker_id, partner_id, opportunity_id)
);

-- Partner invitations table (for future anonymous messaging feature)
CREATE TABLE IF NOT EXISTS partner_invitations (
    id SERIAL PRIMARY KEY,
    from_profile_id INTEGER REFERENCES partner_profiles(id) ON DELETE CASCADE,
    to_profile_id INTEGER REFERENCES partner_profiles(id) ON DELETE CASCADE,
    match_id INTEGER REFERENCES partner_matches(id),
    
    -- Invitation details
    invitation_type VARCHAR(50) DEFAULT 'standard', -- 'standard', 'anonymous' (future)
    message TEXT,
    opportunity_description TEXT,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
    sent_at TIMESTAMP DEFAULT NOW(),
    responded_at TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Response
    response_message TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Partner search preferences (saved searches)
CREATE TABLE IF NOT EXISTS partner_search_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Search criteria
    search_name VARCHAR(255),
    match_type VARCHAR(20), -- 'complementary', 'similar', 'both'
    industries TEXT[],
    capabilities TEXT[],
    certifications TEXT[],
    regions TEXT[],
    company_sizes TEXT[],
    min_score DECIMAL(3,2) DEFAULT 0.60,
    
    -- Notification preferences
    notify_on_new_matches BOOLEAN DEFAULT false,
    notification_frequency VARCHAR(50) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
    last_notified TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Partner activity log (for analytics and improvement)
CREATE TABLE IF NOT EXISTS partner_activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    profile_id INTEGER REFERENCES partner_profiles(id),
    
    -- Activity tracking
    activity_type VARCHAR(100) NOT NULL, -- 'search', 'view_match', 'send_invitation', 'accept_invitation', etc.
    activity_details JSONB,
    
    -- Related entities
    match_id INTEGER REFERENCES partner_matches(id),
    invitation_id INTEGER REFERENCES partner_invitations(id),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_profiles_company ON partner_profiles (company_id);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_user ON partner_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_open ON partner_profiles (open_to_partnership);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_types ON partner_profiles USING GIN (partnership_types);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_industries ON partner_profiles USING GIN (preferred_industries);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_capacity ON partner_profiles (current_capacity);

CREATE INDEX IF NOT EXISTS idx_partner_matches_seeker ON partner_matches (seeker_id);
CREATE INDEX IF NOT EXISTS idx_partner_matches_partner ON partner_matches (partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_matches_opportunity ON partner_matches (opportunity_id);
CREATE INDEX IF NOT EXISTS idx_partner_matches_type ON partner_matches (match_type);
CREATE INDEX IF NOT EXISTS idx_partner_matches_score ON partner_matches (match_score DESC);
CREATE INDEX IF NOT EXISTS idx_partner_matches_status ON partner_matches (match_status);

CREATE INDEX IF NOT EXISTS idx_partner_invitations_from ON partner_invitations (from_profile_id);
CREATE INDEX IF NOT EXISTS idx_partner_invitations_to ON partner_invitations (to_profile_id);
CREATE INDEX IF NOT EXISTS idx_partner_invitations_status ON partner_invitations (status);
CREATE INDEX IF NOT EXISTS idx_partner_invitations_expires ON partner_invitations (expires_at);

CREATE INDEX IF NOT EXISTS idx_partner_search_user ON partner_search_preferences (user_id);
CREATE INDEX IF NOT EXISTS idx_partner_activity_user ON partner_activity_log (user_id);
CREATE INDEX IF NOT EXISTS idx_partner_activity_type ON partner_activity_log (activity_type);
CREATE INDEX IF NOT EXISTS idx_partner_activity_created ON partner_activity_log (created_at);

-- Add comments for documentation
COMMENT ON TABLE partner_profiles IS 'Enhanced profiles for companies participating in partner matching';
COMMENT ON TABLE partner_matches IS 'AI-generated partner matching results with explainable scoring';
COMMENT ON TABLE partner_invitations IS 'Partner connection invitations and responses';
COMMENT ON TABLE partner_search_preferences IS 'Saved search criteria for partner discovery';
COMMENT ON TABLE partner_activity_log IS 'Activity tracking for analytics and system improvement';

COMMENT ON COLUMN partner_matches.match_type IS 'complementary = fills gaps, similar = adds capacity';
COMMENT ON COLUMN partner_matches.cfo_score IS 'Financial compatibility and risk assessment';
COMMENT ON COLUMN partner_matches.ciso_score IS 'Security and compliance alignment';
COMMENT ON COLUMN partner_matches.operator_score IS 'Operational compatibility and delivery capability';
COMMENT ON COLUMN partner_matches.skeptic_score IS 'Risk factors and potential conflicts';