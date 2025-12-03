'use client'

import { motion } from 'framer-motion'

export default function TypewriterBrand() {
  const letters = ['S', 'O', 'F', 'I', 'A']
  return (
    <div className="flex items-center justify-center mt-2">
      {letters.map((l, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 + i * 0.1, duration: 0.32, ease: 'easeOut' }}
          className="text-white/90 tracking-[0.25em] text-sm md:text-base font-medium"
        >
          {l}
        </motion.span>
      ))}
      <motion.span
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.9, ease: 'easeInOut', repeat: Infinity }}
        className="ml-2 w-px h-[1.2em] bg-[#34E03C]"
      />
    </div>
  )
}

