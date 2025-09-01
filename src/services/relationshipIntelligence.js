const defaultPool = require('../database/connection');

class RelationshipIntelligenceService {
  constructor(dbPool) {
    this.pool = dbPool || defaultPool;
  }

  async getOrganizations(filters = {}) {
    const { search, type, county, industry, influenceScore, limit = 50, offset = 0 } = filters;
    let query = `SELECT id, name, type, description, website, address_city, address_county, industry_sectors, key_business_areas, strategic_priorities, influence_score, collaboration_score, event_activity_level, employee_count_range, annual_revenue_range, created_at, updated_at FROM atlanta_organizations WHERE is_active = true`;
    const params = [];
    let paramCount = 0;
    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    if (type) {
      paramCount++;
      query += ` AND type = $${paramCount}`;
      params.push(type);
    }
    // ... other filters
    query += ` ORDER BY influence_score DESC, name ASC`;
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getPeople(filters = {}) {
    const { search, organizationId, seniority, department, expertise, influenceScore, limit = 50, offset = 0 } = filters;
    let query = `SELECT p.id, p.first_name, p.last_name, p.title, p.seniority_level, p.department, p.years_experience, p.areas_of_expertise, p.professional_interests, p.speaking_topics, p.network_influence_score, p.connection_count, p.activity_level, o.name as organization_name, o.type as organization_type, p.created_at, p.updated_at FROM atlanta_people p LEFT JOIN atlanta_organizations o ON p.organization_id = o.id WHERE p.is_active = true AND p.privacy_consent = true`;
    const params = [];
    let paramCount = 0;
    if (search) {
      paramCount++;
      query += ` AND (p.first_name ILIKE $${paramCount} OR p.last_name ILIKE $${paramCount} OR p.title ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    // ... other filters
    query += ` ORDER BY p.network_influence_score DESC, p.last_name ASC`;
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);
    const result = await this.pool.query(query, params);
    return result.rows;
  }
  // ... other methods using this.pool.query(...)
}

module.exports = { RelationshipIntelligenceService };