import { VFile } from 'vfile'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import { parse as parseYaml } from 'yaml'

export interface Slide {
  content: string
  type: 'intro' | 'outro' | 'content'
  metadata: {
    layout?: string
    transition?: string
    duration?: number
  }
}

export function separateSlides(file: VFile): Slide[] {
  const content = String(file)
  const slides: Slide[] = []

  // Split content by horizontal rule (---) and process each section
  const sections = content.split(/\n---\n/)

  sections.forEach((section, index) => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkFrontmatter, ['yaml'])

    const tree = processor.parse(section)
    let metadata = {}
    let slideContent = section

    // Extract frontmatter if present
    if (tree.children[0]?.type === 'yaml') {
      try {
        metadata = parseYaml(tree.children[0].value) || {}
        slideContent = section.replace(/^---\n[\s\S]*?\n---\n/, '')
      } catch (error) {
        console.warn('Failed to parse slide frontmatter:', error)
      }
    }

    // Determine slide type
    let type: Slide['type'] = 'content'
    if (index === 0 && slideContent.toLowerCase().includes('intro')) {
      type = 'intro'
    } else if (index === sections.length - 1 && slideContent.toLowerCase().includes('outro')) {
      type = 'outro'
    }

    slides.push({
      content: slideContent.trim(),
      type,
      metadata,
    })
  })

  return slides
}
