'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import PageTransitionWithBackground from './PageTransitionWithBackground'

export default function ClientTransitionOverlayWithBackground() {
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const isLogin = pathname === '/login'
    if (isLogin) {
      setVisible(false)
      return
    }
    const timeout = setTimeout(() => setVisible(false), 1800)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    const isLogin = pathname === '/login'
    if (isLogin) {
      setVisible(false)
      return
    }
    setVisible(true)
    const timeout = setTimeout(() => setVisible(false), 1800)
    return () => clearTimeout(timeout)
  }, [pathname])

  if (pathname === '/login') return null
  return <PageTransitionWithBackground isVisible={visible} />
}
