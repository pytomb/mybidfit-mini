import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const ABTestRouter = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleABTestRouting = async () => {
      try {
        // Check if user has a preference set
        const savedExperience = localStorage.getItem('abTestExperience');
        const userToken = localStorage.getItem('token');
        
        let selectedExperience = savedExperience;
        
        if (!selectedExperience) {
          // New user - randomly assign to A/B test
          const random = Math.random();
          selectedExperience = random < 0.5 ? 'simple' : 'full';
          localStorage.setItem('abTestExperience', selectedExperience);
          
          // Track assignment if user is logged in
          if (userToken) {
            try {
              await axios.post('/api/analytics/track', {
                event: 'ab_test_assigned',
                experienceType: selectedExperience,
                userId: null // Will be set by backend
              }, {
                headers: { Authorization: `Bearer ${userToken}` }
              });
            } catch (error) {
              console.log('Failed to track A/B test assignment:', error);
            }
          }
        }

        // Track page visit
        if (userToken) {
          try {
            await axios.post('/api/analytics/track', {
              event: 'page_visit',
              experienceType: selectedExperience,
              page: 'home'
            }, {
              headers: { Authorization: `Bearer ${userToken}` }
            });
          } catch (error) {
            console.log('Failed to track page visit:', error);
          }
        }

        // Route to appropriate experience
        if (selectedExperience === 'simple') {
          navigate('/simple', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }

      } catch (error) {
        console.error('A/B test routing error:', error);
        // Default to simple experience on error
        navigate('/simple', { replace: true });
      }
    };

    // Only run A/B test routing on root path
    if (location.pathname === '/') {
      handleABTestRouting();
    }
  }, [navigate, location]);

  // Loading state while routing decision is made
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold mb-2">Welcome to MyBidFit</h1>
        <p className="text-gray-600">Setting up your experience...</p>
      </div>
    </div>
  );
};

// Component to allow manual experience switching (for testing)
export const ExperienceSwitcher = () => {
  const navigate = useNavigate();
  
  const switchExperience = (experience) => {
    localStorage.setItem('abTestExperience', experience);
    
    // Track the switch
    const userToken = localStorage.getItem('token');
    if (userToken) {
      axios.post('/api/analytics/track', {
        event: 'experience_switched',
        experienceType: experience,
        previousExperience: localStorage.getItem('abTestExperience')
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      }).catch(console.error);
    }
    
    // Navigate to the selected experience
    if (experience === 'simple') {
      navigate('/simple');
    } else {
      navigate('/dashboard');
    }
  };

  const currentExperience = localStorage.getItem('abTestExperience') || 'unknown';

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg p-4 shadow-lg">
      <p className="text-sm font-medium mb-2">
        Current: <span className="capitalize">{currentExperience}</span>
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => switchExperience('simple')}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Simple MVP
        </button>
        <button
          onClick={() => switchExperience('full')}
          className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
        >
          Full Platform
        </button>
      </div>
    </div>
  );
};

export default ABTestRouter;