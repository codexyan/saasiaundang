'use client'

import type { SectionConfig, NewInvitationData, TemplateMeta, Wish, RenderMode } from '@/lib/types'
import HeroSection from './sections/HeroSection'
import ProfilesSection from './sections/ProfilesSection'
import CountdownSection from './sections/CountdownSection'
import StorySection from './sections/StorySection'
import EventsSection from './sections/EventsSection'
import GallerySection from './sections/GallerySection'
import GiftSection from './sections/GiftSection'
import RSVPSection from './sections/RSVPSection'
import WishesSection from './sections/WishesSection'
import LivestreamSection from './sections/LivestreamSection'
import ClosingSection from './sections/ClosingSection'
import QuoteSection from './sections/QuoteSection'
import VideoSection from './sections/VideoSection'
import GiftRegistrySection from './sections/GiftRegistrySection'
import IGStorySection from './sections/IGStorySection'
import QRCodeSection from './sections/QRCodeSection'

interface Props {
  sectionConfig: SectionConfig
  invitationData: NewInvitationData
  templateMeta: TemplateMeta
  invitationId: string
  initialWishes?: Wish[]
  /** Diteruskan ke section yang menulis ke database (RSVP, ucapan). */
  mode: RenderMode
}

export default function SectionRenderer({
  sectionConfig, invitationData, templateMeta, invitationId, initialWishes, mode,
}: Props) {
  // Merge template-level font scales as section defaults (section overrides take priority)
  const augmentedSection: SectionConfig = {
    ...sectionConfig,
    heading_scale: sectionConfig.heading_scale ?? templateMeta.font.heading_scale,
    body_scale:    sectionConfig.body_scale    ?? templateMeta.font.body_scale,
  }
  const shared = { section: augmentedSection, data: invitationData, meta: templateMeta }

  switch (sectionConfig.type) {
    case 'hero':          return <HeroSection          {...shared} />
    case 'profiles':      return <ProfilesSection      {...shared} />
    case 'countdown':     return <CountdownSection     {...shared} />
    case 'story':         return <StorySection         {...shared} />
    case 'events':        return <EventsSection        {...shared} />
    case 'gallery':       return <GallerySection       {...shared} />
    case 'gift':          return <GiftSection          {...shared} invitationId={invitationId} />
    case 'rsvp':          return <RSVPSection          {...shared} invitationId={invitationId} mode={mode} />
    case 'wishes':        return <WishesSection        {...shared} invitationId={invitationId} mode={mode} initialWishes={initialWishes} />
    case 'livestream':    return <LivestreamSection    {...shared} />
    case 'closing':       return <ClosingSection       {...shared} />
    case 'quote':         return <QuoteSection         {...shared} />
    case 'video':         return <VideoSection         {...shared} />
    case 'gift-registry': return <GiftRegistrySection  {...shared} />
    case 'ig-story':      return <IGStorySection       {...shared} />
    case 'qrcode':        return <QRCodeSection        {...shared} />
    default:              return null
  }
}
