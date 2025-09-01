import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/ProfileEnhancer.css';

const ProfileEnhancer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysisResults, companyInfo, uploadedFiles } = location.state || {};
  
  const [enhancements, setEnhancements] = useState({
    certifications: [],
    teamSize: '',
    teamComposition: '',
    quantifiedResults: [],
    geographicCoverage: [],
    partnerships: [],
    differentiators: '',
    weaknesses: '',
    idealClient: '',
    avgProjectSize: '',
    deliveryModel: ''
  });

  const [importanceWeights, setImportanceWeights] = useState({
    technical: 3,
    domain: 3,
    financial: 3,
    capacity: 3,
    innovation: 3
  });

  const [currentSection, setCurrentSection] = useState('certifications');

  // Common certifications by industry
  const certificationOptions = {
    'Government': ['FedRAMP', 'CMMC', 'ISO 27001', 'SOC 2', 'GSA Schedule'],
    'Healthcare': ['HIPAA', 'HITRUST', 'HL7', 'ISO 13485'],
    'Financial': ['PCI DSS', 'SOC 1', 'SOC 2', 'ISO 27001'],
    'Technology': ['AWS Certified', 'Azure Certified', 'Google Cloud', 'Kubernetes', 'Scrum/Agile']
  };

  const geographicOptions = [
    'United States - Nationwide',
    'United States - East Coast',
    'United States - West Coast',
    'United States - Midwest',
    'United States - South',
    'Canada',
    'Europe',
    'Asia Pacific',
    'Remote Only',
    'Global'
  ];

  const handleCertificationToggle = (cert) => {
    setEnhancements(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert]
    }));
  };

  const handleAddQuantifiedResult = () => {
    setEnhancements(prev => ({
      ...prev,
      quantifiedResults: [...prev.quantifiedResults, { metric: '', value: '', context: '' }]
    }));
  };

  const handleQuantifiedResultChange = (index, field, value) => {
    setEnhancements(prev => ({
      ...prev,
      quantifiedResults: prev.quantifiedResults.map((result, i) =>
        i === index ? { ...result, [field]: value } : result
      )
    }));
  };

  const handleAddPartnership = () => {
    setEnhancements(prev => ({
      ...prev,
      partnerships: [...prev.partnerships, { name: '', type: '', description: '' }]
    }));
  };

  const handlePartnershipChange = (index, field, value) => {
    setEnhancements(prev => ({
      ...prev,
      partnerships: prev.partnerships.map((partner, i) =>
        i === index ? { ...partner, [field]: value } : partner
      )
    }));
  };

  const calculateEnhancedCompleteness = () => {
    const baseCompleteness = analysisResults?.completeness || 65;
    let enhancement = 0;
    
    if (enhancements.certifications.length > 0) enhancement += 5;
    if (enhancements.teamSize) enhancement += 5;
    if (enhancements.quantifiedResults.length > 0) enhancement += 10;
    if (enhancements.geographicCoverage.length > 0) enhancement += 5;
    if (enhancements.partnerships.length > 0) enhancement += 5;
    if (enhancements.differentiators) enhancement += 5;
    
    return Math.min(100, baseCompleteness + enhancement);
  };

  const handleSaveProfile = () => {
    // In production, this would save to database
    const enhancedProfile = {
      ...companyInfo,
      ...analysisResults,
      manualEnhancements: enhancements,
      importanceWeights,
      completeness: calculateEnhancedCompleteness(),
      enhancedAt: new Date().toISOString()
    };
    
    // Navigate to opportunity evaluator with enhanced profile
    navigate('/opportunity-evaluator', { state: { enhancedProfile } });
  };

  const sections = [
    { id: 'certifications', label: 'Certifications & Compliance', icon: '🏆' },
    { id: 'team', label: 'Team & Capacity', icon: '👥' },
    { id: 'results', label: 'Quantified Results', icon: '📊' },
    { id: 'geographic', label: 'Geographic Coverage', icon: '🌍' },
    { id: 'partnerships', label: 'Partnerships', icon: '🤝' },
    { id: 'differentiators', label: 'Differentiators', icon: '⭐' },
    { id: 'weights', label: 'Priority Weights', icon: '⚖️' }
  ];

  return (
    <div className="profile-enhancer">
      <div className="enhancer-header">
        <h1>Enhance Your Profile</h1>
        <p>Add context that isn't reflected in your marketing materials</p>
        <div className="completeness-indicator">
          <span>Profile Completeness:</span>
          <div className="completeness-bar">
            <div 
              className="completeness-fill"
              style={{ width: `${calculateEnhancedCompleteness()}%` }}
            >
              {calculateEnhancedCompleteness()}%
            </div>
          </div>
        </div>
      </div>

      <div className="enhancer-content">
        <div className="section-nav">
          {sections.map(section => (
            <button
              key={section.id}
              className={`section-nav-item ${currentSection === section.id ? 'active' : ''}`}
              onClick={() => setCurrentSection(section.id)}
            >
              <span className="section-icon">{section.icon}</span>
              <span>{section.label}</span>
            </button>
          ))}
        </div>

        <div className="enhancement-panel">
          {currentSection === 'certifications' && (
            <div className="section-content">
              <h2>Certifications & Compliance</h2>
              <p className="section-hint">
                Select certifications your company holds. These are critical for many opportunities but often missing from marketing materials.
              </p>
              
              {Object.entries(certificationOptions).map(([industry, certs]) => (
                <div key={industry} className="cert-group">
                  <h3>{industry}</h3>
                  <div className="cert-options">
                    {certs.map(cert => (
                      <label key={cert} className="cert-checkbox">
                        <input
                          type="checkbox"
                          checked={enhancements.certifications.includes(cert)}
                          onChange={() => handleCertificationToggle(cert)}
                        />
                        <span>{cert}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="custom-input">
                <label>Other Certifications (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g., ISO 9001, GDPR Compliant, Minority-Owned"
                  onBlur={(e) => {
                    const custom = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                    setEnhancements(prev => ({
                      ...prev,
                      certifications: [...new Set([...prev.certifications, ...custom])]
                    }));
                  }}
                />
              </div>
            </div>
          )}

          {currentSection === 'team' && (
            <div className="section-content">
              <h2>Team & Capacity</h2>
              <p className="section-hint">
                Team size and composition directly impact your ability to deliver. This information helps match you with right-sized opportunities.
              </p>
              
              <div className="form-row">
                <div className="form-field">
                  <label>Total Team Size</label>
                  <input
                    type="number"
                    value={enhancements.teamSize}
                    onChange={(e) => setEnhancements(prev => ({ ...prev, teamSize: e.target.value }))}
                    placeholder="e.g., 25"
                  />
                </div>
                
                <div className="form-field">
                  <label>Average Project Size ($)</label>
                  <input
                    type="text"
                    value={enhancements.avgProjectSize}
                    onChange={(e) => setEnhancements(prev => ({ ...prev, avgProjectSize: e.target.value }))}
                    placeholder="e.g., 250,000"
                  />
                </div>
              </div>
              
              <div className="form-field">
                <label>Team Composition</label>
                <textarea
                  value={enhancements.teamComposition}
                  onChange={(e) => setEnhancements(prev => ({ ...prev, teamComposition: e.target.value }))}
                  placeholder="e.g., 10 developers, 3 designers, 2 project managers, 5 QA engineers..."
                  rows={3}
                />
              </div>
              
              <div className="form-field">
                <label>Delivery Model</label>
                <select
                  value={enhancements.deliveryModel}
                  onChange={(e) => setEnhancements(prev => ({ ...prev, deliveryModel: e.target.value }))}
                >
                  <option value="">Select delivery model</option>
                  <option value="onsite">Onsite</option>
                  <option value="remote">Fully Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="flexible">Flexible (Client Choice)</option>
                </select>
              </div>
            </div>
          )}

          {currentSection === 'results' && (
            <div className="section-content">
              <h2>Quantified Results</h2>
              <p className="section-hint">
                Specific, measurable outcomes from past projects significantly boost your credibility. Add as many as possible.
              </p>
              
              {enhancements.quantifiedResults.map((result, index) => (
                <div key={index} className="result-entry">
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Metric (e.g., Cost Reduction)"
                      value={result.metric}
                      onChange={(e) => handleQuantifiedResultChange(index, 'metric', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g., 35%)"
                      value={result.value}
                      onChange={(e) => handleQuantifiedResultChange(index, 'value', e.target.value)}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Context (e.g., For Fortune 500 healthcare client)"
                    value={result.context}
                    onChange={(e) => handleQuantifiedResultChange(index, 'context', e.target.value)}
                  />
                </div>
              ))}
              
              <button className="btn-add" onClick={handleAddQuantifiedResult}>
                + Add Quantified Result
              </button>
              
              {enhancements.quantifiedResults.length === 0 && (
                <div className="example-box">
                  <h4>Examples:</h4>
                  <ul>
                    <li>Reduced processing time by 60% for insurance claims system</li>
                    <li>Achieved 99.9% uptime for mission-critical application</li>
                    <li>Saved client $2M annually through process automation</li>
                    <li>Improved customer satisfaction scores by 40 points</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {currentSection === 'geographic' && (
            <div className="section-content">
              <h2>Geographic Coverage</h2>
              <p className="section-hint">
                Where can you deliver services? This helps match you with location-specific or remote opportunities.
              </p>
              
              <div className="geo-options">
                {geographicOptions.map(region => (
                  <label key={region} className="geo-checkbox">
                    <input
                      type="checkbox"
                      checked={enhancements.geographicCoverage.includes(region)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEnhancements(prev => ({
                            ...prev,
                            geographicCoverage: [...prev.geographicCoverage, region]
                          }));
                        } else {
                          setEnhancements(prev => ({
                            ...prev,
                            geographicCoverage: prev.geographicCoverage.filter(r => r !== region)
                          }));
                        }
                      }}
                    />
                    <span>{region}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentSection === 'partnerships' && (
            <div className="section-content">
              <h2>Strategic Partnerships</h2>
              <p className="section-hint">
                Partnerships expand your capabilities and increase win probability. Include technology partners, resellers, and teaming partners.
              </p>
              
              {enhancements.partnerships.map((partner, index) => (
                <div key={index} className="partner-entry">
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Partner Name"
                      value={partner.name}
                      onChange={(e) => handlePartnershipChange(index, 'name', e.target.value)}
                    />
                    <select
                      value={partner.type}
                      onChange={(e) => handlePartnershipChange(index, 'type', e.target.value)}
                    >
                      <option value="">Type</option>
                      <option value="technology">Technology Partner</option>
                      <option value="reseller">Reseller/VAR</option>
                      <option value="teaming">Teaming Partner</option>
                      <option value="subcontractor">Subcontractor</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="What they bring (e.g., Cloud infrastructure expertise)"
                    value={partner.description}
                    onChange={(e) => handlePartnershipChange(index, 'description', e.target.value)}
                  />
                </div>
              ))}
              
              <button className="btn-add" onClick={handleAddPartnership}>
                + Add Partnership
              </button>
            </div>
          )}

          {currentSection === 'differentiators' && (
            <div className="section-content">
              <h2>Differentiators & Unique Value</h2>
              <p className="section-hint">
                What makes you different? Be specific about your unique approach, methodology, or advantages.
              </p>
              
              <div className="form-field">
                <label>Key Differentiators</label>
                <textarea
                  value={enhancements.differentiators}
                  onChange={(e) => setEnhancements(prev => ({ ...prev, differentiators: e.target.value }))}
                  placeholder="What makes you uniquely qualified? Special methodologies? Proprietary tools? Unique experience?"
                  rows={4}
                />
              </div>
              
              <div className="form-field">
                <label>Ideal Client Profile</label>
                <textarea
                  value={enhancements.idealClient}
                  onChange={(e) => setEnhancements(prev => ({ ...prev, idealClient: e.target.value }))}
                  placeholder="Describe your ideal client - size, industry, challenges, etc."
                  rows={3}
                />
              </div>
              
              <div className="form-field">
                <label>Known Weaknesses (Optional - Helps avoid poor fits)</label>
                <textarea
                  value={enhancements.weaknesses}
                  onChange={(e) => setEnhancements(prev => ({ ...prev, weaknesses: e.target.value }))}
                  placeholder="Be honest about limitations - this prevents wasted time on poor-fit opportunities"
                  rows={3}
                />
              </div>
            </div>
          )}

          {currentSection === 'weights' && (
            <div className="section-content">
              <h2>Priority Weights</h2>
              <p className="section-hint">
                Adjust these weights to reflect what matters most to your business when evaluating opportunities.
              </p>
              
              <div className="weights-list">
                <div className="weight-item">
                  <label>
                    <span>Technical Fit</span>
                    <small>Do you have the technical capabilities?</small>
                  </label>
                  <div className="weight-slider">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={importanceWeights.technical}
                      onChange={(e) => setImportanceWeights(prev => ({ ...prev, technical: parseInt(e.target.value) }))}
                    />
                    <span className="weight-value">{importanceWeights.technical}</span>
                  </div>
                </div>
                
                <div className="weight-item">
                  <label>
                    <span>Domain Expertise</span>
                    <small>Industry and domain knowledge match</small>
                  </label>
                  <div className="weight-slider">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={importanceWeights.domain}
                      onChange={(e) => setImportanceWeights(prev => ({ ...prev, domain: parseInt(e.target.value) }))}
                    />
                    <span className="weight-value">{importanceWeights.domain}</span>
                  </div>
                </div>
                
                <div className="weight-item">
                  <label>
                    <span>Financial Alignment</span>
                    <small>Budget and project size fit</small>
                  </label>
                  <div className="weight-slider">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={importanceWeights.financial}
                      onChange={(e) => setImportanceWeights(prev => ({ ...prev, financial: parseInt(e.target.value) }))}
                    />
                    <span className="weight-value">{importanceWeights.financial}</span>
                  </div>
                </div>
                
                <div className="weight-item">
                  <label>
                    <span>Delivery Capacity</span>
                    <small>Team size and availability</small>
                  </label>
                  <div className="weight-slider">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={importanceWeights.capacity}
                      onChange={(e) => setImportanceWeights(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                    />
                    <span className="weight-value">{importanceWeights.capacity}</span>
                  </div>
                </div>
                
                <div className="weight-item">
                  <label>
                    <span>Innovation & Growth</span>
                    <small>Strategic value and learning opportunity</small>
                  </label>
                  <div className="weight-slider">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={importanceWeights.innovation}
                      onChange={(e) => setImportanceWeights(prev => ({ ...prev, innovation: parseInt(e.target.value) }))}
                    />
                    <span className="weight-value">{importanceWeights.innovation}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="enhancer-footer">
        <button 
          className="btn-save"
          onClick={handleSaveProfile}
        >
          Save Enhanced Profile & Evaluate Opportunities →
        </button>
      </div>
    </div>
  );
};

export default ProfileEnhancer;