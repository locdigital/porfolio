import { z } from 'zod'
import type {
  BaseComponentProps,
  IntroProps,
  OutroProps,
  CodeProps,
  BrowserProps,
  VideoProps,
  AnimationProps,
  MemeProps,
  ImageProps,
  ScreenshotProps,
} from './interfaces'

export const baseSchema = z.object({
  children: z.any().optional(),
  duration: z.number().min(0).optional(),
  transition: z.string().optional(),
})

export const introSchema = baseSchema.extend({
  title: z.string().min(1),
  subtitle: z.string().optional(),
})

export const outroSchema = baseSchema.extend({
  title: z.string().min(1),
  subtitle: z.string().optional(),
})

export const codeSchema = baseSchema.extend({
  language: z.string().min(1),
  highlighter: z.enum(['prism', 'shiki']).optional(),
  lineNumbers: z.boolean().optional(),
})

export const browserSchema = baseSchema.extend({
  url: z.string().url(),
  width: z.number().min(1).optional(),
  height: z.number().min(1).optional(),
})

export const videoSchema = baseSchema.extend({
  src: z.string().min(1),
  type: z.enum(['stock', 'ai', 'custom']).optional(),
  autoplay: z.boolean().optional(),
})

export const animationSchema = baseSchema.extend({
  name: z.string().min(1),
  duration: z.number().min(0).optional(),
  easing: z.string().optional(),
})

export const memeSchema = baseSchema.extend({
  template: z.string().min(1),
  topText: z.string().optional(),
  bottomText: z.string().optional(),
})

export const imageSchema = baseSchema.extend({
  src: z.string().min(1),
  alt: z.string().optional(),
  type: z.enum(['stock', 'ai', 'custom']).optional(),
})

export const screenshotSchema = baseSchema.extend({
  url: z.string().url(),
  selector: z.string().optional(),
  fullPage: z.boolean().optional(),
})

export function validateProps<T>(schema: z.ZodSchema<T>, props: T): T {
  return schema.parse(props)
}
