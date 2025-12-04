'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import PageTransitionWithBackground from './PageTransitionWithBackground'

export default function ClientTransitionOverlayWithBackground() {
  const pathname = usePathname()

  const slowRoutes = [
    '/login',
    '/register',
    '/email-confirmation',
    '/forgot-password',
    '/reset-password',
    '/account',
    '/settings',
    '/help',
    '/community',
    '/profile',
    '/payment',
  ]

  const isSlowRoute = (path: string) => slowRoutes.some(p => path.startsWith(p))
  const [visible, setVisible] = useState(isSlowRoute(pathname))

  useEffect(() => {
    if (isSlowRoute(pathname)) {
      const timeout = setTimeout(() => setVisible(false), 1800)
      return () => clearTimeout(timeout)
    }
    setVisible(false)
  }, [])

  // Exibir overlay apenas quando navegar para rotas lentas
  useEffect(() => {
    if (isSlowRoute(pathname)) {
      setVisible(true)
      const timeout = setTimeout(() => setVisible(false), 1800)
      return () => clearTimeout(timeout)
    }
    setVisible(false)
  }, [pathname])

  if (typeof document === 'undefined') return null
  return createPortal(
    <PageTransitionWithBackground isVisible={visible} />,
    document.body
  )
}
