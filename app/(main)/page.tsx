import { landingSettings, landingSections, settings, templateRecords } from '@/lib/db'
import type { PriceTier, FlashSale, TemplateRecord } from '@/lib/types'
import HeroSection      from '@/components/landing/HeroSection'
import TrustBar         from '@/components/landing/TrustBar'
import TemplatePreview  from '@/components/landing/TemplatePreview'
import FeatureShowcase  from '@/components/landing/FeatureShowcase'
import Pricing          from '@/components/landing/Pricing'
import FAQ              from '@/components/landing/FAQ'
import ClosingCTA       from '@/components/landing/ClosingCTA'
import HowItWorks       from '@/components/landing/HowItWorks'
import Testimonials     from '@/components/landing/Testimonials'
import BlogShowcase     from '@/components/landing/BlogShowcase'

export const dynamic = 'force-dynamic'

interface PageData {
  landing: Awaited<ReturnType<typeof landingSettings.get>>
  priceTiers: PriceTier[]
  flashSales: FlashSale[]
  activeTemplates: TemplateRecord[]
  whatsapp: string
}

const SECTION_MAP: Record<string, React.FC<PageData>> = {
  hero: ({ landing }) => <HeroSection content={landing.hero} mockup={landing.heroMockup} />,
  trustBar: ({ landing }) => <TrustBar items={landing.trustBar.items} />,
  templatePreview: ({ landing, activeTemplates }) => <TemplatePreview showcase={landing.templateShowcase} templates={activeTemplates} />,
  featureShowcase: ({ landing }) => <FeatureShowcase personalisasi={landing.personalisasiMockup} />,
  pricing: ({ priceTiers, flashSales }) => <Pricing priceTiers={priceTiers} flashSales={flashSales} />,
  faq: ({ landing, whatsapp }) => <FAQ items={landing.faq.items} whatsapp={whatsapp} />,
  howItWorks: () => <HowItWorks />,
  testimonials: () => <Testimonials />,
  blogShowcase: () => <BlogShowcase />,
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

  const visibleSections = sections
    .filter(s => s.visible)
    .sort((a, b) => a.order - b.order)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'iaundang',
    url: 'https://iaundang.online',
    description: 'Platform undangan digital premium self-service. Pilih template, kustomisasi, dan kirim link personal ke tamu.',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '79000',
      highPrice: '249000',
      priceCurrency: 'IDR',
      offerCount: priceTiers.length,
    },
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
