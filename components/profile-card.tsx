'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, UserCheck, Users } from 'lucide-react'

import { cn } from '@/lib/utils'

export type ProfileCardProps = {
  name?: string
  description?: string
  image?: string
  isVerified?: boolean
  followers?: number
  following?: number
  showActionButton?: boolean
  actionText?: string
  onActionClick?: () => void
  enableAnimations?: boolean
  className?: string
}

export function ProfileCard({
  name = 'Sophie Bennett',
  description = 'Product Designer who focuses on simplicity & usability.',
  image = 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=800&h=800&fit=crop&auto=format&q=80',
  isVerified = true,
  followers = 312,
  following = 48,
  showActionButton = true,
  actionText = 'Follow +',
  onActionClick,
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
        'relative w-[300px] max-w-[92vw] overflow-hidden rounded-[32px] bg-white shadow-[0_22px_56px_-28px_rgba(0,0,0,0.28)] transform-gpu',
        className
      )}
      style={{ willChange: 'transform' }}
    >
      <div className="relative h-[240px]">
        <motion.img
          variants={variants.imageV}
          src={image}
          alt={name}
          className="h-full w-full object-cover"
          style={{ willChange: 'transform' }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />

        <div className="absolute bottom-8 left-7 right-7 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[30px] font-semibold leading-[0.94] tracking-tight text-black">
              {nameLines[0]}
              {nameLines[1] ? <br /> : null}
              {nameLines[1] || null}
            </h2>
          </div>

          {isVerified && (
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 shadow-[0_10px_20px_-14px_rgba(0,0,0,0.5)]">
              <Check className="h-6 w-6 text-white" />
            </span>
          )}
        </div>
      </div>

      <div className="relative px-7 pb-7 pt-2">
        <p className="mt-2 text-[14px] leading-snug text-zinc-500">{description}</p>

        <div className="mt-6 grid grid-cols-2 gap-6 text-zinc-500">
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4" />
            <span className="text-[14px] font-semibold text-black tabular-nums">{followers}</span>
            <span className="text-[12px]">followers</span>
          </div>

          <div className="flex items-center gap-3">
            <UserCheck className="h-4 w-4" />
            <span className="text-[14px] font-semibold text-black tabular-nums">{following}</span>
            <span className="text-[12px]">following</span>
          </div>
        </div>

        {showActionButton ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onActionClick?.()
            }}
            className="mt-7 w-full rounded-full bg-black py-3 text-[14px] font-semibold text-white shadow-[0_10px_22px_-16px_rgba(0,0,0,0.7)] transition-transform active:scale-[0.99]"
          >
            {actionText}
          </button>
        ) : null}
      </div>
    </motion.div>
  )
}
