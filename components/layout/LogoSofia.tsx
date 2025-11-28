'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

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
    <motion.svg
      width="180"
      height="180"
      viewBox="0 0 200 200"
      fill="none"
      stroke="#ffffff"
      strokeWidth={2}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      aria-label="Logo SOFIA (animada)"
    >
      {/* Exemplo simples de "logo se desenhando"; substitua pelos paths reais da logo SOFIA */}
      <motion.path
        d="M10 100 L100 10 L190 100"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      />
      <motion.circle
        cx="100"
        cy="120"
        r="35"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.3 }}
      />
    </motion.svg>
  )
}