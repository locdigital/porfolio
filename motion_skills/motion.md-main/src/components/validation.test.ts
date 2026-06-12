import { describe, it, expect } from 'vitest'
import {
  baseSchema,
  introSchema,
  outroSchema,
  codeSchema,
  browserSchema,
  videoSchema,
  animationSchema,
  memeSchema,
  imageSchema,
  screenshotSchema,
  validateProps,
} from './validation'

describe('Props Validation', () => {
  it('should validate base props', () => {
    const validProps = {
      duration: 5,
      transition: 'fade',
    }
    expect(() => validateProps(baseSchema, validProps)).not.toThrow()

    const invalidProps = {
      duration: -1,
    }
    expect(() => validateProps(baseSchema, invalidProps)).toThrow()
  })

  it('should validate intro props', () => {
    const validProps = {
      title: 'Welcome',
      subtitle: 'Presentation',
      duration: 3,
    }
    expect(() => validateProps(introSchema, validProps)).not.toThrow()

    const invalidProps = {
      title: '',
      duration: 3,
    }
    expect(() => validateProps(introSchema, invalidProps)).toThrow()
  })

  it('should validate browser props', () => {
    const validProps = {
      url: 'https://example.com',
      width: 1920,
      height: 1080,
    }
    expect(() => validateProps(browserSchema, validProps)).not.toThrow()

    const invalidProps = {
      url: 'not-a-url',
      width: -1,
    }
    expect(() => validateProps(browserSchema, invalidProps)).toThrow()
  })
})
