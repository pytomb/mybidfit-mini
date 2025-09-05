-- Migration 004: Add Company Profiles Table
-- Creates comprehensive company profiles table for MBF-102
-- Matches companyProfileSchema in src/schemas/profile.schema.js

-- Company profiles table (detailed user-managed profiles)
CREATE TABLE company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic Information
    name VARCHAR(100) NOT NULL,
    dba VARCHAR(100), -- "Doing Business As" name
    summary TEXT NOT NULL, -- 20-600 chars enforced by validation
    description TEXT, -- Optional detailed description
    
    -- Business Identifiers
    naics JSONB NOT NULL DEFAULT '[]', -- Array of 6-digit NAICS codes
    uei VARCHAR(12), -- Unique Entity Identifier (12 alphanumeric)
    cage_code VARCHAR(5), -- CAGE code (5 alphanumeric)
    
    -- Size and Classification
    employee_count INTEGER CHECK (employee_count >= 0),
    annual_revenue DECIMAL(15,2) CHECK (annual_revenue >= 0),
    business_type VARCHAR(50) CHECK (business_type IN (
        'small_business', 
        'large_business', 
        'non_profit', 
        'educational_institution', 
        'government_entity', 
        'other'
    )),
    
    -- Certifications and Past Performance (JSON arrays)
    certifications JSONB DEFAULT '[]',
    past_performance JSONB DEFAULT '[]',
    capabilities JSONB DEFAULT '[]',
    
    -- Contact Information
    website VARCHAR(500),
    linkedin VARCHAR(500),
    
    -- Address (JSON object)
    address JSONB DEFAULT '{}',
    
    -- Service and Keywords (JSON arrays)
    service_areas JSONB DEFAULT '[]',
    keywords JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id), -- One profile per user
    CONSTRAINT valid_naics_format CHECK (
        jsonb_typeof(naics) = 'array'
    ),
    CONSTRAINT valid_certifications_format CHECK (
        jsonb_typeof(certifications) = 'array'
    ),
    CONSTRAINT valid_past_performance_format CHECK (
        jsonb_typeof(past_performance) = 'array'
    ),
    CONSTRAINT valid_capabilities_format CHECK (
        jsonb_typeof(capabilities) = 'array'
    ),
    CONSTRAINT valid_service_areas_format CHECK (
        jsonb_typeof(service_areas) = 'array'
    ),
    CONSTRAINT valid_keywords_format CHECK (
        jsonb_typeof(keywords) = 'array'
    )
);

-- Indexes for performance
CREATE INDEX idx_company_profiles_user_id ON company_profiles (user_id);
CREATE INDEX idx_company_profiles_name ON company_profiles (name);
CREATE INDEX idx_company_profiles_business_type ON company_profiles (business_type);
CREATE INDEX idx_company_profiles_employee_count ON company_profiles (employee_count);
CREATE INDEX idx_company_profiles_annual_revenue ON company_profiles (annual_revenue);
CREATE INDEX idx_company_profiles_created_at ON company_profiles (created_at);

-- JSONB indexes for efficient searching
CREATE INDEX idx_company_profiles_naics ON company_profiles USING GIN (naics);
CREATE INDEX idx_company_profiles_certifications ON company_profiles USING GIN (certifications);
CREATE INDEX idx_company_profiles_capabilities ON company_profiles USING GIN (capabilities);
CREATE INDEX idx_company_profiles_service_areas ON company_profiles USING GIN (service_areas);
CREATE INDEX idx_company_profiles_keywords ON company_profiles USING GIN (keywords);

-- Full text search index for name and summary
CREATE INDEX idx_company_profiles_search ON company_profiles 
USING GIN (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(description, '')));

-- Comments for documentation
COMMENT ON TABLE company_profiles IS 'Detailed company profiles created and managed by users for opportunity matching';
COMMENT ON COLUMN company_profiles.naics IS 'Array of 6-digit NAICS codes representing company business areas';
COMMENT ON COLUMN company_profiles.uei IS 'Unique Entity Identifier required for federal contracting';
COMMENT ON COLUMN company_profiles.cage_code IS 'Commercial And Government Entity code';
COMMENT ON COLUMN company_profiles.certifications IS 'Array of certification objects with type, name, issuing body, dates';
COMMENT ON COLUMN company_profiles.past_performance IS 'Array of past performance entries with title, client, value, year, description';
COMMENT ON COLUMN company_profiles.capabilities IS 'Array of company capability objects with category, description, keywords';
COMMENT ON COLUMN company_profiles.address IS 'JSON object containing street, city, state, zip, country address fields';

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_company_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_profiles_updated_at
    BEFORE UPDATE ON company_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_company_profiles_updated_at();