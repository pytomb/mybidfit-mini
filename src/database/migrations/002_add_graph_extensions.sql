-- Graph Extensions Migration for MyBidFit
-- Adds graph relationship capabilities to existing PostgreSQL database
-- Using ltree extension for hierarchical queries and custom relationship modeling

-- Enable ltree extension for hierarchical relationship queries
CREATE EXTENSION IF NOT EXISTS ltree;

-- Enable additional extensions for graph operations
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Entity relationships table for graph-like queries
-- This table models relationships between all entities in the system
CREATE TABLE entity_relationships (
    id SERIAL PRIMARY KEY,
    
    -- Source entity (where the relationship originates)
    source_id INTEGER NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'company', 'opportunity', 'user', 'agency'
    
    -- Target entity (where the relationship points to)
    target_id INTEGER NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    
    -- Relationship details
    relationship_type VARCHAR(100) NOT NULL, -- 'worked_with', 'competes_for', 'partners_with', 'issued_by', 'bid_on'
    
    -- Relationship strength and metadata
    strength DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0, with 0.5 as neutral
    confidence DECIMAL(3,2) DEFAULT 0.8, -- How confident we are in this relationship
    
    -- Rich metadata about the relationship
    metadata JSONB DEFAULT '{}', -- Flexible storage for relationship-specific data
    
    -- Hierarchical path for complex relationship chains (using ltree)
    relationship_path ltree, -- e.g., 'supplier.123.agency.456.project.789'
    
    -- Temporal information
    relationship_start TIMESTAMP,
    relationship_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Prevent duplicate relationships
    UNIQUE(source_id, source_type, target_id, target_type, relationship_type)
);

-- Bidirectional relationship view for easier graph traversal
-- This view automatically creates inverse relationships for bidirectional queries
CREATE VIEW entity_graph AS 
-- Forward relationships
SELECT 
    id,
    source_id,
    source_type,
    target_id,
    target_type,
    relationship_type,
    strength,
    confidence,
    metadata,
    relationship_path,
    relationship_start,
    relationship_end,
    created_at,
    updated_at,
    'forward' as direction
FROM entity_relationships

UNION ALL

-- Reverse relationships (for bidirectional traversal)
SELECT 
    -id as id, -- Negative ID to distinguish reverse relationships
    target_id as source_id,
    target_type as source_type,
    source_id as target_id,
    source_type as target_type,
    relationship_type || '_inverse' as relationship_type,
    strength,
    confidence,
    metadata,
    relationship_path,
    relationship_start,
    relationship_end,
    created_at,
    updated_at,
    'reverse' as direction
FROM entity_relationships;

-- Entity summary view for quick entity information lookup
CREATE VIEW entity_summary AS
-- Companies as entities
SELECT 
    id as entity_id,
    'company' as entity_type,
    name as entity_name,
    description as entity_description,
    ARRAY[
        COALESCE(headquarters_city, ''),
        COALESCE(headquarters_state, ''),
        size_category
    ]::TEXT[] as entity_tags,
    credibility_score::DECIMAL(5,2) as entity_score,
    created_at
FROM companies

UNION ALL

-- Opportunities as entities  
SELECT 
    id as entity_id,
    'opportunity' as entity_type,
    title as entity_name,
    description as entity_description,
    ARRAY[
        COALESCE(industry, ''),
        COALESCE(buyer_type, ''),
        COALESCE(difficulty_level, '')
    ]::TEXT[] as entity_tags,
    COALESCE(project_value_max / 1000000.0, 0)::DECIMAL(5,2) as entity_score, -- Project value in millions
    created_at
FROM opportunities

UNION ALL

-- Users as entities (for relationship tracking)
SELECT 
    id as entity_id,
    'user' as entity_type,
    COALESCE(first_name || ' ' || last_name, email) as entity_name,
    COALESCE(company_name, 'Individual User') as entity_description,
    ARRAY[COALESCE(role, 'user')]::TEXT[] as entity_tags,
    CASE WHEN last_login IS NOT NULL THEN 1.0 ELSE 0.0 END as entity_score,
    created_at
FROM users;

-- Performance indexes for graph queries
CREATE INDEX idx_entity_relationships_source ON entity_relationships (source_id, source_type);
CREATE INDEX idx_entity_relationships_target ON entity_relationships (target_id, target_type);
CREATE INDEX idx_entity_relationships_type ON entity_relationships (relationship_type);
CREATE INDEX idx_entity_relationships_strength ON entity_relationships (strength DESC);
CREATE INDEX idx_entity_relationships_path ON entity_relationships USING GIST (relationship_path);

-- Composite indexes for common query patterns
CREATE INDEX idx_entity_relationships_source_type ON entity_relationships (source_id, source_type, relationship_type);
CREATE INDEX idx_entity_relationships_target_type ON entity_relationships (target_id, target_type, relationship_type);

-- Full-text search index for relationship metadata
CREATE INDEX idx_entity_relationships_metadata ON entity_relationships USING GIN (metadata);

-- Helper functions for graph operations

-- Function to calculate relationship paths using ltree
CREATE OR REPLACE FUNCTION calculate_relationship_path(
    source_id INTEGER,
    source_type VARCHAR(50),
    target_id INTEGER,
    target_type VARCHAR(50)
) RETURNS ltree AS $$
BEGIN
    RETURN text2ltree(source_type || '.' || source_id || '.' || target_type || '.' || target_id);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find entities within N degrees of separation
CREATE OR REPLACE FUNCTION find_connected_entities(
    entity_id INTEGER,
    entity_type VARCHAR(50),
    max_depth INTEGER DEFAULT 2,
    relationship_types VARCHAR(100)[] DEFAULT NULL
) RETURNS TABLE(
    connected_entity_id INTEGER,
    connected_entity_type VARCHAR(50),
    relationship_path ltree[],
    total_strength DECIMAL(5,2),
    separation_degree INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE entity_connections(id, type, path, strength, depth) AS (
        -- Base case: direct relationships
        SELECT 
            er.target_id,
            er.target_type,
            ARRAY[er.relationship_path],
            er.strength,
            1
        FROM entity_relationships er
        WHERE er.source_id = find_connected_entities.entity_id 
        AND er.source_type = find_connected_entities.entity_type
        AND (relationship_types IS NULL OR er.relationship_type = ANY(relationship_types))
        
        UNION ALL
        
        -- Recursive case: extended relationships
        SELECT 
            er.target_id,
            er.target_type,
            ec.path || er.relationship_path,
            ec.strength * er.strength, -- Multiply strengths for path confidence
            ec.depth + 1
        FROM entity_connections ec
        JOIN entity_relationships er ON er.source_id = ec.id AND er.source_type = ec.type
        WHERE ec.depth < max_depth
        AND (relationship_types IS NULL OR er.relationship_type = ANY(relationship_types))
        -- Prevent cycles
        AND NOT (er.target_id = find_connected_entities.entity_id AND er.target_type = find_connected_entities.entity_type)
    )
    SELECT DISTINCT
        ec.id,
        ec.type,
        ec.path,
        ec.strength,
        ec.depth
    FROM entity_connections ec
    ORDER BY ec.strength DESC, ec.depth ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate entity centrality (how connected an entity is)
CREATE OR REPLACE FUNCTION calculate_entity_centrality(
    entity_id INTEGER,
    entity_type VARCHAR(50)
) RETURNS TABLE(
    incoming_connections INTEGER,
    outgoing_connections INTEGER,
    unique_connection_types INTEGER,
    average_relationship_strength DECIMAL(5,2),
    centrality_score DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH entity_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE er.target_id = calculate_entity_centrality.entity_id 
                           AND er.target_type = calculate_entity_centrality.entity_type) as incoming,
            COUNT(*) FILTER (WHERE er.source_id = calculate_entity_centrality.entity_id 
                           AND er.source_type = calculate_entity_centrality.entity_type) as outgoing,
            COUNT(DISTINCT er.relationship_type) as unique_types,
            AVG(er.strength) as avg_strength
        FROM entity_relationships er
        WHERE (er.source_id = calculate_entity_centrality.entity_id AND er.source_type = calculate_entity_centrality.entity_type)
           OR (er.target_id = calculate_entity_centrality.entity_id AND er.target_type = calculate_entity_centrality.entity_type)
    )
    SELECT 
        es.incoming::INTEGER,
        es.outgoing::INTEGER,
        es.unique_types::INTEGER,
        COALESCE(es.avg_strength, 0.0)::DECIMAL(5,2),
        -- Centrality score: weighted combination of connections and relationship strength
        (COALESCE(es.incoming + es.outgoing, 0) * COALESCE(es.avg_strength, 0) * 
         LOG(GREATEST(es.unique_types, 1)))::DECIMAL(5,2) as centrality_score
    FROM entity_stats es;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update relationship paths when relationships are inserted
CREATE OR REPLACE FUNCTION update_relationship_path()
RETURNS TRIGGER AS $$
BEGIN
    NEW.relationship_path = calculate_relationship_path(
        NEW.source_id, 
        NEW.source_type, 
        NEW.target_id, 
        NEW.target_type
    );
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_relationship_path
    BEFORE INSERT OR UPDATE ON entity_relationships
    FOR EACH ROW
    EXECUTE FUNCTION update_relationship_path();

-- Sample data to demonstrate graph relationships
-- This will be populated by the GraphQueryService based on existing data

COMMENT ON TABLE entity_relationships IS 'Graph-like relationship storage between all entities in the system';
COMMENT ON VIEW entity_graph IS 'Bidirectional view of entity relationships for easy graph traversal';
COMMENT ON VIEW entity_summary IS 'Unified view of all entities with consistent schema for graph operations';
COMMENT ON FUNCTION find_connected_entities IS 'Recursive function to find entities within N degrees of separation';
COMMENT ON FUNCTION calculate_entity_centrality IS 'Calculate how well-connected and influential an entity is in the network';