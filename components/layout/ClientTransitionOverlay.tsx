'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import PageTransition from './PageTransition'

export default function ClientTransitionOverlay() {
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setVisible(true)
    const timeout = setTimeout(() => setVisible(false), 1800)
    return () => clearTimeout(timeout)
  }, [pathname])

  return <PageTransition isVisible={visible} />
}
