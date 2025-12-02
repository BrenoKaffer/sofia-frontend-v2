'use client'

import styles from './GlowRing.module.css'

interface GlowRingProps {
  children: React.ReactNode
  className?: string
}

export default function GlowRing({ children, className }: GlowRingProps) {
  return (
    <div className={`${styles.ring} ${className ?? ''}`}>
      <div className={styles.halo} />
      <div className={styles.content}>{children}</div>
    </div>
  )
}
