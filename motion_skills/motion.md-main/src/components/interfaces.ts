import { ReactNode } from 'react'

export interface BaseComponentProps {
  children?: ReactNode
  duration?: number
  transition?: string
}

export interface IntroProps extends BaseComponentProps {
  title: string
  subtitle?: string
}

export interface OutroProps extends BaseComponentProps {
  title: string
  subtitle?: string
}

export interface CodeProps extends BaseComponentProps {
  language: string
  highlighter?: 'prism' | 'shiki'
  lineNumbers?: boolean
}

export interface BrowserProps extends BaseComponentProps {
  url: string
  width?: number
  height?: number
}

export interface VideoProps extends BaseComponentProps {
  src: string
  type?: 'stock' | 'ai' | 'custom'
  autoplay?: boolean
}

export interface AnimationProps extends BaseComponentProps {
  name: string
  duration?: number
  easing?: string
}

export interface MemeProps extends BaseComponentProps {
  template: string
  topText?: string
  bottomText?: string
}

export interface ImageProps extends BaseComponentProps {
  src: string
  alt?: string
  type?: 'stock' | 'ai' | 'custom'
}

export interface ScreenshotProps extends BaseComponentProps {
  url: string
  selector?: string
  fullPage?: boolean
}
