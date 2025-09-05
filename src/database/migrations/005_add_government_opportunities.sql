-- Migration 005: Government Opportunities Core Table
-- Creates comprehensive government opportunities storage for SAM.gov integration
-- Supports deduplication, full-text search, and complete opportunity metadata

-- Government opportunities table (core storage for all government contracting opportunities)
CREATE TABLE IF NOT EXISTS gov_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source tracking for deduplication
    source_ids JSONB NOT NULL DEFAULT '{}',  -- {"sam_gov": "notice_id", "fpds": "award_id"}
    
    -- Core opportunity information
    title VARCHAR(500) NOT NULL,
    description TEXT,
    agency VARCHAR(255),
    office VARCHAR(255),
    
    -- Classification codes
    naics_codes JSONB DEFAULT '[]',  -- Array of 6-digit NAICS codes
    psc_codes JSONB DEFAULT '[]',    -- Product Service Codes
    
    -- Government-specific metadata  
    set_aside VARCHAR(100),          -- "8(a)", "SDVOSB", "WOSB", "HUBZone", etc.
    place_of_performance JSONB DEFAULT '{}',  -- {"city": "Washington", "state": "DC", "country": "USA"}
    vehicle VARCHAR(255),            -- Contract vehicle (GSA, SEWP, CIO-SP, etc.)
    
    -- Timeline information
    pop_start DATE,                  -- Period of Performance start
    pop_end DATE,                    -- Period of Performance end  
    due_date TIMESTAMP,              -- Proposal submission deadline
    posted_date TIMESTAMP,           -- When opportunity was posted
    
    -- Financial information
    value_low DECIMAL(15,2),         -- Minimum contract value
    value_high DECIMAL(15,2),        -- Maximum contract value
    value_estimated DECIMAL(15,2),   -- Best estimate of contract value
    
    -- Additional metadata
    incumbent VARCHAR(255),          -- Current incumbent contractor (if identified)
    solicitation_number VARCHAR(100), -- Official solicitation/RFP number
    opportunity_type VARCHAR(50),     -- "RFP", "RFQ", "RFI", "Sources Sought", etc.
    
    -- Content and attachments
    requirements_summary TEXT,       -- Extracted key requirements
    evaluation_criteria JSONB DEFAULT '[]',  -- Evaluation factors and weights
    parsed_tags JSONB DEFAULT '[]',  -- AI-extracted capability tags
    raw_text TEXT,                   -- Full original description text
    attachments JSONB DEFAULT '[]',  -- Array of attachment objects
    contacts JSONB DEFAULT '[]',     -- Point of contact information
    
    -- Processing metadata
    data_quality_score DECIMAL(3,2), -- Quality score of extracted data (0-1)
    last_updated_source TIMESTAMP,   -- When source data was last updated
    processing_status VARCHAR(50) DEFAULT 'active', -- "active", "closed", "cancelled", "awarded"
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_source_ids_format CHECK (
        jsonb_typeof(source_ids) = 'object'
    ),
    CONSTRAINT valid_naics_codes_format CHECK (
        jsonb_typeof(naics_codes) = 'array'
    ),
    CONSTRAINT valid_psc_codes_format CHECK (
        jsonb_typeof(psc_codes) = 'array'
    ),
    CONSTRAINT valid_place_of_performance_format CHECK (
        jsonb_typeof(place_of_performance) = 'object'
    ),
    CONSTRAINT valid_evaluation_criteria_format CHECK (
        jsonb_typeof(evaluation_criteria) = 'array'
    ),
    CONSTRAINT valid_parsed_tags_format CHECK (
        jsonb_typeof(parsed_tags) = 'array'  
    ),
    CONSTRAINT valid_attachments_format CHECK (
        jsonb_typeof(attachments) = 'array'
    ),
    CONSTRAINT valid_contacts_format CHECK (
        jsonb_typeof(contacts) = 'array'
    ),
    CONSTRAINT valid_value_range CHECK (
        value_low IS NULL OR value_high IS NULL OR value_low <= value_high
    ),
    CONSTRAINT valid_pop_dates CHECK (
        pop_start IS NULL OR pop_end IS NULL OR pop_start <= pop_end
    ),
    CONSTRAINT valid_data_quality_score CHECK (
        data_quality_score IS NULL OR (data_quality_score >= 0 AND data_quality_score <= 1)
    )
);

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_gov_opps_agency ON gov_opportunities (agency);
CREATE INDEX IF NOT EXISTS idx_gov_opps_due_date ON gov_opportunities (due_date);
CREATE INDEX IF NOT EXISTS idx_gov_opps_posted_date ON gov_opportunities (posted_date);
CREATE INDEX IF NOT EXISTS idx_gov_opps_set_aside ON gov_opportunities (set_aside);
CREATE INDEX IF NOT EXISTS idx_gov_opps_vehicle ON gov_opportunities (vehicle);
CREATE INDEX IF NOT EXISTS idx_gov_opps_opportunity_type ON gov_opportunities (opportunity_type);
CREATE INDEX IF NOT EXISTS idx_gov_opps_processing_status ON gov_opportunities (processing_status);
CREATE INDEX IF NOT EXISTS idx_gov_opps_created_at ON gov_opportunities (created_at);
CREATE INDEX IF NOT EXISTS idx_gov_opps_value_range ON gov_opportunities (value_low, value_high);
CREATE INDEX IF NOT EXISTS idx_gov_opps_solicitation_number ON gov_opportunities (solicitation_number);

-- JSONB indexes for efficient searching
CREATE INDEX IF NOT EXISTS idx_gov_opps_source_ids ON gov_opportunities USING GIN (source_ids);
CREATE INDEX IF NOT EXISTS idx_gov_opps_naics_codes ON gov_opportunities USING GIN (naics_codes);
CREATE INDEX IF NOT EXISTS idx_gov_opps_psc_codes ON gov_opportunities USING GIN (psc_codes);
CREATE INDEX IF NOT EXISTS idx_gov_opps_parsed_tags ON gov_opportunities USING GIN (parsed_tags);
CREATE INDEX IF NOT EXISTS idx_gov_opps_evaluation_criteria ON gov_opportunities USING GIN (evaluation_criteria);
CREATE INDEX IF NOT EXISTS idx_gov_opps_place_of_performance ON gov_opportunities USING GIN (place_of_performance);

-- Full text search index for opportunity content
CREATE INDEX IF NOT EXISTS idx_gov_opps_search ON gov_opportunities 
USING GIN (to_tsvector('english', 
    coalesce(title, '') || ' ' || 
    coalesce(description, '') || ' ' || 
    coalesce(agency, '') || ' ' ||
    coalesce(requirements_summary, '') || ' ' ||
    coalesce(raw_text, '')
));

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_gov_opps_agency_due_date ON gov_opportunities (agency, due_date);
CREATE INDEX IF NOT EXISTS idx_gov_opps_set_aside_due_date ON gov_opportunities (set_aside, due_date);
CREATE INDEX IF NOT EXISTS idx_gov_opps_status_due_date ON gov_opportunities (processing_status, due_date);

-- Unique constraint on SAM.gov notice IDs to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_gov_opps_sam_notice_id 
ON gov_opportunities ((source_ids->>'sam_gov')) 
WHERE source_ids->>'sam_gov' IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE gov_opportunities IS 'Government contracting opportunities from SAM.gov and other sources with full metadata for matching and analysis';
COMMENT ON COLUMN gov_opportunities.source_ids IS 'JSON object tracking opportunity IDs across different source systems for deduplication';
COMMENT ON COLUMN gov_opportunities.naics_codes IS 'Array of 6-digit NAICS codes indicating the type of work required';
COMMENT ON COLUMN gov_opportunities.psc_codes IS 'Array of Product Service Codes for detailed categorization of government requirements';
COMMENT ON COLUMN gov_opportunities.set_aside IS 'Small business set-aside type: 8(a), SDVOSB, WOSB, HUBZone, Total Small Business, or unrestricted';
COMMENT ON COLUMN gov_opportunities.place_of_performance IS 'JSON object containing location information where work will be performed';
COMMENT ON COLUMN gov_opportunities.vehicle IS 'Contract vehicle or acquisition method (GSA Schedules, SEWP, CIO-SP, etc.)';
COMMENT ON COLUMN gov_opportunities.parsed_tags IS 'AI-extracted capability and technology tags for intelligent matching';
COMMENT ON COLUMN gov_opportunities.evaluation_criteria IS 'Array of evaluation factors with weights and descriptions from RFP';
COMMENT ON COLUMN gov_opportunities.data_quality_score IS 'Quality score (0-1) indicating completeness and accuracy of extracted data';
COMMENT ON COLUMN gov_opportunities.attachments IS 'Array of attachment objects with URLs, types, and metadata';
COMMENT ON COLUMN gov_opportunities.contacts IS 'Array of government point of contact information';

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_gov_opportunities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gov_opportunities_updated_at
    BEFORE UPDATE ON gov_opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_gov_opportunities_updated_at();

-- Insert sample data for testing (will be replaced with real SAM.gov data)
INSERT INTO gov_opportunities (
    title, description, agency, naics_codes, set_aside, 
    due_date, value_low, value_high, opportunity_type,
    source_ids, solicitation_number, processing_status
) VALUES 
(
    'IT Infrastructure Modernization Services', 
    'Comprehensive IT infrastructure modernization for federal agency including cloud migration, security enhancement, and system integration.',
    'Department of Technology Services',
    '["541511", "541512"]',
    'Total_Small_Business',
    NOW() + INTERVAL '45 days',
    2000000,
    3000000,
    'RFP',
    '{"sam_gov": "test-notice-001"}',
    'DTS-2025-IT-001',
    'active'
),
(
    'Data Analytics Platform Development',
    'Development of advanced data analytics platform for performance measurement and business intelligence across multiple government agencies.',
    'Department of Performance Management', 
    '["541511", "541690"]',
    'SDVOSB',
    NOW() + INTERVAL '60 days',
    1500000,
    2200000,
    'RFP',
    '{"sam_gov": "test-notice-002"}',
    'DPM-2025-DATA-001', 
    'active'
),
(
    'Cybersecurity Assessment and Penetration Testing',
    'Comprehensive cybersecurity assessment and penetration testing services for critical infrastructure and federal systems.',
    'Department of Homeland Security',
    '["541690", "561621"]', 
    'WOSB',
    NOW() + INTERVAL '30 days',
    800000,
    1200000,
    'RFP',
    '{"sam_gov": "test-notice-003"}',
    'DHS-2025-CYBER-001',
    'active'
) ON CONFLICT DO NOTHING;