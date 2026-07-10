import type { UseInViewOptions } from "framer-motion"

type MarginType = UseInViewOptions["margin"]

interface BlurFadeProps {
  children: React.ReactNode
  className?: string
  variant?: {
    hidden: { y: number; opacity?: number; filter?: string }
    visible: { y: number; opacity?: number; filter?: string }
  }
  duration?: number
  delay?: number
  yOffset?: number
  inView?: boolean
  inViewMargin?: MarginType
  blur?: string
}

export function BlurFade({
  children,
  className,
  variant: _variant,
  duration: _duration = 0.4,
  delay: _delay = 0,
  yOffset: _yOffset = 6,
  inView: _inView = false,
  inViewMargin: _inViewMargin = "-50px",
  blur: _blur = "6px",
}: BlurFadeProps) {
  return <div className={className}>{children}</div>
}

export default BlurFade
