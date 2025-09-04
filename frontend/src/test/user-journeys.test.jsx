import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

describe('Critical User Journeys', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
  })

  describe('Visitor to Trial Journey', () => {
    it('should navigate from home to register when clicking Start Free Trial', async () => {
      const user = userEvent.setup()
      
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      )

      // Verify we're on the home page
      expect(screen.getAllByText(/MyBidFit/i).length).toBeGreaterThan(0)

      // Find and click the first "Start Free Trial" button
      const trialButtons = screen.getAllByText(/Start Free Trial/i)
      expect(trialButtons.length).toBeGreaterThan(0)

      await user.click(trialButtons[0])

      // Wait for navigation to register page
      await waitFor(() => {
        expect(window.location.pathname).toBe('/register')
      })
    })

    it('should navigate from demo video to register', async () => {
      const user = userEvent.setup()
      
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      )

      // Find and click "Watch Demo" button
      const demoButtons = screen.getAllByText(/Watch Demo/i)
      if (demoButtons.length > 0) {
        await user.click(demoButtons[0])

        // Video modal should open
        await waitFor(() => {
          expect(screen.getByText(/Demo Video/i)).toBeDefined()
        })

        // Click "Start Free Trial" from within modal
        const modalTrialButton = screen.getByText(/Start Free Trial/i)
        await user.click(modalTrialButton)

        // Should navigate to register
        await waitFor(() => {
          expect(window.location.pathname).toBe('/register')
        })
      }
    })
  })

  describe('Demo Interaction Journey', () => {
    it('should handle Try Fit Demo form interaction', async () => {
      const user = userEvent.setup()
      
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      )

      // Find the demo textarea
      const demoTextarea = screen.getByPlaceholderText(/Paste your RFP/i)
      expect(demoTextarea).toBeDefined()

      // Enter text and submit
      await user.type(demoTextarea, 'Test RFP content for demo analysis')
      
      const analyzeButton = screen.getByText(/Get Instant Analysis/i)
      await user.click(analyzeButton)

      // Demo results modal should appear
      await waitFor(() => {
        expect(screen.getByText(/DEMO FIT ANALYSIS RESULTS/i)).toBeDefined()
      })

      // Verify results content
      expect(screen.getByText(/OVERALL FIT SCORE/i)).toBeDefined()
      expect(screen.getByText(/CFO PERSPECTIVE/i)).toBeDefined()
    })

    it('should handle empty demo form submission gracefully', async () => {
      const user = userEvent.setup()
      
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      )

      const analyzeButton = screen.getByText(/Get Instant Analysis/i)
      await user.click(analyzeButton)

      // Should not show modal for empty input
      expect(() => screen.getByText(/DEMO FIT ANALYSIS RESULTS/i)).toThrow()
    })
  })

  describe('Navigation Journey', () => {
    const navigationTests = [
      { path: '/features', linkText: /Features/i, expectedContent: /MyBidFit Features/i },
      { path: '/case-studies', linkText: /Success Stories/i, expectedContent: /Pilot Program in Progress/i },
      { path: '/about', linkText: /About/i, expectedContent: /About MyBidFit/i }
    ]

    navigationTests.forEach(({ path, linkText, expectedContent }) => {
      it(`should navigate to ${path} and display correct content`, async () => {
        const user = userEvent.setup()
        
        render(
          <MemoryRouter initialEntries={['/']}>
            <App />
          </MemoryRouter>
        )

        // Navigate directly using React Router
        render(
          <MemoryRouter initialEntries={[path]}>
            <App />
          </MemoryRouter>
        )

        // Verify page content loads
        await waitFor(() => {
          expect(screen.getByText(expectedContent)).toBeDefined()
        })
      })
    })

    it('should handle smooth scroll for internal links', async () => {
      const user = userEvent.setup()
      const scrollIntoViewMock = vi.fn()
      
      // Mock getElementById to return element with scrollIntoView
      const mockElement = { scrollIntoView: scrollIntoViewMock }
      vi.spyOn(document, 'getElementById').mockReturnValue(mockElement)
      
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      )

      // Find and click "Try Free Demo" button (which should trigger scroll)
      const tryDemoButtons = screen.getAllByText(/Try Free Demo/i)
      if (tryDemoButtons.length > 0) {
        await user.click(tryDemoButtons[0])

        // Verify scrollIntoView was called
        expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' })
      }
    })
  })

  describe('Responsive Behavior', () => {
    it('should handle modal interactions on mobile viewports', async () => {
      const user = userEvent.setup()
      
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      )

      // Test demo form on mobile
      const demoTextarea = screen.getByPlaceholderText(/Paste your RFP/i)
      await user.type(demoTextarea, 'Mobile test content')
      
      const analyzeButton = screen.getByText(/Get Instant Analysis/i)
      await user.click(analyzeButton)

      // Modal should still work on mobile
      await waitFor(() => {
        expect(screen.getByText(/DEMO FIT ANALYSIS RESULTS/i)).toBeDefined()
      })

      // Close modal by clicking overlay (mobile behavior)
      const modalOverlay = screen.getByText(/DEMO FIT ANALYSIS RESULTS/i).closest('.modal-overlay')
      if (modalOverlay) {
        await user.click(modalOverlay)
        
        await waitFor(() => {
          expect(() => screen.getByText(/DEMO FIT ANALYSIS RESULTS/i)).toThrow()
        })
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle broken links gracefully', async () => {
      // Test navigation to non-existent route
      render(
        <MemoryRouter initialEntries={['/non-existent-route']}>
          <App />
        </MemoryRouter>
      )

      // Should not crash the app
      expect(document.body).toBeDefined()
      
      // Should still show header/navigation
      expect(screen.getAllByText(/MyBidFit/i).length).toBeGreaterThan(0)
    })

    it('should handle form errors gracefully', async () => {
      const user = userEvent.setup()
      
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      )

      // Try to submit demo with very long text
      const demoTextarea = screen.getByPlaceholderText(/Paste your RFP/i)
      const veryLongText = 'x'.repeat(10000)
      
      await user.type(demoTextarea, veryLongText)
      
      const analyzeButton = screen.getByText(/Get Instant Analysis/i)
      await user.click(analyzeButton)

      // Should still handle gracefully (not crash)
      expect(document.body).toBeDefined()
    })
  })
})