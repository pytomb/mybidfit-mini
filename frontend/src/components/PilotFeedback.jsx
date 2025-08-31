import React, { useState } from 'react'
import { useFeatureFlags } from '../contexts/FeatureFlagsContext'
import { useAuth } from '../contexts/AuthContext'

const PilotFeedback = () => {
  const { isPilotUser } = useFeatureFlags()
  const { user } = useAuth()
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackType, setFeedbackType] = useState('suggestion')
  const [feedbackText, setFeedbackText] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (!isPilotUser()) {
    return null
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!feedbackText.trim()) return

    // In a real app, this would send to an API
    console.log('Pilot Feedback Submitted:', {
      user: user.email,
      type: feedbackType,
      feedback: feedbackText,
      timestamp: new Date().toISOString(),
      page: window.location.pathname
    })

    // Show confirmation and reset
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setShowFeedback(false)
      setFeedbackText('')
    }, 2000)
  }

  return (
    <>
      {/* Feedback Button - Fixed Position */}
      <button
        onClick={() => setShowFeedback(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'var(--secondary-green)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#2EBD5C'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--secondary-green)'}
        title="Pilot Feedback"
      >
        💬
      </button>

      {/* Feedback Modal */}
      {showFeedback && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowFeedback(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: 'var(--text-medium)'
              }}
            >
              ×
            </button>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>🙏</div>
                <h3 style={{ color: 'var(--secondary-green)', marginBottom: '10px' }}>
                  Thank You!
                </h3>
                <p style={{ color: 'var(--text-medium)' }}>
                  Your feedback has been sent to our development team.
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ 
                    color: 'var(--secondary-green)', 
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    ✨ Pilot Feedback
                  </h3>
                  <p style={{ 
                    fontSize: '14px', 
                    color: 'var(--text-medium)',
                    margin: 0
                  }}>
                    Help us build the perfect tool for IT services professionals. Your insights shape the future of MyBidFit.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      Feedback Type
                    </label>
                    <select
                      value={feedbackType}
                      onChange={(e) => setFeedbackType(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '2px solid var(--border-light)',
                        fontSize: '14px'
                      }}
                    >
                      <option value="suggestion">Suggestion / Feature Request</option>
                      <option value="bug">Bug Report</option>
                      <option value="confusion">Something Was Confusing</option>
                      <option value="praise">Something Worked Great</option>
                      <option value="general">General Feedback</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      Your Feedback
                    </label>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder={
                        feedbackType === 'suggestion' ? 'What feature or improvement would help you most?' :
                        feedbackType === 'bug' ? 'What happened? What did you expect to happen?' :
                        feedbackType === 'confusion' ? 'What was confusing? How could we make it clearer?' :
                        feedbackType === 'praise' ? 'What worked well for you?' :
                        'Share your thoughts about your experience...'
                      }
                      required
                      style={{
                        width: '100%',
                        height: '120px',
                        padding: '12px',
                        borderRadius: '6px',
                        border: '2px solid var(--border-light)',
                        fontSize: '14px',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  <div style={{
                    padding: '15px',
                    backgroundColor: 'var(--bg-light)',
                    borderRadius: '6px',
                    marginBottom: '20px',
                    fontSize: '13px',
                    color: 'var(--text-medium)'
                  }}>
                    💡 <strong>Context automatically included:</strong> Current page, your user type, and timestamp will be sent with your feedback.
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    justifyContent: 'flex-end' 
                  }}>
                    <button
                      type="button"
                      onClick={() => setShowFeedback(false)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: 'white',
                        color: 'var(--text-medium)',
                        border: '2px solid var(--border-light)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!feedbackText.trim()}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: feedbackText.trim() ? 'var(--secondary-green)' : 'var(--border-light)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: feedbackText.trim() ? 'pointer' : 'not-allowed',
                        fontWeight: '600'
                      }}
                    >
                      Send Feedback
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default PilotFeedback