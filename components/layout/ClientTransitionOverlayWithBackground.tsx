'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import PageTransitionWithBackground from './PageTransitionWithBackground'

export default function ClientTransitionOverlayWithBackground() {
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()

  // Exibir overlay no primeiro mount
  useEffect(() => {
    setVisible(true)
    const timeout = setTimeout(() => setVisible(false), 1800)
    return () => clearTimeout(timeout)
  }, [])

  // Exibir overlay em mudanças de rota
  useEffect(() => {
    setVisible(true)
    const timeout = setTimeout(() => setVisible(false), 1800)
    return () => clearTimeout(timeout)
  }, [pathname])

  if (typeof document === 'undefined') return null
  return createPortal(
    <PageTransitionWithBackground isVisible={visible} />,
    document.body
  )
}
