import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { templateRecords } from '@/lib/db'
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
    title: `Template ${template.name} — Undangan Digital | iaundang`,
    description: `Lihat dan coba template undangan digital "${template.name}" dari iaundang. Kustomisasi dengan nama pasangan, tanggal, dan lokasi. Coba gratis tanpa daftar.`,
    openGraph: {
      title: `Template ${template.name} | iaundang`,
      description: `Template undangan digital "${template.name}" — elegan, personal, dan siap pakai.`,
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

  const features = [
    { icon: Music, label: 'Musik Latar', available: true },
    { icon: ImageIcon, label: 'Galeri Foto', available: true },
    { icon: Users, label: 'RSVP', available: true },
    { icon: MessageCircle, label: 'Buku Ucapan', available: true },
    { icon: Gift, label: 'Amplop Digital', available: true },
    { icon: Video, label: 'Video', available: true },
    { icon: Globe, label: 'Custom Domain', available: false },
  ]

  const allTemplates = await templateRecords.findActive()
  const related = allTemplates
    .filter(t => t.id !== template.id && t.category === template.category)
    .slice(0, 3)

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
      price: template.price,
      availability: 'https://schema.org/InStock',
    },
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <Link href="/templates" className="text-sm text-stone-400 hover:text-stone-600 transition-colors inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Kembali ke galeri
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Preview */}
          <div className="relative">
            <div
              className="aspect-[2/3] rounded-2xl overflow-hidden relative"
              style={{ backgroundColor: cs.primary }}
            >
              {coverPhoto && (
                <Image
                  src={coverPhoto}
                  alt={template.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
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
                <p className="font-sans text-4xl font-bold text-center" style={{ color: cs.text }}>
                  Namamu
                </p>
                <p className="font-sans text-2xl my-2" style={{ color: cs.accent, fontStyle: 'italic' }}>
                  &amp;
                </p>
                <p className="font-sans text-4xl font-bold text-center" style={{ color: cs.text }}>
                  Namanya
                </p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              {template.category && (
                <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-stone-100 text-stone-500 capitalize">
                  {template.category}
                </span>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-3">{template.name}</h1>
              <p className="text-stone-500 text-sm mt-2">
                Template undangan digital yang elegan dan bisa dikustomisasi sepenuhnya.
                Masukkan nama, tanggal, lokasi, dan foto — langsung jadi undangan online yang siap dibagikan.
              </p>
            </div>

            {/* Price */}
            <div className="bg-white rounded-2xl border border-stone-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-stone-400">Mulai dari</p>
                  <p className="text-2xl font-bold text-stone-900">
                    {template.price > 0
                      ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(template.price)
                      : 'Gratis'}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Link href={demoUrl}
                  className="block w-full text-center py-3 rounded-xl text-sm font-semibold text-white transition-colors"
                  style={{ backgroundColor: cs.primary }}>
                  Coba Gratis dengan Namamu
                </Link>
                <Link href={`/order?template=${template.id}`}
                  className="block w-full text-center py-2.5 rounded-xl text-sm font-medium border border-stone-200 text-stone-500 hover:border-stone-300 transition-colors">
                  Langsung Buat Undangan
                </Link>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-sm font-bold text-stone-900 mb-3">Fitur Template</h3>
              <div className="grid grid-cols-2 gap-2">
                {features.map(f => (
                  <div key={f.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${f.available ? 'bg-green-50 text-green-700' : 'bg-stone-50 text-stone-400'}`}>
                    <f.icon size={14} />
                    <span className="font-medium">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Color scheme */}
            <div>
              <h3 className="text-sm font-bold text-stone-900 mb-3">Palet Warna</h3>
              <div className="flex gap-2">
                {[cs.primary, cs.accent, cs.text, cs.background].filter(Boolean).map((color, i) => (
                  <div key={i} className="w-10 h-10 rounded-xl border border-stone-200 shadow-sm" style={{ backgroundColor: color }} title={color} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related templates */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-lg font-bold text-stone-900 mb-6">Template Lainnya</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map(rec => {
                const rcs = rec.config.meta.color_scheme
                const rCover = rec.config?.opening?.cover_photo_url || rec.config?.opening?.background_image
                return (
                  <Link key={rec.id} href={`/templates/${rec.slug}`} className="group">
                    <div className="aspect-[2/3] rounded-2xl overflow-hidden relative" style={{ backgroundColor: rcs.primary }}>
                      {rCover && <Image src={rCover} alt={rec.name} fill className="object-cover" sizes="33vw" style={{ opacity: 0.5 }} />}
                      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 40%, ${rcs.primary} 100%)` }} />
                      <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                        <p className="font-sans text-lg font-bold" style={{ color: rcs.text }}>{rec.name}</p>
                      </div>
                      <div className="absolute inset-0 z-20 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-stone-900 text-xs font-semibold px-4 py-2 rounded-full shadow-lg">
                          Lihat Detail →
                        </span>
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
