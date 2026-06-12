import { describe, it, expect, vi } from 'vitest'
import { BrowserService, StockService, AIService, AnimationService } from '.'

// Mock puppeteer
vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        setViewport: vi.fn(),
        goto: vi.fn().mockRejectedValue(new Error('Failed to load page')),
        screenshot: vi.fn(),
        close: vi.fn(),
      }),
      close: vi.fn(),
    }),
  },
}))

// Mock axios for OpenAI API calls
vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockRejectedValue(new Error('OpenAI API key required')),
  },
}))

// Mock unsplash-js
vi.mock('unsplash-js', () => ({
  createApi: vi.fn().mockReturnValue({
    search: {
      getPhotos: vi.fn().mockRejectedValue(new Error('No images found')),
    },
  }),
}))

describe('Services', () => {
  describe('BrowserService', () => {
    it('should throw error when capturing fails', async () => {
      const service = new BrowserService({ headless: true })
      await expect(service.capture('https://example.com')).rejects.toThrow('Failed to capture screenshot: Failed to load page')
    })
  })

  describe('StockService', () => {
    it('should throw error when video fetch fails', async () => {
      const service = new StockService({
        unsplashAccessKey: 'test-key',
        storyblocksApiKey: 'test-key',
      })
      await expect(service.getVideo('nature', 'hd')).rejects.toThrow('Failed to fetch video: Network Error')
    })

    it('should throw error when image fetch fails', async () => {
      const service = new StockService({
        unsplashAccessKey: 'test-key',
        storyblocksApiKey: 'test-key',
      })
      await expect(service.getImage('nature', 'regular')).rejects.toThrow('Failed to fetch image: No images found')
    })

    it('should throw error without API keys', () => {
      expect(() => new StockService({} as any)).toThrow('Unsplash access key is required')
      expect(() => new StockService({ unsplashAccessKey: 'key' } as any)).toThrow('Storyblocks API key is required')
    })
  })

  describe('AIService', () => {
    it('should throw error without API key', async () => {
      const service = new AIService({})
      await expect(service.generateImage('test')).rejects.toThrow('Failed to generate image: OpenAI API key required')
    })
  })

  describe('AnimationService', () => {
    it('should generate fadeIn animation', () => {
      const service = new AnimationService({ fps: 30 })
      const result = service.getAnimation('fadeIn', 15, { duration: 1 })
      expect(result.opacity).toBeDefined()
    })

    it('should throw error for invalid animation', () => {
      const service = new AnimationService({ fps: 30 })
      expect(() => service.getAnimation('invalid', 0, { duration: 1 })).toThrow('Animation "invalid" not found')
    })
  })
})
