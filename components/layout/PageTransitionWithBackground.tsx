'use client'

import { motion } from 'framer-motion'
import LogoTransition from './LogoTransition'
import EtherealShadows from '../ui/etheral-shadow'

interface PageTransitionProps {
  isVisible: boolean
}

export default function PageTransitionWithBackground({ isVisible }: PageTransitionProps) {
  if (!isVisible) return null
  return (
    <motion.div
      className="fixed inset-0 z-[2147483647] flex items-center justify-center pointer-events-none"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: 1.2, duration: 0.6, ease: 'easeInOut' }}
      aria-hidden="true"
      style={{ willChange: 'opacity' }}
    >
      <div className="absolute inset-0">
        <EtherealShadows
          color="#000000"
          animation={{ scale: 100, speed: 90 }}
          noise={{ opacity: 0.6, scale: 1.2 }}
          sizing="fill"
        />
      </div>
      <div className="relative">
        <LogoTransition />
      </div>
    </motion.div>
  )
}
