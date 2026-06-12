import { describe, it, expect } from 'vitest'
import { VFile } from 'vfile'
import { parseSlidevSyntax } from './slidev'

describe('Slidev Syntax Parser', () => {
  it('should parse basic Slidev config', () => {
    const file = new VFile(`---
theme: default
layout: intro
highlighter:
  theme: prism
  showLineNumbers: true
---

# Content`)

    const config = parseSlidevSyntax(file)
    expect(config.theme).toBe('default')
    expect(config.layout).toBe('intro')
    expect(config.highlighter?.theme).toBe('prism')
    expect(config.highlighter?.showLineNumbers).toBe(true)
  })

  it('should handle drawings config', () => {
    const file = new VFile(`---
theme: default
drawings:
  enabled: true
  persist: true
---

# Content`)

    const config = parseSlidevSyntax(file)
    expect(config.drawings).toBeDefined()
    expect(config.drawings?.enabled).toBe(true)
    expect(config.drawings?.persist).toBe(true)
  })

  it('should parse transition with duration', () => {
    const file = new VFile(`---
transition:
  type: slide-left
  duration: 500
---

# Content`)

    const config = parseSlidevSyntax(file)
    expect(config.transition?.type).toBe('slide-left')
    expect(config.transition?.duration).toBe(500)
  })

  it('should parse string transition without duration', () => {
    const file = new VFile(`---
transition: fade
---

# Content`)

    const config = parseSlidevSyntax(file)
    expect(config.transition?.type).toBe('fade')
    expect(config.transition?.duration).toBeUndefined()
  })

  it('should handle missing frontmatter', () => {
    const file = new VFile('# Content without frontmatter')

    const config = parseSlidevSyntax(file)
    expect(config).toEqual({})
  })

  it('should handle code blocks with highlighting', () => {
    const file = new VFile(`---
highlighter:
  theme: dracula
  showLineNumbers: true
---

\`\`\`typescript
const hello = "world"
\`\`\``)

    const config = parseSlidevSyntax(file)
    expect(config.highlighter?.theme).toBe('dracula')
    expect(config.highlighter?.showLineNumbers).toBe(true)
  })
})
