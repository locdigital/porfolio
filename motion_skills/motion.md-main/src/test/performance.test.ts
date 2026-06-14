import { describe, it, expect, beforeAll } from 'vitest'
import { render } from '../video/render'
import { initializeServices } from '../services'
import path from 'path'
import fs from 'fs'

describe('Performance Tests', () => {
  const services = initializeServices({
    browser: {
      headless: true,
      defaultViewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2,
      },
    },
    stock: {
      unsplashAccessKey: process.env.UNSPLASH_API_KEY || '',
      storyblocksApiKey: process.env.STORYBLOCKS_API_KEY || '',
    },
    ai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      modelName: 'gpt-4',
    },
    animation: {
      apiKey: process.env.MAGICUI_API_KEY || '',
    },
  })

  const testMarkdown = `
# Test Slide
This is a test slide with various components to measure performance.

![Test Image](https://example.com/test.jpg)
\`\`\`js
console.log('Hello World')
\`\`\`
`

  beforeAll(() => {
    if (!fs.existsSync(path.join(__dirname, 'output'))) {
      fs.mkdirSync(path.join(__dirname, 'output'))
    }
  })

  it('should render video within performance thresholds', async () => {
    const startTime = performance.now()

    await render({
      input: testMarkdown,
      output: path.join(__dirname, 'output', 'perf-test.mp4'),
      services,
    })

    const endTime = performance.now()
    const renderTime = endTime - startTime

    const maxRenderTime = 30000 // 30 seconds
    expect(renderTime).toBeLessThan(maxRenderTime)
  }, 35000)

  it('should maintain consistent memory usage', async () => {
    const initialMemory = process.memoryUsage().heapUsed

    await render({
      input: testMarkdown,
      output: path.join(__dirname, 'output', 'memory-test.mp4'),
      services,
    })

    const finalMemory = process.memoryUsage().heapUsed
    const memoryIncrease = finalMemory - initialMemory

    const maxMemoryIncrease = 500 * 1024 * 1024 // 500MB
    expect(memoryIncrease).toBeLessThan(maxMemoryIncrease)
  }, 35000)
})
