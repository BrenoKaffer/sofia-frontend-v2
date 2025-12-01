'use client'

import { motion } from 'framer-motion'

interface BrandSVGProps {
  width?: number
  height?: number
}

export default function BrandSVG({ width = 226, height = 34 }: BrandSVGProps) {
  // Path extraído do SVG fornecido em docs (rodapé), última camada com fill verde
  const dPath = "M225.794 33.6H220.994V24H194.162V19.2H220.994V4.8H203.762C201.586 4.8 199.586 5.344 197.762 6.432C195.938 7.488 194.482 8.928 193.394 10.752C192.338 12.576 191.81 14.592 191.81 16.8V33.6H187.01V16.8C187.01 14.496 187.442 12.336 188.306 10.32C189.17 8.27201 190.37 6.48001 191.906 4.94401C193.442 3.37601 195.218 2.16 197.234 1.296C199.282 0.432004 201.458 3.8147e-06 203.762 3.8147e-06H225.794V33.6Z";

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 226 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SOFIA brand SVG"
    >
      {/* Static fill layer (brand green) */}
      <path d={dPath} fill="#6FFF00" />
      {/* Animated stroke layer to simulate "desenhando" */}
      <motion.path
        d={dPath}
        fill="none"
        stroke="#6FFF00"
        strokeWidth={1.5}
        initial={{ pathLength: 0, opacity: 0.9 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      />
    </svg>
  )
}
