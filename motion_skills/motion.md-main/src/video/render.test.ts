import { describe, it, expect, vi } from 'vitest'
import { render, renderFrame } from './render'
import path from 'path'

describe('Video Rendering', () => {
  it('should render a video', async () => {
    const options = {
      input: 'test.md',
      output: path.join(__dirname, '../tmp/test.mp4'),
      fps: 30,
      width: 1920,
      height: 1080,
    }

    await expect(render(options)).resolves.not.toThrow()
  })

  it('should render a single frame', async () => {
    const options = {
      input: 'test.md',
      output: path.join(__dirname, '../tmp/test.mp4'),
    }

    const frame = await renderFrame(0, options)
    expect(frame).toBeDefined()
    expect(frame).toBeInstanceOf(Buffer)
  })
})
