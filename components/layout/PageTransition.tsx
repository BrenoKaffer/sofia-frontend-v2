'use client'

import { motion } from 'framer-motion'
import LogoTransition from './LogoTransition'

interface PageTransitionProps {
  isVisible: boolean
}

export default function PageTransition({ isVisible }: PageTransitionProps) {
  if (!isVisible) return null
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black z-[9999] pointer-events-none"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: 1.2, duration: 0.6, ease: 'easeInOut' }}
    >
      <LogoTransition />
    </motion.div>
  )
}
