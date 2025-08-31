import React from 'react'
import { useFeatureFlags } from '../contexts/FeatureFlagsContext'

const PilotBadge = ({ size = 'small', style = {} }) => {
  const { isPilotUser } = useFeatureFlags()

  if (!isPilotUser()) {
    return null
  }

  const sizeStyles = {
    small: {
      padding: '4px 8px',
      fontSize: '11px',
      borderRadius: '12px'
    },
    medium: {
      padding: '6px 12px',
      fontSize: '12px',
      borderRadius: '14px'
    },
    large: {
      padding: '8px 16px',
      fontSize: '14px',
      borderRadius: '20px'
    }
  }

  return (
    <span style={{
      backgroundColor: 'var(--secondary-green)',
      color: 'white',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      ...sizeStyles[size],
      ...style
    }}>
      <span>✨</span>
      PILOT USER
    </span>
  )
}

export default PilotBadge