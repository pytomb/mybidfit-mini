import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import '../styles/ProfileBuilder.css';

const ProfileBuilder = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    size: '',
    location: '',
    industries: [],
    website: '',
    capabilities: [],
    certifications: [],
    technologies: []
  });
  
  const [uploadedFiles, setUploadedFiles] = useState({
    overview: null,
    caseStudies: [],
    marketing: []
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);

  // Dropzone for company overview
  const onDropOverview = useCallback(acceptedFiles => {
    setUploadedFiles(prev => ({
      ...prev,
      overview: acceptedFiles[0]
    }));
  }, []);

  // Dropzone for case studies
  const onDropCaseStudies = useCallback(acceptedFiles => {
    setUploadedFiles(prev => ({
      ...prev,
      caseStudies: [...prev.caseStudies, ...acceptedFiles]
    }));
  }, []);

  // Dropzone for marketing materials
  const onDropMarketing = useCallback(acceptedFiles => {
    setUploadedFiles(prev => ({
      ...prev,
      marketing: [...prev.marketing, ...acceptedFiles]
    }));
  }, []);

  const { getRootProps: getOverviewProps, getInputProps: getOverviewInput, isDragActive: isOverviewDrag } = useDropzone({
    onDrop: onDropOverview,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  const { getRootProps: getCaseProps, getInputProps: getCaseInput, isDragActive: isCaseDrag } = useDropzone({
    onDrop: onDropCaseStudies,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true
  });

  const { getRootProps: getMarketingProps, getInputProps: getMarketingInput, isDragActive: isMarketingDrag } = useDropzone({
    onDrop: onDropMarketing,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/vnd.ms-powerpoint': ['.ppt', '.pptx']
    },
    multiple: true
  });

  const handleIndustryToggle = (industry) => {
    setCompanyInfo(prev => ({
      ...prev,
      industries: prev.industries.includes(industry)
        ? prev.industries.filter(i => i !== industry)
        : [...prev.industries, industry]
    }));
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    
    // Simulate API call to analyze documents
    // In production, this would upload files and call the supplierAnalysis service
    setTimeout(() => {
      setAnalysisResults({
        confidence: 0.78,
        capabilities: [
          { name: 'Cloud Infrastructure', proficiency: 4.5 },
          { name: 'DevOps Automation', proficiency: 4.2 },
          { name: 'Security Compliance', proficiency: 3.8 },
          { name: 'Data Analytics', proficiency: 3.5 },
          { name: 'AI/ML Development', proficiency: 3.0 }
        ],
        industries: [
          { name: 'Healthcare', confidence: 0.85 },
          { name: 'Financial Services', confidence: 0.72 },
          { name: 'Government', confidence: 0.65 }
        ],
        completeness: 65,
        gaps: [
          'No specific certifications mentioned',
          'Team size and composition unclear',
          'Limited quantified results in case studies',
          'Geographic coverage not specified'
        ]
      });
      setIsAnalyzing(false);
    }, 3000);
  };

  const handleEnhanceProfile = () => {
    // Navigate to profile enhancement page with analysis results
    navigate('/profile-enhancer', { state: { analysisResults, companyInfo, uploadedFiles } });
  };

  // Step management
  const wizardSteps = [
    {
      title: "Basic Company Information",
      description: "Let's start with the essentials",
      timeEstimate: "2 minutes",
      fields: ['name', 'size', 'location']
    },
    {
      title: "Core Capabilities", 
      description: "Tell us about your services and expertise",
      timeEstimate: "3 minutes",
      fields: ['industries', 'website', 'capabilities']
    },
    {
      title: "Document Uploads",
      description: "Upload documents to showcase your experience",
      timeEstimate: "5 minutes", 
      fields: ['files']
    },
    {
      title: "Enhanced Details",
      description: "Add certifications and technologies",
      timeEstimate: "3 minutes",
      fields: ['certifications', 'technologies']
    },
    {
      title: "AI Analysis & Review",
      description: "Let our AI analyze your profile",
      timeEstimate: "1 minute",
      fields: ['analysis']
    }
  ];

  // Validation functions for each step
  const isStepValid = (stepIndex) => {
    switch(stepIndex) {
      case 0: // Basic info
        return companyInfo.name.trim() && companyInfo.size && companyInfo.location.trim();
      case 1: // Core capabilities  
        return companyInfo.industries.length > 0 && companyInfo.website.trim();
      case 2: // Document uploads
        return uploadedFiles.overview !== null;
      case 3: // Enhanced details
        return companyInfo.certifications.length > 0 || companyInfo.technologies.length > 0;
      case 4: // Analysis
        return true; // Always valid for analysis step
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < wizardSteps.length - 1 && isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getCompletionPercentage = () => {
    let score = 0;
    let maxScore = 100;
    
    // Basic Info (25 points)
    if (companyInfo.name.trim()) score += 10;
    if (companyInfo.size) score += 8;
    if (companyInfo.location.trim()) score += 7;
    
    // Core Capabilities (30 points)
    if (companyInfo.website.trim()) score += 5;
    if (companyInfo.industries.length > 0) score += 10;
    if (companyInfo.industries.length >= 2) score += 5; // Bonus for multiple industries
    if (companyInfo.capabilities.length > 0) score += 5;
    if (companyInfo.capabilities.length >= 3) score += 5; // Bonus for multiple capabilities
    
    // Documents (25 points)
    if (uploadedFiles.overview) score += 15;
    if (uploadedFiles.caseStudies.length > 0) score += 5;
    if (uploadedFiles.marketing.length > 0) score += 5;
    
    // Enhanced Details (20 points)
    if (companyInfo.certifications.length > 0) score += 10;
    if (companyInfo.technologies.length > 0) score += 5;
    if (companyInfo.certifications.length >= 2) score += 3; // Bonus
    if (companyInfo.technologies.length >= 3) score += 2; // Bonus
    
    return Math.min(100, score);
  };

  const getUnlockedFeatures = () => {
    const completion = getCompletionPercentage();
    return {
      aiAnalysis: completion >= 60,
      advancedMatching: completion >= 80,
      premiumOpportunities: completion >= 90,
      completionLevel: completion >= 60 ? (completion >= 80 ? (completion >= 90 ? 'premium' : 'advanced') : 'basic') : 'incomplete'
    };
  };

  const getNextMilestone = () => {
    const completion = getCompletionPercentage();
    if (completion < 60) return { target: 60, feature: 'AI Analysis', description: 'Unlock AI-powered capability analysis' };
    if (completion < 80) return { target: 80, feature: 'Advanced Matching', description: 'Get priority access to high-value opportunities' };
    if (completion < 90) return { target: 90, feature: 'Premium Opportunities', description: 'Access exclusive enterprise-level opportunities' };
    return { target: 100, feature: 'Complete Profile', description: 'Maximum opportunity visibility and matching accuracy' };
  };

  const industryOptions = [
    'Healthcare', 'Financial Services', 'Government', 'Technology',
    'Manufacturing', 'Retail', 'Education', 'Energy', 'Transportation'
  ];

  const sizeOptions = [
    { value: 'micro', label: '1-10 employees' },
    { value: 'small', label: '11-50 employees' },
    { value: 'medium', label: '51-250 employees' },
    { value: 'large', label: '250+ employees' }
  ];

  const capabilityOptions = [
    'Cloud Migration', 'Cybersecurity', 'Managed Services', 'Software Development',
    'Data Analytics', 'DevOps', 'Network Infrastructure', 'Help Desk Support',
    'Consulting Services', 'Project Management', 'System Integration', 'Backup & Recovery'
  ];

  const certificationOptions = [
    'AWS Certified', 'Microsoft Partner', 'CompTIA', 'Cisco Partner',
    'ISO 27001', 'SOC 2', 'Google Cloud Partner', 'Oracle Partner',
    'VMware Partner', 'Salesforce Partner', 'PMP', 'ITIL'
  ];

  const technologyOptions = [
    'AWS', 'Microsoft Azure', 'Google Cloud', 'VMware', 'Cisco',
    'Office 365', 'Salesforce', 'ServiceNow', 'Splunk', 'Tableau',
    'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins'
  ];

  // Field management functions
  const handleArrayInputAdd = (field, value) => {
    if (value.trim() && !companyInfo[field].includes(value.trim())) {
      setCompanyInfo(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  };

  const handleArrayInputRemove = (field, value) => {
    setCompanyInfo(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== value)
    }));
  };

  // Render step content based on current step
  const renderStepContent = () => {
    switch(currentStep) {
      case 0: // Basic Company Information
        return (
          <div className="wizard-step">
            <div className="step-form">
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your company name"
                  className="large-input"
                />
              </div>
              
              <div className="form-group">
                <label>Company Size *</label>
                <select
                  value={companyInfo.size}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, size: e.target.value }))}
                  className="large-input"
                >
                  <option value="">Select size</option>
                  {sizeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Headquarters Location *</label>
                <input
                  type="text"
                  value={companyInfo.location}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, State"
                  className="large-input"
                />
              </div>
            </div>
            <div className="step-guidance">
              <div className="guidance-box">
                <h4>📍 Why we need this</h4>
                <p>Basic information helps us match you with opportunities in your area and size range.</p>
                <div className="completion-incentive">
                  <div className="step-score">
                    Basic Info: {[
                      companyInfo.name.trim(),
                      companyInfo.size,
                      companyInfo.location.trim()
                    ].filter(Boolean).length}/3 complete
                  </div>
                  <div className="score-impact">
                    Worth up to 25 points toward AI Analysis unlock
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 1: // Core Capabilities
        return (
          <div className="wizard-step">
            <div className="step-form">
              <div className="form-group">
                <label>Website *</label>
                <input
                  type="url"
                  value={companyInfo.website}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://www.example.com"
                  className="large-input"
                />
              </div>
              
              <div className="form-group">
                <label>Industries Served *</label>
                <div className="industry-chips">
                  {industryOptions.map(industry => (
                    <button
                      key={industry}
                      className={`industry-chip ${companyInfo.industries.includes(industry) ? 'selected' : ''}`}
                      onClick={() => handleIndustryToggle(industry)}
                      type="button"
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Core Capabilities</label>
                <div className="chips-container">
                  {companyInfo.capabilities.map(capability => (
                    <span key={capability} className="selected-chip">
                      {capability}
                      <button onClick={() => handleArrayInputRemove('capabilities', capability)}>×</button>
                    </span>
                  ))}
                </div>
                <div className="suggestion-chips">
                  {capabilityOptions
                    .filter(cap => !companyInfo.capabilities.includes(cap))
                    .slice(0, 6)
                    .map(capability => (
                    <button
                      key={capability}
                      className="suggestion-chip"
                      onClick={() => handleArrayInputAdd('capabilities', capability)}
                      type="button"
                    >
                      + {capability}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="step-guidance">
              <div className="guidance-box">
                <h4>🎯 Building your profile</h4>
                <p>Industries and capabilities help us match you with relevant opportunities. Select at least one industry to continue.</p>
                <div className="completion-incentive">
                  <div className="step-score">
                    Capabilities: {[
                      companyInfo.website.trim(),
                      companyInfo.industries.length > 0,
                      companyInfo.capabilities.length > 0
                    ].filter(Boolean).length}/3 complete
                  </div>
                  <div className="score-impact">
                    Worth up to 30 points • Add 3+ capabilities for bonus points
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Document Uploads
        return (
          <div className="wizard-step">
            <div className="step-form">
              <div className="upload-section">
                <div className="upload-box">
                  <h3>Company Overview *</h3>
                  <div {...getOverviewProps()} className={`dropzone ${isOverviewDrag ? 'active' : ''}`}>
                    <input {...getOverviewInput()} />
                    {uploadedFiles.overview ? (
                      <div className="file-uploaded">
                        <span className="file-icon">📄</span>
                        <span>{uploadedFiles.overview.name}</span>
                        <span className="file-success">✓</span>
                      </div>
                    ) : (
                      <div className="dropzone-content">
                        <span className="upload-icon">⬆️</span>
                        <p>Drag & drop your company overview or click to browse</p>
                        <small>PDF or Word document (required)</small>
                      </div>
                    )}
                  </div>
                </div>

                <div className="upload-box">
                  <h3>Case Studies <small>(optional)</small></h3>
                  <div {...getCaseProps()} className={`dropzone ${isCaseDrag ? 'active' : ''}`}>
                    <input {...getCaseInput()} />
                    {uploadedFiles.caseStudies.length > 0 ? (
                      <div className="files-list">
                        {uploadedFiles.caseStudies.map((file, idx) => (
                          <div key={idx} className="file-uploaded">
                            <span className="file-icon">📄</span>
                            <span>{file.name}</span>
                          </div>
                        ))}
                        <small>+ Add more case studies</small>
                      </div>
                    ) : (
                      <div className="dropzone-content">
                        <span className="upload-icon">⬆️</span>
                        <p>Drag & drop case studies or click to browse</p>
                        <small>Multiple files allowed</small>
                      </div>
                    )}
                  </div>
                </div>

                <div className="upload-box">
                  <h3>Marketing Materials <small>(optional)</small></h3>
                  <div {...getMarketingProps()} className={`dropzone ${isMarketingDrag ? 'active' : ''}`}>
                    <input {...getMarketingInput()} />
                    {uploadedFiles.marketing.length > 0 ? (
                      <div className="files-list">
                        {uploadedFiles.marketing.map((file, idx) => (
                          <div key={idx} className="file-uploaded">
                            <span className="file-icon">📄</span>
                            <span>{file.name}</span>
                          </div>
                        ))}
                        <small>+ Add more materials</small>
                      </div>
                    ) : (
                      <div className="dropzone-content">
                        <span className="upload-icon">⬆️</span>
                        <p>Drag & drop marketing materials</p>
                        <small>PDFs, Images, Presentations</small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="step-guidance">
              <div className="guidance-box">
                <h4>📋 Document Upload Guide</h4>
                <p style={{ marginBottom: '20px', fontWeight: '600' }}>
                  Our AI analyzes your documents to extract capabilities, experience, and competitive advantages automatically.
                </p>
                
                <div style={{ marginBottom: '25px' }}>
                  <h5 style={{ color: 'var(--primary-blue)', marginBottom: '10px' }}>🏢 Company Overview (Required)</h5>
                  <div style={{ 
                    backgroundColor: 'rgba(37, 99, 235, 0.05)', 
                    padding: '15px', 
                    borderRadius: '8px',
                    marginBottom: '10px'
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>What to Include:</p>
                    <ul style={{ margin: 0, paddingLeft: '15px', fontSize: '13px' }}>
                      <li>Company mission and core services</li>
                      <li>Key differentiators and unique value propositions</li>
                      <li>Target markets and client types served</li>
                      <li>Team size and expertise areas</li>
                      <li>Geographic reach and service regions</li>
                    </ul>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-medium)' }}>
                    💡 <strong>Examples:</strong> Company brochure, capabilities statement, "About Us" document, executive summary
                  </div>
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <h5 style={{ color: 'var(--secondary-green)', marginBottom: '10px' }}>📈 Case Studies (Recommended)</h5>
                  <div style={{ 
                    backgroundColor: 'rgba(46, 184, 92, 0.05)', 
                    padding: '15px', 
                    borderRadius: '8px',
                    marginBottom: '10px'
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Best Case Studies Include:</p>
                    <ul style={{ margin: 0, paddingLeft: '15px', fontSize: '13px' }}>
                      <li>Client challenge and project scope</li>
                      <li>Your solution and technical approach</li>
                      <li>Measurable results and outcomes</li>
                      <li>Technologies used and team involved</li>
                      <li>Timeline and project complexity</li>
                    </ul>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-medium)' }}>
                    🎯 <strong>Impact:</strong> Case studies increase match quality by 40% and show real-world problem-solving skills
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ color: 'var(--text-dark)', marginBottom: '10px' }}>📊 Marketing Materials (Optional)</h5>
                  <div style={{ 
                    backgroundColor: 'var(--bg-light)', 
                    padding: '15px', 
                    borderRadius: '8px',
                    marginBottom: '10px'
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Helpful Materials:</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                      <div>
                        • Service portfolios<br/>
                        • Solution briefs<br/>
                        • Client testimonials
                      </div>
                      <div>
                        • Award certificates<br/>
                        • Partnership badges<br/>
                        • Industry presentations
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-medium)' }}>
                    ⭐ <strong>Bonus:</strong> Awards and certifications help establish credibility and industry recognition
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'rgba(46, 184, 92, 0.1)',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '15px'
                }}>
                  <h5 style={{ margin: '0 0 8px 0', color: 'var(--secondary-green)' }}>🤖 AI Analysis Benefits</h5>
                  <div style={{ fontSize: '13px' }}>
                    <div style={{ marginBottom: '5px' }}>✓ <strong>Automatic capability extraction</strong> - No manual data entry</div>
                    <div style={{ marginBottom: '5px' }}>✓ <strong>Competitive positioning</strong> - Identify your unique strengths</div>
                    <div style={{ marginBottom: '5px' }}>✓ <strong>Better matches</strong> - AI understands your real experience</div>
                    <div>✓ <strong>Faster responses</strong> - Pre-populated proposal content</div>
                  </div>
                </div>

                <div className="completion-incentive">
                  <div className="step-score">
                    Documents: {[
                      uploadedFiles.overview,
                      uploadedFiles.caseStudies.length > 0,
                      uploadedFiles.marketing.length > 0
                    ].filter(Boolean).length}/3 uploaded
                  </div>
                  <div className="score-impact">
                    Worth up to 25 points • Overview required for AI Analysis unlock
                  </div>
                </div>

                <div style={{
                  marginTop: '15px',
                  padding: '12px',
                  backgroundColor: 'rgba(255, 193, 7, 0.1)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'var(--text-dark)'
                }}>
                  🔒 <strong>Privacy Note:</strong> All documents are processed securely and used only for AI analysis to improve your opportunity matching. We never share your documents with third parties.
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // Enhanced Details
        return (
          <div className="wizard-step">
            <div className="step-form">
              <div className="form-group">
                <label>Certifications</label>
                <div className="chips-container">
                  {companyInfo.certifications.map(cert => (
                    <span key={cert} className="selected-chip">
                      {cert}
                      <button onClick={() => handleArrayInputRemove('certifications', cert)}>×</button>
                    </span>
                  ))}
                </div>
                <div className="suggestion-chips">
                  {certificationOptions
                    .filter(cert => !companyInfo.certifications.includes(cert))
                    .slice(0, 6)
                    .map(cert => (
                    <button
                      key={cert}
                      className="suggestion-chip"
                      onClick={() => handleArrayInputAdd('certifications', cert)}
                      type="button"
                    >
                      + {cert}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Technologies</label>
                <div className="chips-container">
                  {companyInfo.technologies.map(tech => (
                    <span key={tech} className="selected-chip">
                      {tech}
                      <button onClick={() => handleArrayInputRemove('technologies', tech)}>×</button>
                    </span>
                  ))}
                </div>
                <div className="suggestion-chips">
                  {technologyOptions
                    .filter(tech => !companyInfo.technologies.includes(tech))
                    .slice(0, 8)
                    .map(tech => (
                    <button
                      key={tech}
                      className="suggestion-chip"
                      onClick={() => handleArrayInputAdd('technologies', tech)}
                      type="button"
                    >
                      + {tech}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="step-guidance">
              <div className="guidance-box">
                <h4>🏆 Stand out from competition</h4>
                <p>Certifications and technologies help buyers understand your technical expertise. Add at least one to continue.</p>
                <div className="completion-incentive">
                  <div className="step-score">
                    Details: {[
                      companyInfo.certifications.length > 0,
                      companyInfo.technologies.length > 0
                    ].filter(Boolean).length}/2 complete
                  </div>
                  <div className="score-impact">
                    Worth up to 20 points • 2+ certifications & 3+ technologies for bonus
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4: // AI Analysis
        return (
          <div className="wizard-step">
            {!analysisResults ? (
              <div className="analysis-step">
                {(() => {
                  const features = getUnlockedFeatures();
                  const completion = getCompletionPercentage();
                  
                  if (!features.aiAnalysis) {
                    return (
                      <div className="feature-locked">
                        <div className="lock-icon">🔒</div>
                        <h3>AI Analysis Locked</h3>
                        <div className="unlock-requirement">
                          <div className="progress-to-unlock">
                            <div className="completion-needed">
                              You need <strong>{60 - completion}%</strong> more completion to unlock AI Analysis
                            </div>
                            <div className="completion-bar">
                              <div className="bar-background">
                                <div 
                                  className="bar-fill" 
                                  style={{ width: `${(completion / 60) * 100}%` }}
                                />
                                <div className="unlock-target" style={{ left: '100%' }}>
                                  60%
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="missing-info">
                            <h4>Complete your profile to unlock:</h4>
                            <ul>
                              {!companyInfo.name.trim() && <li>• Company name</li>}
                              {!companyInfo.size && <li>• Company size</li>}
                              {!companyInfo.location.trim() && <li>• Location</li>}
                              {!companyInfo.website.trim() && <li>• Website</li>}
                              {companyInfo.industries.length === 0 && <li>• At least one industry</li>}
                              {!uploadedFiles.overview && <li>• Company overview document</li>}
                              {companyInfo.certifications.length === 0 && companyInfo.technologies.length === 0 && <li>• Certifications or technologies</li>}
                            </ul>
                          </div>
                          <div className="go-back-prompt">
                            <button 
                              onClick={() => setCurrentStep(0)} 
                              className="btn-secondary"
                            >
                              ← Complete Profile Information
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="analysis-intro">
                      <div className="feature-unlocked">
                        <div className="unlock-celebration">
                          🎉 <strong>AI Analysis Unlocked!</strong>
                        </div>
                        <div className="unlock-benefits">
                          Profile completion: <strong>{completion}%</strong> - Ready for AI analysis
                        </div>
                      </div>
                      
                      <h3>🤖 Ready for AI Analysis</h3>
                      <p>Our AI will analyze your profile to:</p>
                      <ul>
                        <li>✓ Identify your core capabilities</li>
                        <li>✓ Assess industry expertise</li>
                        <li>✓ Calculate profile completeness</li>
                        <li>✓ Suggest improvements</li>
                      </ul>
                      
                      <div className="action-buttons">
                        <button 
                          className="btn-analyze large"
                          onClick={handleAnalyze}
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? (
                            <span>🔄 Analyzing Your Profile...</span>
                          ) : (
                            <span>🚀 Analyze My Profile</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="analysis-results">
                <h3>🎉 Analysis Complete!</h3>
                
                <div className="results-grid">
                  <div className="result-card">
                    <h4>Profile Completeness</h4>
                    <div className="completeness-meter">
                      <div className="meter-fill" style={{ width: `${analysisResults.completeness}%` }}>
                        {analysisResults.completeness}%
                      </div>
                    </div>
                    <p className="confidence">Confidence: {(analysisResults.confidence * 100).toFixed(0)}%</p>
                  </div>

                  <div className="result-card">
                    <h4>Detected Capabilities</h4>
                    <div className="capabilities-list">
                      {analysisResults.capabilities.slice(0, 3).map((cap, idx) => (
                        <div key={idx} className="capability-item">
                          <span>{cap.name}</span>
                          <div className="proficiency-bar">
                            <div 
                              className="proficiency-fill"
                              style={{ width: `${(cap.proficiency / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="next-steps">
                  <h4>🎯 Recommended Next Steps</h4>
                  <ul>
                    {analysisResults.gaps.slice(0, 3).map((gap, idx) => (
                      <li key={idx}>{gap}</li>
                    ))}
                  </ul>
                </div>

                <div className="action-buttons">
                  <button className="btn-enhance large" onClick={handleEnhanceProfile}>
                    ✨ Enhance Profile & Get Opportunities
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="profile-builder">
      {/* Wizard Header */}
      <div className="wizard-header">
        <div className="wizard-progress">
          <div className="progress-steps">
            {wizardSteps.map((step, index) => (
              <div
                key={index}
                className={`progress-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              >
                <div className="step-number">
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <div className="step-info">
                  <div className="step-title">{step.title}</div>
                  <div className="step-time">{step.timeEstimate}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(currentStep / (wizardSteps.length - 1)) * 100}%` }}
            />
          </div>
        </div>
        
        <div className="wizard-title">
          <h1>{wizardSteps[currentStep].title}</h1>
          <p>{wizardSteps[currentStep].description}</p>
        </div>

        <div className="completion-status">
          <div className="completion-percentage">
            <div className="score-display">
              <span className="score-number">{getCompletionPercentage()}%</span>
              <span className="score-label">Complete</span>
            </div>
            <div className="score-bar">
              <div 
                className="score-fill" 
                style={{ width: `${getCompletionPercentage()}%` }}
              />
              <div className="milestone-markers">
                <div className="milestone" style={{ left: '60%' }}>
                  <div className={`milestone-dot ${getCompletionPercentage() >= 60 ? 'achieved' : ''}`}>
                    🤖
                  </div>
                </div>
                <div className="milestone" style={{ left: '80%' }}>
                  <div className={`milestone-dot ${getCompletionPercentage() >= 80 ? 'achieved' : ''}`}>
                    ⭐
                  </div>
                </div>
                <div className="milestone" style={{ left: '90%' }}>
                  <div className={`milestone-dot ${getCompletionPercentage() >= 90 ? 'achieved' : ''}`}>
                    💎
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="feature-status">
            {(() => {
              const features = getUnlockedFeatures();
              const nextMilestone = getNextMilestone();
              
              return (
                <div className="status-info">
                  {features.completionLevel === 'incomplete' && (
                    <div className="next-milestone">
                      <div className="milestone-progress">
                        <span className="progress-text">
                          🎯 {nextMilestone.target - getCompletionPercentage()}% to unlock
                        </span>
                        <strong>{nextMilestone.feature}</strong>
                      </div>
                      <div className="milestone-description">
                        {nextMilestone.description}
                      </div>
                    </div>
                  )}
                  
                  {features.aiAnalysis && (
                    <div className="unlocked-feature">
                      ✅ <strong>AI Analysis</strong> - Ready to analyze your profile
                    </div>
                  )}
                  
                  {features.advancedMatching && (
                    <div className="unlocked-feature">
                      ✅ <strong>Advanced Matching</strong> - Priority opportunity access
                    </div>
                  )}
                  
                  {features.premiumOpportunities && (
                    <div className="unlocked-feature premium">
                      ✅ <strong>Premium Opportunities</strong> - Enterprise-level access
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="wizard-content">
        {renderStepContent()}
      </div>

      {/* Wizard Navigation */}
      <div className="wizard-navigation">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="btn-nav prev"
        >
          ← Previous
        </button>

        <div className="step-indicator">
          Step {currentStep + 1} of {wizardSteps.length}
        </div>

        {currentStep < 4 && (
          <button
            onClick={nextStep}
            disabled={!isStepValid(currentStep)}
            className={`btn-nav next ${!isStepValid(currentStep) ? 'disabled' : ''}`}
          >
            {currentStep === 3 ? 'Analyze Profile' : 'Continue'} →
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileBuilder;