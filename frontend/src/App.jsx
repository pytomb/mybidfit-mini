import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import ProfileBuilder from './pages/ProfileBuilder'
import OpportunityDetail from './pages/OpportunityDetail'
import PartnerFit from './pages/PartnerFit'
import RelationshipIntelligence from './pages/RelationshipIntelligence'
import Login from './pages/Login'
import Register from './pages/Register'
import Features from './pages/Features'
import CaseStudies from './pages/CaseStudies'
import About from './pages/About'
import SimpleMVP from './components/SimpleMVP'
import AdminDashboard from './components/AdminDashboard'
import { AuthProvider } from './contexts/AuthContext'
import { FeatureFlagsProvider } from './contexts/FeatureFlagsContext'
import PilotOnboarding from './components/PilotOnboarding'
import PilotFeedback from './components/PilotFeedback'

function App() {
  return (
    <AuthProvider>
      <FeatureFlagsProvider>
        <div className="container">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/simple" element={<SimpleMVP />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile-builder" element={<ProfileBuilder />} />
              <Route path="/partner-fit" element={<PartnerFit />} />
              <Route path="/relationship-intelligence" element={<RelationshipIntelligence />} />
              <Route path="/opportunity/:id" element={<OpportunityDetail />} />
              <Route path="/features" element={<Features />} />
              <Route path="/case-studies" element={<CaseStudies />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </main>
        </div>
        <PilotOnboarding />
        <PilotFeedback />
      </FeatureFlagsProvider>
    </AuthProvider>
  )
}

export default App