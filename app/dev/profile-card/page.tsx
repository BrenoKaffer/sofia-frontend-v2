'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, UserCheck, Users } from 'lucide-react'

import { cn } from '@/lib/utils'

type ProfileCardProps = {
  name?: string
  description?: string
  image?: string
  isVerified?: boolean
  followers?: number
  following?: number
  enableAnimations?: boolean
  className?: string
}

function ProfileCard({
  name = 'Sophie Bennett',
  description = 'Product Designer who focuses on simplicity & usability.',
  image = 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=800&h=800&fit=crop&auto=format&q=80',
  isVerified = true,
  followers = 312,
  following = 48,
  enableAnimations = true,
  className,
}: ProfileCardProps) {
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = enableAnimations && !shouldReduceMotion

  const nameLines = useMemo(() => {
    const trimmed = name.trim()
    const parts = trimmed.split(/\s+/).filter(Boolean)
    if (parts.length <= 1) return [trimmed]
    const first = parts[0]
    const rest = parts.slice(1).join(' ')
    return [first, rest]
  }, [name])

  const variants = useMemo(() => {
    const hoverTransition = { type: 'spring', stiffness: 420, damping: 30 } as const
    const container = {
      rest: { scale: 1, transition: hoverTransition },
      hover: shouldAnimate ? { scale: 1.02, transition: hoverTransition } : { transition: hoverTransition },
    }

    const imageV = {
      rest: { scale: 1, transition: hoverTransition },
      hover: shouldAnimate ? { scale: 1.04, transition: hoverTransition } : { transition: hoverTransition },
    }

    return { container, imageV }
  }, [shouldAnimate])

  return (
    <motion.div
      initial="rest"
      animate="rest"
      whileHover="hover"
      variants={variants.container}
      className={cn(
        'relative w-[360px] max-w-[92vw] overflow-hidden rounded-[44px] bg-white shadow-[0_28px_70px_-30px_rgba(0,0,0,0.28)] transform-gpu',
        className
      )}
      style={{ willChange: 'transform' }}
    >
      <div className="relative h-[320px]">
        <motion.img
          variants={variants.imageV}
          src={image}
          alt={name}
          className="h-full w-full object-cover"
          style={{ willChange: 'transform' }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />

        <div className="absolute bottom-12 left-10 right-10 flex items-end justify-between gap-6">
          <div className="min-w-0">
            <h2 className="text-[44px] font-semibold leading-[0.92] tracking-tight text-black">
              {nameLines[0]}
              {nameLines[1] ? <br /> : null}
              {nameLines[1] || null}
            </h2>
          </div>

          {isVerified && (
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-600 shadow-[0_12px_24px_-14px_rgba(0,0,0,0.5)]">
              <Check className="h-7 w-7 text-white" />
            </span>
          )}
        </div>
      </div>

      <div className="relative px-10 pb-10 pt-2">
        <p className="mt-2 text-[20px] leading-snug text-zinc-500">{description}</p>

        <div className="mt-10 grid grid-cols-2 gap-10 text-zinc-500">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5" />
            <span className="text-[20px] font-semibold text-black tabular-nums">{followers}</span>
            <span className="text-[18px]">followers</span>
          </div>

          <div className="flex items-center gap-3">
            <UserCheck className="h-5 w-5" />
            <span className="text-[20px] font-semibold text-black tabular-nums">{following}</span>
            <span className="text-[18px]">following</span>
          </div>
        </div>

        <button
          type="button"
          className="mt-12 w-full rounded-full bg-black py-5 text-[18px] font-semibold text-white shadow-[0_12px_30px_-18px_rgba(0,0,0,0.7)] transition-transform active:scale-[0.99]"
        >
          Follow +
        </button>
      </div>
    </motion.div>
  )
}

export default function ProfileCardIsolatedPage() {
  return (
    <main className="min-h-screen bg-white p-8 overflow-hidden">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <ProfileCard />
      </div>
    </main>
  )
}
