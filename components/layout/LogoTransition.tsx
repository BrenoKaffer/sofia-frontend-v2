'use client'

import { motion } from 'framer-motion'
import BrandSVGProvided from './BrandSVGProvided'
import styles from './LogoShimmer.module.css'

export default function LogoTransition() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative"
    >
      <div>
        <BrandSVGProvided width={280} height={70} />
      </div>
    </motion.div>
  )
}
