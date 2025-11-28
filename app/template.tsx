"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const variants = {
    default: {
      initial: { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -16 },
      transition: { duration: 0.35, ease: 'easeOut' },
    },
    register: {
      initial: { opacity: 0, x: 24 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -24 },
      transition: { duration: 0.4, ease: 'easeInOut' },
    },
    dashboard: {
      initial: { opacity: 0, scale: 0.98 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.98 },
      transition: { duration: 0.35, ease: 'easeOut' },
    },
    checkout: {
      initial: { opacity: 0, y: 32 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -32 },
      transition: { duration: 0.45, ease: 'easeInOut' },
    },
  } as const

  const variantKey =
    pathname?.startsWith('/register')
      ? 'register'
      : pathname?.startsWith('/dashboard')
      ? 'dashboard'
      : pathname?.startsWith('/checkout')
      ? 'checkout'
      : 'default'

  const v = variants[variantKey]

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={v.initial}
        animate={v.animate}
        exit={v.exit}
        transition={v.transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}