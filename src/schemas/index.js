/**
 * Central export for all validation schemas
 */

const authSchemas = require('./auth.schema');
const profileSchemas = require('./profile.schema');
const opportunitySchemas = require('./opportunity.schema');

module.exports = {
  // Auth schemas
  ...authSchemas,
  
  // Profile schemas
  ...profileSchemas,
  
  // Opportunity schemas
  ...opportunitySchemas,
  
  // Grouped exports for convenience
  auth: authSchemas,
  profile: profileSchemas,
  opportunity: opportunitySchemas
};