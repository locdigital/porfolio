import { FC, createElement, ComponentType } from 'react'
import {
  validateBrowserProps,
  validateVideoProps,
  validateImageProps,
  validateAnimationProps,
  validateVoiceoverProps,
  ValidationError,
} from '../utils/validation'

interface BrowserProps {
  url?: string
  width?: number
  height?: number
}

interface VideoProps {
  src?: string
  type?: 'storyblocks' | 'ai'
  width?: number
  height?: number
}

interface ImageProps {
  src?: string
  type?: 'unsplash' | 'ai'
  width?: number
  height?: number
}

interface AnimationProps {
  type: 'magicui'
  name?: string
  duration?: number
}

interface VoiceoverProps {
  text?: string
  voice?: string
}

function withValidation<P extends object>(Component: FC<P>, validate: (props: P) => void, displayName: string): FC<P> {
  const ValidatedComponent: FC<P> = (props) => {
    try {
      validate(props)
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        throw error
      }
      if (error instanceof Error) {
        throw new ValidationError(error.message)
      }
      throw new ValidationError('Component validation failed')
    }
    return createElement(Component, props)
  }
  ValidatedComponent.displayName = displayName
  return ValidatedComponent
}

const BaseBrowser: FC<BrowserProps> = (props) => {
  return createElement('div', { className: 'browser-component' }, `Browser: ${props.url}`)
}

const BaseVideo: FC<VideoProps> = (props) => {
  return createElement('div', { className: 'video-component' }, `Video: ${props.src}`)
}

const BaseImage: FC<ImageProps> = (props) => {
  return createElement('div', { className: 'image-component' }, `Image: ${props.src}`)
}

const BaseAnimation: FC<AnimationProps> = (props) => {
  return createElement('div', { className: 'animation-component' }, `Animation: ${props.name}`)
}

const BaseVoiceover: FC<VoiceoverProps> = (props) => {
  return createElement('div', { className: 'voiceover-component' }, `Voiceover: ${props.text}`)
}

const Browser = withValidation(BaseBrowser, validateBrowserProps, 'Browser')
const Video = withValidation(BaseVideo, validateVideoProps, 'Video')
const Image = withValidation(BaseImage, validateImageProps, 'Image')
const Animation = withValidation(BaseAnimation, validateAnimationProps, 'Animation')
const Voiceover = withValidation(BaseVoiceover, validateVoiceoverProps, 'Voiceover')

export type { BrowserProps, VideoProps, ImageProps, AnimationProps, VoiceoverProps }

export { Browser, Video, Image, Animation, Voiceover, withValidation }
