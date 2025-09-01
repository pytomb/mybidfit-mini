import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import '../styles/ProfileBuilder.css';

const ProfileBuilder = () => {
  const navigate = useNavigate();
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    size: '',
    location: '',
    industries: [],
    website: ''
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

  return (
    <div className="profile-builder">
      <div className="profile-header">
        <h1>Build Your Company Profile</h1>
        <p>Upload your company information and let our AI analyze your capabilities</p>
      </div>

      <div className="profile-content">
        <section className="basic-info-section">
          <h2>Basic Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                value={companyInfo.name}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your company name"
              />
            </div>
            
            <div className="form-group">
              <label>Company Size *</label>
              <select
                value={companyInfo.size}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, size: e.target.value }))}
              >
                <option value="">Select size</option>
                {sizeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Headquarters Location</label>
              <input
                type="text"
                value={companyInfo.location}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, State"
              />
            </div>
            
            <div className="form-group">
              <label>Website</label>
              <input
                type="url"
                value={companyInfo.website}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://www.example.com"
              />
            </div>
          </div>
          
          <div className="industries-section">
            <label>Industries Served</label>
            <div className="industry-chips">
              {industryOptions.map(industry => (
                <button
                  key={industry}
                  className={`industry-chip ${companyInfo.industries.includes(industry) ? 'selected' : ''}`}
                  onClick={() => handleIndustryToggle(industry)}
                >
                  {industry}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="upload-section">
          <h2>Upload Documents</h2>
          
          <div className="upload-grid">
            <div className="upload-box">
              <h3>Company Overview</h3>
              <div {...getOverviewProps()} className={`dropzone ${isOverviewDrag ? 'active' : ''}`}>
                <input {...getOverviewInput()} />
                {uploadedFiles.overview ? (
                  <div className="file-uploaded">
                    <span className="file-icon">📄</span>
                    <span>{uploadedFiles.overview.name}</span>
                  </div>
                ) : (
                  <div className="dropzone-content">
                    <span className="upload-icon">⬆️</span>
                    <p>Drag & drop your company overview or click to browse</p>
                    <small>PDF or Word document</small>
                  </div>
                )}
              </div>
            </div>

            <div className="upload-box">
              <h3>Case Studies</h3>
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
              <h3>Marketing Materials</h3>
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
        </section>

        {!analysisResults && (
          <div className="action-buttons">
            <button 
              className="btn-analyze"
              onClick={handleAnalyze}
              disabled={!companyInfo.name || !companyInfo.size || isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Profile'}
            </button>
          </div>
        )}

        {analysisResults && (
          <section className="analysis-results">
            <h2>Initial Profile Analysis</h2>
            
            <div className="results-grid">
              <div className="result-card">
                <h3>Profile Completeness</h3>
                <div className="completeness-meter">
                  <div className="meter-fill" style={{ width: `${analysisResults.completeness}%` }}>
                    {analysisResults.completeness}%
                  </div>
                </div>
                <p className="confidence">Confidence: {(analysisResults.confidence * 100).toFixed(0)}%</p>
              </div>

              <div className="result-card">
                <h3>Detected Capabilities</h3>
                <div className="capabilities-list">
                  {analysisResults.capabilities.map((cap, idx) => (
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

              <div className="result-card">
                <h3>Industry Expertise</h3>
                <div className="industries-list">
                  {analysisResults.industries.map((ind, idx) => (
                    <div key={idx} className="industry-item">
                      <span>{ind.name}</span>
                      <span className="confidence-badge">
                        {(ind.confidence * 100).toFixed(0)}% match
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="result-card">
                <h3>Profile Gaps</h3>
                <ul className="gaps-list">
                  {analysisResults.gaps.map((gap, idx) => (
                    <li key={idx}>{gap}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn-enhance" onClick={handleEnhanceProfile}>
                Enhance Profile → Add Missing Context
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProfileBuilder;