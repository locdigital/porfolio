import { VFile } from 'vfile'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import { parse as parseYaml } from 'yaml'
import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import { Root, Code } from 'mdast'

export interface SlidevConfig {
  theme?: string
  layout?: string
  highlighter?: {
    theme: string
    showLineNumbers?: boolean
  }
  drawings?: {
    enabled?: boolean
    persist?: boolean
  }
  transition?: {
    type: string
    duration?: number
  }
}

export function parseSlidevSyntax(file: VFile): SlidevConfig {
  const content = String(file)
  const tree = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .parse(content) as Root

  let config: SlidevConfig = {}

  // Extract frontmatter configuration
  if (tree.children[0]?.type === 'yaml') {
    try {
      const yamlConfig = parseYaml(tree.children[0].value) || {}
      config = {
        theme: yamlConfig.theme,
        layout: yamlConfig.layout,
        highlighter: yamlConfig.highlighter && {
          theme: yamlConfig.highlighter.theme || 'github-dark',
          showLineNumbers: yamlConfig.highlighter.showLineNumbers ?? true,
        },
        drawings: yamlConfig.drawings && {
          enabled: yamlConfig.drawings.enabled ?? true,
          persist: yamlConfig.drawings.persist ?? false,
        },
        transition: yamlConfig.transition && {
          type: typeof yamlConfig.transition === 'string' ? yamlConfig.transition : yamlConfig.transition.type,
          duration: typeof yamlConfig.transition === 'object' ? yamlConfig.transition.duration : undefined,
        },
      }
    } catch (error) {
      console.error('Failed to parse Slidev config:', error)
    }
  }

  // Process code blocks for highlighting
  visit(tree, 'code', (node: Code) => {
    if (!config.highlighter) {
      config.highlighter = {
        theme: 'github-dark',
        showLineNumbers: true,
      }
    }
    // Add language-specific highlighting
    if (node.lang) {
      node.data = {
        ...node.data,
        hProperties: {
          className: [`language-${node.lang}`],
          ...(config.highlighter.showLineNumbers && { 'data-line-numbers': '' }),
        },
      }
    }
  })

  return config
}
