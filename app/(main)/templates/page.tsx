import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { templateRecords, settings } from '@/lib/db'
import type { TemplateRecord, PriceTier, FlashSale } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pilih Template Undangan | iaundang',
  description: 'Lihat semua template undangan digital pernikahan. Coba gratis dengan nama kalian sebelum beli.',
}

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function getActiveFlashSale(tierId: string, flashSales: FlashSale[]): FlashSale | null {
  const now = new Date()
  return flashSales.find(s =>
    s.is_active &&
    new Date(s.start_date) <= now &&
    new Date(s.end_date) >= now &&
    (s.scope === 'all' || (s.scope === 'tier' && s.scope_ids.includes(tierId)))
  ) ?? null
}

function calcDiscount(price: number, sale: FlashSale): number {
  if (sale.discount_type === 'percentage') return Math.round(price * (1 - sale.discount_value / 100))
  return Math.max(0, price - sale.discount_value)
}

function TemplateCard({ rec, tier, flashSale }: {
  rec: TemplateRecord
  tier?: PriceTier
  flashSale: FlashSale | null
}) {
  const cs = rec.config.meta.color_scheme
  const opening = rec.config?.opening
  const coverPhoto = opening?.cover_photo_url || opening?.background_image
  const demoUrl = `/demo/renderer?id=${rec.id}`
  const price = tier?.price ?? rec.price
  const discountedPrice = flashSale ? calcDiscount(price, flashSale) : null

  return (
    <div className="bg-chalk rounded-card overflow-hidden border border-hairline shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col group">
      {/* Thumbnail */}
      <Link href={demoUrl} className="block relative">
        <div
          className="aspect-[2/3] relative overflow-hidden"
          style={{ backgroundColor: cs.primary }}
        >
          {coverPhoto && (
            <Image
              src={coverPhoto}
              alt={rec.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
              style={{ opacity: 0.6 }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(180deg, transparent 20%, ${cs.primary}dd 60%, ${cs.primary} 100%)` }}
          />

          {/* Isi cover template — teks miniatur dekoratif */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-10 px-6">
            <p
              className="text-[9px] uppercase tracking-[0.35em] mb-4"
              style={{ color: `${cs.accent}cc` }}
            >
              Undangan Pernikahan
            </p>
            <p className="font-display text-h1 text-center leading-tight" style={{ color: cs.text }}>
              Namamu
            </p>
            <p className="font-display text-body-xl my-1.5" style={{ color: cs.accent }}>
              &amp;
            </p>
            <p className="font-display text-h1 text-center leading-tight" style={{ color: cs.text }}>
              Namanya
            </p>
            <div
              className="mt-5 px-5 py-1.5 rounded-full text-[9px] tracking-[0.15em]"
              style={{ border: `1px solid ${cs.accent}40`, color: `${cs.accent}dd` }}
            >
              BUKA UNDANGAN
            </div>
          </div>

          {/* Badge harga */}
          {price > 0 && (
            <div className="absolute top-3 right-3 z-20">
              {discountedPrice != null ? (
                <div className="flex flex-col items-end gap-1">
                  <span className="text-label-sm px-2 py-0.5 rounded-md bg-red-600 text-white">
                    {flashSale!.discount_type === 'percentage' ? `-${flashSale!.discount_value}%` : `-${formatRp(flashSale!.discount_value)}`}
                  </span>
                  <span className="text-label-base px-2.5 py-1 rounded-lg bg-chalk/90 text-graphite backdrop-blur-sm shadow-sm">
                    {formatRp(discountedPrice)}
                  </span>
                </div>
              ) : (
                <span className="text-label-base px-2.5 py-1 rounded-lg bg-chalk/90 text-graphite backdrop-blur-sm shadow-sm">
                  {tier?.label ?? formatRp(price)}
                </span>
              )}
            </div>
          )}

          {/* Badge kategori */}
          {rec.category && (
            <div className="absolute top-3 left-3 z-20">
              <span className="text-label-sm px-2 py-1 rounded-lg bg-forest-deep/40 text-chalk/90 backdrop-blur-sm capitalize">
                {rec.category}
              </span>
            </div>
          )}

          {/* Overlay hover */}
          <div className="absolute inset-0 z-20 bg-forest-deep/0 group-hover:bg-forest-deep/25 transition-all duration-300 flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-chalk text-graphite text-button-sm font-semibold px-5 py-2.5 rounded-pill shadow-card">
              Coba dengan namamu →
            </span>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-5 flex flex-col flex-1">
        <h2 className="font-display text-h2 text-graphite">{rec.name}</h2>

        {/* Harga */}
        <div className="flex items-center gap-2 mt-1.5">
          {price > 0 ? (
            discountedPrice != null ? (
              <>
                <span className="text-body-sm font-bold text-forest">{formatRp(discountedPrice)}</span>
                <span className="text-body-xs text-concrete line-through">{formatRp(price)}</span>
              </>
            ) : (
              <span className="text-body-sm font-bold text-graphite">{formatRp(price)}</span>
            )
          ) : (
            <span className="text-body-sm font-semibold text-forest">Gratis</span>
          )}
        </div>

        {/* Ringkasan fitur */}
        {tier?.features && (
          <div className="flex flex-wrap gap-1 mt-3">
            {tier.features.music && <span className="text-label-sm bg-mist text-concrete px-2 py-0.5 rounded-pill">Musik</span>}
            {tier.features.gallery && <span className="text-label-sm bg-mist text-concrete px-2 py-0.5 rounded-pill">Galeri</span>}
            {tier.features.rsvp && <span className="text-label-sm bg-mist text-concrete px-2 py-0.5 rounded-pill">RSVP</span>}
            {tier.features.wishes && <span className="text-label-sm bg-mist text-concrete px-2 py-0.5 rounded-pill">Ucapan</span>}
            {tier.features.gift && <span className="text-label-sm bg-forest-50 text-forest px-2 py-0.5 rounded-pill">Amplop</span>}
            {tier.features.video && <span className="text-label-sm bg-forest-50 text-forest px-2 py-0.5 rounded-pill">Video</span>}
            {tier.features.custom_domain && <span className="text-label-sm bg-gold-50 text-gold-700 px-2 py-0.5 rounded-pill">Custom Domain</span>}
          </div>
        )}

        <div className="mt-auto pt-4 space-y-2">
          <Link
            href={demoUrl}
            className="block w-full text-center min-h-[44px] py-3 rounded-button text-button-base font-semibold transition-opacity text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2"
            style={{ backgroundColor: cs.primary }}
          >
            Coba Gratis
          </Link>
          <Link
            href={`/order?template=${rec.id}`}
            className="block w-full text-center py-2.5 rounded-button text-button-sm border border-hairline text-concrete hover:border-gold-dark/50 hover:text-forest-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2"
          >
            Langsung buat undangan
          </Link>
        </div>
      </div>
    </div>
  )
}

export default async function TemplatesPage(props: { searchParams: Promise<{ kategori?: string }> }) {
  const searchParams = await props.searchParams;
  const [activeTemplates, appSettings] = await Promise.all([
    templateRecords.findActive(),
    settings.get(),
  ])

  const tiers = appSettings.priceTiers
  const flashSales = appSettings.flashSales

  function findTier(price: number): PriceTier | undefined {
    return tiers.find(t => t.price === price)
  }

  const categories = Array.from(new Set(activeTemplates.map(t => t.category).filter(Boolean)))

  // Filter kategori via URL param — server-side, tanpa JS tambahan di client
  const rawKategori = searchParams?.kategori?.toLowerCase() ?? ''
  const activeKategori = categories.find(c => c?.toLowerCase() === rawKategori) ?? null
  const shownTemplates = activeKategori
    ? activeTemplates.filter(t => t.category?.toLowerCase() === activeKategori.toLowerCase())
    : activeTemplates

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="bg-chalk border-b border-hairline">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-10 text-center">
          <p className="text-eyebrow text-concrete mb-4">Galeri Template</p>
          <h1 className="font-display text-display-lg text-forest-deep text-balance">
            Pilih gaya undangan kalian
          </h1>
          <p className="mt-3 text-body-lg text-concrete max-w-md mx-auto">
            Klik <strong className="text-graphite">Coba Gratis</strong> untuk lihat tampilan undangan dengan nama kalian sendiri.
            Tidak perlu daftar.
          </p>

          {/* Chip filter kategori — link fungsional */}
          {categories.length > 1 && (
            <nav aria-label="Filter kategori template" className="flex flex-wrap justify-center gap-2 mt-7">
              <Link
                href="/templates"
                aria-current={!activeKategori ? 'page' : undefined}
                className={`text-label-base px-3.5 py-1.5 rounded-pill transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2 ${
                  !activeKategori
                    ? 'bg-forest text-chalk'
                    : 'bg-chalk border border-hairline text-concrete hover:border-gold-dark/50 hover:text-forest-deep'
                }`}
              >
                Semua ({activeTemplates.length})
              </Link>
              {categories.map(cat => {
                const isActive = activeKategori?.toLowerCase() === cat?.toLowerCase()
                const count = activeTemplates.filter(t => t.category === cat).length
                return (
                  <Link
                    key={cat}
                    href={`/templates?kategori=${encodeURIComponent(cat!.toLowerCase())}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={`text-label-base px-3.5 py-1.5 rounded-pill capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2 ${
                      isActive
                        ? 'bg-forest text-chalk'
                        : 'bg-chalk border border-hairline text-concrete hover:border-gold-dark/50 hover:text-forest-deep'
                    }`}
                  >
                    {cat} ({count})
                  </Link>
                )
              })}
            </nav>
          )}
        </div>
      </div>

      {/* Grid template */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {shownTemplates.length === 0 ? (
          <div className="bg-chalk rounded-card border border-dashed border-hairline px-6 py-16 text-center">
            <p className="font-display text-h2 text-graphite mb-2">
              {activeKategori ? `Belum ada template ${activeKategori}` : 'Template segera hadir'}
            </p>
            <p className="text-body-sm text-concrete">
              {activeKategori
                ? 'Coba kategori lain — koleksi terus bertambah.'
                : 'Tim kami sedang menyiapkan koleksi template undangan digital terbaik untuk kalian.'}
            </p>
            {activeKategori && (
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 mt-5 text-button-base text-forest hover:text-forest-deep underline underline-offset-4 transition-colors"
              >
                Lihat semua template
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {shownTemplates
              .sort((a, b) => a.sort_order - b.sort_order)
              .map(rec => {
                const tier = findTier(rec.price)
                const tierId = tier?.id ?? ''
                const sale = getActiveFlashSale(tierId, flashSales)
                return (
                  <TemplateCard key={rec.id} rec={rec} tier={tier} flashSale={sale} />
                )
              })}
          </div>
        )}

        {/* Catatan kaki */}
        <div className="mt-12 text-center bg-chalk border border-hairline rounded-card px-6 py-6">
          <p className="text-body-sm text-concrete">
            Semua template bisa dikustomisasi: nama, tanggal, lokasi, foto, dan musik.
          </p>
          <p className="text-body-xs text-concrete mt-1.5">
            Template baru akan terus ditambah. Sudah beli? Template lama tetap bisa dipakai.
          </p>
        </div>
      </div>
    </div>
  )
}
