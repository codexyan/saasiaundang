'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Play, ArrowRight, Sparkles, Crown, Gem } from 'lucide-react'
import type { TemplateRecord } from '@/lib/types'
import { SectionContainer } from '@/components/marketing/SectionContainer'
import { Button } from '@/components/marketing/Button'
import { Badge } from '@/components/marketing/Badge'
import { EASE, VIEWPORT_ONCE } from '@/lib/motion'

// Teks miniatur di dalam mockup HP = ilustrasi dekoratif; arbitrary < 12px
// diizinkan khusus di dalam mockup.
function PhoneMockup({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-[28px] sm:rounded-[32px] overflow-hidden ${className}`}
      style={{
        padding: 5,
        background: 'linear-gradient(160deg, #2a2a2c 0%, #1a1a1c 40%, #0a0a0a 100%)',
        boxShadow: '0 12px 28px -10px rgba(10,10,10,0.22), 0 28px 56px -16px rgba(10,10,10,0.14), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      <div className="absolute left-1/2 -translate-x-1/2 z-30 rounded-full" style={{ top: 8, width: 56, height: 16, backgroundColor: '#000' }} />
      <div className="rounded-[24px] sm:rounded-[28px] overflow-hidden relative" style={{ aspectRatio: '9/19.5' }}>
        {children}
      </div>
    </div>
  )
}

interface TemplateCard {
  id: string
  name: string
  category: string
  primary: string
  accent: string
  textColor: string
  coverPhoto: string
  href: string
  requiredPackage: string
  description: string
}

type BadgeVariant = 'neutral' | 'forest' | 'gold'
const TIER_BADGE: Record<string, { label: string; icon: typeof Sparkles; variant: BadgeVariant }> = {
  all: { label: 'Starter', icon: Sparkles, variant: 'neutral' },
  starter: { label: 'Starter', icon: Sparkles, variant: 'neutral' },
  popular: { label: 'Popular', icon: Crown, variant: 'forest' },
  eksklusif: { label: 'Eksklusif', icon: Gem, variant: 'gold' },
}

// Solid-color blur placeholder so foto external (Unsplash) tidak flash kosong saat load
function blurFor(color: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='8' height='12'><rect width='100%' height='100%' fill='${color}'/></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function templateToCard(t: TemplateRecord): TemplateCard {
  const cs = t.config.meta.color_scheme
  const opening = t.config?.opening
  return {
    id: t.id,
    name: t.name,
    category: t.category || 'Wedding',
    primary: cs.primary,
    accent: cs.accent,
    textColor: cs.text || '#ffffff',
    coverPhoto: opening?.cover_photo_url || opening?.background_image || '',
    href: `/demo/renderer?id=${t.id}`,
    requiredPackage: t.required_package,
    // Em dash dilarang di teks yang tampil (R-02), dan deskripsi template
    // ditulis admin dari panel, bukan di kode. Diganti koma saat dirender;
    // sumber teksnya sendiri sebaiknya dirapikan dari panel admin.
    description: (t.description || '').replace(/\s*—\s*/g, ', '),
  }
}


interface ShowcaseData {
  featured: { name: string; tagline: string; coverPhoto: string; primary: string; accent: string; href: string }
  comingSoon: { label: string; accent: string; bg: string }[]
}

export default function TemplatePreview({ templates }: { showcase?: ShowcaseData; templates?: TemplateRecord[] }) {
  const cards: TemplateCard[] = (templates ?? [])
    .filter(t => t.status === 'active')
    .map(templateToCard)

  // Tanpa daftar cadangan. Dulu tiga template contoh lengkap dengan foto
  // Unsplash tampil di sini kalau database kosong, jadi halaman memamerkan tema
  // yang tidak dijual siapa pun (D-9). Sekarang kosong terbaca sebagai kosong.
  if (cards.length === 0) {
    return (
      <SectionContainer
        id="templates"
        tone="ivory"
        eyebrow="Tema undangan"
        title="Tema sedang disiapkan"
        lead="Belum ada tema yang aktif untuk ditampilkan. Hubungi kami dan kami kabari begitu ada."
      >
        <div className="text-center">
          <Button href="/#faq" variant="secondary">Baca pertanyaan umum</Button>
        </div>
      </SectionContainer>
    )
  }

  return (
    <SectionContainer
      id="templates"
      tone="ivory"
      eyebrow="Tema undangan"
      title={<>Tiga tema, digarap satu per satu.</>}
      lead="Bukan katalog ratusan tema hasil ganti warna. Masing-masing bisa kalian buka sekarang dengan nama kalian sendiri, gratis dan tanpa daftar."
    >
      {/* Satu tema satu baris penuh, arahnya berselang-seling. Tiga tema yang
          dipajang besar terbaca sebagai kurasi; tiga tema dalam grid kartu kecil
          terbaca sebagai stok yang belum terisi (RHYTHM 3). */}
      <div className="space-y-16 sm:space-y-20">
        {cards.map((card, i) => {
          const badge = TIER_BADGE[card.requiredPackage] ?? TIER_BADGE.all
          const BadgeIcon = badge.icon
          const terbalik = i % 2 === 1

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT_ONCE}
              transition={{ duration: 0.6, ease: EASE }}
              className={`group flex flex-col items-center gap-8 sm:gap-10 lg:gap-16 ${terbalik ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}
            >
              <div className="w-[210px] sm:w-[240px] shrink-0 transition-transform duration-500 ease-out group-hover:-translate-y-2">
                <PhoneMockup>
                  <div className="absolute inset-0" style={{ backgroundColor: card.primary }}>
                    {card.coverPhoto && (
                      <Image src={card.coverPhoto} alt={`Tema ${card.name}`} fill className="object-cover" sizes="260px"
                        placeholder="blur" blurDataURL={blurFor(card.primary)} style={{ opacity: 0.6 }} />
                    )}
                    <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 18%, ${card.primary}99 56%, ${card.primary} 100%)` }} />
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-12 px-4">
                      <p className="text-[8px] tracking-[0.35em] uppercase mb-2" style={{ color: `${card.accent}bb` }}>
                        The Wedding of
                      </p>
                      <p className="font-display text-[28px] leading-[0.95]" style={{ color: card.textColor }}>Ikhwal</p>
                      <p className="font-display text-base my-0.5" style={{ color: card.accent }}>&amp;</p>
                      <p className="font-display text-[28px] leading-[0.95]" style={{ color: card.textColor }}>Fani</p>
                      <div className="mt-4 px-4 py-1.5 rounded-full" style={{ border: `1px solid ${card.accent}30`, fontSize: 8, color: `${card.accent}aa`, letterSpacing: '0.15em' }}>
                        BUKA UNDANGAN
                      </div>
                    </div>
                  </div>
                </PhoneMockup>
              </div>

              <div className={`flex-1 text-center ${terbalik ? 'lg:text-right' : 'lg:text-left'}`}>
                <div className={`flex items-center justify-center gap-2 mb-3 ${terbalik ? 'lg:justify-end' : 'lg:justify-start'}`}>
                  <Badge variant={badge.variant}>
                    <BadgeIcon className="w-3 h-3" />
                    {badge.label}
                  </Badge>
                  <span className="text-body-xs text-concrete capitalize">{card.category}</span>
                </div>

                <h3 className="font-display text-display-md text-graphite">{card.name}</h3>

                {card.description && (
                  <p className="text-body-base text-concrete leading-relaxed mt-3 max-w-md mx-auto lg:mx-0">
                    {card.description}
                  </p>
                )}

                <div className={`mt-7 flex flex-col sm:flex-row gap-3 justify-center ${terbalik ? 'lg:justify-end' : 'lg:justify-start'}`}>
                  <Button href={card.href} className="w-full sm:w-auto">
                    <span className="w-5 h-5 rounded-full bg-chalk/20 flex items-center justify-center">
                      <Play size={9} className="fill-current ml-0.5" />
                    </span>
                    Coba dengan nama kalian
                  </Button>
                  <Button href={`/order?template=${card.id}`} variant="secondary" className="w-full sm:w-auto">
                    Pesan tema ini
                  </Button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={VIEWPORT_ONCE}
        transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
        className="text-center mt-14 sm:mt-16"
      >
        <Link
          href="/templates"
          className="group inline-flex items-center gap-2 text-button-base text-concrete hover:text-forest-deep pb-0.5 border-b border-hairline hover:border-gold-dark transition-colors"
        >
          Lihat halaman tema
          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </motion.div>
    </SectionContainer>
  )
}
