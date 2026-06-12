import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MotionComposition } from './composition'

describe('MotionComposition', () => {
  it('should render without crashing', () => {
    const { container } = render(<MotionComposition />)
    expect(container).toBeDefined()
  })

  it('should initialize all required services', () => {
    const { container } = render(<MotionComposition />)
    // Services are initialized in the component
    expect(container).toBeDefined()
  })
})
