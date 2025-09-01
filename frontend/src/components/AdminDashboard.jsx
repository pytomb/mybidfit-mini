import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [conversionData, setConversionData] = useState(null);
  const [experienceComparison, setExperienceComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(7);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedTimeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please sign in to view analytics');
        return;
      }

      // Fetch conversion funnel data
      const funnelResponse = await axios.get('/api/analytics/conversion-funnel', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: new Date(Date.now() - selectedTimeRange * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        }
      });

      // Fetch experience comparison
      const comparisonResponse = await axios.get('/api/analytics/experience-comparison', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          days: selectedTimeRange
        }
      });

      setConversionData(funnelResponse.data.data);
      setExperienceComparison(comparisonResponse.data.data);
      setError(null);

    } catch (error) {
      console.error('Analytics fetch error:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return typeof num === 'number' ? num.toLocaleString() : num || '0';
  };

  const getExperienceColor = (experienceType) => {
    return experienceType === 'simple' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200';
  };

  const getHigherPerformer = (simpleValue, fullValue, higherIsBetter = true) => {
    if (!simpleValue || !fullValue) return '';
    const simpleNum = parseFloat(simpleValue);
    const fullNum = parseFloat(fullValue);
    
    if (higherIsBetter) {
      return simpleNum > fullNum ? 'simple' : simpleNum < fullNum ? 'full' : 'tie';
    } else {
      return simpleNum < fullNum ? 'simple' : simpleNum > fullNum ? 'full' : 'tie';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={fetchAnalytics}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">A/B Testing Dashboard</h1>
        <p className="text-gray-600 mb-4">Compare performance between Simple MVP and Full Platform experiences</p>
        
        {/* Time Range Selector */}
        <div className="flex gap-2 mb-6">
          {[7, 14, 30, 60].map(days => (
            <button
              key={days}
              onClick={() => setSelectedTimeRange(days)}
              className={`px-4 py-2 rounded ${
                selectedTimeRange === days 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Last {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Experience Comparison Overview */}
      {experienceComparison && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {experienceComparison.comparison.map(exp => (
            <div 
              key={exp.experience_type} 
              className={`p-6 rounded-lg border-2 ${getExperienceColor(exp.experience_type)}`}
            >
              <h3 className="text-xl font-semibold mb-4 capitalize">
                {exp.experience_type === 'simple' ? '🎯 Simple MVP' : '🏢 Full Platform'} Experience
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{formatNumber(exp.total_unique_users)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Daily Avg Users</p>
                  <p className="text-2xl font-bold">{formatNumber(exp.avg_daily_users)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Completions</p>
                  <p className="text-2xl font-bold">{formatNumber(exp.total_completions)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold">{exp.user_conversion_rate}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Purchases</p>
                  <p className="text-2xl font-bold">{formatNumber(exp.total_purchases)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Avg Score</p>
                  <p className="text-2xl font-bold">{exp.overall_avg_score ? parseFloat(exp.overall_avg_score).toFixed(1) : 'N/A'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Winner Analysis */}
      {experienceComparison && experienceComparison.comparison.length >= 2 && (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold mb-4">🏆 Performance Comparison</h3>
          
          {(() => {
            const simple = experienceComparison.comparison.find(e => e.experience_type === 'simple');
            const full = experienceComparison.comparison.find(e => e.experience_type === 'full');
            
            if (!simple || !full) return <p>Need data from both experiences for comparison</p>;

            const metrics = [
              { 
                name: 'User Conversion Rate', 
                simpleValue: simple.user_conversion_rate, 
                fullValue: full.user_conversion_rate, 
                unit: '%',
                higherIsBetter: true 
              },
              { 
                name: 'Average Daily Users', 
                simpleValue: simple.avg_daily_users, 
                fullValue: full.avg_daily_users,
                higherIsBetter: true 
              },
              { 
                name: 'Total Purchases', 
                simpleValue: simple.total_purchases, 
                fullValue: full.total_purchases,
                higherIsBetter: true 
              },
              { 
                name: 'Average Score', 
                simpleValue: simple.overall_avg_score, 
                fullValue: full.overall_avg_score,
                higherIsBetter: true 
              }
            ];

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metrics.map(metric => {
                  const winner = getHigherPerformer(metric.simpleValue, metric.fullValue, metric.higherIsBetter);
                  return (
                    <div key={metric.name} className="bg-white p-4 rounded border">
                      <p className="font-medium mb-2">{metric.name}</p>
                      <div className="flex justify-between text-sm">
                        <span className={winner === 'simple' ? 'font-bold text-blue-600' : ''}>
                          Simple: {formatNumber(metric.simpleValue)}{metric.unit}
                        </span>
                        <span className={winner === 'full' ? 'font-bold text-green-600' : ''}>
                          Full: {formatNumber(metric.fullValue)}{metric.unit}
                        </span>
                      </div>
                      {winner !== 'tie' && (
                        <p className="text-xs mt-1 text-gray-600">
                          🏆 {winner === 'simple' ? 'Simple MVP' : 'Full Platform'} wins
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Detailed Conversion Funnel */}
      {conversionData && conversionData.funnelData && (
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h3 className="text-xl font-semibold mb-4">📊 Conversion Funnel Breakdown</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Experience</th>
                  <th className="text-right p-2">Visits</th>
                  <th className="text-right p-2">Analyses Started</th>
                  <th className="text-right p-2">Analyses Completed</th>
                  <th className="text-right p-2">Upgrade Clicks</th>
                  <th className="text-right p-2">Purchases</th>
                  <th className="text-right p-2">Final Conversion</th>
                </tr>
              </thead>
              <tbody>
                {conversionData.funnelData.map(funnel => (
                  <tr key={funnel.experienceType} className="border-b">
                    <td className="p-2 font-medium capitalize">
                      {funnel.experienceType === 'simple' ? '🎯 Simple MVP' : '🏢 Full Platform'}
                    </td>
                    <td className="text-right p-2">{formatNumber(funnel.metrics.visits)}</td>
                    <td className="text-right p-2">
                      {formatNumber(funnel.metrics.analysesStarted)}
                      <br />
                      <span className="text-xs text-gray-500">({funnel.conversionRates.visitToAnalysis}%)</span>
                    </td>
                    <td className="text-right p-2">
                      {formatNumber(funnel.metrics.analysesCompleted)}
                      <br />
                      <span className="text-xs text-gray-500">({funnel.conversionRates.analysisCompletion}%)</span>
                    </td>
                    <td className="text-right p-2">
                      {formatNumber(funnel.metrics.upgradeClicks)}
                      <br />
                      <span className="text-xs text-gray-500">({funnel.conversionRates.upgradeRate}%)</span>
                    </td>
                    <td className="text-right p-2">{formatNumber(funnel.metrics.conversions)}</td>
                    <td className="text-right p-2">
                      <span className="font-bold">{funnel.conversionRates.finalConversion}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-8 text-center">
        <button
          onClick={fetchAnalytics}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Refresh Data
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;