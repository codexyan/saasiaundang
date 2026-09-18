import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { templateRecords, settings } from '@/lib/db'
import type { TemplateRecord, PriceTier } from '@/lib/types'
import { startingPrice } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pilih Template Undangan | iaundang',
  description: 'Lihat semua template undangan digital pernikahan. Coba gratis dengan nama kalian sebelum beli.',
}

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

// Satu tema satu baris penuh, arahnya berselang-seling. Tiga tema dalam grid
// tiga kolom meninggalkan satu kolom menganga dan terbaca sebagai toko yang
// belum buka; tiga tema yang dipajang besar terbaca sebagai kurasi. Halaman ini
// tujuan watermark di setiap undangan, jadi kesan pertamanya menentukan.
function TemplateRow({ rec, tier, start, terbalik }: {
  rec: TemplateRecord
  /** Paket syarat template, hanya untuk label badge dan ringkasan fitur. */
  tier?: PriceTier
  /** Hasil startingPrice() untuk template ini, dihitung di halaman. */
  start: ReturnType<typeof startingPrice>
  terbalik: boolean
}) {
  const cs = rec.config.meta.color_scheme
  const opening = rec.config?.opening
  const coverPhoto = opening?.cover_photo_url || opening?.background_image
  const demoUrl = `/demo/renderer?id=${rec.id}`
  // Harga dari startingPrice(), yang memakai computePrice() dan aturan paket
  // yang sama dengan /api/orders. Dulu basePrice di sini jatuh ke 0 untuk
  // template berharga 0 dengan required_package 'all' (findTier mengembalikan
  // undefined), lalu kartu memajang "Gratis" padahal /order menagih harga paket.
  const price = start?.price.base ?? 0
  const finalPrice = start?.price.final ?? 0
  const discountedPrice = start?.price.flashSale ? finalPrice : null

  return (
    <div className={`bg-chalk rounded-card overflow-hidden border border-hairline shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col group lg:items-stretch ${terbalik ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
      {/* Thumbnail */}
      <Link href={demoUrl} className="block relative lg:w-[42%] lg:shrink-0">
        <div
          className="aspect-[2/3] lg:aspect-auto lg:h-full lg:min-h-[460px] relative overflow-hidden"
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

          {/* Badge harga. Muncul untuk template yang sama seperti dulu (harga
              khusus atau punya paket syarat), ditambah saat ada flash sale.
              Angkanya sekarang dari startingPrice(). */}
          {start && (rec.price > 0 || tier || discountedPrice != null) && (
            <div className="absolute top-3 right-3 z-20">
              {discountedPrice != null ? (
                <div className="flex flex-col items-end gap-1">
                  <span className="text-label-sm px-2 py-0.5 rounded-md bg-red-600 text-white">
                    &minus;{formatRp(start.price.flashSale!.saved)}
                  </span>
                  <span className="text-label-base px-2.5 py-1 rounded-lg bg-chalk/90 text-graphite backdrop-blur-sm shadow-sm">
                    {formatRp(discountedPrice)}
                  </span>
                </div>
              ) : (
                <span className="text-label-base px-2.5 py-1 rounded-lg bg-chalk/90 text-graphite backdrop-blur-sm shadow-sm">
                  {tier?.label ?? formatRp(finalPrice)}
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
              Coba dengan nama kalian
            </span>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-6 sm:p-8 lg:p-10 flex flex-col flex-1 lg:justify-center">
        {/* Nama tema menautkan ke halaman detailnya. Sebelum ini tidak ada
            satu pun tautan ke /templates/[slug] di seluruh situs, jadi
            halaman itu hanya bisa dicapai lewat mesin pencari. */}
        <Link
          href={`/templates/${rec.slug}`}
          className="font-display text-display-md text-graphite hover:text-forest-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 rounded-button"
        >
          {rec.name}
        </Link>
        {rec.description && (
          <p className="mt-2 text-body-base text-concrete leading-relaxed max-w-md">{rec.description}</p>
        )}

        {/* Harga. Diawali "Mulai" karena angkanya harga paket termurah yang
            boleh dipilih untuk template ini, bukan satu-satunya harga. Label
            "Gratis" yang dulu ada di sini dibuang: tidak ada template yang bisa
            dipesan tanpa bayar. */}
        {start && (
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-body-xs text-concrete">Mulai</span>
            {discountedPrice != null ? (
              <>
                <span className="text-body-sm font-bold text-forest">{formatRp(discountedPrice)}</span>
                <span className="text-body-xs text-concrete line-through">{formatRp(price)}</span>
              </>
            ) : (
              <span className="text-body-sm font-bold text-graphite">{formatRp(finalPrice)}</span>
            )}
          </div>
        )}

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

        <div className="mt-6 pt-2 space-y-2 lg:max-w-xs">
          <Link
            href={demoUrl}
            className="block w-full text-center min-h-[44px] py-3 rounded-button text-button-base font-semibold transition-opacity text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2"
            style={{ backgroundColor: cs.primary }}
          >
            Coba dengan nama kalian
          </Link>
          <Link
            href={`/order?template=${rec.id}`}
            className="flex w-full items-center justify-center min-h-[44px] py-2.5 rounded-button text-button-sm border border-hairline text-concrete hover:border-gold-dark/50 hover:text-forest-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2"
          >
            Pesan tema ini
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

  /** Paket sebuah template ditentukan oleh `required_package` (id paket),
   *  bukan dengan mencocokkan NILAI HARGA seperti sebelumnya. Pencocokan lewat
   *  harga membuat dua paket bertarif sama saling mengklaim template yang
   *  sama, dan begitu admin mengubah harga sebuah paket, seluruh template
   *  "miliknya" lepas diam-diam lalu tampil tanpa daftar fitur. */
  function findTier(rec: TemplateRecord): PriceTier | undefined {
    if (rec.required_package === 'all') return undefined
    return tiers.find(t => t.id === rec.required_package)
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
            Buka salah satunya dengan nama kalian sendiri dulu, gratis dan tanpa daftar.
            Pemesanan baru dimulai kalau kalian memang mau melanjutkan.
          </p>

          {/* Chip filter kategori — link fungsional */}
          {categories.length > 1 && (
            <nav aria-label="Filter kategori template" className="flex flex-wrap justify-center gap-2 mt-7">
              <Link
                href="/templates"
                aria-current={!activeKategori ? 'page' : undefined}
                className={`text-label-base inline-flex items-center min-h-[44px] px-4 py-1.5 rounded-pill transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2 ${
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
                    className={`text-label-base inline-flex items-center min-h-[44px] px-4 py-1.5 rounded-pill capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2 ${
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
                ? 'Coba lihat kategori lain ya.'
                : 'Belum ada tema yang aktif untuk ditampilkan.'}
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
          <div className="space-y-8 sm:space-y-10">
            {shownTemplates
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((rec, i) => {
                const tier = findTier(rec)
                const start = startingPrice({
                  templatePrice: rec.price,
                  requiredPackage: rec.required_package,
                  category: rec.category,
                  tiers,
                  flashSales,
                })
                return (
                  <TemplateRow key={rec.id} rec={rec} tier={tier} start={start} terbalik={i % 2 === 1} />
                )
              })}
          </div>
        )}

        {/* Catatan kaki */}
        <div className="mt-12 text-center bg-chalk border border-hairline rounded-card px-6 py-6">
          <p className="text-body-sm text-concrete">
            Nama, tanggal, lokasi, foto, dan musik bisa kalian ubah sendiri sesudah memesan.
          </p>
        </div>
      </div>
    </div>
  )
}
