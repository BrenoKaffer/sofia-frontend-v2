'use client'

import { motion } from 'framer-motion'
import React from 'react'

interface SignInBackgroundProps {
  className?: string
}

export function SignInBackground({ className }: SignInBackgroundProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 0.6, 0.4, 0.7, 0.3] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundColor: 'transparent',
        backgroundImage:
          'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
        backgroundSize: '10px 10px',
        filter: 'brightness(0.9) contrast(1.2)',
      }}
    />
  )
}

export default SignInBackground

