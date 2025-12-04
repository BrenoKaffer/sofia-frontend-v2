'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import PageTransitionWithBackground from './PageTransitionWithBackground'

export default function ClientTransitionOverlayWithBackground() {
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()

  // Não exibir overlay no mount inicial; apenas em mudanças de rota

  useEffect(() => {
    setVisible(true)
    const timeout = setTimeout(() => setVisible(false), 1800)
    return () => clearTimeout(timeout)
  }, [pathname])

  return <PageTransitionWithBackground isVisible={visible} />
}
