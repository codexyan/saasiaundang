'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Music2, ClipboardCheck, Users } from 'lucide-react'
import { Button } from '@/components/marketing/Button'
import { EASE } from '@/lib/motion'

interface HeroContent {
  headline: string
  subheadline: string
  ctaPrimary: string
  ctaSecondary: string
}

const FEATURE_TAGS = [
  { icon: Users, label: 'Nama tamu personal' },
  { icon: Music2, label: 'Musik otomatis' },
  { icon: ClipboardCheck, label: 'RSVP online' },
]

export default function HeroSection({
  content,
  mockup,
}: {
  content?: HeroContent
  mockup?: { groomName?: string; brideName?: string; date?: string; venue?: string }
}) {
  const hero = {
    ctaPrimary: content?.ctaPrimary ?? 'Coba dengan Nama Kalian',
    ctaSecondary: content?.ctaSecondary ?? 'Lihat Demo',
    subheadline:
      content?.subheadline ??
      'Setiap tamu mendapat undangan dengan namanya. Musik otomatis, RSVP langsung, tanpa install.',
  }
  const groomName = mockup?.groomName ?? 'Rizky'
  const brideName = mockup?.brideName ?? 'Aulia'
  const date = mockup?.date ?? '12 · 04 · 2026'
  const venue = mockup?.venue ?? 'Hotel Grand Ballroom, Jakarta'

  return (
    <section className="relative overflow-hidden bg-ivory">
      <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 pt-28 sm:pt-36 lg:pt-40 pb-16 sm:pb-24">

        {/* Blok tipografi — tengah */}
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
          >
            <span className="inline-flex items-center gap-2 text-label-sm uppercase tracking-[0.09em] text-forest bg-gold/[0.07] border border-gold-200/70 px-3.5 py-1.5 rounded-pill">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              Undangan Digital Premium
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
            className="mt-7 font-display text-display-2xl text-forest-deep text-balance"
          >
            Undangan digital yang personal
            <br className="hidden sm:block" />
            {' '}untuk <span className="text-gold-700">setiap tamu.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
            className="mt-6 text-body-lg leading-[1.75] text-concrete max-w-xl mx-auto"
          >
            {hero.subheadline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: EASE }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <Button href="/templates" size="lg" className="w-full sm:w-auto">
              {hero.ctaPrimary}
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Button>
            <Link
              href="/demo/renderer?id=javanese-gold"
              className="group inline-flex items-center gap-2 text-button-base text-concrete hover:text-forest-deep pb-0.5 border-b border-hairline hover:border-gold-dark transition-colors"
            >
              {hero.ctaSecondary}
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-7 flex flex-wrap items-center justify-center gap-y-2 gap-x-5 text-body-xs text-concrete"
          >
            {['Gratis preview', 'Sekali bayar', 'Tanpa langganan'].map((t, i) => (
              <span key={t} className="flex items-center gap-5">
                {i > 0 && <span className="w-1 h-1 rounded-full bg-gold/50 -ml-5" />}
                {t}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Kanvas undangan — produk sebagai panggung sinematik lebar */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.0, delay: 0.45, ease: EASE }}
          className="relative mt-12 sm:mt-16 rounded-card overflow-hidden shadow-float aspect-[3/4] sm:aspect-[16/9] lg:aspect-[21/9]"
        >
          <Image
            src="/images/templates/wedding-bg.jpg"
            alt="Contoh tampilan undangan digital iaundang"
            fill
            priority
            quality={90}
            sizes="(max-width: 1152px) 100vw, 1104px"
            className="object-cover"
          />
          {/* Overlay hijau pekat agar teks terbaca */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(15,26,18,0.25) 0%, rgba(15,26,18,0.45) 55%, rgba(15,26,18,0.82) 100%)' }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at center 40%, transparent 30%, rgba(15,26,18,0.35) 100%)' }}
          />

          {/* Isi undangan — pb menjauhkan dari pita tag fitur di bawah */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6 pb-14 sm:pb-0">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.75, ease: EASE }}
            >
              <p className="text-label-sm uppercase tracking-[0.35em] text-gold mb-4 sm:mb-5">
                The Wedding of
              </p>
              <h2 className="font-display text-display-lg text-chalk leading-tight">
                {groomName} <span className="text-gold">&amp;</span> {brideName}
              </h2>
              <div aria-hidden className="w-10 h-px bg-gold/70 mx-auto my-4 sm:my-5" />
              <p className="text-body-sm text-chalk/80">
                {date}
                <span className="hidden sm:inline"> &middot; </span>
                <span className="block sm:inline mt-1 sm:mt-0">{venue}</span>
              </p>
            </motion.div>
          </div>

          {/* Tag fitur — pita bawah kanvas */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.95, ease: EASE }}
            className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2 sm:gap-3 pb-4 sm:pb-5 px-4 flex-wrap"
          >
            {FEATURE_TAGS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 text-label-sm text-chalk/90 bg-forest-deep/45 backdrop-blur-sm border border-chalk/15 px-3 py-1.5 rounded-pill"
              >
                <Icon size={12} className="text-gold/90" />
                {label}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
