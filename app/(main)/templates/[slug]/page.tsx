import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { templateRecords, settings } from '@/lib/db'
import { startingPrice } from '@/lib/pricing'
import { ArrowLeft, Music, Image as ImageIcon, Users, MessageCircle, Gift, Video, Globe } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const template = await templateRecords.findBySlug(params.slug)
  if (!template) return {}

  return {
    title: `Undangan Digital ${template.name} | iaundang`,
    description: `Lihat dan coba desain undangan digital "${template.name}" dari iaundang. Isi dengan nama kalian berdua, tanggal, dan lokasi acara. Gratis dicoba, tanpa perlu daftar.`,
    openGraph: {
      title: `Undangan Digital ${template.name} | iaundang`,
      description: `Desain undangan "${template.name}" yang elegan, personal, dan siap pakai.`,
      images: template.thumbnail_url ? [template.thumbnail_url] : undefined,
    },
  }
}

export default async function TemplateDetailPage(props: Props) {
  const params = await props.params;
  const template = await templateRecords.findBySlug(params.slug)
  if (!template || template.status !== 'active') notFound()

  const cs = template.config.meta.color_scheme
  const opening = template.config?.opening
  const coverPhoto = opening?.cover_photo_url || opening?.background_image
  const demoUrl = `/demo/renderer?id=${template.id}`

  const [allTemplates, appSettings] = await Promise.all([
    templateRecords.findActive(),
    settings.get(),
  ])
  const related = allTemplates
    .filter(t => t.id !== template.id && t.category === template.category)
    .slice(0, 3)

  // Harga "Mulai dari" dan harga di data terstruktur SEO dihitung dengan aturan
  // yang sama dengan /api/orders. Dulu halaman ini tidak memuat pengaturan
  // paket sama sekali: template berharga 0 tampil "Mulai dari Gratis" dan data
  // SEO-nya mengumumkan price 0, padahal tombol di sebelahnya membuka /order
  // yang menagih harga paket.
  const start = startingPrice({
    templatePrice: template.price,
    requiredPackage: template.required_package,
    category: template.category,
    tiers: appSettings.priceTiers,
    flashSales: appSettings.flashSales,
  })

  // Daftar fitur dibaca dari paket TERMURAH yang boleh dipakai tema ini, yang
  // memang dikembalikan startingPrice(). Dulu daftar ini ditulis mati dengan
  // semuanya `available: true` kecuali custom domain, jadi halaman tema yang
  // cukup memakai paket Starter tetap menjanjikan amplop digital dan video,
  // padahal keduanya tidak ada di Starter (R-38).
  const f = start?.tier.features
  const features = f ? [
    { icon: Music, label: 'Musik latar', available: f.music },
    { icon: ImageIcon, label: 'Galeri foto', available: f.gallery },
    { icon: Users, label: 'RSVP', available: f.rsvp },
    { icon: MessageCircle, label: 'Buku ucapan', available: f.wishes },
    { icon: Gift, label: 'Amplop digital', available: f.gift },
    { icon: Video, label: 'Video', available: f.video },
    // Custom domain dicabut: belum ada mekanismenya sama sekali.
  ] : []

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Template ${template.name}`,
    description: `Template undangan digital "${template.name}" dari iaundang`,
    url: `https://iaundang.online/templates/${template.slug}`,
    ...(template.thumbnail_url && { image: template.thumbnail_url }),
    brand: { '@type': 'Brand', name: 'iaundang' },
    category: 'Undangan Digital',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'IDR',
      price: start?.price.final ?? template.price,
      availability: 'https://schema.org/InStock',
    },
  }

  return (
    <div className="min-h-screen bg-ivory">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="bg-chalk border-b border-hairline">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-24 pb-6">
          <Link
            href="/templates"
            className="inline-flex items-center gap-1.5 min-h-[44px] text-body-sm text-concrete hover:text-forest-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 rounded-button"
          >
            <ArrowLeft size={14} /> Kembali ke galeri
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Sampul tema */}
          <div
            className="aspect-[2/3] rounded-card overflow-hidden relative shadow-card"
            style={{ backgroundColor: cs.primary }}
          >
            {coverPhoto && (
              <Image
                src={coverPhoto}
                alt={`Tema ${template.name}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                style={{ opacity: 0.6 }}
              />
            )}
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(180deg, transparent 20%, ${cs.primary}dd 60%, ${cs.primary} 100%)` }}
            />
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-16 px-6">
              <p className="text-[9px] uppercase tracking-[0.35em] mb-4" style={{ color: `${cs.accent}cc` }}>
                Undangan Pernikahan
              </p>
              {/* font-display, sama dengan seluruh permukaan lain. Dulu di sini
                  sans tebal, jadi ini satu-satunya tempat nama pasangan tidak
                  memakai serif merek. */}
              <p className="font-display text-display-md text-center leading-none" style={{ color: cs.text }}>
                Namamu
              </p>
              <p className="font-display text-h3 my-2" style={{ color: cs.accent }}>&amp;</p>
              <p className="font-display text-display-md text-center leading-none" style={{ color: cs.text }}>
                Namanya
              </p>
            </div>
          </div>

          {/* Keterangan */}
          <div className="space-y-7">
            <div>
              {template.category && (
                <span className="text-label-sm px-3 py-1 rounded-pill bg-mist text-concrete capitalize">
                  {template.category}
                </span>
              )}
              <h1 className="font-display text-display-lg text-forest-deep mt-4">{template.name}</h1>
              {/* Deskripsi asli tema, bukan satu kalimat yang sama untuk semua
                  tema. Em dash diganti koma saat dirender (R-02); sumber
                  teksnya sendiri sebaiknya dirapikan dari panel admin. */}
              {template.description && (
                <p className="text-body-base text-concrete leading-relaxed mt-3">
                  {template.description.replace(/\s*—\s*/g, ', ')}
                </p>
              )}
            </div>

            <div className="bg-chalk rounded-card border border-hairline shadow-card p-6">
              {start && (
                <div className="mb-5">
                  <p className="text-body-xs text-concrete">Mulai dari</p>
                  <p className="font-display text-h1 text-forest-deep">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(start.price.final)}
                  </p>
                  <p className="text-body-xs text-concrete mt-1">
                    Harga paket {start.tier.label}, paket termurah yang bisa dipakai tema ini.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Link
                  href={demoUrl}
                  className="flex w-full items-center justify-center min-h-[44px] py-3 rounded-button text-button-base font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2"
                  style={{ backgroundColor: cs.primary }}
                >
                  Coba dengan nama kalian
                </Link>
                <Link
                  href={`/order?template=${template.id}`}
                  className="flex w-full items-center justify-center min-h-[44px] py-2.5 rounded-button text-button-sm border border-hairline text-concrete hover:border-gold-dark/50 hover:text-forest-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2"
                >
                  Pesan tema ini
                </Link>
              </div>
            </div>

            {features.length > 0 && start && (
              <div>
                <h2 className="text-label-lg text-graphite mb-1">Isi paket {start.tier.label}</h2>
                <p className="text-body-xs text-concrete mb-3">
                  Paket di atasnya menambah lebih banyak. Rinciannya ada di halaman harga.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {features.map(fitur => (
                    <div
                      key={fitur.label}
                      className={`flex items-center gap-2 px-3 py-2 rounded-button text-body-xs ${
                        fitur.available ? 'bg-forest-50 text-forest-deep' : 'bg-mist text-ash line-through'
                      }`}
                    >
                      <fitur.icon size={14} aria-hidden />
                      <span className="font-medium">{fitur.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-label-lg text-graphite mb-3">Palet warna</h2>
              <div className="flex gap-2">
                {[cs.primary, cs.accent, cs.text, cs.background].filter(Boolean).map((color, i) => (
                  <div key={i} className="w-10 h-10 rounded-button border border-hairline shadow-card" style={{ backgroundColor: color }} title={color} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="font-display text-h2 text-forest-deep mb-7">Tema lainnya</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map(rec => {
                const rcs = rec.config.meta.color_scheme
                const rCover = rec.config?.opening?.cover_photo_url || rec.config?.opening?.background_image
                return (
                  <Link
                    key={rec.id}
                    href={`/templates/${rec.slug}`}
                    className="group block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2"
                  >
                    <div className="aspect-[2/3] rounded-card overflow-hidden relative shadow-card transition-shadow duration-300 group-hover:shadow-card-hover" style={{ backgroundColor: rcs.primary }}>
                      {rCover && <Image src={rCover} alt={`Tema ${rec.name}`} fill className="object-cover" sizes="33vw" style={{ opacity: 0.5 }} />}
                      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 40%, ${rcs.primary} 100%)` }} />
                      <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                        <p className="font-display text-h3" style={{ color: rcs.text }}>{rec.name}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
