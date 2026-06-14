import { interpolate } from 'remotion'
import type { AnimationConfig } from './index'

export class AnimationService {
  private fps: number

  constructor(config: AnimationConfig) {
    this.fps = config.fps || 30
  }

  getAnimation(name: string, frame: number, options?: { duration?: number; easing?: string }) {
    const duration = options?.duration || 1
    const frameRange = [0, this.fps * duration]

    switch (name) {
      case 'fadeIn':
        return {
          opacity: interpolate(frame, frameRange, [0, 1], { extrapolateRight: 'clamp' }),
        }
      case 'scale':
        return {
          transform: `scale(${interpolate(frame, frameRange, [1, 2], { extrapolateRight: 'clamp' })})`,
        }
      case 'slideIn':
        return {
          transform: `translateX(${interpolate(frame, frameRange, [-100, 0], { extrapolateRight: 'clamp' })}%)`,
        }
      case 'rotate':
        return {
          transform: `rotate(${interpolate(frame, frameRange, [0, 360], { extrapolateRight: 'clamp' })}deg)`,
        }
      default:
        throw new Error(`Animation "${name}" not found`)
    }
  }
}
