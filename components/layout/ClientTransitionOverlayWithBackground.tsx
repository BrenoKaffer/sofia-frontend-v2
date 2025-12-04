'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import PageTransitionWithBackground from './PageTransitionWithBackground'

export default function ClientTransitionOverlayWithBackground() {
  const [visible, setVisible] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(false), 1800)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    setVisible(true)
    const timeout = setTimeout(() => setVisible(false), 1800)
    return () => clearTimeout(timeout)
  }, [pathname])

  return <PageTransitionWithBackground isVisible={visible} />
}

