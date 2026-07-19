import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { invitations, galleries, wishes, guests, templateRecords } from '@/lib/db'
import { isExpired } from '@/lib/utils'
import { getPackage, type PackageTier } from '@/lib/packages'
import { subscriptions, isActive as isSubActive, isTrial, isInGracePeriod } from '@/lib/subscription'

export const dynamic = 'force-dynamic'
import { LEGACY_TEMPLATE_IDS } from '@/lib/types'
import type { Invitation, Gallery, Wish, Guest, NewInvitationData } from '@/lib/types'

// Legacy hardcoded templates
import ModernWhiteTemplate from '@/components/templates/modern-white/ModernWhiteTemplate'
import FloralGardenTemplate from '@/components/templates/floral-garden/FloralGardenTemplate'
import DarkElegantTemplate from '@/components/templates/dark-elegant/DarkElegantTemplate'

// New JSON-driven renderer
import InvitationRenderer from '@/components/renderer/InvitationRenderer'
import ViewTracker from '@/components/analytics/ViewTracker'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(props: Props) {
  const params = await props.params;
  const inv = await invitations.findBySlug(params.slug)
  if (!inv?.is_published) return {}

  // New style data
  const data = inv.data as unknown as NewInvitationData
  if (data.groom_name) {
    return {
      title: `Undangan ${data.groom_name} & ${data.bride_name}`,
      description: `Kami mengundang kehadiran Anda pada pernikahan ${data.groom_name} & ${data.bride_name}`,
    }
  }

  // Legacy style data
  const d = inv.data
  return {
    title: `Undangan ${d.groomName} & ${d.brideName}`,
    description: `Kami mengundang kehadiran Anda pada pernikahan ${d.groomName} & ${d.brideName}`,
  }
}

export default async function InvitationPage(props0: Props) {
  const params = await props0.params;
  const invitation = await invitations.findBySlug(params.slug)

  if (!invitation) notFound()

  if (!invitation.is_published) {
    return <UnpublishedPage />
  }

  const sub = await subscriptions.findByInvitation(invitation.id)
  const expired = sub
    ? !isSubActive(sub)
    : invitation.is_paid && isExpired(invitation.expires_at)

  if (expired) {
    if (sub && isTrial(sub) && isInGracePeriod(sub)) {
      return <TrialGracePage slug={invitation.slug} />
    }
    return <ExpiredPage />
  }

  const tier = (invitation as unknown as Record<string, unknown>).package_tier as PackageTier | undefined
  const pkg = getPackage(tier)
  const showWatermark = !invitation.is_paid || !pkg.hasWatermarkFree

  // Build Event structured data for SEO
  const isLegacyData = (LEGACY_TEMPLATE_IDS as string[]).includes(invitation.template_id)
  const seoData = isLegacyData
    ? { groom: invitation.data.groomName, bride: invitation.data.brideName, date: invitation.data.akadDate, venue: invitation.data.akadVenue }
    : (() => { const d = invitation.data as unknown as NewInvitationData; return { groom: d.groom_name, bride: d.bride_name, date: d.akad?.date, venue: d.akad?.venue_name } })()

  const eventJsonLd = seoData.groom ? {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `Pernikahan ${seoData.groom} & ${seoData.bride}`,
    ...(seoData.date && { startDate: seoData.date }),
    ...(seoData.venue && { location: { '@type': 'Place', name: seoData.venue } }),
    url: `https://iaundang.online/invitation/${invitation.slug}`,
    organizer: { '@type': 'Organization', name: 'iaundang', url: 'https://iaundang.online' },
  } : null

  //  JSON-driven renderer path
  const isLegacy = (LEGACY_TEMPLATE_IDS as string[]).includes(invitation.template_id)

  if (!isLegacy) {
    const template = await templateRecords.findById(invitation.template_id)
    if (!template) {
      return <UnpublishedPage message="Template undangan tidak ditemukan." />
    }

    const invWishes = await wishes.findByInvitationId(invitation.id)

    const content = (
      <InvitationRenderer
        invitationId={invitation.id}
        invitationData={invitation.data as unknown as NewInvitationData}
        template={template}
        initialWishes={invWishes}
        musicUrl={(invitation.data as unknown as NewInvitationData).music_url}
      />
    )

    const page = showWatermark ? <WatermarkShell>{content}</WatermarkShell> : content
    return <>{eventJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }} />}{page}<ViewTracker invitationId={invitation.id} /></>
  }

  //  Legacy hardcoded templates path
  const props = {
    invitation: invitation as Invitation,
    galleries: await galleries.findByInvitationId(invitation.id) as Gallery[],
    wishes: await wishes.findByInvitationId(invitation.id) as Wish[],
    guests: await guests.findByInvitationId(invitation.id) as Guest[],
  }

  let content: React.ReactNode
  switch (invitation.template_id) {
    case 'floral-garden':
      content = <FloralGardenTemplate {...props} />; break
    case 'dark-elegant':
      content = <DarkElegantTemplate {...props} />; break
    default:
      content = <ModernWhiteTemplate {...props} />; break
  }

  const page = showWatermark ? <WatermarkShell>{content}</WatermarkShell> : content
  return <>{eventJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }} />}{page}<ViewTracker invitationId={invitation.id} /></>
}

function WatermarkShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* Top watermark bar */}
      <div className="sticky top-0 z-[100] bg-white/95 backdrop-blur-xl border-b border-stone-200/60 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-11 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logos/logo-horizontal.png" alt="iaundang" width={90} height={24} className="object-contain" />
          </Link>
          <Link
            href="/templates"
            className="flex items-center gap-1.5 bg-forest-500 hover:bg-forest-600 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            Buat Undangan
          </Link>
        </div>
      </div>

      {/* Invitation content */}
      <div className="flex-1">{children}</div>

      {/* Bottom watermark bar */}
      <div className="sticky bottom-0 z-[100] bg-white/95 backdrop-blur-xl border-t border-stone-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-10 flex items-center justify-between">
          <p className="text-[11px] text-stone-400">
            Dibuat dengan <span className="font-semibold text-stone-600">iaundang</span> · Undangan digital premium
          </p>
          <Link href="/templates" className="text-[11px] text-forest-600 hover:text-forest-700 transition-colors font-semibold">
            Buat Undangan
          </Link>
        </div>
      </div>
    </div>
  )
}

function UnpublishedPage({ message }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <div className="text-5xl mb-4">💌</div>
        <h1 className="text-2xl font-sans font-bold text-gray-800">Undangan Belum Aktif</h1>
        <p className="text-gray-500 mt-3 max-w-sm">
          {message ?? 'Undangan ini belum dipublikasikan oleh pemiliknya.'}
        </p>
      </div>
    </div>
  )
}

function TrialGracePage({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4 max-w-md">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-sans font-bold text-gray-800">Masa Percobaan Berakhir</h1>
        <p className="text-gray-500 mt-3">
          Free trial untuk undangan <strong>{slug}</strong> telah habis. Undangan masih tersimpan — upgrade ke paket berbayar untuk mengaktifkan kembali.
        </p>
        <Link
          href="/templates"
          className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors"
        >
          Pilih Paket & Aktifkan
        </Link>
      </div>
    </div>
  )
}

function ExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <div className="text-5xl mb-4">⏰</div>
        <h1 className="text-2xl font-sans font-bold text-gray-800">Undangan Sudah Berakhir</h1>
        <p className="text-gray-500 mt-3 max-w-sm">
          Masa aktif undangan ini telah habis. Terima kasih telah hadir.
        </p>
      </div>
    </div>
  )
}
