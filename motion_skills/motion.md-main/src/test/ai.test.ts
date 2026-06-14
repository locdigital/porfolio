import { describe, it, expect, beforeEach } from 'vitest'
import type { AIService } from '../services/ai'
import { MockAIService } from './mocks'

describe('AI Content Validation Tests', () => {
  let aiService: AIService

  beforeEach(() => {
    aiService = new MockAIService({ apiKey: 'mock-key' })
  })

  it('should generate valid voiceover audio', async () => {
    const audio = await aiService.generateVoiceover('This is a test voiceover.')
    expect(audio).toBeDefined()
    expect(audio.byteLength).toBeGreaterThan(0)
  })

  it('should generate appropriate images', async () => {
    const imageUrl = await aiService.generateImage('A test image of a sunset')
    expect(imageUrl).toBeDefined()
    expect(imageUrl).toMatch(/^https:\/\//)
  })

  it('should generate valid video content', async () => {
    const videoUrl = await aiService.generateVideo('A short video clip of waves')
    expect(videoUrl).toBeDefined()
    expect(videoUrl).toMatch(/^https:\/\//)
  })

  it('should handle content moderation', async () => {
    await expect(aiService.generateImage('inappropriate content')).resolves.toMatch(/^https:\/\//)
  })

  it('should maintain consistent style', async () => {
    const [image1, image2] = await Promise.all([aiService.generateImage('A sunny day'), aiService.generateImage('A rainy day')])

    expect(image1).toMatch(/^https:\/\//)
    expect(image2).toMatch(/^https:\/\//)
  })
})
