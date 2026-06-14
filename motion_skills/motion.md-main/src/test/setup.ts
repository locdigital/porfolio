import '@testing-library/jest-dom'
import { beforeAll, vi } from 'vitest'
import { createElement } from 'react'
import * as runtime from 'react/jsx-runtime'
import type { Browser, Page } from 'puppeteer'
import { Browser as BrowserComponent, Video, Image, Animation, Voiceover } from '../components'
import yaml from 'yaml'

interface FrontmatterData {
  title?: string
  fps?: number
  resolution?: {
    width: number
    height: number
  }
  layout?: string
  transition?: string
  [key: string]: any
}

// Mock MDX compilation
vi.mock('@mdx-js/mdx', () => {
  return {
    compile: vi.fn().mockImplementation(async (source: string) => {
      // Parse frontmatter if present
      let frontmatterData: FrontmatterData = {}
      const frontmatterMatch = source.match(/^---\n([\s\S]*?)\n---/)
      if (frontmatterMatch) {
        try {
          frontmatterData = yaml.parse(frontmatterMatch[1]) as FrontmatterData
        } catch (e) {
          throw new Error('Failed to parse frontmatter')
        }
      }

      const hasComponent = /\<(Browser|Video|Image|Animation|Voiceover)/.test(source)

      // Handle slide separation
      const contentWithoutFrontmatter = frontmatterMatch ? source.slice(frontmatterMatch[0].length).trim() : source.trim()

      const slides = contentWithoutFrontmatter
        .split(/^---$/m)
        .map((slide) => slide.trim())
        .filter(Boolean)

      // Return valid JavaScript code
      return {
        value: `
          const _jsx = runtime.jsx;
          const _jsxs = runtime.jsxs;
          const _Fragment = runtime.Fragment;

          exports.default = function MDXContent(props) {
            const {components = {}} = props;
            ${
              hasComponent
                ? `
              const {
                Browser = () => null,
                Video = () => null,
                Image = () => null,
                Animation = () => null,
                Voiceover = () => null
              } = components;
            `
                : ''
            }

            return _jsx(_Fragment, {
              children: [
                ${slides
                  .map((slide, index) => {
                    const lines = slide
                      .split('\n')
                      .map((line) => {
                        if (line.includes('<Browser')) {
                          return '_jsx(Browser, { url: "https://example.com", width: 1920, height: 1080 })'
                        } else if (line.includes('<Video')) {
                          return '_jsx(Video, { src: "video.mp4", type: "storyblocks", width: 1920, height: 1080 })'
                        } else if (line.includes('<Image')) {
                          return '_jsx(Image, { src: "image.jpg", type: "unsplash", width: 1920, height: 1080 })'
                        } else if (line.includes('<Animation')) {
                          return '_jsx(Animation, { type: "magicui", name: "fade", duration: 1 })'
                        } else if (line.includes('<Voiceover')) {
                          return '_jsx(Voiceover, { text: "Hello world", voice: "default" })'
                        }
                        return `_jsx('p', { children: ${JSON.stringify(line)} })`
                      })
                      .join(',\n')
                    return `_jsx('div', {
                    className: 'slide',
                    'data-slide-index': ${index},
                    children: [${lines}]
                  })`
                  })
                  .join(',\n')}
              ]
            });
          };

          exports.frontmatter = ${JSON.stringify(frontmatterData)};
          exports.slides = ${JSON.stringify(slides)};
          exports.slidevConfig = ${JSON.stringify({
            layout: frontmatterData.layout || null,
            transition: frontmatterData.transition || null,
          })};
        `,
      }
    }),
  }
})

// Mock Puppeteer
vi.mock('puppeteer', () => {
  const mockPage = {
    goto: vi.fn().mockRejectedValue(new Error('Failed to load page')),
    setViewport: vi.fn(),
    screenshot: vi.fn().mockResolvedValue(Buffer.from('mock-screenshot')),
    close: vi.fn(),
  }

  const mockBrowser = {
    newPage: vi.fn().mockResolvedValue(mockPage),
    close: vi.fn(),
  }

  return {
    launch: vi.fn().mockResolvedValue(mockBrowser),
  }
})

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockImplementation(() => {
      throw new Error('OpenAI API key is required')
    }),
  },
}))

// Mock unsplash-js
vi.mock('unsplash-js', () => {
  return {
    createApi: vi.fn().mockReturnValue({
      photos: {
        getRandom: vi.fn().mockRejectedValue(new Error('Failed to fetch image')),
      },
    }),
  }
})

// Setup environment variables
beforeAll(() => {
  process.env = {
    ...process.env,
    OPENAI_API_KEY: undefined,
    UNSPLASH_ACCESS_KEY: undefined,
    STORYBLOCKS_API_KEY: undefined,
  }
})
