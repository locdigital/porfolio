import React, { createElement, Fragment } from 'react'
import { compile } from '@mdx-js/mdx'
import { VFile } from 'vfile'
import { renderToString } from 'react-dom/server'
import { validateBrowserProps, validateVideoProps, validateImageProps, validateAnimationProps } from '../utils/validation'
import { Browser, Video, Image, Animation } from '../components'
import { parseFrontmatter, FrontmatterData } from './frontmatter'
import { separateSlides, type Slide } from './slides'

export interface ParsedMDX {
  content: string
  frontmatter: FrontmatterData
  slides: Slide[]
  slidevConfig: { layout: string | null; transition: string | null }
}

export interface MDXParserOptions {
  components?: Record<string, any>
  remarkPlugins?: any[]
}

const defaultComponents = {
  Browser: (props: any) => {
    try {
      validateBrowserProps(props)
      return createElement(Browser, props)
    } catch (error: any) {
      throw new Error(`Failed to parse MDX: ${error.message}`)
    }
  },
  Video: (props: any) => {
    try {
      validateVideoProps(props)
      return createElement(Video, props)
    } catch (error: any) {
      throw new Error(`Failed to parse MDX: ${error.message}`)
    }
  },
  Image: (props: any) => {
    try {
      validateImageProps(props)
      return createElement(Image, props)
    } catch (error: any) {
      throw new Error(`Failed to parse MDX: ${error.message}`)
    }
  },
  Animation: (props: any) => {
    try {
      validateAnimationProps(props)
      return createElement(Animation, props)
    } catch (error: any) {
      throw new Error(`Failed to parse MDX: ${error.message}`)
    }
  },
  wrapper: ({ children }: { children: React.ReactNode }) => createElement('div', { className: 'slide', 'data-slide-index': '0' }, children),
  Fragment,
}

const runtime = {
  Fragment: React.Fragment,
  jsx: createElement,
  jsxs: createElement,
  useMDXComponents: () => defaultComponents,
}

export async function parseMDX(mdxContent: string, options: MDXParserOptions = {}): Promise<ParsedMDX> {
  // Handle empty content
  if (!mdxContent || !mdxContent.trim()) {
    return {
      content: '',
      frontmatter: {},
      slides: [],
      slidevConfig: {
        layout: null,
        transition: null,
      },
    }
  }

  // Check for invalid MDX syntax
  const trimmedContent = mdxContent.trim()
  if (trimmedContent.includes('< ') || trimmedContent.includes(' >') || trimmedContent.includes(' <') || trimmedContent.includes('> ')) {
    throw new Error('Failed to parse MDX: Invalid syntax')
  }

  // Parse frontmatter and separate slides
  const vfile = new VFile(mdxContent)
  const frontmatterData = parseFrontmatter(vfile)
  const mdxWithoutFrontmatter = String(vfile)
  const slides = separateSlides(vfile)

  const slidevConfig = {
    layout: frontmatterData.layout || null,
    transition: frontmatterData.transitions?.[0]?.type || frontmatterData.transition || null,
  }

  // Validate components
  const componentRegex = /<(Browser|Video|Image|Animation)\s*([^>]*?)\/>/g
  let match
  while ((match = componentRegex.exec(mdxWithoutFrontmatter)) !== null) {
    const [_, componentName, propsString] = match
    const props: Record<string, any> = {}

    const propMatches = propsString.matchAll(/(\w+)=\{([^}]+)\}|(\w+)="([^"]+)"/g)
    for (const propMatch of propMatches) {
      const [, name1, value1, name2, value2] = propMatch
      const name = name1 || name2
      const rawValue = value1 || value2

      let value: any = rawValue
      if (value1) {
        if (/^-?\d+(\.\d+)?$/.test(rawValue)) {
          value = parseFloat(rawValue)
        } else if (rawValue === 'true' || rawValue === 'false') {
          value = rawValue === 'true'
        }
      }
      props[name] = value
    }

    try {
      switch (componentName) {
        case 'Browser':
          validateBrowserProps(props)
          break
        case 'Video':
          validateVideoProps(props)
          break
        case 'Image':
          validateImageProps(props)
          break
        case 'Animation':
          validateAnimationProps(props)
          break
      }
    } catch (error: any) {
      throw new Error(`Failed to parse MDX: ${error.message}`)
    }
  }

  // Compile MDX
  let compiledResult
  try {
    const result = await compile(mdxWithoutFrontmatter, {
      jsx: true,
      jsxRuntime: 'automatic',
      development: true,
      ...options,
      remarkPlugins: [...(options.remarkPlugins || [])],
    })
    compiledResult = result
  } catch (err: any) {
    throw new Error('Failed to parse MDX: Invalid syntax')
  }

  const moduleCode = `
    const {Fragment, jsx, jsxs} = runtime;
    const {useMDXComponents} = runtime;
    ${compiledResult.value}
  `

  const renderWithComponents = (components: Record<string, any> = {}) => {
    try {
      const mergedComponents = {
        ...defaultComponents,
        ...components,
      }

      const moduleExports: { default?: any } = {}
      const require = (id: string) => {
        if (id === 'react/jsx-runtime') return runtime
        if (id === 'react') return { createElement, Fragment }
        throw new Error(`Failed to parse MDX: Module not found: ${id}`)
      }

      new Function('exports', 'require', 'runtime', moduleCode)(moduleExports, require, runtime)

      if (!moduleExports.default || typeof moduleExports.default !== 'function') {
        throw new Error('Failed to parse MDX: Invalid content structure')
      }

      const Content = moduleExports.default
      const element = createElement(Content, { components: mergedComponents })
      return renderToString(element)
    } catch (err: any) {
      console.error('MDX Render Error:', err)
      throw new Error(`Failed to parse MDX: ${err?.message}`)
    }
  }

  return {
    content: renderWithComponents(),
    frontmatter: frontmatterData,
    slidevConfig,
    slides,
  }
}
