'use client'

import { useEffect, useState } from 'react'
import PageTransition from './PageTransition'

export default function ClientTransitionOverlay() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(false), 2500)
    return () => clearTimeout(timeout)
  }, [])

  return <PageTransition isVisible={visible} />
}