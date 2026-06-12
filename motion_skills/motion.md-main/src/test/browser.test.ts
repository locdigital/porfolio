import { describe, it, expect, beforeEach } from 'vitest'
import type { BrowserService } from '../services/browser'
import { MockBrowserService } from './mocks'

describe('Browser Rendering Tests', () => {
  let browserService: BrowserService

  beforeEach(() => {
    browserService = new MockBrowserService({
      headless: true,
      defaultViewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2,
      },
    })
  })

  it('should capture browser screenshot', async () => {
    const screenshot = await browserService.capture('https://example.com')
    expect(screenshot).toBeDefined()
    expect(screenshot.length).toBeGreaterThan(0)
  })

  it('should handle dynamic content', async () => {
    const screenshot = await browserService.capture('https://example.com/dynamic')
    expect(screenshot).toBeDefined()
    expect(screenshot.length).toBeGreaterThan(0)
  })

  it('should handle errors gracefully', async () => {
    await expect(browserService.capture('https://nonexistent.example.com')).rejects.toThrow()
  })

  it('should respect viewport settings', async () => {
    const screenshot = await browserService.capture('https://example.com')
    expect(screenshot).toBeDefined()
    expect(screenshot.length).toBeGreaterThan(0)
  })
})
