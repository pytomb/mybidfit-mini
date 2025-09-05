# Mock Data Configuration Strategy - Flexible Data Sources

## Current Mock Data Analysis

I've identified the following primary mock data usage areas:

### 🎯 **High Priority - Production Mock Data**

1. **`src/routes/scoring.js`**
   - `getMockOpportunities()` - Returns 6 hardcoded government opportunities
   - `getActiveOpportunities()` - Currently calls getMockOpportunities()
   - `getOpportunity(id)` - Searches mock array

2. **`src/routes/partnerFit.js`**
   - `generateMockPartnerResults()` - Returns 4 hardcoded partner companies
   - Partner search endpoint uses mock data exclusively

3. **`frontend/src/pages/OpportunityDetail.jsx`**
   - Frontend has its own `mockOpportunities` object
   - Duplicates backend mock data structure

4. **`scripts/seed.js`**
   - `mockSuppliers` - 20 example companies for seeding
   - `mockOpportunities` - 10 example opportunities for seeding

## New Strategy: Configurable Data Sources

### **Environment-Based Data Source Selection**

**Configuration Options:**
```javascript
// .env variables
DATA_SOURCE_MODE=mock|database|hybrid|external
OPPORTUNITIES_SOURCE=mock|database|sam_gov
PARTNERS_SOURCE=mock|database|enhanced
AI_ANALYSIS_MODE=mock|openrouter|hybrid
```

### **Implementation Approach**

### **Phase 1: Data Source Abstraction Layer (Week 1)**

1. **Create Data Source Managers**
   - `OpportunityDataSource` - Handles opportunity data from any source
   - `CompanyDataSource` - Handles partner/company data from any source  
   - `AnalysisDataSource` - Handles AI analysis from any source

2. **Configuration System**
   - Environment-based data source selection
   - Runtime switching capability
   - Graceful fallback mechanisms

### **Phase 2: Multi-Source Implementation (Week 2)**

3. **Opportunity Sources**
   - Mock: Current getMockOpportunities() (fast, predictable)
   - Database: Query opportunities table (realistic, persistent)
   - SAM.gov: Live government data (real-time, accurate)
   - Hybrid: Database + SAM.gov sync

4. **Partner Sources**
   - Mock: Current generateMockPartnerResults() (instant testing)
   - Database: Query companies table (realistic matching)
   - Enhanced: Database + external APIs (comprehensive data)

### **Phase 3: Intelligent Switching (Week 3)**

5. **Smart Data Source Selection**
   - Development: Default to mock for speed
   - Testing: Use database for integration tests
   - Staging: Use hybrid (database + limited external calls)
   - Production: Use external APIs with database fallback

6. **Performance Optimization**
   - Cache external API results
   - Background sync for hybrid mode
   - Circuit breakers for external failures

### **Phase 4: Enhanced Mock Data (Week 4)**

7. **Improved Mock Data Quality**
   - Larger mock datasets for better testing
   - More realistic data scenarios
   - Edge cases and error conditions
   - Performance testing data sets

## Technical Implementation Details

### **Data Source Interface**
```javascript
class OpportunityDataSource {
  async getActiveOpportunities(filters) {
    switch(process.env.OPPORTUNITIES_SOURCE) {
      case 'mock': return this.getMockOpportunities(filters);
      case 'database': return this.getDatabaseOpportunities(filters);
      case 'sam_gov': return this.getSamGovOpportunities(filters);
      case 'hybrid': return this.getHybridOpportunities(filters);
    }
  }
}
```

### **Configuration Benefits**
- **Development Speed**: Mock data = instant responses
- **Integration Testing**: Database = realistic scenarios  
- **Production Ready**: External APIs = live data
- **Fallback Safety**: Automatic degradation when external fails
- **A/B Testing**: Easy switching to compare data quality

### **Environment Recommendations**
- **Local Development**: `DATA_SOURCE_MODE=mock` (fastest iteration)
- **Unit Tests**: `DATA_SOURCE_MODE=mock` (predictable, fast)
- **Integration Tests**: `DATA_SOURCE_MODE=database` (realistic scenarios)
- **Staging**: `DATA_SOURCE_MODE=hybrid` (mix of real/cached data)
- **Production**: `DATA_SOURCE_MODE=external` (live data with fallbacks)

### **Migration Path**
1. **Week 1**: Implement configuration system, no breaking changes
2. **Week 2**: Add database and external sources as options
3. **Week 3**: Enable hybrid modes and smart fallbacks  
4. **Week 4**: Optimize and enhance mock data quality

### **Quality Assurance**
- All existing functionality preserved
- Mock data enhanced with more scenarios
- Database integration optional but available
- External APIs integrated with proper error handling
- Easy switching between modes for testing different scenarios

## Expected Outcomes
- ✅ **Flexibility**: Choose best data source per environment
- ✅ **Speed**: Keep mock data for fast development
- ✅ **Realism**: Add database/external sources when needed
- ✅ **Safety**: Fallback mechanisms prevent failures
- ✅ **Testing**: Better test coverage with multiple data sources
- ✅ **Production**: Real data available when ready

## Detailed Mock Data Locations Found

### **Backend Mock Data**
- `src/routes/scoring.js:328` - `getMockOpportunities()` with 6 government opportunities
- `src/routes/partnerFit.js:377` - `generateMockPartnerResults()` with 4 partner companies
- `src/services/supplierAnalysis.js:31` - Mock AI implementation comments
- `src/services/eventRecommendations.js:77` - Mock event generation
- `src/services/featureFlags.js:74` - `MOCK_DATA_ACCESS: true` flag
- `scripts/seed.js:8,71` - Mock suppliers and opportunities for seeding

### **Frontend Mock Data**
- `frontend/src/pages/OpportunityDetail.jsx:50` - Frontend mock opportunities object

### **Test Mock Data (Keep As-Is)**
- All test files with appropriate mocking for unit/integration tests
- Database connection mocking in test environments
- Frontend test setup mocking

### **Configuration Files**
- `scripts/seed-config.js:23` - Test configuration with mock data flags
- Various test configuration files appropriately using mocks

## Implementation Priority

### **High Priority (Production Impact)**
1. Scoring route mock opportunities
2. Partner fit route mock partners
3. Frontend opportunity detail mock data

### **Medium Priority (Development Quality)**
4. Seed data configuration
5. Service layer mock implementations
6. Event recommendations mock data

### **Low Priority (Enhancement)**
7. Enhanced mock data quality
8. Performance testing mock datasets
9. Edge case mock scenarios