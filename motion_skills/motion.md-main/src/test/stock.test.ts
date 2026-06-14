import { describe, it, expect, beforeEach } from 'vitest'
import type { StockService } from '../services/stock'
import { MockStockService } from './mocks'

describe('Stock Media Tests', () => {
  let stockService: StockService

  beforeEach(() => {
    stockService = new MockStockService({
      unsplashAccessKey: 'mock-key',
      storyblocksApiKey: 'mock-key',
    })
  })

  it('should fetch images with proper metadata', async () => {
    const image = await stockService.getImage('test query')
    expect(image.url).toMatch(/^https:\/\//)
    expect(image.credit).toContain('Unsplash')
    expect(image.title).toBeDefined()
    expect(image.width).toBeGreaterThan(0)
    expect(image.height).toBeGreaterThan(0)
  })

  it('should fetch videos with proper metadata', async () => {
    const video = await stockService.getVideo('test query')
    expect(video.url).toMatch(/^https:\/\//)
    expect(video.preview).toMatch(/^https:\/\//)
    expect(video.thumbnail).toMatch(/^https:\/\//)
    expect(video.title).toBeDefined()
    expect(video.duration).toBeGreaterThan(0)
  })

  it('should handle different image quality options', async () => {
    const qualities: Array<'regular' | 'full' | 'thumb'> = ['regular', 'full', 'thumb']
    const results = await Promise.all(qualities.map((quality) => stockService.getImage('test query', quality)))

    results.forEach((image) => {
      expect(image.url).toMatch(/^https:\/\//)
      expect(image.credit).toBeDefined()
    })
  })

  it('should handle different video quality options', async () => {
    const qualities: Array<'4k' | 'hd' | 'preview'> = ['4k', 'hd', 'preview']
    const results = await Promise.all(qualities.map((quality) => stockService.getVideo('test query', quality)))

    results.forEach((video) => {
      expect(video.url).toMatch(/^https:\/\//)
      expect(video.preview).toBeDefined()
    })
  })
})
