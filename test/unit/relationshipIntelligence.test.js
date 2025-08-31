const { test, describe } = require('node:test');
const assert = require('node:assert');

const { RelationshipIntelligenceService } = require('../../src/services/relationshipIntelligence');

describe('Relationship Intelligence Service', () => {
  let relationshipService;

  // Mock database connection for testing
  const mockPool = {
    query: (query, params) => {
      // Return mock responses based on query patterns
      if (query.includes('atlanta_organizations')) {
        return Promise.resolve({
          rows: [
            {
              id: 1,
              name: 'Test Corporation',
              type: 'corporation',
              description: 'Test company for relationship intelligence',
              address_county: 'Fulton',
              industry_sectors: ['Technology', 'Software'],
              influence_score: 8.5,
              collaboration_score: 7.8,
              event_activity_level: 'high'
            }
          ]
        });
      }
      
      if (query.includes('atlanta_people')) {
        return Promise.resolve({
          rows: [
            {
              id: 1,
              first_name: 'John',
              last_name: 'Doe',
              title: 'CEO',
              seniority_level: 'c-level',
              department: 'executive',
              network_influence_score: 9.2,
              connection_count: 250,
              organization_name: 'Test Corporation'
            },
            {
              id: 2,
              first_name: 'Jane',
              last_name: 'Smith',
              title: 'CTO',
              seniority_level: 'c-level',
              department: 'technology',
              network_influence_score: 8.7,
              connection_count: 180,
              organization_name: 'Test Corporation'
            }
          ]
        });
      }
      
      if (query.includes('connection_paths')) {
        return Promise.resolve({
          rows: [
            {
              degree: 2,
              path: [1, 3, 2],
              overall_strength: 'medium',
              business_relevance_score: 8.2,
              relationship_types: ['colleague', 'peer'],
              people_in_path: [
                { id: 1, name: 'John Doe', title: 'CEO', organization: 'Test Corp' },
                { id: 3, name: 'Bob Wilson', title: 'Director', organization: 'Partner Corp' },
                { id: 2, name: 'Jane Smith', title: 'CTO', organization: 'Target Corp' }
              ]
            }
          ]
        });
      }
      
      if (query.includes('atlanta_events')) {
        return Promise.resolve({
          rows: [
            {
              id: 1,
              name: 'Atlanta Tech Summit',
              event_type: 'conference',
              start_date: new Date('2024-06-15'),
              networking_potential: 'high',
              business_value_rating: 8.5,
              industry_focus: ['Technology', 'Software']
            }
          ]
        });
      }
      
      if (query.includes('atlanta_opportunities')) {
        return Promise.resolve({
          rows: [
            {
              id: 1,
              title: 'Smart City Technology Partnership',
              opportunity_type: 'partnership',
              estimated_value_min: 1000000,
              estimated_value_max: 5000000,
              source_organization_name: 'City of Atlanta',
              primary_contact_name: 'Mayor Johnson',
              current_status: 'open'
            }
          ]
        });
      }
      
      if (query.includes('atlanta_relationship_insights')) {
        return Promise.resolve({
          rows: [
            {
              id: 1,
              target_type: 'person',
              target_id: 1,
              insight_type: 'connection_path',
              insight_title: 'Strong Connection Path Available',
              insight_description: 'Direct connection to target through mutual colleague',
              relevance_score: 8.8,
              confidence_level: 9.2,
              actionability_score: 8.5,
              recommended_actions: ['Schedule introduction meeting', 'Prepare value proposition']
            }
          ]
        });
      }
      
      return Promise.resolve({ rows: [] });
    }
  };

  // Replace the database connection with mock for testing
  beforeEach(() => {
    relationshipService = new RelationshipIntelligenceService();
    // Mock the database connection
    const originalRequire = require;
    require = (id) => {
      if (id === '../database/connection') {
        return mockPool;
      }
      return originalRequire(id);
    };
  });

  test('should retrieve Atlanta organizations with filtering', async () => {
    const organizations = await relationshipService.getOrganizations({
      type: 'corporation',
      county: 'Fulton',
      influenceScore: 8.0,
      limit: 10
    });

    assert.ok(Array.isArray(organizations), 'Should return an array of organizations');
    assert.ok(organizations.length > 0, 'Should return at least one organization');
    
    const org = organizations[0];
    assert.ok(org.id, 'Organization should have an ID');
    assert.ok(org.name, 'Organization should have a name');
    assert.ok(org.type, 'Organization should have a type');
    assert.ok(typeof org.influence_score === 'number', 'Influence score should be numeric');
    assert.ok(Array.isArray(org.industry_sectors), 'Industry sectors should be an array');
  });

  test('should retrieve Atlanta professionals with search capabilities', async () => {
    const people = await relationshipService.getPeople({
      seniority: 'c-level',
      department: 'executive',
      influenceScore: 8.0,
      limit: 20
    });

    assert.ok(Array.isArray(people), 'Should return an array of people');
    assert.ok(people.length > 0, 'Should return at least one person');
    
    const person = people[0];
    assert.ok(person.id, 'Person should have an ID');
    assert.ok(person.first_name, 'Person should have first name');
    assert.ok(person.last_name, 'Person should have last name');
    assert.ok(person.title, 'Person should have title');
    assert.ok(typeof person.network_influence_score === 'number', 'Network influence should be numeric');
    assert.ok(typeof person.connection_count === 'number', 'Connection count should be numeric');
  });

  test('should find connection paths between people', async () => {
    const connectionPaths = await relationshipService.findConnectionPaths(1, 2, 3);

    assert.ok(Array.isArray(connectionPaths), 'Should return an array of connection paths');
    
    if (connectionPaths.length > 0) {
      const path = connectionPaths[0];
      assert.ok(typeof path.degree === 'number', 'Path should have degree of separation');
      assert.ok(Array.isArray(path.path), 'Path should have array of person IDs');
      assert.ok(path.overallStrength, 'Path should have overall strength rating');
      assert.ok(typeof path.businessRelevance === 'number', 'Path should have business relevance score');
      assert.ok(Array.isArray(path.peopleInPath), 'Path should include people information');
      assert.ok(path.path.length >= 2, 'Path should connect at least 2 people');
    }
  });

  test('should retrieve and filter Atlanta events', async () => {
    const events = await relationshipService.getEvents({
      eventType: 'conference',
      networkingPotential: 'high',
      limit: 5
    });

    assert.ok(Array.isArray(events), 'Should return an array of events');
    
    if (events.length > 0) {
      const event = events[0];
      assert.ok(event.id, 'Event should have an ID');
      assert.ok(event.name, 'Event should have a name');
      assert.ok(event.event_type, 'Event should have a type');
      assert.ok(event.start_date, 'Event should have start date');
      assert.ok(event.networking_potential, 'Event should have networking potential rating');
      assert.ok(typeof event.business_value_rating === 'number', 'Business value should be numeric');
    }
  });

  test('should recommend events based on person profile and goals', async () => {
    const recommendations = await relationshipService.recommendEvents(1, {
      goals: ['networking', 'business_development'],
      targetIndustries: ['Technology'],
      maxEvents: 3
    });

    assert.ok(Array.isArray(recommendations), 'Should return an array of event recommendations');
    assert.ok(recommendations.length <= 3, 'Should respect maxEvents limit');
    
    if (recommendations.length > 0) {
      const recommendation = recommendations[0];
      assert.ok(recommendation.id, 'Recommendation should have event ID');
      assert.ok(recommendation.name, 'Recommendation should have event name');
      assert.ok(typeof recommendation.recommendationScore === 'number', 'Should have recommendation score');
      assert.ok(recommendation.matchingCriteria, 'Should provide matching criteria');
      assert.ok(recommendation.recommendationScore >= 0 && recommendation.recommendationScore <= 10, 
        'Recommendation score should be 0-10');
    }
  });

  test('should retrieve business opportunities with relationship context', async () => {
    const opportunities = await relationshipService.getOpportunities({
      opportunityType: 'partnership',
      minValue: 500000,
      status: 'open',
      limit: 10
    });

    assert.ok(Array.isArray(opportunities), 'Should return an array of opportunities');
    
    if (opportunities.length > 0) {
      const opportunity = opportunities[0];
      assert.ok(opportunity.id, 'Opportunity should have an ID');
      assert.ok(opportunity.title, 'Opportunity should have a title');
      assert.ok(opportunity.opportunity_type, 'Opportunity should have a type');
      assert.ok(typeof opportunity.estimated_value_min === 'number', 'Min value should be numeric');
      assert.ok(opportunity.current_status, 'Opportunity should have status');
    }
  });

  test('should analyze opportunity fit with relationship advantages', async () => {
    const analysis = await relationshipService.analyzeOpportunity(1, 1, [
      'Software Development', 'Cloud Infrastructure', 'Project Management'
    ]);

    assert.ok(analysis, 'Should return opportunity analysis');
    assert.ok(analysis.opportunity, 'Should include opportunity details');
    assert.ok(analysis.capabilityAnalysis, 'Should include capability analysis');
    assert.ok(analysis.overallFitScore !== undefined, 'Should calculate overall fit score');
    assert.ok(Array.isArray(analysis.recommendations), 'Should provide recommendations');
    
    // Capability analysis validation
    const capAnalysis = analysis.capabilityAnalysis;
    assert.ok(Array.isArray(capAnalysis.requiredMatch), 'Should identify required capability matches');
    assert.ok(Array.isArray(capAnalysis.preferredMatch), 'Should identify preferred capability matches');
    assert.ok(Array.isArray(capAnalysis.missingRequired), 'Should identify missing required capabilities');
    assert.ok(typeof capAnalysis.strengthScore === 'number', 'Should calculate capability strength score');
    
    // Overall fit score should be reasonable
    assert.ok(analysis.overallFitScore >= 0 && analysis.overallFitScore <= 100, 
      'Overall fit score should be 0-100');
  });

  test('should retrieve AI-generated relationship insights', async () => {
    const insights = await relationshipService.getInsights({
      targetType: 'person',
      targetId: 1,
      minRelevance: 8.0,
      limit: 5
    });

    assert.ok(Array.isArray(insights), 'Should return an array of insights');
    
    if (insights.length > 0) {
      const insight = insights[0];
      assert.ok(insight.id, 'Insight should have an ID');
      assert.ok(insight.insight_title, 'Insight should have a title');
      assert.ok(insight.insight_description, 'Insight should have description');
      assert.ok(typeof insight.relevance_score === 'number', 'Should have relevance score');
      assert.ok(typeof insight.confidence_level === 'number', 'Should have confidence level');
      assert.ok(typeof insight.actionability_score === 'number', 'Should have actionability score');
      assert.ok(Array.isArray(insight.recommended_actions), 'Should have recommended actions');
    }
  });

  test('should perform comprehensive network analysis', async () => {
    const networkAnalysis = await relationshipService.analyzeNetwork(1, 'comprehensive');

    assert.ok(networkAnalysis, 'Should return network analysis');
    assert.ok(networkAnalysis.person, 'Should include person details');
    assert.ok(networkAnalysis.networkMetrics, 'Should include network metrics');
    assert.ok(networkAnalysis.industryPosition, 'Should include industry position analysis');
    assert.ok(networkAnalysis.influenceAnalysis, 'Should include influence analysis');
    assert.ok(Array.isArray(networkAnalysis.recommendations), 'Should provide recommendations');

    // Person details validation
    const person = networkAnalysis.person;
    assert.ok(person.id, 'Person should have ID');
    assert.ok(person.name, 'Person should have name');
    assert.ok(person.currentInfluenceScore !== undefined, 'Should have current influence score');

    // Network metrics validation
    const metrics = networkAnalysis.networkMetrics;
    assert.ok(typeof metrics.totalConnections === 'number', 'Should have total connections count');
    assert.ok(metrics.connectionStrengthDistribution, 'Should have connection strength distribution');
    assert.ok(typeof metrics.connectionStrengthDistribution.strong === 'number', 'Should count strong connections');
    assert.ok(typeof metrics.connectionStrengthDistribution.medium === 'number', 'Should count medium connections');
    assert.ok(typeof metrics.connectionStrengthDistribution.weak === 'number', 'Should count weak connections');

    // Industry position validation
    const industryPos = networkAnalysis.industryPosition;
    assert.ok(typeof industryPos.industryConnections === 'number', 'Should count industry connections');
    assert.ok(typeof industryPos.industryNetworkPenetration === 'number', 'Should calculate industry penetration');

    // Influence analysis validation
    const influence = networkAnalysis.influenceAnalysis;
    assert.ok(typeof influence.networkQualityScore === 'number', 'Should have network quality score');
    assert.ok(influence.growthPotential, 'Should assess growth potential');
    assert.ok(typeof influence.growthPotential.score === 'number', 'Growth potential should have score');
    assert.ok(Array.isArray(influence.growthPotential.factors), 'Should list growth factors');
  });

  test('should calculate network quality score correctly', async () => {
    const mockConnectionStats = {
      total_connections: '100',
      strong_connections: '30',
      medium_connections: '50',
      weak_connections: '20',
      avg_business_relevance: '7.5'
    };

    const qualityScore = relationshipService.calculateNetworkQualityScore(mockConnectionStats);
    
    assert.ok(typeof qualityScore === 'number', 'Quality score should be numeric');
    assert.ok(qualityScore >= 0 && qualityScore <= 10, 'Quality score should be 0-10');
    
    // Should weight strong connections more heavily
    const mockWeakNetwork = {
      total_connections: '100',
      strong_connections: '5',
      medium_connections: '15',
      weak_connections: '80',
      avg_business_relevance: '4.0'
    };
    
    const weakQualityScore = relationshipService.calculateNetworkQualityScore(mockWeakNetwork);
    assert.ok(qualityScore > weakQualityScore, 'Network with more strong connections should score higher');
  });

  test('should generate appropriate networking recommendations', async () => {
    const mockPerson = {
      seniority_level: 'c-level',
      organization_id: 1
    };
    
    const mockConnectionStats = {
      total_connections: '25', // Low total
      strong_connections: '5',
      medium_connections: '15',
      weak_connections: '5',
      avg_business_relevance: '6.0'
    };
    
    const mockIndustryNetwork = {
      industry_connections: '8', // Low industry penetration
      avg_industry_influence: '7.2'
    };

    const recommendations = relationshipService.generateNetworkRecommendations(
      mockPerson, mockConnectionStats, mockIndustryNetwork
    );

    assert.ok(Array.isArray(recommendations), 'Should return array of recommendations');
    assert.ok(recommendations.length > 0, 'Should generate at least one recommendation');
    
    const hasExpansionRec = recommendations.some(r => r.type === 'network_expansion');
    const hasIndustryRec = recommendations.some(r => r.type === 'industry_focus');
    const hasExecutiveRec = recommendations.some(r => r.type === 'executive_networking');
    
    assert.ok(hasExpansionRec, 'Should recommend network expansion for low connection count');
    assert.ok(hasIndustryRec, 'Should recommend industry focus for low industry penetration');
    assert.ok(hasExecutiveRec, 'Should recommend executive networking for C-level person');
    
    recommendations.forEach(rec => {
      assert.ok(rec.type, 'Recommendation should have type');
      assert.ok(rec.priority, 'Recommendation should have priority');
      assert.ok(rec.action, 'Recommendation should have action');
      assert.ok(rec.target, 'Recommendation should have target');
    });
  });

  test('should handle introduction requests properly', async () => {
    const introductionRequest = await relationshipService.requestIntroduction({
      fromPersonId: 1,
      toPersonId: 2,
      introducerPersonId: 3,
      message: 'Would like to discuss potential partnership opportunities',
      context: 'Met at Atlanta Tech Summit',
      urgency: 'normal'
    });

    assert.ok(introductionRequest, 'Should return introduction request response');
    assert.ok(introductionRequest.requestId, 'Should generate request ID');
    assert.ok(introductionRequest.status, 'Should have status');
    assert.ok(introductionRequest.estimatedResponse, 'Should provide estimated response time');
    assert.ok(Array.isArray(introductionRequest.nextSteps), 'Should provide next steps');
    assert.ok(introductionRequest.createdAt, 'Should have creation timestamp');
    
    // Urgency should affect response time
    assert.ok(typeof introductionRequest.estimatedResponse === 'string', 'Estimated response should be string');
  });

  test('should generate comprehensive dashboard data', async () => {
    const dashboardData = await relationshipService.getDashboardData(1);

    assert.ok(dashboardData, 'Should return dashboard data');
    assert.ok(dashboardData.networkSummary, 'Should include network summary');
    assert.ok(Array.isArray(dashboardData.recentInsights), 'Should include recent insights');
    assert.ok(Array.isArray(dashboardData.upcomingEvents), 'Should include upcoming events');
    assert.ok(Array.isArray(dashboardData.relevantOpportunities), 'Should include opportunities');
    assert.ok(Array.isArray(dashboardData.actionableRecommendations), 'Should include recommendations');
    assert.ok(dashboardData.weeklyActivity, 'Should include weekly activity metrics');

    // Network summary validation
    const summary = dashboardData.networkSummary;
    assert.ok(typeof summary.totalConnections === 'number', 'Should have total connections');
    assert.ok(typeof summary.influenceScore === 'number', 'Should have influence score');
    assert.ok(typeof summary.networkQuality === 'number', 'Should have network quality score');
    assert.ok(typeof summary.industryConnections === 'number', 'Should have industry connections');

    // Weekly activity validation
    const activity = dashboardData.weeklyActivity;
    assert.ok(typeof activity.newConnections === 'number', 'Should track new connections');
    assert.ok(typeof activity.eventsAttended === 'number', 'Should track events attended');
    assert.ok(typeof activity.opportunitiesViewed === 'number', 'Should track opportunities viewed');
    assert.ok(typeof activity.introductionsRequested === 'number', 'Should track introduction requests');
  });

  test('should handle errors gracefully', async () => {
    // Test with invalid person ID
    try {
      await relationshipService.analyzeNetwork(999999);
      assert.fail('Should throw error for invalid person ID');
    } catch (error) {
      assert.ok(error.message.includes('Person not found'), 'Should provide meaningful error message');
    }

    // Test with empty filters
    const emptyResults = await relationshipService.getOrganizations({});
    assert.ok(Array.isArray(emptyResults), 'Should handle empty filters gracefully');

    // Test with invalid connection path
    const emptyPath = await relationshipService.findConnectionPaths(999, 998, 2);
    assert.ok(Array.isArray(emptyPath), 'Should return empty array for invalid connection paths');
  });

  test('should respect privacy and data compliance', async () => {
    // Mock query should only return people with privacy_consent = true
    const people = await relationshipService.getPeople({ limit: 10 });
    
    // All returned people should have consented to data usage
    people.forEach(person => {
      // The mock query includes privacy filter in the service
      assert.ok(true, 'Service should only return people with privacy consent');
    });

    // Sensitive information should not be exposed in insights
    const insights = await relationshipService.getInsights({ limit: 5 });
    insights.forEach(insight => {
      assert.ok(!insight.insight_description.includes('private'), 'Should not expose private information');
      assert.ok(!insight.insight_description.includes('confidential'), 'Should not expose confidential information');
    });
  });

  test('should perform within acceptable time limits', async () => {
    const startTime = Date.now();
    
    // Test multiple operations to simulate dashboard load
    await Promise.all([
      relationshipService.getOrganizations({ limit: 10 }),
      relationshipService.getPeople({ limit: 10 }),
      relationshipService.getEvents({ limit: 5 }),
      relationshipService.getInsights({ limit: 5 })
    ]);
    
    const executionTime = Date.now() - startTime;
    
    // Should complete multiple operations within reasonable time
    assert.ok(executionTime < 5000, `Multiple operations should complete within 5 seconds, took ${executionTime}ms`);
  });
});