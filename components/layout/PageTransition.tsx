'use client'

import { motion } from 'framer-motion'
import LogoSofia from './LogoSofia'

interface PageTransitionProps {
  isVisible: boolean
}

export default function PageTransition({ isVisible }: PageTransitionProps) {
  if (!isVisible) return null
  const useOfficialLogo = process.env.NEXT_PUBLIC_USE_OFFICIAL_LOGO === 'true'
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-black to-gray-900 z-[9999]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: 1.2, duration: 0.6, ease: 'easeInOut' }}
    >
      <LogoSofia useExternal={useOfficialLogo} />
    </motion.div>
  )
}