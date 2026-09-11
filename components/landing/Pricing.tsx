'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, ArrowRight, ShieldCheck, MessageCircle } from 'lucide-react'
import { PRICING_CONFIG } from '@/lib/pricing-config'
import { computePrice } from '@/lib/pricing'
import { SectionContainer } from '@/components/marketing/SectionContainer'
import { EASE, VIEWPORT_ONCE } from '@/lib/motion'
import type { PriceTier, FlashSale } from '@/lib/types'

type CardVariant = 'light' | 'dark' | 'gold'

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function PricingCard({
  name, badge, price, originalPrice, discountLabel, duration, features, highlightedFeature,
  ctaLabel, ctaHint, variant, popular, delay = 0,
}: {
  name: string; badge: string; price: string; originalPrice?: string; discountLabel?: string
  duration: string; features: readonly string[]; highlightedFeature?: string
  ctaLabel: string; ctaHint: string; variant: CardVariant
  popular?: boolean; delay?: number
}) {
  const isDark = variant === 'dark'
  const isGold = variant === 'gold'

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT_ONCE}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className={`relative rounded-card h-full flex flex-col overflow-hidden shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover ${
        isDark
          ? 'bg-forest-deep text-chalk ring-1 ring-gold/20'
          : isGold
            ? 'bg-gold-50 border border-gold-200 hover:border-gold-300'
            : 'bg-chalk border border-hairline hover:border-ash/40'
      } ${popular ? 'sm:scale-[1.03] sm:z-10' : ''}`}
    >
      {popular && (
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gold" />
      )}

      {discountLabel && (
        <div className={`absolute top-3 right-3 text-label-sm px-2 py-1 rounded-lg ${
          isDark ? 'bg-gold text-forest-deep' : 'bg-forest text-chalk'
        }`}>
          {discountLabel}
        </div>
      )}

      <div className={`px-6 pt-6 pb-5 border-b ${isDark ? 'border-chalk/10' : isGold ? 'border-gold-200' : 'border-hairline'}`}>
        <span className={`inline-block text-label-sm uppercase tracking-[0.1em] px-2.5 py-1 rounded-lg mb-4 ${
          isDark ? 'bg-gold/15 text-gold-light'
            : isGold ? 'bg-gold/15 text-gold-700'
              : 'bg-forest-50 text-forest'
        }`}>
          {badge}
        </span>
        <p className={`text-body-sm font-medium mb-2 ${isDark ? 'text-chalk/70' : 'text-concrete'}`}>{name}</p>
        <div className="flex items-baseline gap-2">
          <span className={`font-display text-h1 ${isDark ? 'text-chalk' : 'text-forest-deep'}`}>{price}</span>
          {originalPrice && (
            <span className={`text-body-sm line-through ${isDark ? 'text-chalk/40' : 'text-concrete'}`}>{originalPrice}</span>
          )}
        </div>
        <p className={`text-body-xs mt-2 ${isDark ? 'text-chalk/60' : 'text-concrete'}`}>
          sekali bayar · aktif {duration}
        </p>
      </div>

      <div className="px-6 py-5 flex-1">
        <ul className="space-y-2.5">
          {features.map((feature) => {
            const isHL = feature === highlightedFeature
            return (
              <li key={feature} className={`flex items-start gap-2.5 ${
                isHL ? `rounded-lg px-2.5 py-1.5 -mx-2.5 ${isDark ? 'bg-gold/[0.08]' : 'bg-forest-50'}` : ''
              }`}>
                <div className={`shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-gold/15' : 'bg-forest-50'
                }`}>
                  <Check size={10} strokeWidth={3} className={isDark ? 'text-gold/80' : 'text-forest'} />
                </div>
                <span className={`text-body-sm leading-snug ${
                  isHL ? `font-semibold ${isDark ? 'text-chalk' : 'text-forest-deep'}` : isDark ? 'text-chalk/75' : 'text-concrete'
                }`}>
                  {feature}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="px-6 pb-6">
        <Link
          href="/templates"
          className={`w-full text-button-base font-semibold min-h-[44px] rounded-button transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2 ${
            isDark ? 'bg-gold text-forest-deep hover:bg-gold-light'
              : isGold ? 'bg-forest text-chalk hover:bg-forest-deep'
                : 'bg-forest-50 text-forest-deep hover:bg-forest-100'
          }`}
        >
          {ctaLabel}
          <ArrowRight size={14} />
        </Link>
        <p className={`text-body-xs mt-2.5 text-center ${isDark ? 'text-chalk/60' : 'text-concrete'}`}>{ctaHint}</p>
      </div>
    </motion.div>
  )
}

const TIER_VARIANTS: Record<string, CardVariant> = { starter: 'light', popular: 'dark', eksklusif: 'gold' }
const TIER_CTA: Record<string, { label: string; hint: string }> = {
  // Dulu "Mulai Gratis / Coba dulu, bayar kalau cocok", padahal Starter
  // berbayar dan tombolnya hanya membuka galeri. Yang gratis adalah demo di
  // galeri itu, bukan paketnya, jadi hint menyebut demo secara terus terang.
  starter: { label: 'Pilih Starter', hint: 'Coba demonya gratis dulu' },
  popular: { label: 'Pilih Popular', hint: 'Fitur lengkap untuk acara kalian' },
  eksklusif: { label: 'Pilih Eksklusif', hint: 'Untuk acara besar & eksklusif' },
}

/**
 * `cheaperTier` = tier tepat di bawahnya berdasarkan harga, dipakai untuk
 * baris ringkas "Semua fitur X". Dulu ini hardcode: popular selalu bilang
 * "Semua fitur Starter", eksklusif selalu "Semua fitur Popular", dan tier
 * kustom tidak dapat baris itu sama sekali. Sekarang diturunkan dari urutan
 * harga, jadi tier keempat pun ikut benar.
 */
function buildFeatureList(tier: PriceTier, cheaperTier: PriceTier | undefined): string[] {
  const f = tier.features
  if (!f) return []
  const list: string[] = []
  if (cheaperTier) {
    list.push(`Semua fitur ${cheaperTier.label}`)
  } else {
    if (f.music) list.push('Musik pengiring')
    if (f.rsvp) list.push('RSVP online')
    if (f.gallery) list.push('Galeri foto')
    if (f.countdown) list.push('Countdown hari H')
    if (f.wishes) list.push('Ucapan & doa dari tamu')
  }
  // Dulu dibatasi `tier.id !== 'starter'` / `=== 'eksklusif'`. Fitur ini
  // sekarang ditampilkan kalau paketnya memang punya, apa pun id-nya.
  if (f.gift) list.push('Amplop digital & rekening')
  if (f.gift_registry) list.push('Wishlist hadiah')
  if (f.story) list.push('Kisah cinta pasangan')
  if (f.video) list.push('Video prewedding')
  if (f.qrcode) list.push('Scan barcode kehadiran tamu')
  if (f.remove_watermark) list.push('Tanpa watermark')
  if (f.custom_domain) list.push('Custom domain sendiri')
  if (f.priority_support) list.push('Priority support via WhatsApp')
  list.push(`Aktif ${f.validity_days} hari`)
  return list
}

interface PricingProps {
  priceTiers?: PriceTier[]
  flashSales?: FlashSale[]
}

export default function Pricing({ priceTiers, flashSales }: PricingProps) {
  const tiers = priceTiers?.length ? [...priceTiers].sort((a, b) => a.price - b.price) : null
  const sales = flashSales ?? []

  // Grid dulu dikunci `sm:grid-cols-3` karena tier memang selalu tepat tiga.
  // Dengan tier kustom jumlahnya bisa berapa saja, jadi kolom mengikuti
  // jumlah tier (dibatasi 4 supaya kartunya tidak jadi terlalu sempit).
  const cols = tiers ? Math.min(tiers.length, 4) : 3
  const gridCols = cols >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4'
    : cols === 3 ? 'sm:grid-cols-3'
    : cols === 2 ? 'sm:grid-cols-2'
    : 'sm:grid-cols-1'

  return (
    <SectionContainer
      id="harga"
      tone="ivory"
      eyebrow="Harga"
      title="Sekali bayar. Tanpa langganan."
      lead="Sekali bayar, langsung aktif. Tidak ada biaya bulanan atau biaya tersembunyi."
    >
      <div className={`grid grid-cols-1 ${gridCols} gap-4 sm:gap-5 max-w-4xl mx-auto items-stretch`}>
        {tiers ? (
          tiers
            .map((tier, i) => {
              // computePrice() — FUNGSI YANG SAMA dengan /api/orders. Halaman
              // ini dulu punya perhitungan diskonnya sendiri, jadi angka yang
              // dipajang bisa berbeda dari yang benar-benar ditagih.
              const breakdown = computePrice({
                basePrice: tier.price,
                tierId: tier.id,
                flashSales: sales,
                coupons: [],
              })
              const discounted = breakdown.flashSale ? breakdown.final : null
              const variant = TIER_VARIANTS[tier.id] ?? 'light'
              const cta = TIER_CTA[tier.id] ?? { label: `Pilih ${tier.label}`, hint: '' }
              const features = buildFeatureList(tier, tiers[i - 1])
              // Dulu: hardcode per id. Sekarang fitur unggulan = fitur pertama
              // yang tier ini punya tapi tier di bawahnya belum.
              const highlighted = i > 0
                ? features.find(x => !buildFeatureList(tiers[i - 1], tiers[i - 2]).includes(x) && !x.startsWith('Semua fitur') && !x.startsWith('Aktif '))
                : undefined

              return (
                <PricingCard
                  key={tier.id}
                  name={`Paket ${tier.label}`}
                  badge={tier.highlight ? 'PALING DIPILIH' : tier.label.toUpperCase()}
                  price={formatRp(discounted ?? tier.price)}
                  originalPrice={discounted ? formatRp(tier.price) : undefined}
                  discountLabel={breakdown.flashSale ? `−${formatRp(breakdown.flashSale.saved)}` : undefined}
                  duration={tier.features ? `${tier.features.validity_days} hari` : '30 hari'}
                  features={features}
                  highlightedFeature={highlighted}
                  ctaLabel={cta.label}
                  ctaHint={cta.hint}
                  variant={variant}
                  popular={!!tier.highlight}
                  delay={i * 0.1}
                />
              )
            })
        ) : (
          <>
            {/* Teks tombol sama dengan TIER_CTA.starter, lihat alasannya di sana. */}
            <PricingCard
              name="Paket Starter" badge={PRICING_CONFIG.starter.badge}
              price={PRICING_CONFIG.starter.priceFormatted} duration={PRICING_CONFIG.starter.durationLabel}
              features={PRICING_CONFIG.starter.features}
              ctaLabel="Pilih Starter" ctaHint="Coba demonya gratis dulu" variant="light" delay={0}
            />
            <PricingCard
              name="Paket Popular" badge={PRICING_CONFIG.popular.badge}
              price={PRICING_CONFIG.popular.priceFormatted} duration={PRICING_CONFIG.popular.durationLabel}
              features={PRICING_CONFIG.popular.features} highlightedFeature={PRICING_CONFIG.popular.highlightedFeature}
              ctaLabel="Pilih Popular" ctaHint="Fitur lengkap untuk acara kalian" variant="dark" popular delay={0.1}
            />
            <PricingCard
              name="Paket Eksklusif" badge={PRICING_CONFIG.eksklusif.badge}
              price={PRICING_CONFIG.eksklusif.priceFormatted} duration={PRICING_CONFIG.eksklusif.durationLabel}
              features={PRICING_CONFIG.eksklusif.features} highlightedFeature={PRICING_CONFIG.eksklusif.highlightedFeature}
              ctaLabel="Pilih Eksklusif" ctaHint="Untuk acara besar & eksklusif" variant="gold" delay={0.2}
            />
          </>
        )}
      </div>

      {/* Trust badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
        className="mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-3xl mx-auto"
      >
        <div className="flex items-center gap-3.5 bg-chalk rounded-card px-5 py-4 border border-hairline shadow-card">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center border border-forest-100">
            <ShieldCheck size={18} className="text-forest" />
          </div>
          <div>
            <p className="text-body-sm font-semibold text-forest-deep leading-snug">
              Lihat hasilnya dulu, bayar kalau suka
            </p>
            <p className="text-body-xs text-concrete mt-0.5">Tanpa risiko, tanpa komitmen</p>
          </div>
        </div>
        <div className="flex items-center gap-3.5 bg-chalk rounded-card px-5 py-4 border border-hairline shadow-card">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center border border-forest-100">
            <MessageCircle size={18} className="text-forest" />
          </div>
          <div>
            <p className="text-body-sm font-semibold text-forest-deep leading-snug">
              Tim kami siap membantu via WhatsApp
            </p>
            <p className="text-body-xs text-concrete mt-0.5">Balas dalam 1 hari kerja</p>
          </div>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mt-8 text-center text-body-sm text-concrete"
      >
        Ada pertanyaan?{' '}
        <Link href="/#faq" className="font-medium text-forest hover:text-forest-deep underline underline-offset-2 transition-colors">
          Lihat FAQ
        </Link>
      </motion.p>
    </SectionContainer>
  )
}
