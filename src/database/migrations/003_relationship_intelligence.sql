-- Relationship Intelligence Migration for Atlanta Metro PoC
-- Adds relationship mapping, professional network analysis, and event intelligence
-- Feature flagged: relationship_intelligence_atlanta

-- Atlanta Organizations (companies, agencies, nonprofits in metro area)
CREATE TABLE atlanta_organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'corporation', 'government', 'nonprofit', 'association', 'startup'
    description TEXT,
    website VARCHAR(255),
    
    -- Geographic specifics for Atlanta Metro
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_county VARCHAR(50), -- Fulton, DeKalb, Gwinnett, Cobb, etc.
    address_zip VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Organization details
    employee_count_range VARCHAR(50), -- '1-10', '11-50', '51-200', '201-1000', '1000+'
    founded_year INTEGER,
    annual_revenue_range VARCHAR(50),
    industry_sectors TEXT[], -- Array of NAICS sectors
    
    -- Business relationship metadata
    key_business_areas TEXT[], -- Main business focuses
    strategic_priorities TEXT[], -- Current strategic initiatives
    partnership_interests TEXT[], -- Types of partnerships they seek
    
    -- Network intelligence
    influence_score DECIMAL(5,2) DEFAULT 0, -- 0-10 scale of market influence
    collaboration_score DECIMAL(5,2) DEFAULT 0, -- 0-10 scale of partnership activity
    event_activity_level VARCHAR(20) DEFAULT 'unknown', -- 'low', 'medium', 'high', 'unknown'
    
    -- Data provenance
    data_sources JSONB, -- Sources of information (LinkedIn, website, etc.)
    last_updated TIMESTAMP DEFAULT NOW(),
    data_quality_score DECIMAL(5,2) DEFAULT 0, -- 0-10 confidence in data accuracy
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Professional People in Atlanta Metro
CREATE TABLE atlanta_people (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(255),
    organization_id INTEGER REFERENCES atlanta_organizations(id) ON DELETE SET NULL,
    
    -- Professional information
    seniority_level VARCHAR(50), -- 'entry', 'mid', 'senior', 'executive', 'c-level'
    department VARCHAR(100), -- 'sales', 'marketing', 'operations', 'strategy', 'procurement'
    years_experience INTEGER,
    
    -- Contact information (GDPR/privacy compliant)
    linkedin_profile VARCHAR(255),
    email VARCHAR(255), -- Only if publicly available or opted in
    phone VARCHAR(50), -- Only if publicly available or opted in
    
    -- Professional interests and expertise
    areas_of_expertise TEXT[],
    professional_interests TEXT[],
    speaking_topics TEXT[],
    
    -- Network analysis
    network_influence_score DECIMAL(5,2) DEFAULT 0, -- 0-10 scale
    connection_count INTEGER DEFAULT 0,
    activity_level VARCHAR(20) DEFAULT 'unknown', -- 'low', 'medium', 'high', 'unknown'
    
    -- Privacy and compliance
    privacy_consent BOOLEAN DEFAULT false,
    data_source VARCHAR(100), -- 'public_profile', 'opted_in', 'business_directory'
    last_verified TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Professional Relationships (who knows whom, business connections)
CREATE TABLE atlanta_relationships (
    id SERIAL PRIMARY KEY,
    person_a_id INTEGER REFERENCES atlanta_people(id) ON DELETE CASCADE,
    person_b_id INTEGER REFERENCES atlanta_people(id) ON DELETE CASCADE,
    
    -- Relationship characteristics
    relationship_type VARCHAR(50), -- 'colleague', 'former_colleague', 'client', 'vendor', 'partner', 'peer'
    relationship_strength VARCHAR(20), -- 'weak', 'medium', 'strong'
    connection_context TEXT, -- How they know each other
    
    -- Temporal information
    relationship_start_date DATE,
    last_interaction_date DATE,
    interaction_frequency VARCHAR(20), -- 'rare', 'occasional', 'regular', 'frequent'
    
    -- Business relevance
    business_relevance_score DECIMAL(5,2) DEFAULT 0, -- 0-10 how relevant for business connections
    shared_interests TEXT[],
    mutual_connections_count INTEGER DEFAULT 0,
    
    -- Data integrity
    confidence_level DECIMAL(5,2) DEFAULT 0, -- 0-10 confidence in relationship data
    data_sources JSONB,
    last_updated TIMESTAMP DEFAULT NOW(),
    
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Prevent duplicate relationships and self-references
    UNIQUE(person_a_id, person_b_id),
    CHECK(person_a_id != person_b_id)
);

-- Atlanta Events (networking events, conferences, meetups)
CREATE TABLE atlanta_events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    event_type VARCHAR(50), -- 'conference', 'networking', 'meetup', 'trade_show', 'seminar', 'panel'
    description TEXT,
    
    -- Event details
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    venue_name VARCHAR(255),
    venue_address TEXT,
    venue_latitude DECIMAL(10, 8),
    venue_longitude DECIMAL(11, 8),
    
    -- Event characteristics
    expected_attendance_range VARCHAR(50), -- '10-25', '26-50', '51-100', '101-500', '500+'
    target_audience TEXT[], -- Industries, roles, company types
    ticket_price_range VARCHAR(50), -- 'free', '1-50', '51-200', '201-500', '500+'
    
    -- Business intelligence
    industry_focus TEXT[], -- Primary industries represented
    networking_potential VARCHAR(20), -- 'low', 'medium', 'high', 'exceptional'
    business_value_rating DECIMAL(5,2) DEFAULT 0, -- 0-10 scale
    
    -- Organizational information
    organizer_organization_id INTEGER REFERENCES atlanta_organizations(id),
    sponsor_organization_ids INTEGER[], -- Array of sponsor organization IDs
    
    -- Event metadata
    registration_url VARCHAR(500),
    event_website VARCHAR(255),
    social_media_hashtags TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Event Attendance (who attended what events)
CREATE TABLE atlanta_event_attendance (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES atlanta_events(id) ON DELETE CASCADE,
    person_id INTEGER REFERENCES atlanta_people(id) ON DELETE CASCADE,
    organization_id INTEGER REFERENCES atlanta_organizations(id) ON DELETE CASCADE,
    
    -- Attendance details
    attendance_type VARCHAR(50), -- 'attendee', 'speaker', 'sponsor', 'organizer', 'volunteer'
    session_topics TEXT[], -- If speaker, what topics they covered
    
    -- Networking outcomes
    new_connections_made INTEGER DEFAULT 0,
    business_cards_exchanged INTEGER DEFAULT 0,
    follow_up_meetings_scheduled INTEGER DEFAULT 0,
    
    -- Verification
    attendance_verified BOOLEAN DEFAULT false,
    verification_source VARCHAR(100), -- 'registration_list', 'social_media', 'manual_confirmation'
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Business Opportunities specific to Atlanta Metro
CREATE TABLE atlanta_opportunities (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Opportunity source
    source_organization_id INTEGER REFERENCES atlanta_organizations(id),
    opportunity_type VARCHAR(50), -- 'rfp', 'partnership', 'investment', 'contract', 'collaboration'
    
    -- Opportunity details
    estimated_value_min DECIMAL(12,2),
    estimated_value_max DECIMAL(12,2),
    timeline_months INTEGER,
    
    -- Requirements
    required_capabilities TEXT[],
    preferred_qualifications TEXT[],
    geographic_requirements TEXT[], -- Must be Atlanta metro, specific counties, etc.
    
    -- Key contacts and decision makers
    primary_contact_person_id INTEGER REFERENCES atlanta_people(id),
    decision_makers_person_ids INTEGER[], -- Array of person IDs who influence decisions
    
    -- Strategic intelligence
    competitive_landscape TEXT, -- Who else is likely to compete
    success_factors TEXT[], -- Key factors for winning
    relationship_advantages TEXT[], -- How relationships could help
    
    -- Opportunity status
    submission_deadline TIMESTAMP,
    decision_timeline TIMESTAMP,
    current_status VARCHAR(50) DEFAULT 'open', -- 'open', 'submitted', 'awarded', 'cancelled'
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Relationship Intelligence Insights (AI-generated insights about the network)
CREATE TABLE atlanta_relationship_insights (
    id SERIAL PRIMARY KEY,
    
    -- Insight target (what the insight is about)
    target_type VARCHAR(50), -- 'person', 'organization', 'opportunity', 'event', 'network_cluster'
    target_id INTEGER, -- ID of the target entity
    
    -- Insight details
    insight_type VARCHAR(50), -- 'connection_path', 'influence_analysis', 'opportunity_match', 'event_recommendation'
    insight_title VARCHAR(255),
    insight_description TEXT,
    
    -- Insight scoring
    relevance_score DECIMAL(5,2), -- 0-10 how relevant this insight is
    confidence_level DECIMAL(5,2), -- 0-10 confidence in the insight
    actionability_score DECIMAL(5,2), -- 0-10 how actionable this insight is
    
    -- Supporting data
    supporting_evidence JSONB, -- Data points that support this insight
    recommended_actions TEXT[], -- What actions should be taken based on this insight
    
    -- Insight metadata
    generated_by VARCHAR(100), -- 'graph_analysis', 'ml_model', 'manual_analysis'
    generated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP, -- When this insight becomes stale
    
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Performance indexes for relationship intelligence queries
CREATE INDEX idx_atlanta_orgs_type ON atlanta_organizations (type);
CREATE INDEX idx_atlanta_orgs_county ON atlanta_organizations (address_county);
CREATE INDEX idx_atlanta_orgs_industry ON atlanta_organizations USING GIN (industry_sectors);
CREATE INDEX idx_atlanta_orgs_location ON atlanta_organizations (latitude, longitude);
CREATE INDEX idx_atlanta_orgs_influence ON atlanta_organizations (influence_score DESC);

CREATE INDEX idx_atlanta_people_org ON atlanta_people (organization_id);
CREATE INDEX idx_atlanta_people_seniority ON atlanta_people (seniority_level);
CREATE INDEX idx_atlanta_people_dept ON atlanta_people (department);
CREATE INDEX idx_atlanta_people_expertise ON atlanta_people USING GIN (areas_of_expertise);
CREATE INDEX idx_atlanta_people_influence ON atlanta_people (network_influence_score DESC);

CREATE INDEX idx_atlanta_relationships_people ON atlanta_relationships (person_a_id, person_b_id);
CREATE INDEX idx_atlanta_relationships_strength ON atlanta_relationships (relationship_strength);
CREATE INDEX idx_atlanta_relationships_type ON atlanta_relationships (relationship_type);
CREATE INDEX idx_atlanta_relationships_relevance ON atlanta_relationships (business_relevance_score DESC);

CREATE INDEX idx_atlanta_events_date ON atlanta_events (start_date);
CREATE INDEX idx_atlanta_events_type ON atlanta_events (event_type);
CREATE INDEX idx_atlanta_events_industry ON atlanta_events USING GIN (industry_focus);
CREATE INDEX idx_atlanta_events_networking ON atlanta_events (networking_potential);
CREATE INDEX idx_atlanta_events_location ON atlanta_events (venue_latitude, venue_longitude);

CREATE INDEX idx_atlanta_attendance_event ON atlanta_event_attendance (event_id);
CREATE INDEX idx_atlanta_attendance_person ON atlanta_event_attendance (person_id);
CREATE INDEX idx_atlanta_attendance_org ON atlanta_event_attendance (organization_id);

CREATE INDEX idx_atlanta_opps_org ON atlanta_opportunities (source_organization_id);
CREATE INDEX idx_atlanta_opps_contact ON atlanta_opportunities (primary_contact_person_id);
CREATE INDEX idx_atlanta_opps_status ON atlanta_opportunities (current_status);
CREATE INDEX idx_atlanta_opps_deadline ON atlanta_opportunities (submission_deadline);

CREATE INDEX idx_atlanta_insights_target ON atlanta_relationship_insights (target_type, target_id);
CREATE INDEX idx_atlanta_insights_type ON atlanta_relationship_insights (insight_type);
CREATE INDEX idx_atlanta_insights_relevance ON atlanta_relationship_insights (relevance_score DESC);

-- Table comments for documentation
COMMENT ON TABLE atlanta_organizations IS 'Organizations in the Atlanta Metro area for relationship intelligence';
COMMENT ON TABLE atlanta_people IS 'Professional people in Atlanta Metro with privacy compliance';
COMMENT ON TABLE atlanta_relationships IS 'Professional relationships and connections between people';
COMMENT ON TABLE atlanta_events IS 'Networking events, conferences, and business gatherings in Atlanta';
COMMENT ON TABLE atlanta_event_attendance IS 'Record of who attended which events for network analysis';
COMMENT ON TABLE atlanta_opportunities IS 'Business opportunities specific to Atlanta Metro market';
COMMENT ON TABLE atlanta_relationship_insights IS 'AI-generated insights about the professional network';

-- Add feature flag support for relationship intelligence
-- This allows gradual rollout and testing without affecting existing functionality
CREATE OR REPLACE FUNCTION check_relationship_intelligence_feature()
RETURNS BOOLEAN AS $$
BEGIN
    -- This will integrate with the existing feature flag system
    -- For now, return true for development
    RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_relationship_intelligence_feature() IS 'Feature flag check for relationship intelligence functionality';