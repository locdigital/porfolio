import { BrowserService } from './browser'
import { StockService } from './stock'
import { AIService } from './ai'
import { AnimationService } from './animation'

export interface BrowserbaseConfig {
  headless?: boolean
  defaultViewport?: {
    width: number
    height: number
    deviceScaleFactor: number
  }
  baseUrl?: string
}

export interface StockConfig {
  unsplashAccessKey?: string
  storyblocksApiKey?: string
}

export interface AIConfig {
  apiKey?: string
  modelName?: string
}

export interface AnimationConfig {
  fps?: number
}

export interface ServiceConfig {
  browser?: BrowserbaseConfig
  stock?: StockConfig
  ai?: AIConfig
  animation?: AnimationConfig
}

export function initializeServices(config: ServiceConfig): {
  browser: BrowserService
  stock: StockService
  ai: AIService
  animation: AnimationService
} {
  const browserConfig = config.browser ?? {
    headless: true,
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2,
    },
  }

  const stockConfig = {
    unsplashAccessKey: config.stock?.unsplashAccessKey || process.env.UNSPLASH_ACCESS_KEY,
    storyblocksApiKey: config.stock?.storyblocksApiKey || process.env.STORYBLOCKS_API_KEY,
  }

  const aiConfig = {
    apiKey: config.ai?.apiKey || process.env.OPENAI_API_KEY,
    modelName: config.ai?.modelName || 'gpt-4',
  }

  const animationConfig = {
    fps: config.animation?.fps || 30,
  }

  return {
    browser: new BrowserService(browserConfig),
    stock: new StockService(stockConfig),
    ai: new AIService(aiConfig),
    animation: new AnimationService(animationConfig),
  }
}

export { BrowserService, StockService, AIService, AnimationService }
