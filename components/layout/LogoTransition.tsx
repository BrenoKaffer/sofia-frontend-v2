'use client'

import { motion } from 'framer-motion'
import BrandSVG from './BrandSVG'
import GlowRing from '../ui/GlowRing'

export default function LogoTransition() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative"
    >
      <GlowRing>
        <BrandSVG width={226} height={34} />
      </GlowRing>
    </motion.div>
  )
}
