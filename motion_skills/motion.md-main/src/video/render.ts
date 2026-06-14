import { bundle } from '@remotion/bundler'
import { renderMedia, getCompositions } from '@remotion/renderer'
import type { VideoConfig } from 'remotion'
import path from 'path'
import type { BrowserService, StockService, AIService, AnimationService } from '../services'

interface RenderOptions {
  input: string
  output: string
  fps?: number
  width?: number
  height?: number
  services: {
    browser: BrowserService
    stock: StockService
    ai: AIService
    animation: AnimationService
  }
}

export async function render(options: RenderOptions): Promise<void> {
  const { input, output, fps = 30, width = 1920, height = 1080, services } = options

  try {
    const bundled = await bundle(path.join(__dirname, './composition.tsx'))
    const compositions = await getCompositions(bundled)
    const composition = compositions.find((c) => c.id === 'Presentation')

    if (!composition) {
      throw new Error('Could not find composition')
    }

    const videoConfig: VideoConfig = {
      ...composition,
      id: 'Presentation',
      defaultProps: {},
      props: {
        services,
        markdown: input,
      },
    }

    await renderMedia({
      composition: videoConfig,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: output,
      inputProps: videoConfig.props,
      frameRange: [0, composition.durationInFrames - 1],
      imageFormat: 'jpeg',
      jpegQuality: 95,
      chromiumOptions: {
        gl: 'angle',
        headless: true,
        ignoreCertificateErrors: false,
        disableWebSecurity: false,
        enableMultiProcessOnLinux: true,
      },
      videoBitrate: '20M',
      audioBitrate: '256k',
      timeoutInMilliseconds: 30000,
      scale: 2,
    })
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Video rendering failed: ${err.message}`)
    }
    throw new Error(`Failed to render video: ${String(err)}`)
  }
}
