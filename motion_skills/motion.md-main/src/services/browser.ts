import * as puppeteer from 'puppeteer'
import { BrowserbaseConfig } from './index'

export class BrowserService {
  private browser: puppeteer.Browser | null = null
  private config: BrowserbaseConfig

  constructor(config: BrowserbaseConfig) {
    this.config = {
      headless: config.headless ?? true,
      defaultViewport: config.defaultViewport ?? {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2,
      },
    }
  }

  private async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: this.config.headless,
        defaultViewport: this.config.defaultViewport,
      })
    }
    return this.browser
  }

  async capture(url: string) {
    const browser = await this.initialize()
    const page = await browser.newPage()

    try {
      await page.setViewport(this.config.defaultViewport!)
      await page.goto(url, { waitUntil: 'networkidle0' })
      return await page.screenshot({ type: 'png' })
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to capture screenshot: ${error.message}`)
      }
      throw new Error('Failed to capture screenshot: Unknown error')
    } finally {
      await page.close()
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}
