import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { waitlistService } from '../services/api'

const SimpleLanding = () => {
  const { isAuthenticated } = useAuth()
  const [showWaitlistModal, setShowWaitlistModal] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [isWaitlistSubmitted, setIsWaitlistSubmitted] = useState(false)
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false)
  const [waitlistError, setWaitlistError] = useState('')

  const openWaitlistModal = () => {
    setShowWaitlistModal(true)
    setIsWaitlistSubmitted(false)
    setWaitlistEmail('')
    setWaitlistError('')
    setIsSubmittingWaitlist(false)
  }

  const closeWaitlistModal = () => {
    setShowWaitlistModal(false)
    setIsWaitlistSubmitted(false)
    setWaitlistEmail('')
    setWaitlistError('')
    setIsSubmittingWaitlist(false)
  }

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault()
    
    if (!waitlistEmail.trim()) {
      setWaitlistError('Please enter your email address')
      return
    }

    setIsSubmittingWaitlist(true)
    setWaitlistError('')

    try {
      const response = await waitlistService.join(waitlistEmail)
      
      if (response.data.alreadyExists) {
        // User was already on waitlist
        setIsWaitlistSubmitted(true)
      } else {
        // Successfully added to waitlist
        setIsWaitlistSubmitted(true)
      }
    } catch (error) {
      console.error('Waitlist signup error:', error)
      
      if (error.response?.data?.error) {
        setWaitlistError(error.response.data.error)
      } else {
        setWaitlistError('Failed to join waitlist. Please try again.')
      }
    } finally {
      setIsSubmittingWaitlist(false)
    }
  }

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu)
  }

  return (
    <div className="bg-white text-slate-800 min-h-screen">
      {/* Header & Navigation */}
      <header className="bg-white/80 backdrop-blur-lg fixed top-0 left-0 right-0 z-40 border-b border-slate-200">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img 
              src="/MyBidFit_LogoA_Wordmark_original_transparent.png" 
              alt="MyBidFit Logo" 
              className="h-8"
            />
          </Link>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-slate-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="#who-is-it-for" className="text-slate-600 hover:text-blue-600 transition-colors">Who It's For</a>
            <a href="#resources" className="text-slate-600 hover:text-blue-600 transition-colors">Resources</a>
          </nav>
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/login" 
              className="text-slate-600 hover:text-blue-600 transition-colors font-medium"
            >
              Login
            </Link>
            <button 
              onClick={openWaitlistModal}
              className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Join Waitlist
            </button>
          </div>
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden text-slate-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
            </svg>
          </button>
        </div>
        
        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden px-6 pb-4 space-y-2">
            <a href="#features" className="block text-slate-600 hover:text-blue-600 transition-colors" onClick={() => setShowMobileMenu(false)}>Features</a>
            <a href="#who-is-it-for" className="block text-slate-600 hover:text-blue-600 transition-colors" onClick={() => setShowMobileMenu(false)}>Who It's For</a>
            <a href="#resources" className="block text-slate-600 hover:text-blue-600 transition-colors" onClick={() => setShowMobileMenu(false)}>Resources</a>
            <Link 
              to="/login" 
              className="block text-slate-600 hover:text-blue-600 transition-colors font-medium" 
              onClick={() => setShowMobileMenu(false)}
            >
              Login
            </Link>
            <button 
              onClick={() => { openWaitlistModal(); setShowMobileMenu(false); }}
              className="w-full mt-2 bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Join Waitlist
            </button>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 md:pt-32 md:pb-20 text-center bg-gradient-to-b from-blue-50 to-white">
          <div className="container mx-auto px-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
              Win The Work You Were Built For
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-600 mb-8">
              MyBidFit's AI finds your highest-potential opportunities and partners, so you can focus on closing deals, not chasing leads. Stop guessing, start winning.
            </p>
            <button 
              onClick={openWaitlistModal}
              className="bg-blue-600 text-white font-semibold px-8 py-4 rounded-lg hover:bg-blue-700 transition-transform hover:scale-105 shadow-lg mb-12"
            >
              Join the Early Access Waitlist
            </button>
            <div className="relative">
              <div className="rounded-2xl shadow-xl border border-slate-200 mx-auto bg-white p-4 md:p-6 max-w-4xl">
                <div className="text-center mb-4">
                  <p className="text-xl font-semibold text-slate-900 mb-2">🚧 Platform Preview Coming Soon</p>
                  <p className="text-slate-600">Join our waitlist to be first in line when we launch</p>
                </div>
                
                {/* Product Screenshot Mockup */}
                <div className="relative bg-slate-100 rounded-lg overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                    {/* Browser-like mockup header */}
                    <div className="absolute top-0 left-0 right-0 h-8 bg-white border-b border-slate-200 flex items-center px-4">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="ml-4 flex-1 bg-slate-50 rounded px-3 py-1 text-xs text-slate-500">
                        app.mybidfit.com/dashboard
                      </div>
                    </div>
                    
                    {/* Mockup content */}
                    <div className="pt-8 px-6 pb-6 w-full">
                      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-slate-900 text-sm">Federal IT Contract - $2.4M</h3>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">94% Match</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500">Due Date</span>
                            <p className="font-medium text-slate-900">Mar 15, 2025</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Location</span>
                            <p className="font-medium text-slate-900">Sacramento, CA</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Type</span>
                            <p className="font-medium text-slate-900">Cloud Migration</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex space-x-2">
                            <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Win Strategy</button>
                            <button className="border border-slate-300 text-slate-700 px-3 py-1 rounded text-xs">View Details</button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Additional mockup elements */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
                          <div className="h-2 bg-slate-200 rounded mb-2"></div>
                          <div className="h-2 bg-slate-200 rounded w-2/3"></div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
                          <div className="h-2 bg-slate-200 rounded mb-2"></div>
                          <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Coming Soon Overlay */}
                  <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg px-6 py-4 text-center shadow-lg">
                      <div className="text-2xl mb-2">⚡</div>
                      <p className="font-semibold text-slate-900 mb-1">Coming Soon</p>
                      <p className="text-sm text-slate-600">Full platform launching Q1 2025</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Status Quo is Broken</h2>
            <p className="max-w-2xl mx-auto text-slate-600 mb-12">The go-to-market motion for service businesses is filled with friction, guesswork, and wasted effort.</p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-xl font-semibold mb-2">Wasted Hours on Prospecting</h3>
                <p className="text-slate-600">Manual searches and cold outreach have a dismal success rate, burning out your best people.</p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-xl font-semibold mb-2">Missed Partnership Opportunities</h3>
                <p className="text-slate-600">Identifying and vetting strategic partners is time-consuming and often relies on luck.</p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-xl font-semibold mb-2">Low-Quality, Generic Leads</h3>
                <p className="text-slate-600">Procurement buyers are spammed with ill-fitting proposals, making it hard for you to stand out.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Section with Interactive Opportunity Hub Preview */}
        <section id="features" className="py-20">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Where <span className="gradient-text">AI-Powered Precision</span> Meets Opportunity
            </h2>
            <p className="max-w-2xl mx-auto text-slate-600 mb-12">
              MyBidFit goes beyond simple keyword matching to understand the DNA of your business and the true needs of the market.
            </p>
            
            {/* Interactive Opportunity Hub Demo */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-6xl mx-auto">
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">Live Opportunity Hub Preview</h3>
                <p className="text-slate-600">See how MyBidFit's AI matches suppliers to their highest-potential opportunities</p>
              </div>
              
              {/* Demo Opportunity Card */}
              <div className="bg-slate-50 rounded-xl p-6 mb-6 text-left">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">IT Infrastructure Modernization - State of California</h4>
                    <p className="text-slate-600">$2.4M • Due: March 15, 2025 • Sacramento, CA</p>
                  </div>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Active</span>
                </div>
                <p className="text-slate-700 mb-4">Seeking qualified vendors for comprehensive cloud migration, security implementation, and staff training for 15 state departments.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">Cloud Migration</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">Cybersecurity</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">Training</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">Government</span>
                </div>
              </div>
              
              {/* AI Match Analysis */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Supplier Match 1 */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="font-semibold text-slate-900">TechForward Solutions</h5>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-green-600">94%</span>
                      <span className="text-sm text-green-700">Match</span>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Past Performance</span>
                      <span className="font-medium text-slate-900">Excellent (12 gov projects)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Capability Match</span>
                      <span className="font-medium text-slate-900">95% (Cloud + Security)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Geographic Fit</span>
                      <span className="font-medium text-slate-900">Perfect (Sacramento HQ)</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                      Win Strategy
                    </button>
                    <button className="flex-1 bg-white text-green-600 border border-green-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors">
                      View Profile
                    </button>
                  </div>
                </div>
                
                {/* Supplier Match 2 */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="font-semibold text-slate-900">CloudSecure Inc.</h5>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-orange-600">76%</span>
                      <span className="text-sm text-orange-700">Match</span>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Past Performance</span>
                      <span className="font-medium text-slate-900">Good (4 gov projects)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Capability Match</span>
                      <span className="font-medium text-slate-900">85% (Strong Security)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Geographic Fit</span>
                      <span className="font-medium text-slate-900">Regional (Bay Area)</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors">
                      Win Strategy
                    </button>
                    <button className="flex-1 bg-white text-orange-600 border border-orange-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
              
              {/* AI Insights Section */}
              <div className="mt-8 bg-blue-50 rounded-xl p-6">
                <h6 className="font-semibold text-slate-900 mb-3">🤖 AI-Generated Insights</h6>
                <div className="grid md:grid-cols-3 gap-4 text-left">
                  <div>
                    <div className="font-medium text-blue-900 mb-1">Key Success Factor</div>
                    <p className="text-sm text-blue-800">Government experience and security clearances are critical differentiators for this opportunity.</p>
                  </div>
                  <div>
                    <div className="font-medium text-blue-900 mb-1">Competitive Edge</div>
                    <p className="text-sm text-blue-800">Emphasize local presence and previous state agency relationships in proposals.</p>
                  </div>
                  <div>
                    <div className="font-medium text-blue-900 mb-1">Win Probability</div>
                    <p className="text-sm text-blue-800">TechForward has 73% win probability based on similar past competitions.</p>
                  </div>
                </div>
              </div>
              
              {/* Call-to-Action */}
              <div className="mt-8 text-center">
                <button 
                  onClick={openWaitlistModal}
                  className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                >
                  Get Early Access to the Opportunity Hub
                </button>
                <p className="text-sm text-slate-500 mt-2">Join our waitlist to receive personalized match analysis for your business</p>
              </div>
            </div>
          </div>
        </section>

        <section id="who-is-it-for" className="py-20 bg-slate-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Built for Growth-Focused Service Businesses</h2>
              <p className="max-w-2xl mx-auto text-slate-600 mt-4">If you're tired of the traditional, low-ROI approach to business development, MyBidFit is for you.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-xl font-semibold mb-2">MSP Sales Leaders</h3>
                <p className="text-slate-600">Transform from a commoditized IT provider to a proactive strategic partner for your clients.</p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-xl font-semibold mb-2">SMB Partnership Teams</h3>
                <p className="text-slate-600">Cut through the noise to find, vet, and engage partners that will actually help you scale.</p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-xl font-semibold mb-2">Niche Service Providers</h3>
                <p className="text-slate-600">Stop competing on price. Start winning on your unique strengths and expertise.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="resources" className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Stay Ahead of the Curve</h2>
              <p className="max-w-2xl mx-auto text-slate-600 mt-4">We're not just building a platform; we're researching the future of business development.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl grid md:grid-cols-2 overflow-hidden shadow-lg">
              <div className="p-8 md:p-12">
                <h3 className="text-sm font-semibold uppercase text-blue-600 mb-2">World Economic Forum White Paper</h3>
                <h4 className="text-2xl font-bold mb-4">Start-up and Corporation Collaboration</h4>
                <p className="text-slate-600 mb-6">A comprehensive guide for mutual understanding between start-ups and corporates. Explore practical frameworks, collaboration models, and proven strategies for successful partnerships in the Fourth Industrial Revolution.</p>
                <a
                  href="/WEF_White_Paper_Collaboration_between_Start-ups_and_Corporates.pdf"
                  download="WEF_Startup_Corporate_Collaboration.pdf"
                  className="inline-block bg-slate-800 text-white font-semibold px-6 py-3 rounded-lg hover:bg-slate-900 transition-colors"
                >
                  Download the White Paper
                </a>
              </div>
              <div className="bg-slate-100 flex items-center justify-center p-8">
                <div className="w-full h-full max-w-xs bg-white rounded-lg shadow-xl p-6 border border-slate-200 flex flex-col justify-center text-center">
                  <p className="text-3xl">📄</p>
                  <p className="font-bold mt-4">Start-up and Corporation Collaboration</p>
                  <p className="text-sm text-slate-500 mt-1">WEF White Paper</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-slate-900 text-white py-20">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Go-to-Market?</h2>
            <p className="max-w-2xl mx-auto text-slate-300 mb-8">Be the first to know when MyBidFit launches. Join our early access waitlist to get exclusive updates and onboarding priority.</p>
            <button 
              onClick={openWaitlistModal}
              className="bg-blue-600 text-white font-semibold px-8 py-4 rounded-lg hover:bg-blue-700 transition-transform hover:scale-105 shadow-lg"
            >
              Join the Early Access Waitlist
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 py-12">
        <div className="container mx-auto px-6 text-center text-slate-500">
          <p>&copy; 2025 MyBidFit, Inc. All rights reserved.</p>
          <div className="mt-4 space-x-6">
            <Link to="/about" className="hover:text-blue-600">About</Link>
            <Link to="/contact" className="hover:text-blue-600">Contact</Link>
            <a href="#" className="hover:text-blue-600">LinkedIn</a>
          </div>
        </div>
      </footer>

      {/* Waitlist Modal */}
      {showWaitlistModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative">
            <button 
              onClick={closeWaitlistModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 text-2xl"
            >
              ×
            </button>
            
            {!isWaitlistSubmitted ? (
              <div>
                <h3 className="text-2xl font-bold mb-2">Join the Waitlist</h3>
                <p className="text-slate-600 mb-6">Get early access and be the first to know when we launch.</p>
                <form onSubmit={handleWaitlistSubmit}>
                  <div className="mb-4">
                    <label htmlFor="waitlist-email" className="sr-only">Email Address</label>
                    <input 
                      type="email" 
                      id="waitlist-email"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      placeholder="you@company.com" 
                      required 
                      disabled={isSubmittingWaitlist}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  
                  {waitlistError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{waitlistError}</p>
                    </div>
                  )}
                  
                  <button 
                    type="submit" 
                    disabled={isSubmittingWaitlist}
                    className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmittingWaitlist ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Joining...
                      </>
                    ) : (
                      'Join Now'
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">You're on the list! 🎉</h3>
                <p className="text-slate-600 mb-6">Thank you for joining. We'll be in touch with updates soon.</p>
                <button 
                  onClick={closeWaitlistModal}
                  className="w-full bg-slate-200 text-slate-800 font-semibold py-3 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SimpleLanding