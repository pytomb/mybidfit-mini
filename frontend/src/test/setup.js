import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})

// Mock window.scrollTo for smooth scroll tests
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(() => {}),
  writable: true
})

// Mock window.alert for alert tests
Object.defineProperty(window, 'alert', {
  value: vi.fn(() => {}),
  writable: true
})

// Mock document.getElementById for scroll tests
const originalGetElementById = document.getElementById
document.getElementById = vi.fn((id) => {
  if (id === 'try-fit-demo') {
    return {
      scrollIntoView: vi.fn()
    }
  }
  return originalGetElementById.call(document, id)
})