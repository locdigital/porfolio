import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AIService } from './ai'

vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockImplementation((url) => {
      if (url.includes('/images/generations')) {
        return Promise.resolve({
          data: {
            data: [{ url: 'https://example.com/image.png' }],
          },
        })
      } else if (url.includes('/audio/speech')) {
        return Promise.resolve({
          data: Buffer.from('test-audio'),
        })
      }
    }),
  },
}))

describe('AIService', () => {
  let service: AIService

  beforeEach(() => {
    service = new AIService({ apiKey: 'test-key' })
  })

  it('should generate image', async () => {
    const result = await service.generateImage('test prompt')
    expect(result).toBe('https://example.com/image.png')
  })

  it('should generate video', async () => {
    const result = await service.generateVideo('test prompt')
    expect(result).toBe('https://example.com/image.png')
  })

  it('should generate voiceover', async () => {
    const result = await service.generateVoiceover('Hello world')
    expect(Buffer.isBuffer(result)).toBe(true)
  })

  it('should throw error without API key', async () => {
    service = new AIService({})
    await expect(service.generateImage('test')).rejects.toThrow('OpenAI API key is required')
  })
})
