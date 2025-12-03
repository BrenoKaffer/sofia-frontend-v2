'use client'

import { motion } from 'framer-motion'

interface Props {
  width?: number
  height?: number
}

export default function BrandTextLogo({ width = 603, height = 110 }: Props) {
  const textY = 70
  return (
    <motion.svg
      initial={{ opacity: 0, y: 10, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      width={width}
      height={height}
      viewBox="0 0 603 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SOFIA brand text"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="neonGradient" x1="0" y1="0" x2="603" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#FFFFFF" />
        </linearGradient>
        <linearGradient id="sweepGradient" x1="0" y1="0" x2="603" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#6FFF00" />
        </linearGradient>
        <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <mask id="textMask">
          <rect x="0" y="0" width="603" height="110" fill="#000" />
          <text
            x="20"
            y={textY}
            fill="#fff"
            fontFamily="Bruno Ace, Poppins, sans-serif"
            fontSize="60"
            letterSpacing="0.28em"
          >
            S.O.F.I.
            <tspan fill="#6FFF00">A</tspan>
          </text>
        </mask>
      </defs>

      <text
        x="20"
        y={textY}
        fill="#FFFFFF"
        fontFamily="Bruno Ace, Poppins, sans-serif"
        fontSize="60"
        letterSpacing="0.28em"
      >
        S.O.F.I.
        <tspan fill="#6FFF00">A</tspan>
      </text>

      <text
        x="20"
        y={textY}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        fontFamily="Bruno Ace, Poppins, sans-serif"
        fontSize="60"
        letterSpacing="0.28em"
        filter="url(#glowFilter)"
      >
        S.O.F.I.A
      </text>

      <motion.rect
        x={-200}
        y={0}
        width={1000}
        height={110}
        fill="url(#sweepGradient)"
        mask="url(#textMask)"
        style={{ mixBlendMode: 'screen' }}
        initial={{ x: -200, opacity: 0.9 }}
        animate={{ x: 700, opacity: [0.9, 0.6, 0.9] }}
        transition={{ duration: 2.4, ease: 'linear', repeat: Infinity }}
      />
    </motion.svg>
  )
}
