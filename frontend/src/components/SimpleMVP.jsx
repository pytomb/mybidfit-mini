import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SimpleMVP = () => {
  const [rfpText, setRfpText] = useState('');
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    industry: '',
    capabilities: ''
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [analysisCount, setAnalysisCount] = useState(0);

  // Check authentication and get user data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Get user profile and analysis count
      fetchUserData();
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.data);
      setAnalysisCount(response.data.data.analysisCount || 0);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    
    if (!rfpText.trim() || !companyInfo.name.trim()) {
      setError('Please fill in both the RFP text and company name');
      return;
    }

    // Check usage limits for free users
    if (!user) {
      setError('Please sign in to analyze opportunities');
      return;
    }

    if (analysisCount >= 3 && !user.isPaid) {
      setError('You\'ve reached your free analysis limit. Please upgrade to continue.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      // Track MVP usage
      await axios.post('/api/analytics/track', {
        event: 'mvp_analysis_started',
        userId: user.id,
        experienceType: 'simple'
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Create or get company profile
      const companyResponse = await axios.post('/api/users/companies', companyInfo, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const companyId = companyResponse.data.data.id;

      // Create opportunity from RFP text
      const opportunityData = {
        title: `RFP Analysis - ${new Date().toLocaleDateString()}`,
        description: rfpText,
        requirements: rfpText,
        industry: companyInfo.industry,
        estimatedValue: 50000, // Default for MVP
        submissionDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      };

      const opportunityResponse = await axios.post('/api/opportunities', opportunityData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const opportunityId = opportunityResponse.data.data.id;

      // Score the opportunity fit
      const scoringResponse = await axios.post('/api/opportunities/score-fit', {
        companyId,
        opportunityId
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setResults(scoringResponse.data.data);
      setAnalysisCount(analysisCount + 1);

      // Track successful analysis
      await axios.post('/api/analytics/track', {
        event: 'mvp_analysis_completed',
        userId: user.id,
        experienceType: 'simple',
        score: scoringResponse.data.data.overallScore
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

    } catch (error) {
      console.error('Analysis error:', error);
      setError('Analysis failed. Please try again or contact support.');
      
      // Track error
      await axios.post('/api/analytics/track', {
        event: 'mvp_analysis_error',
        userId: user?.id,
        experienceType: 'simple',
        error: error.message
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).catch(() => {}); // Don't fail if tracking fails

    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score) => {
    if (score >= 85) return 'Excellent Fit';
    if (score >= 70) return 'Good Opportunity';
    if (score >= 50) return 'Fair Chance';
    return 'Poor Match';
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">MyBidFit RFP Analyzer</h1>
          <p className="text-gray-600 mb-8">
            Instantly score how well opportunities match your capabilities
          </p>
          <div className="bg-blue-50 p-6 rounded-lg">
            <p className="mb-4">Please sign in to analyze RFPs and opportunities</p>
            <button 
              onClick={() => window.location.href = '/auth/login'}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Sign In to Get Started
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">RFP Opportunity Analyzer</h1>
        <p className="text-gray-600 mb-4">
          Paste in an RFP or opportunity description and get instant fit scoring with detailed explanations
        </p>
        
        {/* Usage Counter */}
        <div className="bg-gray-50 p-3 rounded-lg inline-block">
          <span className="text-sm">
            Analyses used: <strong>{analysisCount}/3</strong>
            {analysisCount >= 3 && !user.isPaid && (
              <span className="text-red-600 ml-2">
                (Upgrade for unlimited analyses)
              </span>
            )}
          </span>
        </div>
      </div>

      {!results ? (
        // Input Form
        <form onSubmit={handleAnalyze} className="space-y-6">
          {/* Company Information */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Your Company Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Company Name *</label>
                <input
                  type="text"
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Your Company Name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Industry</label>
                <input
                  type="text"
                  value={companyInfo.industry}
                  onChange={(e) => setCompanyInfo({...companyInfo, industry: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g. IT Services, Manufacturing"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Key Capabilities</label>
                <input
                  type="text"
                  value={companyInfo.capabilities}
                  onChange={(e) => setCompanyInfo({...companyInfo, capabilities: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g. Software Development, Cloud Migration"
                />
              </div>
            </div>
          </div>

          {/* RFP Input */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">RFP or Opportunity Description</h2>
            <textarea
              value={rfpText}
              onChange={(e) => setRfpText(e.target.value)}
              rows={12}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Paste the full RFP text, opportunity description, or requirements document here..."
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              The more detailed the opportunity description, the more accurate your fit score will be.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isAnalyzing || (analysisCount >= 3 && !user.isPaid)}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? 'Analyzing Opportunity...' : 'Analyze Opportunity Fit'}
          </button>
        </form>
      ) : (
        // Results Display
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-white p-6 rounded-lg border shadow-sm text-center">
            <h2 className="text-2xl font-bold mb-4">Opportunity Fit Analysis</h2>
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(results.overallScore)}`}>
              {results.overallScore}
            </div>
            <div className="text-xl mb-4">{getScoreLabel(results.overallScore)}</div>
            <div className="text-gray-600">
              Confidence Level: <strong>{results.confidenceLevel}</strong>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Detailed Analysis</h3>
            {results.judgeScores && results.judgeScores.map((judge, index) => (
              <div key={index} className="mb-4 p-4 bg-gray-50 rounded">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{judge.judgeName}</h4>
                  <span className={`font-bold ${getScoreColor(judge.score)}`}>
                    {judge.score}/100
                  </span>
                </div>
                <p className="text-sm text-gray-700">{judge.reasoning}</p>
                {judge.evidence && (
                  <ul className="text-xs text-gray-600 mt-2 ml-4">
                    {judge.evidence.map((item, i) => (
                      <li key={i} className="list-disc">{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => {
                setResults(null);
                setRfpText('');
                setError(null);
              }}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
            >
              Analyze Another RFP
            </button>
            {!user.isPaid && (
              <button
                onClick={() => window.location.href = '/pricing'}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
              >
                Upgrade for Unlimited Analyses
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleMVP;