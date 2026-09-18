import { landingSettings, landingSections, settings, templateRecords } from '@/lib/db'
import type { PriceTier, FlashSale, TemplateRecord } from '@/lib/types'
import HeroSection      from '@/components/landing/HeroSection'
import TemplatePreview  from '@/components/landing/TemplatePreview'
import GuestExperience  from '@/components/landing/GuestExperience'
import Pricing          from '@/components/landing/Pricing'
import FAQ              from '@/components/landing/FAQ'
import ClosingCTA       from '@/components/landing/ClosingCTA'
import HowItWorks       from '@/components/landing/HowItWorks'

export const dynamic = 'force-dynamic'

interface PageData {
  landing: Awaited<ReturnType<typeof landingSettings.get>>
  priceTiers: PriceTier[]
  flashSales: FlashSale[]
  activeTemplates: TemplateRecord[]
  whatsapp: string
}

const SECTION_MAP: Record<string, React.FC<PageData>> = {
  hero: ({ landing, activeTemplates }) => <HeroSection content={landing.hero} mockup={landing.heroMockup} template={activeTemplates[0]} />,
  templatePreview: ({ landing, activeTemplates }) => <TemplatePreview showcase={landing.templateShowcase} templates={activeTemplates} />,
  // Id-nya tetap `featureShowcase` supaya urutan section yang sudah tersimpan
  // di database tidak perlu disusun ulang. Isinya yang berganti: dari tujuh
  // kartu fitur seragam menjadi satu cerita tentang apa yang dialami tamu.
  featureShowcase: ({ landing }) => <GuestExperience personalisasi={landing.personalisasiMockup} />,
  pricing: ({ priceTiers, flashSales }) => <Pricing priceTiers={priceTiers} flashSales={flashSales} />,
  faq: ({ landing, whatsapp }) => <FAQ items={landing.faq.items} whatsapp={whatsapp} />,
  howItWorks: () => <HowItWorks />,
  closingCta: ({ whatsapp }) => <ClosingCTA whatsapp={whatsapp} />,
}

export default async function LandingPage() {
  const [landing, sections, appSettings, allTemplates] = await Promise.all([
    landingSettings.get(),
    landingSections.get(),
    settings.get(),
    templateRecords.findAll(),
  ])

  const priceTiers = appSettings.priceTiers
  const flashSales = appSettings.flashSales
  const activeTemplates = allTemplates.filter(t => t.status === 'active')
  // Tanpa nilai cadangan. Nomor contoh yang dulu dipakai di sini menuju ruang
  // kosong, dan kontak palsu lebih merusak kepercayaan daripada kontak yang
  // tidak ditampilkan (D-9).
  const whatsapp = appSettings.confirmationWhatsapp || ''

  const hargaPaket = priceTiers.map(t => t.price).filter(p => p > 0)

  const visibleSections = sections
    .filter(s => s.visible)
    .sort((a, b) => a.order - b.order)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'iaundang',
    url: 'https://iaundang.online',
    description: 'Undangan digital yang menyapa setiap tamu dengan namanya sendiri. Pilih tema, isi sendiri dari dashboard, bagikan tautannya lewat WhatsApp.',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    // Harga dibaca dari paket yang benar-benar dijual. Dulu 79000 dan 249000
    // ditulis mati di sini, jadi data terstruktur untuk mesin pencari ikut
    // melenceng begitu admin mengubah harga.
    ...(hargaPaket.length > 0 && {
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: String(Math.min(...hargaPaket)),
        highPrice: String(Math.max(...hargaPaket)),
        priceCurrency: 'IDR',
        offerCount: priceTiers.length,
      },
    }),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {visibleSections.map(section => {
        const Component = SECTION_MAP[section.id]
        if (!Component) return null
        return <Component key={section.id} landing={landing} priceTiers={priceTiers} flashSales={flashSales} activeTemplates={activeTemplates} whatsapp={whatsapp} />
      })}
    </>
  )
}
