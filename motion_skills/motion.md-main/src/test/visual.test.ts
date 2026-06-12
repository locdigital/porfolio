import { describe, it, expect, beforeAll } from 'vitest'
import { render } from '../video/render'
import { initializeServices } from '../services'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'

describe('Visual Regression Tests', () => {
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

  const testCases = [
    {
      name: 'basic-slide',
      markdown: '# Basic Slide\nThis is a basic slide test.',
    },
    {
      name: 'code-block',
      markdown: '# Code Test\n```js\nconsole.log("test")\n```',
    },
    {
      name: 'image-slide',
      markdown: '# Image Test\n![Test](https://example.com/test.jpg)',
    },
  ]

  beforeAll(() => {
    if (!fs.existsSync(path.join(__dirname, 'output'))) {
      fs.mkdirSync(path.join(__dirname, 'output'))
    }
  })

  for (const testCase of testCases) {
    it(`should match visual snapshot for ${testCase.name}`, async () => {
      const outputPath = path.join(__dirname, 'output', `${testCase.name}.mp4`)

      await render({
        input: testCase.markdown,
        output: outputPath,
        services,
      })

      const snapshotPath = path.join(__dirname, 'output', `${testCase.name}-snapshot.png`)
      execSync(`ffmpeg -i ${outputPath} -vframes 1 ${snapshotPath}`)

      const baselinePath = path.join(__dirname, 'snapshots', `${testCase.name}-baseline.png`)
      if (fs.existsSync(baselinePath)) {
        const diff = execSync(`compare -metric AE ${snapshotPath} ${baselinePath} null: 2>&1`).toString()
        const pixelDifference = parseInt(diff, 10)

        const maxDifference = Math.floor(1920 * 1080 * 0.001)
        expect(pixelDifference).toBeLessThan(maxDifference)
      } else {
        fs.copyFileSync(snapshotPath, baselinePath)
      }
    }, 35000)
  }
})
