'use client'

import { motion } from 'framer-motion'

interface BrandSVGProps {
  width?: number
  height?: number
}

export default function BrandSVG({ width = 226, height = 34 }: BrandSVGProps) {
  const dPrimary = "M38.784 24C38.784 25.76 38.352 27.376 37.488 28.848C36.624 30.288 35.472 31.44 34.032 32.304C32.592 33.168 30.976 33.6 29.184 33.6H2.74181e-06V28.8H29.184C30.528 28.8 31.664 28.336 32.592 27.408C33.52 26.448 33.984 25.312 33.984 24C33.984 22.688 33.52 21.568 32.592 20.64C31.664 19.68 30.528 19.2 29.184 19.2H9.6C7.84 19.2 6.224 18.768 4.752 17.904C3.312 17.04 2.16 15.888 1.296 14.448C0.432003 12.976 2.74181e-06 11.36 2.74181e-06 9.60001C2.74181e-06 7.84001 0.432003 6.24001 1.296 4.8C2.16 3.328 3.312 2.16 4.752 1.296C6.224 0.432004 7.84 3.8147e-06 9.6 3.8147e-06H36.384V4.8H9.6C8.288 4.8 7.152 5.28 6.192 6.24C5.264 7.168 4.8 8.28801 4.8 9.60001C4.8 10.912 5.264 12.048 6.192 13.008C7.152 13.936 8.288 14.4 9.6 14.4H29.184C30.976 14.4 32.592 14.832 34.032 15.696C35.472 16.56 36.624 17.728 37.488 19.2C38.352 20.64 38.784 22.24 38.784 24Z";
  const dAccent = "M225.794 33.6H220.994V24H194.162V19.2H220.994V4.8H203.762C201.586 4.8 199.586 5.344 197.762 6.432C195.938 7.488 194.482 8.928 193.394 10.752C192.338 12.576 191.81 14.592 191.81 16.8V33.6H187.01V16.8C187.01 14.496 187.442 12.336 188.306 10.32C189.17 8.27201 190.37 6.48001 191.906 4.94401C193.442 3.37601 195.218 2.16 197.234 1.296C199.282 0.432004 201.458 3.8147e-06 203.762 3.8147e-06H225.794V33.6Z";

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 226 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SOFIA brand SVG"
    >
      <defs>
        <linearGradient id="paint0_linear_1_5" x1="-2.352" y1="13.1" x2="237.648" y2="13.1" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4B4B4B" />
          <stop offset="0.173077" stopColor="white" />
        </linearGradient>
        <linearGradient id="paint1_linear_1_5" x1="-2.352" y1="13.1" x2="237.648" y2="13.1" gradientUnits="userSpaceOnUse">
          <stop offset="0.822115" stopColor="#6FFF00" />
          <stop offset="1" stopColor="#0D1D00" />
        </linearGradient>
      </defs>
      {/* Camada base com gradiente cinza → branco */}
      <path d={dPrimary} fill="url(#paint0_linear_1_5)" />
      {/* Camada de destaque com gradiente verde → escuro */}
      <path d={dAccent} fill="url(#paint1_linear_1_5)" />
      {/* Animação de desenho sobre a camada de destaque */}
      <motion.path
        d={dAccent}
        fill="none"
        stroke="url(#paint1_linear_1_5)"
        strokeWidth={1.6}
        initial={{ pathLength: 0, opacity: 0.9 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      />
    </svg>
  )
}
