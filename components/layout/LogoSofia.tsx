'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import BrandSVG from './BrandSVG'

interface LogoSofiaProps {
  useExternal?: boolean
}

export default function LogoSofia({ useExternal = false }: LogoSofiaProps) {
  if (useExternal) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        aria-label="Logo SOFIA"
      >
        <Image
          src={'/logo-sofia.svg'}
          alt="Logo SOFIA"
          width={180}
          height={180}
          priority
        />
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <BrandSVG width={603} height={90} />
    </motion.div>
  )
}
