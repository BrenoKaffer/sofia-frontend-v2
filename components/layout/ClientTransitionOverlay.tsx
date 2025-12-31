'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import PageTransition from './PageTransition'

export default function ClientTransitionOverlay() {
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

  useEffect(() => {
    if (isSlowRoute(pathname)) {
      setVisible(true)
      const timeout = setTimeout(() => setVisible(false), 1800)
      return () => clearTimeout(timeout)
    }
    setVisible(false)
  }, [pathname])

  return <PageTransition isVisible={visible} />
}
