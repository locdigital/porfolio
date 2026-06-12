import { existsSync } from 'fs'
import { resolve } from 'path'
import { createSpinner } from 'nanospinner'
import { render } from '../video/render'
import { parseMDX } from '../mdx/parser'
import { parseFrontmatter } from '../mdx/frontmatter'
import { initializeServices, type ServiceConfig } from '../services'

interface RenderOptions {
  output?: string
  fps?: number
  width?: number
  height?: number
  config?: ServiceConfig
}

export async function renderCommand(input: string, options: RenderOptions = {}) {
  const spinner = createSpinner('Initializing services...').start()

  try {
    // Validate input file
    const inputPath = resolve(input)
    if (!existsSync(inputPath)) {
      throw new Error(`Input file not found: ${input}`)
    }

    // Parse MDX and frontmatter
    spinner.update({ text: 'Parsing markdown content...' })
    const mdxContent = await parseMDX(inputPath)
    const frontmatter = parseFrontmatter(inputPath)

    // Initialize services
    const services = initializeServices(options.config)

    // Configure video settings
    const videoConfig = {
      input: mdxContent,
      output: options.output || input.replace(/\.md$/, '.mp4'),
      fps: options.fps || frontmatter.fps || 30,
      width: options.width || frontmatter.width || 1920,
      height: options.height || frontmatter.height || 1080,
      services,
    }

    // Generate video
    spinner.update({ text: 'Generating video...' })
    await render(videoConfig)

    spinner.success({ text: 'Video generated successfully!' })
    await services.browser.cleanup()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    spinner.error({ text: `Error generating video: ${message}` })
    process.exit(1)
  }
}
