import { describe, it, expect } from 'vitest'
import { parseMDX } from './parser'
import { Browser, Video, Image, Animation } from '../components'

describe('MDX Parser', () => {
  describe('Basic MDX Parsing', () => {
    it('should parse basic MDX content', async () => {
      const content = '# Hello World\n\nThis is a test'
      const result = await parseMDX(content)
      expect(result.content).toContain('Hello World')
      expect(result.content).toContain('This is a test')
    })

    it('should handle empty content', async () => {
      const content = ''
      const result = await parseMDX(content)
      expect(result.content).toBe('')
      expect(result.slides).toHaveLength(0)
    })
  })

  describe('Frontmatter Handling', () => {
    it('should parse frontmatter correctly', async () => {
      const content = `---
title: Test Presentation
fps: 30
resolution:
  width: 1920
  height: 1080
---
# Content`
      const result = await parseMDX(content)
      expect(result.frontmatter).toEqual({
        title: 'Test Presentation',
        fps: 30,
        resolution: {
          width: 1920,
          height: 1080,
        },
      })
    })

    it('should handle missing frontmatter', async () => {
      const content = '# No Frontmatter'
      const result = await parseMDX(content)
      expect(result.frontmatter).toEqual({})
    })
  })

  describe('Component Integration', () => {
    it('should render Browser component', async () => {
      const content = '<Browser url="https://example.com" width={1920} height={1080} />'
      const result = await parseMDX(content)
      expect(result.content).toContain('Browser')
      expect(result.content).toContain('example.com')
    })

    it('should render Video component', async () => {
      const content = '<Video src="video.mp4" type="storyblocks" width={1920} height={1080} />'
      const result = await parseMDX(content)
      expect(result.content).toContain('Video')
      expect(result.content).toContain('video.mp4')
    })

    it('should render Image component', async () => {
      const content = '<Image src="image.jpg" type="unsplash" width={1920} height={1080} />'
      const result = await parseMDX(content)
      expect(result.content).toContain('Image')
      expect(result.content).toContain('image.jpg')
    })

    it('should render Animation component', async () => {
      const content = '<Animation type="magicui" name="fade" duration={1} />'
      const result = await parseMDX(content)
      expect(result.content).toContain('Animation')
      expect(result.content).toContain('fade')
    })

    it('should handle multiple components in a single MDX', async () => {
      const content = `
<Browser url="https://example.com" />
<Video src="video.mp4" type="storyblocks" />
<Image src="image.jpg" type="unsplash" />
`
      const result = await parseMDX(content)
      expect(result.content).toContain('Browser')
      expect(result.content).toContain('Video')
      expect(result.content).toContain('Image')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid MDX syntax', async () => {
      const content = '< Invalid MDX >'
      await expect(parseMDX(content)).rejects.toThrow('Failed to parse MDX')
    })

    it('should handle invalid component props', async () => {
      const content = '<Browser width={-100} />'
      await expect(parseMDX(content)).rejects.toThrow('Failed to parse MDX: Browser width must be a positive number')
    })

    it('should handle invalid video type', async () => {
      const content = '<Video type="invalid" />'
      await expect(parseMDX(content)).rejects.toThrow('Failed to parse MDX: Video type must be either "storyblocks" or "ai"')
    })

    it('should handle invalid animation duration', async () => {
      const content = '<Animation type="magicui" duration={-1} />'
      await expect(parseMDX(content)).rejects.toThrow('Failed to parse MDX: Animation duration must be a positive number')
    })

    it('should handle missing required props', async () => {
      const content = '<Animation />'
      await expect(parseMDX(content)).rejects.toThrow('Failed to parse MDX: Animation type must be "magicui"')
    })

    it('should handle malformed frontmatter', async () => {
      const content = `---
invalid yaml
---
# Content`
      await expect(parseMDX(content)).rejects.toThrow()
    })
  })

  describe('Slidev Syntax', () => {
    it('should handle Slidev layout syntax', async () => {
      const content = `---
layout: intro
---
# Welcome`
      const result = await parseMDX(content)
      expect(result.slidevConfig).toHaveProperty('layout', 'intro')
    })

    it('should handle Slidev transitions', async () => {
      const content = `---
transition: slide-left
---
# Slide`
      const result = await parseMDX(content)
      expect(result.slidevConfig).toHaveProperty('transition', 'slide-left')
    })
  })

  describe('Slide Separation', () => {
    it('should separate slides correctly', async () => {
      const content = `# Slide 1\n---\n# Slide 2`
      const result = await parseMDX(content)
      expect(result.slides).toHaveLength(2)
    })

    it('should handle single slide', async () => {
      const content = '# Single Slide'
      const result = await parseMDX(content)
      expect(result.slides).toHaveLength(1)
    })
  })
})
