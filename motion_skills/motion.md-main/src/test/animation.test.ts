import { describe, it, expect, beforeEach } from 'vitest'
import type { AnimationService } from '../services/animation'
import { MockAnimationService } from './mocks'

describe('Animation Service Tests', () => {
  let animationService: AnimationService

  beforeEach(() => {
    animationService = new MockAnimationService({
      apiKey: 'mock-key',
    })
  })

  it('should fetch animation with proper metadata', async () => {
    const animation = await animationService.getAnimation('fade')
    expect(animation.name).toBeDefined()
    expect(animation.defaultDuration).toBeGreaterThan(0)
    expect(animation.defaultEasing).toBeDefined()
    expect(animation.keyframes).toBeDefined()
    expect(animation.css).toContain('@keyframes')
  })

  it('should include duration and easing in output', async () => {
    const animation = await animationService.getAnimation('slide')
    expect(animation.duration).toBeDefined()
    expect(animation.easing).toBeDefined()
  })

  it('should generate valid CSS', async () => {
    const animation = await animationService.getAnimation('bounce')
    expect(animation.css).toContain(animation.name)
    expect(animation.css).toContain(animation.defaultDuration + 's')
    expect(animation.css).toContain(animation.defaultEasing)
  })

  it('should handle different animation types', async () => {
    const animations = ['fade', 'slide', 'bounce']
    const results = await Promise.all(animations.map((name) => animationService.getAnimation(name)))

    results.forEach((animation) => {
      expect(animation.name).toBeDefined()
      expect(animation.css).toBeDefined()
      expect(animation.keyframes).toBeDefined()
    })
  })
})
