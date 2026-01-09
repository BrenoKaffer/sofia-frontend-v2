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

  const isSlowRoute = (path: string) => {
    // Garante que o dashboard nunca seja tratado como rota lenta
    if (path.includes('/dashboard')) return false
    return slowRoutes.some(p => path.startsWith(p))
  }

  const [visible, setVisible] = useState(false)

  // Sincronizar estado inicial com a rota atual após montagem para evitar hydration mismatch
  useEffect(() => {
    if (isSlowRoute(pathname)) {
      setVisible(true)
      const timeout = setTimeout(() => setVisible(false), 1800)
      return () => clearTimeout(timeout)
    }
  }, [])

  // Exibir overlay apenas quando navegar para rotas lentas
  useEffect(() => {
    if (isSlowRoute(pathname)) {
      setVisible(true)
      const timeout = setTimeout(() => setVisible(false), 1800)
      return () => clearTimeout(timeout)
    }
    // Garante que o overlay seja ocultado imediatamente ao sair de uma rota lenta
    setVisible(false)
  }, [pathname])

  if (typeof document === 'undefined') return null
  
  return createPortal(
    <PageTransitionWithBackground isVisible={visible} />,
    document.body
  )
}
