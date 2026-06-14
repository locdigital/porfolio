import { BrowserProps, VideoProps, ImageProps, AnimationProps, VoiceoverProps } from '../components'

export class ValidationError extends Error {
  constructor(message: string) {
    super(`Failed to parse MDX: ${message}`)
    this.name = 'ValidationError'
  }
}

export function validateBrowserProps(props: Partial<BrowserProps>): void {
  if (props.width && (typeof props.width !== 'number' || props.width <= 0)) {
    throw new ValidationError('Browser width must be a positive number')
  }
  if (props.height && (typeof props.height !== 'number' || props.height <= 0)) {
    throw new ValidationError('Browser height must be a positive number')
  }
  if (props.url && typeof props.url !== 'string') {
    throw new ValidationError('Browser URL must be a string')
  }
}

export function validateVideoProps(props: Partial<VideoProps>): void {
  if (props.width && (typeof props.width !== 'number' || props.width <= 0)) {
    throw new ValidationError('Video width must be a positive number')
  }
  if (props.height && (typeof props.height !== 'number' || props.height <= 0)) {
    throw new ValidationError('Video height must be a positive number')
  }
  if (props.src && typeof props.src !== 'string') {
    throw new ValidationError('Video source must be a string')
  }
  if (props.type && !['storyblocks', 'ai'].includes(props.type)) {
    throw new ValidationError('Video type must be either "storyblocks" or "ai"')
  }
}

export function validateImageProps(props: Partial<ImageProps>): void {
  if (props.width && (typeof props.width !== 'number' || props.width <= 0)) {
    throw new ValidationError('Image width must be a positive number')
  }
  if (props.height && (typeof props.height !== 'number' || props.height <= 0)) {
    throw new ValidationError('Image height must be a positive number')
  }
  if (props.src && typeof props.src !== 'string') {
    throw new ValidationError('Image source must be a string')
  }
  if (props.type && !['unsplash', 'ai'].includes(props.type)) {
    throw new ValidationError('Image type must be either "unsplash" or "ai"')
  }
}

export function validateAnimationProps(props: Partial<AnimationProps>): void {
  if (!props.type) {
    throw new ValidationError('Animation type must be "magicui"')
  }
  if (props.type !== 'magicui') {
    throw new ValidationError('Animation type must be "magicui"')
  }
  if (props.duration !== undefined && (typeof props.duration !== 'number' || props.duration <= 0)) {
    throw new ValidationError('Animation duration must be a positive number')
  }
  if (props.name !== undefined && typeof props.name !== 'string') {
    throw new ValidationError('Animation name must be a string')
  }
}

export function validateVoiceoverProps(props: Partial<VoiceoverProps>): void {
  if (!props.text) {
    throw new ValidationError('Voiceover text is required')
  }
  if (typeof props.text !== 'string') {
    throw new ValidationError('Voiceover text must be a string')
  }
  if (props.voice !== undefined && typeof props.voice !== 'string') {
    throw new ValidationError('Voiceover voice must be a string')
  }
}
