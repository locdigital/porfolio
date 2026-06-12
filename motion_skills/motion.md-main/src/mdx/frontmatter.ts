import { matter } from 'vfile-matter'
import type { VFile } from 'vfile'
import { isObject } from '../utils'

export interface FrontmatterData {
  title?: string
  duration?: number
  fps?: number
  resolution?: {
    width: number
    height: number
  }
  theme?: string
  layout?: string
  transition?: string
  transitions?: {
    type: string
    duration: number
  }[]
  ai?: {
    model?: string
    voice?: string
  }
}

export function parseFrontmatter(file: VFile): FrontmatterData {
  matter(file, { strip: true })
  const data = file.data.matter

  if (!data || !isObject(data)) {
    throw new Error('Failed to parse MDX: Invalid frontmatter format')
  }

  return data as FrontmatterData
}
