import { describe, it, expect, beforeEach } from 'vitest'
import { AnimationService } from './animation'

describe('AnimationService', () => {
  let service: AnimationService

  beforeEach(() => {
    service = new AnimationService({ fps: 30 })
  })

  it('should generate fadeIn animation', () => {
    const result = service.getAnimation('fadeIn', 15, { duration: 1 })
    expect(result).toBeDefined()
    expect(result.opacity).toBeDefined()
  })

  it('should handle invalid animation type', () => {
    expect(() => service.getAnimation('invalid', 0, { duration: 1 })).toThrow('Animation "invalid" not found')
  })
})
