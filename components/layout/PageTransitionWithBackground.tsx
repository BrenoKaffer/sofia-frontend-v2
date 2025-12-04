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
      className="fixed inset-0 flex items-center justify-center z-[9999] relative"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: 1.2, duration: 0.6, ease: 'easeInOut' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <EtherealShadows
          color="rgba(24, 24, 24, 1)"
          animation={{ scale: 100, speed: 90 }}
          noise={{ opacity: 0.6, scale: 1.2 }}
          sizing="fill"
        />
      </div>
      <LogoTransition />
    </motion.div>
  )
}

