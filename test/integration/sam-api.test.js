
const { fetchOpportunities } = require('../../src/integrations/sam');

describe('SAM.gov API Integration', () => {
  it('should fetch opportunities from the SAM.gov API', async () => {
    const params = { q: 'software' };
    const opportunities = await fetchOpportunities(params);
    console.log('Successfully fetched opportunities:', opportunities);
    expect(opportunities).toBeDefined();
    expect(opportunities.opportunities).toBeInstanceOf(Array);
  });
});
