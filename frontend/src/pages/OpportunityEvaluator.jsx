import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import '../styles/OpportunityEvaluator.css';

const OpportunityEvaluator = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { enhancedProfile } = location.state || {};
  
  const [inputMethod, setInputMethod] = useState('upload'); // upload, paste, form, url
  const [opportunityData, setOpportunityData] = useState({
    title: '',
    organization: '',
    type: '',
    budget: '',
    deadline: '',
    description: '',
    requirements: '',
    evaluationCriteria: '',
    uploadedFile: null,
    url: ''
  });
  
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState(null);

  // Dropzone for RFP upload
  const onDrop = useCallback(acceptedFiles => {
    setOpportunityData(prev => ({
      ...prev,
      uploadedFile: acceptedFiles[0]
    }));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  });

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    
    // Simulate parsing and evaluation
    // In production, this would call the backend opportunityScoring service
    setTimeout(() => {
      setEvaluationResults({
        overallScore: 78,
        verdict: 'RECOMMENDED',
        confidence: 0.82,
        judges: {
          technical: {
            score: 85,
            verdict: 'STRONG_FIT',
            reasoning: 'Your technical capabilities align well with requirements. Strong match on cloud infrastructure and DevOps expertise.',
            gaps: ['Kubernetes certification recommended', 'Limited blockchain experience'],
            evidence: ['5 similar projects completed', 'Team has required certifications']
          },
          domain: {
            score: 72,
            verdict: 'MODERATE_FIT',
            reasoning: 'Good healthcare industry experience, but limited work with large hospital systems.',
            gaps: ['No direct EMR integration experience', 'Limited HIPAA compliance projects'],
            evidence: ['3 healthcare clients', '2 years in medical technology']
          },
          financial: {
            score: 90,
            verdict: 'EXCELLENT_FIT',
            reasoning: 'Budget aligns perfectly with your typical project size. Good profit margin potential.',
            gaps: [],
            evidence: ['Average project size: $250K', 'Budget range: $200-300K']
          },
          capacity: {
            score: 68,
            verdict: 'MODERATE_FIT',
            reasoning: 'Current team capacity is 70% utilized. May need to hire or delay other projects.',
            gaps: ['2 developers needed', 'Project manager availability limited'],
            evidence: ['Team size: 25', 'Current utilization: 70%']
          },
          competitive: {
            score: 75,
            verdict: 'MODERATE_FIT',
            reasoning: 'Strong technical differentiation but facing 3-4 established competitors.',
            gaps: ['No existing relationship with buyer', 'Competitors have local presence'],
            evidence: ['Unique AI capabilities', 'Competitive pricing model']
          }
        },
        recommendations: [
          {
            priority: 'HIGH',
            action: 'Partner with local healthcare IT firm',
            impact: 'Increases win probability by 15%',
            reasoning: 'Addresses domain expertise gap and local presence requirement'
          },
          {
            priority: 'MEDIUM',
            action: 'Obtain Kubernetes certification for 2 team members',
            impact: 'Strengthens technical score by 5 points',
            reasoning: 'Directly addresses technical requirement gap'
          },
          {
            priority: 'LOW',
            action: 'Prepare detailed HIPAA compliance documentation',
            impact: 'Improves domain credibility',
            reasoning: 'Demonstrates healthcare regulatory understanding'
          }
        ],
        proposalStrategy: {
          winThemes: [
            'Proven cloud migration expertise with quantified results',
            'Agile delivery methodology with fixed-price guarantee',
            'Local partnership ensuring on-site support'
          ],
          differentiators: [
            'AI-powered optimization reducing operational costs by 30%',
            'Zero-downtime migration approach',
            '24/7 support included in base price'
          ],
          riskMitigation: [
            'Phased delivery approach reducing implementation risk',
            'Money-back guarantee for defined SLAs',
            'Knowledge transfer and training included'
          ]
        },
        timeline: {
          daysUntilDeadline: 14,
          recommendedActions: [
            { day: 1, action: 'Reach out to potential partners' },
            { day: 3, action: 'Submit clarification questions' },
            { day: 5, action: 'Complete technical solution design' },
            { day: 8, action: 'Finalize pricing strategy' },
            { day: 10, action: 'Complete proposal draft' },
            { day: 12, action: 'Internal review and refinement' },
            { day: 14, action: 'Submit proposal' }
          ]
        }
      });
      setIsEvaluating(false);
    }, 3000);
  };

  const handleViewVisualization = () => {
    navigate('/evaluation-results', { 
      state: { 
        evaluationResults,
        opportunityData,
        enhancedProfile 
      } 
    });
  };

  const opportunityTypes = [
    'Government RFP',
    'Private Sector RFP',
    'Direct Opportunity',
    'Subcontract Opportunity',
    'Grant Application',
    'Partnership Request'
  ];

  return (
    <div className="opportunity-evaluator">
      <div className="evaluator-header">
        <h1>Evaluate Opportunity Fit</h1>
        <p>Input an RFP or problem statement to see how well it matches your capabilities</p>
        {enhancedProfile && (
          <div className="profile-summary">
            <span className="profile-indicator">
              Profile: <strong>{enhancedProfile.name}</strong> | 
              Completeness: <strong>{enhancedProfile.completeness}%</strong>
            </span>
          </div>
        )}
      </div>

      <div className="evaluator-content">
        <div className="input-methods">
          <button
            className={`method-btn ${inputMethod === 'upload' ? 'active' : ''}`}
            onClick={() => setInputMethod('upload')}
          >
            📤 Upload Document
          </button>
          <button
            className={`method-btn ${inputMethod === 'paste' ? 'active' : ''}`}
            onClick={() => setInputMethod('paste')}
          >
            📝 Paste Text
          </button>
          <button
            className={`method-btn ${inputMethod === 'form' ? 'active' : ''}`}
            onClick={() => setInputMethod('form')}
          >
            📋 Structured Form
          </button>
          <button
            className={`method-btn ${inputMethod === 'url' ? 'active' : ''}`}
            onClick={() => setInputMethod('url')}
          >
            🔗 Enter URL
          </button>
        </div>

        <div className="input-panel">
          {inputMethod === 'upload' && (
            <div className="upload-section">
              <h2>Upload RFP Document</h2>
              <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                {opportunityData.uploadedFile ? (
                  <div className="file-uploaded">
                    <span className="file-icon">📄</span>
                    <span>{opportunityData.uploadedFile.name}</span>
                    <button 
                      className="remove-file"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpportunityData(prev => ({ ...prev, uploadedFile: null }));
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="dropzone-content">
                    <span className="upload-icon">⬆️</span>
                    <p>Drag & drop RFP document or click to browse</p>
                    <small>PDF, Word, or Text files</small>
                  </div>
                )}
              </div>
              
              <div className="quick-details">
                <h3>Quick Details (Optional)</h3>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Opportunity Title"
                    value={opportunityData.title}
                    onChange={(e) => setOpportunityData(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="Budget Range"
                    value={opportunityData.budget}
                    onChange={(e) => setOpportunityData(prev => ({ ...prev, budget: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          {inputMethod === 'paste' && (
            <div className="paste-section">
              <h2>Paste RFP or Problem Statement</h2>
              <textarea
                placeholder="Paste the full RFP text or problem statement here..."
                value={opportunityData.description}
                onChange={(e) => setOpportunityData(prev => ({ ...prev, description: e.target.value }))}
                rows={15}
              />
              
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Opportunity Title"
                  value={opportunityData.title}
                  onChange={(e) => setOpportunityData(prev => ({ ...prev, title: e.target.value }))}
                />
                <input
                  type="text"
                  placeholder="Organization"
                  value={opportunityData.organization}
                  onChange={(e) => setOpportunityData(prev => ({ ...prev, organization: e.target.value }))}
                />
              </div>
            </div>
          )}

          {inputMethod === 'form' && (
            <div className="form-section">
              <h2>Structured Opportunity Details</h2>
              
              <div className="form-group">
                <label>Opportunity Title *</label>
                <input
                  type="text"
                  value={opportunityData.title}
                  onChange={(e) => setOpportunityData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Cloud Migration Services for Healthcare System"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Organization *</label>
                  <input
                    type="text"
                    value={opportunityData.organization}
                    onChange={(e) => setOpportunityData(prev => ({ ...prev, organization: e.target.value }))}
                    placeholder="e.g., County General Hospital"
                  />
                </div>
                
                <div className="form-group">
                  <label>Opportunity Type</label>
                  <select
                    value={opportunityData.type}
                    onChange={(e) => setOpportunityData(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="">Select type</option>
                    {opportunityTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Budget Range</label>
                  <input
                    type="text"
                    value={opportunityData.budget}
                    onChange={(e) => setOpportunityData(prev => ({ ...prev, budget: e.target.value }))}
                    placeholder="e.g., $200,000 - $300,000"
                  />
                </div>
                
                <div className="form-group">
                  <label>Submission Deadline</label>
                  <input
                    type="date"
                    value={opportunityData.deadline}
                    onChange={(e) => setOpportunityData(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Project Description *</label>
                <textarea
                  value={opportunityData.description}
                  onChange={(e) => setOpportunityData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the project scope, objectives, and deliverables..."
                  rows={5}
                />
              </div>
              
              <div className="form-group">
                <label>Key Requirements</label>
                <textarea
                  value={opportunityData.requirements}
                  onChange={(e) => setOpportunityData(prev => ({ ...prev, requirements: e.target.value }))}
                  placeholder="List technical requirements, certifications, experience needed..."
                  rows={4}
                />
              </div>
              
              <div className="form-group">
                <label>Evaluation Criteria</label>
                <textarea
                  value={opportunityData.evaluationCriteria}
                  onChange={(e) => setOpportunityData(prev => ({ ...prev, evaluationCriteria: e.target.value }))}
                  placeholder="How will proposals be evaluated? (e.g., Technical 40%, Price 30%, Experience 30%)"
                  rows={3}
                />
              </div>
            </div>
          )}

          {inputMethod === 'url' && (
            <div className="url-section">
              <h2>Enter RFP URL</h2>
              <p className="section-hint">
                Provide a link to an online RFP or opportunity posting
              </p>
              
              <input
                type="url"
                placeholder="https://example.com/rfp/cloud-migration-services"
                value={opportunityData.url}
                onChange={(e) => setOpportunityData(prev => ({ ...prev, url: e.target.value }))}
                className="url-input"
              />
              
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Opportunity Title (Optional)"
                  value={opportunityData.title}
                  onChange={(e) => setOpportunityData(prev => ({ ...prev, title: e.target.value }))}
                />
                <input
                  type="text"
                  placeholder="Organization (Optional)"
                  value={opportunityData.organization}
                  onChange={(e) => setOpportunityData(prev => ({ ...prev, organization: e.target.value }))}
                />
              </div>
            </div>
          )}
        </div>

        {!evaluationResults && (
          <div className="action-buttons">
            <button 
              className="btn-evaluate"
              onClick={handleEvaluate}
              disabled={isEvaluating || (!opportunityData.uploadedFile && !opportunityData.description && !opportunityData.url)}
            >
              {isEvaluating ? 'Evaluating Fit...' : 'Evaluate Opportunity Fit'}
            </button>
          </div>
        )}

        {evaluationResults && (
          <div className="evaluation-summary">
            <h2>Evaluation Complete</h2>
            
            <div className="score-overview">
              <div className={`overall-score ${evaluationResults.verdict.toLowerCase()}`}>
                <div className="score-value">{evaluationResults.overallScore}</div>
                <div className="score-label">Overall Fit Score</div>
              </div>
              
              <div className="verdict">
                <span className={`verdict-badge ${evaluationResults.verdict.toLowerCase()}`}>
                  {evaluationResults.verdict.replace('_', ' ')}
                </span>
                <p className="confidence">Confidence: {(evaluationResults.confidence * 100).toFixed(0)}%</p>
              </div>
            </div>

            <div className="judge-summary">
              <h3>Judge Scores</h3>
              <div className="judge-grid">
                {Object.entries(evaluationResults.judges).map(([judge, data]) => (
                  <div key={judge} className="judge-card">
                    <div className="judge-header">
                      <span className="judge-name">{judge.charAt(0).toUpperCase() + judge.slice(1)}</span>
                      <span className={`judge-score ${data.verdict.toLowerCase()}`}>
                        {data.score}
                      </span>
                    </div>
                    <p className="judge-reasoning">{data.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="top-recommendations">
              <h3>Top Recommendations</h3>
              {evaluationResults.recommendations.slice(0, 3).map((rec, idx) => (
                <div key={idx} className={`recommendation ${rec.priority.toLowerCase()}`}>
                  <span className="rec-priority">{rec.priority}</span>
                  <div className="rec-content">
                    <strong>{rec.action}</strong>
                    <p>{rec.impact}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="action-buttons">
              <button className="btn-visualize" onClick={handleViewVisualization}>
                View Detailed Analysis & Visualizations →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunityEvaluator;