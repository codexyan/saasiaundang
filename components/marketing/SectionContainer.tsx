'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { fadeUp } from '@/lib/motion'

// Wrapper section landing: menstandarkan ritme vertikal, container,
// dan pola header (eyebrow → judul serif → lead) untuk semua section publik.

type Tone = 'ivory' | 'chalk' | 'mist' | 'tint' | 'dark'

const TONES: Record<Tone, string> = {
  ivory: 'bg-ivory',
  chalk: 'bg-chalk',
  mist: 'bg-mist/50',
  tint: 'bg-forest-50',
  dark: 'bg-forest-deep',
}

interface SectionContainerProps {
  id?: string
  tone?: Tone
  eyebrow?: string
  title?: React.ReactNode
  lead?: React.ReactNode
  align?: 'center' | 'left'
  className?: string
  children: React.ReactNode
}

export function SectionContainer({
  id,
  tone = 'ivory',
  eyebrow,
  title,
  lead,
  align = 'center',
  className,
  children,
}: SectionContainerProps) {
  const reduced = useReducedMotion()
  const isDark = tone === 'dark'
  const hasHeader = eyebrow || title || lead
  // Untuk pengunjung yang mematikan animasi, judul section HILANG sama sekali
  // sebelum ini. Sebabnya: server selalu merender initial `opacity:0` ke HTML,
  // karena di server tidak ada media query untuk dibaca. Begitu di klien
  // useReducedMotion() bernilai true, propsnya dikosongkan, jadi tidak ada lagi
  // yang mengembalikan opacity ke 1 dan gaya bawaan dari server menetap. Yang
  // dimatikan seharusnya geraknya, bukan kemunculannya.
  const enter = reduced
    ? { initial: false as const, animate: { opacity: 1, y: 0 } }
    : fadeUp()

  return (
    <section id={id} className={cn('py-20 sm:py-28 lg:py-32 overflow-hidden', TONES[tone], className)}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {hasHeader && (
          <motion.div
            {...enter}
            className={cn('mb-12 sm:mb-16', align === 'center' && 'text-center mx-auto max-w-2xl')}
          >
            {eyebrow && (
              <p className={cn('text-eyebrow mb-4', isDark ? 'text-gold/70' : 'text-concrete')}>
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className={cn('font-display text-display-lg text-balance', isDark ? 'text-chalk' : 'text-forest-deep')}>
                {title}
              </h2>
            )}
            {lead && (
              <p className={cn('mt-4 text-body-lg leading-relaxed', align === 'center' && 'max-w-lg mx-auto', isDark ? 'text-chalk/70' : 'text-concrete')}>
                {lead}
              </p>
            )}
          </motion.div>
        )}
        {children}
      </div>
    </section>
  )
}
