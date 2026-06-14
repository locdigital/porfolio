import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StockService } from './stock'

vi.mock('unsplash-js', () => ({
  createApi: vi.fn().mockReturnValue({
    search: {
      getPhotos: vi.fn().mockResolvedValue({
        response: {
          results: [
            {
              urls: {
                regular: 'https://example.com/photo.jpg',
              },
              user: {
                name: 'Test User',
              },
            },
          ],
        },
      }),
    },
  }),
}))

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        results: [
          {
            url: 'https://example.com/video.mp4',
          },
        ],
      },
    }),
  },
}))

describe('StockService', () => {
  let service: StockService

  beforeEach(() => {
    service = new StockService({
      unsplashAccessKey: 'test-key',
      storyblocksApiKey: 'test-key',
    })
  })

  it('should fetch image from Unsplash', async () => {
    const result = await service.getImage('nature', 'regular')
    expect(result.url).toBeDefined()
    expect(result.credit).toContain('Photo by')
  })

  it('should fetch video from Storyblocks', async () => {
    const result = await service.getVideo('nature', 'hd')
    expect(result.url).toBeDefined()
  })
})
