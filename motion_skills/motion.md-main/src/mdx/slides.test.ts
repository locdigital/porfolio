import { describe, it, expect } from 'vitest'
import { VFile } from 'vfile'
import { separateSlides } from './slides'

describe('Slide Separation', () => {
  it('should separate slides by headings', () => {
    const file = new VFile(`# Intro
Welcome to the presentation

# Slide 1
Content for slide 1

# Slide 2
Content for slide 2

# Outro
Thank you!`)

    const slides = separateSlides(file)
    expect(slides).toHaveLength(4)
    expect(slides[0].type).toBe('intro')
    expect(slides[3].type).toBe('outro')
  })

  it('should separate slides by horizontal rules', () => {
    const file = new VFile(`# Presentation

---

Slide content 1

---

Slide content 2`)

    const slides = separateSlides(file)
    expect(slides).toHaveLength(3)
  })

  it('should handle mixed separators', () => {
    const file = new VFile(`# Intro
Welcome

---

# Slide 1
Content

---

# Outro`)

    const slides = separateSlides(file)
    expect(slides).toHaveLength(3)
    expect(slides[0].type).toBe('intro')
    expect(slides[2].type).toBe('outro')
  })
})
