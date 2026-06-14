import React from 'react'
import { IntroProps, OutroProps } from './interfaces'

export const Intro: React.FC<IntroProps> = ({ title, subtitle, duration, transition, children }) => {
  return (
    <div className='intro-slide' style={{ transition }}>
      <h1>{title}</h1>
      {subtitle && <h2>{subtitle}</h2>}
      {children}
    </div>
  )
}

export const Outro: React.FC<OutroProps> = ({ title, subtitle, duration, transition, children }) => {
  return (
    <div className='outro-slide' style={{ transition }}>
      <h1>{title}</h1>
      {subtitle && <h2>{subtitle}</h2>}
      {children}
    </div>
  )
}
