import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useFeatureFlags } from '../contexts/FeatureFlagsContext'
import { Link } from 'react-router-dom'

const PilotOnboarding = () => {
  const { user } = useAuth()
  const { isPilotUser, getEnabledFeatures } = useFeatureFlags()
  const [currentStep, setCurrentStep] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Check if user should see pilot onboarding
  useEffect(() => {
    if (isPilotUser() && user) {
      // Show onboarding for pilot users who haven't completed it
      const hasCompletedOnboarding = localStorage.getItem(`pilot-onboarding-completed-${user.id}`)
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true)
      }
    }
  }, [isPilotUser, user])

  const completeOnboarding = () => {
    localStorage.setItem(`pilot-onboarding-completed-${user.id}`, 'true')
    setShowOnboarding(false)
  }

  const pilotFeatures = [
    {
      name: 'AI Opportunity Scoring',
      description: 'Get explainable fit analysis with our panel of judges (CFO, CISO, Operator, Skeptic perspectives)',
      benefit: 'Stop chasing opportunities that aren\'t a fit',
      available: true
    },
    {
      name: 'Market Intelligence',
      description: 'Comprehensive market insights and competitive landscape analysis for your opportunities',
      benefit: 'Win more by understanding the competitive landscape',
      available: true
    },
    {
      name: 'Company Analysis',
      description: 'Deep analysis of your company capabilities and strategic positioning',
      benefit: 'Identify your unique competitive advantages',
      available: true
    },
    {
      name: 'Partnership Matching',
      description: 'Find complementary partners to expand capabilities and scale capacity',
      benefit: 'Win bigger opportunities through strategic partnerships',
      available: false,
      comingSoon: true
    },
    {
      name: 'Event Recommendations',
      description: 'Get personalized networking and industry event recommendations',
      benefit: 'Network more strategically with better ROI',
      available: false,
      comingSoon: true
    }
  ]

  const onboardingSteps = [
    {
      title: 'Welcome to the MyBidFit Pilot Program!',
      content: (
        <div>
          <div style={{
            backgroundColor: 'var(--secondary-green)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>🎉 You're Part of Something Special</h3>
            <p style={{ margin: 0 }}>
              You're one of 10 IT services sales professionals selected for our exclusive pilot program.
            </p>
          </div>
          <p>
            As a pilot user, you have early access to advanced AI-powered features that will help you:
          </p>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Quickly identify opportunities that are a good fit</li>
            <li>Get strategic insights on competitive positioning</li>
            <li>Make data-driven decisions about where to focus your efforts</li>
            <li>Save time by avoiding opportunities that aren't worth pursuing</li>
          </ul>
          <p>
            <strong>Your feedback is invaluable</strong> - we're building this specifically for IT services professionals like you.
          </p>
        </div>
      )
    },
    {
      title: 'Your Pilot Features',
      content: (
        <div>
          <p style={{ marginBottom: '20px' }}>Here's what you have access to as a pilot user:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {pilotFeatures.map((feature, index) => (
              <div 
                key={index} 
                className="card" 
                style={{ 
                  padding: '15px',
                  borderLeft: `4px solid ${feature.available ? 'var(--secondary-green)' : 'var(--text-medium)'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, marginRight: '10px' }}>{feature.name}</h4>
                  <span style={{
                    backgroundColor: feature.available ? 'var(--secondary-green)' : 'var(--text-medium)',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {feature.available ? '✨ PILOT ACCESS' : 'COMING SOON'}
                  </span>
                </div>
                <p style={{ fontSize: '14px', marginBottom: '8px' }}>{feature.description}</p>
                <p style={{ 
                  fontSize: '13px', 
                  color: 'var(--secondary-green)', 
                  fontWeight: '600',
                  margin: 0
                }}>
                  💡 {feature.benefit}
                </p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'How to Get Started',
      content: (
        <div>
          <p style={{ marginBottom: '20px' }}>Follow these steps to make the most of your pilot access:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '15px' 
              }}>
                <div style={{
                  backgroundColor: 'var(--primary-blue)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  marginRight: '15px'
                }}>1</div>
                <h4 style={{ margin: 0 }}>Complete Your Company Profile</h4>
              </div>
              <p style={{ fontSize: '14px', marginBottom: '15px' }}>
                Add your company's capabilities, certifications, and experience to get accurate fit scoring.
              </p>
              <Link to="/profile" className="btn btn-primary">
                Create Company Profile →
              </Link>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '15px' 
              }}>
                <div style={{
                  backgroundColor: 'var(--secondary-green)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  marginRight: '15px'
                }}>2</div>
                <h4 style={{ margin: 0 }}>Explore Your Dashboard</h4>
              </div>
              <p style={{ fontSize: '14px', marginBottom: '15px' }}>
                Your personalized dashboard shows opportunities matched to your capabilities with AI-powered insights.
              </p>
              <Link to="/dashboard" className="btn btn-primary">
                Go to Dashboard →
              </Link>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '15px' 
              }}>
                <div style={{
                  backgroundColor: 'var(--primary-blue)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  marginRight: '15px'
                }}>3</div>
                <h4 style={{ margin: 0 }}>Test AI Scoring</h4>
              </div>
              <p style={{ fontSize: '14px', marginBottom: '15px' }}>
                Try the AI opportunity scoring on real opportunities to see explainable fit analysis in action.
              </p>
              <div style={{
                padding: '10px',
                backgroundColor: 'var(--bg-light)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--text-medium)'
              }}>
                💡 Tip: Start with opportunities you're already familiar with to see how the AI analysis compares to your intuition.
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Your Feedback Matters',
      content: (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            backgroundColor: 'var(--primary-blue)',
            color: 'white',
            padding: '30px',
            borderRadius: '12px',
            marginBottom: '30px'
          }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Help Us Build the Perfect Tool</h3>
            <p style={{ margin: 0, fontSize: '16px' }}>
              Your real-world feedback will shape the future of MyBidFit. We're here to build exactly what IT services professionals need.
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px',
            marginBottom: '30px' 
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: 'var(--bg-light)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>📧</div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Direct Feedback</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-medium)', margin: 0 }}>
                Email us directly with suggestions
              </p>
            </div>
            <div style={{
              padding: '20px',
              backgroundColor: 'var(--bg-light)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>💬</div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>In-App Feedback</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-medium)', margin: 0 }}>
                Use feedback buttons throughout the app
              </p>
            </div>
            <div style={{
              padding: '20px',
              backgroundColor: 'var(--bg-light)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>📞</div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Monthly Check-ins</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-medium)', margin: 0 }}>
                Optional 15-minute calls to discuss your experience
              </p>
            </div>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: 'rgba(46, 184, 92, 0.1)',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <p style={{ 
              margin: 0, 
              fontSize: '14px', 
              color: 'var(--secondary-green)',
              fontWeight: '600'
            }}>
              🎯 Remember: This is YOUR tool. We're building it for real IT services professionals, based on real feedback from real users.
            </p>
          </div>

          <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
            Ready to start your pilot experience?
          </p>
        </div>
      )
    }
  ]

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeOnboarding()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (!showOnboarding) {
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Progress indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '30px'
        }}>
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: index <= currentStep ? 'var(--secondary-green)' : 'var(--border-light)',
                margin: '0 5px'
              }}
            />
          ))}
        </div>

        {/* Step content */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            marginBottom: '20px', 
            textAlign: 'center',
            color: 'var(--primary-blue)'
          }}>
            {onboardingSteps[currentStep].title}
          </h2>
          {onboardingSteps[currentStep].content}
        </div>

        {/* Navigation */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: currentStep === 0 ? 'var(--border-light)' : 'white',
              color: currentStep === 0 ? 'var(--text-medium)' : 'var(--primary-blue)',
              border: `2px solid ${currentStep === 0 ? 'var(--border-light)' : 'var(--primary-blue)'}`,
              borderRadius: '8px',
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            ← Previous
          </button>

          <div style={{ fontSize: '14px', color: 'var(--text-medium)' }}>
            Step {currentStep + 1} of {onboardingSteps.length}
          </div>

          <button
            onClick={nextStep}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--secondary-green)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            {currentStep === onboardingSteps.length - 1 ? 'Get Started!' : 'Next →'}
          </button>
        </div>

        {/* Skip option */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={completeOnboarding}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-medium)',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Skip onboarding
          </button>
        </div>
      </div>
    </div>
  )
}

export default PilotOnboarding