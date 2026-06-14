import { describe, it, expect } from 'vitest'
import { VFile } from 'vfile'
import { parseFrontmatter } from './frontmatter'

describe('Frontmatter Parser', () => {
  it('should parse basic frontmatter', () => {
    const file = new VFile({
      value: `---
title: Test Presentation
duration: 300
fps: 30
---

# Content`,
    })

    const result = parseFrontmatter(file)
    expect(result.title).toBe('Test Presentation')
    expect(result.duration).toBe(300)
    expect(result.fps).toBe(30)
  })

  it('should handle complex frontmatter', () => {
    const file = new VFile({
      value: `---
title: Advanced Demo
resolution:
  width: 1920
  height: 1080
theme: dark
transitions:
  - type: fade
    duration: 0.5
ai:
  model: gpt-4
  voice: alloy
---

# Content`,
    })

    const result = parseFrontmatter(file)
    expect(result.resolution).toEqual({ width: 1920, height: 1080 })
    expect(result.theme).toBe('dark')
    expect(result.transitions).toHaveLength(1)
    expect(result.ai).toBeDefined()
  })
})
