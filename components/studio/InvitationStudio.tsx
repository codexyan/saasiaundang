'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import { Reorder, useDragControls, motion, AnimatePresence } from 'framer-motion'
import {
  CheckSquare, MessageSquare, BookOpen, Eye, X, Loader2, Check, RefreshCw,
  User, Calendar, Sparkles, Music, Quote, Image, Gift, FileText,
  Maximize2, ExternalLink, Lock, Video, Radio, Instagram, QrCode, ShoppingBag,
  GripVertical, ArrowUpDown, Palette,
} from 'lucide-react'
import type { Invitation, NewInvitationData, TemplateRecord, OpeningType, TierFeatures } from '@/lib/types'
import type { PackageTier } from '@/lib/packages'
import { calculateCompleteness } from '@/lib/studio-progress'
import { EASE } from '@/lib/motion'
import { usePackageGating } from '@/hooks/usePackageGating'
import GalleryManager from '@/components/dashboard/GalleryManager'
import LockedOverlay from './ui/LockedOverlay'

const InvitationRenderer = dynamic(() => import('@/components/renderer/InvitationRenderer'), { ssr: false })

import OpeningForm from './forms/OpeningForm'
import LoadingForm from './forms/LoadingForm'
import MusicForm from './forms/MusicForm'
import QuoteForm from './forms/QuoteForm'
import BasicInfoForm from './forms/BasicInfoForm'
import EventDetailsForm from './forms/EventDetailsForm'
import GiftForm from './forms/GiftForm'
import StoryForm from './forms/StoryForm'
import VideoForm from './forms/VideoForm'
import LivestreamForm from './forms/LivestreamForm'
import IGStoryForm from './forms/IGStoryForm'
import QRCodeForm from './forms/QRCodeForm'
import GiftRegistryForm from './forms/GiftRegistryForm'
import ColorPaletteForm from './forms/ColorPaletteForm'
import InfoCard from './ui/InfoCard'
import FormField from './ui/FormField'
import { StudioInput, StudioTextarea } from './ui/StudioInput'
import SectionCard from './ui/SectionCard'
import SectionAppearanceControls from './SectionAppearanceControls'

interface Props {
  invitation: Invitation
  template: TemplateRecord
  onSaved: (inv: Invitation) => void
  isAdmin?: boolean
}

function initData(inv: Invitation): NewInvitationData {
  const d = inv.data as unknown as NewInvitationData
  return {
    groom_name: d.groom_name ?? '',
    bride_name: d.bride_name ?? '',
    groom_nickname: d.groom_nickname ?? '',
    bride_nickname: d.bride_nickname ?? '',
    groom_parents: d.groom_parents ?? '',
    bride_parents: d.bride_parents ?? '',
    groom_father: d.groom_father ?? '',
    groom_mother: d.groom_mother ?? '',
    bride_father: d.bride_father ?? '',
    bride_mother: d.bride_mother ?? '',
    tagline: d.tagline ?? '',
    groom_photo_url: d.groom_photo_url ?? '',
    bride_photo_url: d.bride_photo_url ?? '',
    groom_bio: d.groom_bio ?? '',
    bride_bio: d.bride_bio ?? '',
    couple_photo_url: d.couple_photo_url ?? '',
    primary_color: d.primary_color ?? '#2c4a34',
    accent_color: d.accent_color ?? '#c9a961',
    text_color: d.text_color ?? '#1a1a1a',
    background_color: d.background_color ?? '#fefdf8',
    opening_type: d.opening_type ?? 'fade-reveal',
    opening_greeting: d.opening_greeting ?? 'Assalamualaikum Warahmatullahi Wabarakatuh',
    opening_subtitle: d.opening_subtitle ?? 'Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami.',
    opening_groom_name: d.opening_groom_name ?? '',
    opening_bride_name: d.opening_bride_name ?? '',
    opening_name_gap: d.opening_name_gap,
    music_url: d.music_url ?? '',
    music_title: d.music_title ?? '',
    quote_arabic: d.quote_arabic ?? '',
    quote_translation: d.quote_translation ?? '',
    quote_source: d.quote_source ?? '',
    akad: d.akad ?? { date: '', time: '08:00', venue_name: '', venue_address: '' },
    resepsi: d.resepsi ?? { date: '', time: '11:00', venue_name: '', venue_address: '' },
    story_title: d.story_title ?? '',
    story_text: d.story_text ?? '',
    story_chapters: d.story_chapters ?? [],
    story_timeline: d.story_timeline ?? [],
    gift_accounts: d.gift_accounts ?? [],
    gallery_photos: d.gallery_photos ?? [],
    closing_text: d.closing_text ?? '',
    thank_you_message: d.thank_you_message ?? '',
    hero_video_url: '',
    livestream_url: d.livestream_url ?? '',
    video_embed_url: d.video_embed_url ?? '',
    video_caption: d.video_caption ?? '',
    section_decoration_overrides: d.section_decoration_overrides ?? {},
    section_background_overrides: d.section_background_overrides ?? {},
    section_transition_overrides: d.section_transition_overrides ?? {},
  }
}

interface NavItem { id: string; label: string; icon: React.ElementType; locked?: boolean; requiredTier?: string; group: string; required?: boolean }
interface NavGroup { label: string; items: NavItem[] }

const NAV_SECTION_TYPE: Record<string, string> = {
  info: 'profiles', acara: 'events', cerita: 'story', galeri: 'gallery',
  hadiah: 'gift', quote: 'quote', penutup: 'closing', video: 'video',
  livestream: 'livestream', ig_story: 'ig-story', qrcode: 'qrcode',
  gift_registry: 'gift-registry', musik: 'wishes',
}

function buildNavGroups(
  gating: { isSectionAllowed: (id: string) => boolean; getRequiredTier: (id: string) => string | undefined },
  templateSections: { type: string; enabled: boolean }[],
): { groups: NavGroup[]; sections: NavItem[] } {
  const enabledTypes = new Set(templateSections.filter(s => s.enabled).map(s => s.type))

  function item(id: string, label: string, icon: React.ElementType, groupLabel: string, gateKey?: string, required = false): NavItem | null {
    const sectionType = NAV_SECTION_TYPE[id]
    if (sectionType && !enabledTypes.has(sectionType)) return null
    const isLocked = gateKey ? !gating.isSectionAllowed(gateKey) : false
    return { id, label, icon, locked: isLocked, requiredTier: isLocked ? gating.getRequiredTier(gateKey!) : undefined, group: groupLabel, required }
  }

  // Urutan mengikuti alur pengisian yang logis: isi data dasar dulu,
  // baru atur tampilan, lalu cerita/media, interaksi tamu, dan fitur lanjutan.
  const allGroups: { label: string; rawItems: (NavItem | null)[] }[] = [
    {
      label: 'Info Dasar',
      rawItems: [
        item('info', 'Mempelai', User, 'Info Dasar', undefined, true),
        item('acara', 'Acara', Calendar, 'Info Dasar', undefined, true),
      ],
    },
    {
      label: 'Tampilan',
      rawItems: [
        item('warna', 'Tema Warna', Palette, 'Tampilan'),
        item('opening', 'Pembuka', Sparkles, 'Tampilan'),
        item('loading', 'Loading', Loader2, 'Tampilan'),
      ],
    },
    {
      label: 'Cerita & Media',
      rawItems: [
        item('quote', 'Quote & Doa', Quote, 'Cerita & Media'),
        item('cerita', 'Cerita', BookOpen, 'Cerita & Media', 'cerita'),
        item('galeri', 'Galeri', Image, 'Cerita & Media', 'galeri'),
        item('musik', 'Musik', Music, 'Cerita & Media', 'musik'),
        item('video', 'Video Pre-Wedding', Video, 'Cerita & Media', 'video'),
      ],
    },
    {
      label: 'Interaksi Tamu',
      rawItems: [
        item('hadiah', 'Hadiah', Gift, 'Interaksi Tamu', 'hadiah'),
        item('gift_registry', 'Gift Registry', ShoppingBag, 'Interaksi Tamu', 'gift_registry'),
        item('penutup', 'Penutup', FileText, 'Interaksi Tamu'),
      ],
    },
    {
      label: 'Fitur Lanjutan',
      rawItems: [
        item('livestream', 'Live Streaming', Radio, 'Fitur Lanjutan', 'livestream'),
        item('ig_story', 'IG Story', Instagram, 'Fitur Lanjutan', 'ig_story'),
        item('qrcode', 'QR Code', QrCode, 'Fitur Lanjutan', 'qrcode'),
      ],
    },
  ]

  const groups: NavGroup[] = allGroups
    .map(g => ({ label: g.label, items: g.rawItems.filter((i): i is NavItem => i !== null) }))
    .filter(g => g.items.length > 0)

  return { groups, sections: groups.flatMap(g => g.items) }
}

/* ─── Draggable Section Item ─── */

function DraggableSectionItem({ section, active, onClick }: { section: NavItem; active: boolean; onClick: () => void }) {
  const controls = useDragControls()
  const SIcon = section.icon

  return (
    <Reorder.Item
      value={section.id}
      dragListener={false}
      dragControls={controls}
      className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 cursor-pointer transition-colors group relative overflow-hidden ${
        active ? 'bg-forest text-chalk' : `${section.locked ? 'text-smoke' : 'text-concrete'} hover:bg-mist`
      }`}
    >
      <div
        className={`shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded ${active ? 'text-gold/60' : 'text-smoke'}`}
        onPointerDown={(e) => controls.start(e)}
      >
        <GripVertical size={14} />
      </div>
      <button onClick={onClick} className="flex items-center gap-2.5 flex-1 min-w-0 text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40">
        <div className={`relative w-7 h-7 flex items-center justify-center shrink-0 rounded-[7px] ${active ? 'bg-gold/15' : 'bg-mist'}`}>
          <SIcon size={14} strokeWidth={active ? 2.2 : 1.8} className={active ? 'text-gold' : section.locked ? 'text-smoke' : 'text-ash'} />
          {section.locked && !active && (
            <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 flex items-center justify-center">
              <Lock size={7} className="text-white" />
            </div>
          )}
        </div>
        <span className={`text-ui-sm truncate ${active ? 'font-semibold' : 'font-medium'}`}>
          {section.label}
        </span>
      </button>
    </Reorder.Item>
  )
}

/* ─── Static Section Item ─── */

function StaticSectionItem({ section, active, onClick }: { section: NavItem; active: boolean; onClick: () => void }) {
  const SIcon = section.icon
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors text-left group relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 ${
        active ? 'bg-forest text-chalk' : `${section.locked ? 'text-smoke' : 'text-concrete'} hover:bg-mist`
      }`}
    >
      <div className={`relative w-7 h-7 flex items-center justify-center shrink-0 rounded-[7px] ${active ? 'bg-gold/15' : 'bg-mist'}`}>
        <SIcon size={14} strokeWidth={active ? 2.2 : 1.8} className={active ? 'text-gold' : section.locked ? 'text-smoke' : 'text-ash'} />
        {section.locked && !active && (
          <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 flex items-center justify-center">
            <Lock size={7} className="text-white" />
          </div>
        )}
      </div>
      <span className={`text-ui-sm truncate flex-1 ${active ? 'font-semibold' : 'font-medium'}`}>
        {section.label}
      </span>
      {section.required && !section.locked && (
        <span className={`w-[5px] h-[5px] rounded-full shrink-0 ml-auto ${active ? 'bg-gold' : 'bg-gold-dark'}`} title="Wajib diisi" />
      )}
      {section.locked && section.requiredTier && (
        <span className="text-ui-2xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md shrink-0">
          {section.requiredTier}
        </span>
      )}
    </button>
  )
}

const SECTION_TYPE_FEATURE: Record<string, keyof TierFeatures> = {
  hero: 'hero', profiles: 'profiles', events: 'events', quote: 'quote',
  countdown: 'countdown', gallery: 'gallery', rsvp: 'rsvp', wishes: 'wishes',
  story: 'story', video: 'video', gift: 'gift', 'gift-registry': 'gift_registry',
  livestream: 'livestream', 'ig-story': 'ig_story', qrcode: 'qrcode', closing: 'closing',
}

export default function InvitationStudio({ invitation, template, onSaved, isAdmin }: Props) {
  const [data, setData] = useState<NewInvitationData>(() => initData(invitation))
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [showPreview, setShowPreview] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('info')
  const [previewKey, setPreviewKey] = useState(0)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [reorderMode, setReorderMode] = useState(false)
  const [sectionOrder, setSectionOrder] = useState<string[]>([])

  const [debouncedData, setDebouncedData] = useState(data)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    debounceTimer.current = setTimeout(() => setDebouncedData(data), 600)
    return () => clearTimeout(debounceTimer.current)
  }, [data])

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const completeness = calculateCompleteness(data)
  const gating = usePackageGating(isAdmin ? 'eksklusif' : (invitation as unknown as Record<string, unknown>).package_tier as PackageTier | undefined)

  const { groups: NAV_GROUPS, sections: SECTIONS } = useMemo(() => buildNavGroups(gating, template.config.sections), [gating, template.config.sections])

  useEffect(() => {
    setSectionOrder(SECTIONS.map(s => s.id))
  }, [SECTIONS])

  const orderedSections = useMemo(() => {
    if (sectionOrder.length === 0) return SECTIONS
    return sectionOrder
      .map(id => SECTIONS.find(s => s.id === id))
      .filter((s): s is NavItem => s !== undefined)
  }, [sectionOrder, SECTIONS])

  const previewTemplate = useMemo<TemplateRecord>(() => ({
    ...template,
    config: {
      ...template.config,
      opening: {
        ...template.config.opening,
        type: (data.opening_type || template.config.opening.type) as OpeningType,
        subtitle: data.opening_greeting || template.config.opening.subtitle,
        invitation_text: data.opening_subtitle || template.config.opening.invitation_text,
      },
      loading: {
        ...template.config.loading,
        ...(data.loading_config ?? {}),
      },
      sections: template.config.sections.filter(s => {
        const featureKey = SECTION_TYPE_FEATURE[s.type]
        if (!featureKey) return true
        return !!gating.features[featureKey]
      }),
    },
  }), [template, data.opening_type, data.opening_greeting, data.opening_subtitle, data.loading_config, gating.features])

  useEffect(() => {
    setPreviewKey(k => k + 1)
  }, [data.opening_type, data.loading_config])

  const scheduleSave = useCallback(
    (updatedData: NewInvitationData) => {
      clearTimeout(timer.current)
      setSaveStatus('saving')
      timer.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/invitations/${invitation.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: updatedData }),
          })
          if (!res.ok) throw new Error('Save failed')
          const { invitation: updated } = await res.json()
          onSaved(updated)
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
        } catch {
          toast.error('Gagal menyimpan perubahan')
          setSaveStatus('idle')
        }
      }, 800)
    },
    [invitation.id, onSaved]
  )

  function updateData(patch: Partial<NewInvitationData>) {
    const updated = { ...data, ...patch }
    setData(updated)
    scheduleSave(updated)
  }

  function renderActiveForm() {
    switch (activeSection) {
      case 'info': return (
        <BasicInfoForm
          groomName={data.groom_name} brideName={data.bride_name}
          groomNickname={data.groom_nickname} brideNickname={data.bride_nickname}
          groomFather={data.groom_father} groomMother={data.groom_mother}
          brideFather={data.bride_father} brideMother={data.bride_mother}
          couplePhotoUrl={data.couple_photo_url} tagline={data.tagline}
          groomPhotoUrl={data.groom_photo_url} bridePhotoUrl={data.bride_photo_url}
          groomBio={data.groom_bio} brideBio={data.bride_bio}
          onGroomNameChange={(val) => updateData({ groom_name: val })}
          onBrideNameChange={(val) => updateData({ bride_name: val })}
          onGroomNicknameChange={(val) => updateData({ groom_nickname: val })}
          onBrideNicknameChange={(val) => updateData({ bride_nickname: val })}
          onGroomFatherChange={(val) => updateData({ groom_father: val })}
          onGroomMotherChange={(val) => updateData({ groom_mother: val })}
          onBrideFatherChange={(val) => updateData({ bride_father: val })}
          onBrideMotherChange={(val) => updateData({ bride_mother: val })}
          onCouplePhotoChange={(url) => updateData({ couple_photo_url: url })}
          onTaglineChange={(val) => updateData({ tagline: val })}
          onGroomPhotoChange={(url) => updateData({ groom_photo_url: url })}
          onBridePhotoChange={(url) => updateData({ bride_photo_url: url })}
          onGroomBioChange={(val) => updateData({ groom_bio: val })}
          onBrideBioChange={(val) => updateData({ bride_bio: val })}
        />
      )
      case 'acara': return (
        <EventDetailsForm
          akad={data.akad} resepsi={data.resepsi}
          onAkadChange={(patch) => updateData({ akad: { ...(data.akad ?? { date: '', time: '', venue_name: '', venue_address: '' }), ...patch } as NewInvitationData['akad'] })}
          onResepsiChange={(patch) => updateData({ resepsi: { ...(data.resepsi ?? { date: '', time: '', venue_name: '', venue_address: '' }), ...patch } as NewInvitationData['resepsi'] })}
        />
      )
      case 'opening': return (
        <OpeningForm
          openingType={(data.opening_type as OpeningType) || 'fade-reveal'}
          openingGreeting={data.opening_greeting || ''} openingSubtitle={data.opening_subtitle || ''}
          openingGroomName={data.opening_groom_name || ''} openingBrideName={data.opening_bride_name || ''}
          groomName={data.groom_name} brideName={data.bride_name}
          nameGap={data.opening_name_gap ?? template.config.opening.couple_name_gap ?? 3}
          onOpeningTypeChange={(val) => updateData({ opening_type: val })}
          onOpeningGreetingChange={(val) => updateData({ opening_greeting: val })}
          onOpeningSubtitleChange={(val) => updateData({ opening_subtitle: val })}
          onOpeningGroomNameChange={(val) => updateData({ opening_groom_name: val })}
          onOpeningBrideNameChange={(val) => updateData({ opening_bride_name: val })}
          onNameGapChange={(val) => updateData({ opening_name_gap: val })}
        />
      )
      case 'loading': return (
        <LoadingForm
          config={{ ...template.config.loading, ...(data.loading_config ?? {}) }}
          onChange={(cfg) => updateData({ loading_config: cfg })}
        />
      )
      case 'warna': return (
        <ColorPaletteForm
          primaryColor={data.primary_color ?? '#2c4a34'}
          accentColor={data.accent_color ?? '#c9a961'}
          textColor={data.text_color ?? '#1a1a1a'}
          backgroundColor={data.background_color ?? '#fefdf8'}
          onPrimaryColorChange={(color) => updateData({ primary_color: color })}
          onAccentColorChange={(color) => updateData({ accent_color: color })}
          onTextColorChange={(color) => updateData({ text_color: color })}
          onBackgroundColorChange={(color) => updateData({ background_color: color })}
          onPresetApply={(colors) => updateData({
            primary_color: colors.primary,
            accent_color: colors.accent,
            text_color: colors.text,
            background_color: colors.background,
          })}
        />
      )
      case 'musik': return (
        <MusicForm
          musicUrl={data.music_url || ''} musicTitle={data.music_title || ''}
          onMusicUrlChange={(val) => updateData({ music_url: val })}
          onMusicTitleChange={(val) => updateData({ music_title: val })}
        />
      )
      case 'quote': return (
        <QuoteForm
          quoteArabic={data.quote_arabic || ''} quoteTranslation={data.quote_translation || ''}
          quoteSource={data.quote_source || ''}
          onQuoteArabicChange={(val) => updateData({ quote_arabic: val })}
          onQuoteTranslationChange={(val) => updateData({ quote_translation: val })}
          onQuoteSourceChange={(val) => updateData({ quote_source: val })}
        />
      )
      case 'cerita': return (
        <StoryForm
          storyTitle={data.story_title ?? ''} storyText={data.story_text ?? ''}
          chapters={data.story_chapters ?? []}
          onStoryTitleChange={(val) => updateData({ story_title: val })}
          onStoryTextChange={(val) => updateData({ story_text: val })}
          onChaptersChange={(chapters) => updateData({ story_chapters: chapters })}
        />
      )
      case 'galeri': return <GalleryManager invitation={invitation} />
      case 'hadiah': return (
        <GiftForm accounts={data.gift_accounts ?? []} onAccountsChange={(accounts) => updateData({ gift_accounts: accounts })} />
      )
      case 'gift_registry': return (
        <GiftRegistryForm items={data.gift_registry ?? []} onItemsChange={(items) => updateData({ gift_registry: items })} />
      )
      case 'video': return (
        <VideoForm
          embedUrl={data.video_embed_url ?? ''} caption={data.video_caption ?? ''}
          onEmbedUrlChange={(val) => updateData({ video_embed_url: val })}
          onCaptionChange={(val) => updateData({ video_caption: val })}
        />
      )
      case 'livestream': return (
        <LivestreamForm url={data.livestream_url ?? ''} onUrlChange={(val) => updateData({ livestream_url: val })} />
      )
      case 'ig_story': return (
        <IGStoryForm imageUrl={data.ig_story_image_url ?? ''} onImageUrlChange={(val) => updateData({ ig_story_image_url: val })} />
      )
      case 'qrcode': return (
        <QRCodeForm
          targetUrl={data.qr_target_url ?? ''} label={data.qr_label ?? ''}
          onTargetUrlChange={(val) => updateData({ qr_target_url: val })}
          onLabelChange={(val) => updateData({ qr_label: val })}
        />
      )
      case 'penutup': return (
        <div className="space-y-3.5">
          <SectionCard title="Penutup" icon={BookOpen} description="Pesan penutup dan ucapan terima kasih (opsional)">
            <FormField label="Kalimat Penutup" hint="Ucapan terima kasih atau kalimat penutup undangan">
              <StudioTextarea rows={3} value={data.closing_text}
                onChange={(e) => updateData({ closing_text: e.target.value })}
                placeholder="Merupakan suatu kehormatan dan kebahagiaan bagi kami..." />
            </FormField>
            <FormField label="Pesan Terima Kasih" hint="Pesan singkat terima kasih untuk para tamu">
              <StudioInput type="text" value={data.thank_you_message}
                onChange={(e) => updateData({ thank_you_message: e.target.value })}
                placeholder="Terima kasih atas doa dan kehadiran Anda" />
            </FormField>
          </SectionCard>
          <InfoCard title="Konfirmasi Kehadiran" icon={CheckSquare}
            message="Form RSVP otomatis tampil di undangan. Lihat daftar tamu yang sudah konfirmasi di tab RSVP."
            actionText="Lihat Daftar RSVP" actionHref="#" />
          <InfoCard title="Buku Ucapan" icon={MessageSquare}
            message="Buku ucapan otomatis tersedia di undangan. Tamu bisa menulis ucapan dan doa untuk Anda berdua." />
        </div>
      )
      default: return null
    }
  }

    const activeItem = SECTIONS.find(s => s.id === activeSection)
    const ActiveIcon = activeItem?.icon ?? Sparkles

    const sectionType = NAV_SECTION_TYPE[activeSection]
    // Section template yang cocok dengan nav item aktif (untuk kontrol Latar Belakang & Transisi).
    // Hanya nav item konten yang punya padanan section render; item level-template (warna/opening/loading) tidak.
    const appearanceSection = sectionType ? template.config.sections.find(s => s.type === sectionType) : undefined
    const previewPhase: 'opening' | 'loading' | 'main' =
      activeSection === 'loading' ? 'loading'
      : sectionType ? 'main'
      : 'opening'
    const previewScrollTo = sectionType
      ? template.config.sections.find(s => s.type === sectionType)?.id
      : undefined

    const renderPhone = (pw: number) => {
      const pad = 6
      const sw = pw - pad * 2
      const sh = Math.round(sw * 2.17)
      const screenR = sw * 0.1
      const z = sw / 390
      return (
        <div className="relative bg-[#1a1a1a] shadow-2xl" style={{ width: pw, borderRadius: pw * 0.12, padding: pad }}>
          <div className="absolute left-1/2 -translate-x-1/2 bg-[#1a1a1a] rounded-full z-20" style={{ top: pad + 4, width: pw * 0.28, height: 14, borderRadius: 10 }} />
          <div style={{ width: sw, height: sh, borderRadius: screenR, position: 'relative', overflow: 'hidden', background: '#000' }}>
            <div style={{ width: 390, height: Math.round(sh / z), zoom: z, position: 'absolute', top: 0, left: 0, overflow: 'hidden' }}>
              <div style={{ width: 390, height: Math.round(sh / z), position: 'relative' }}>
                <InvitationRenderer
                  key={`preview-${previewKey}-${activeSection}`}
                  invitationId={`preview-${invitation.id}`}
                  invitationData={debouncedData}
                  template={previewTemplate}
                  contained
                  noMusic
                  previewGuestName="Bapak & Ibu"
                  initialPhase={previewPhase}
                  scrollToSection={previewScrollTo}
                />
              </div>
            </div>
          </div>
          <div className="mx-auto mt-1 rounded-full bg-concrete" style={{ width: pw * 0.3, height: 3 }} />
        </div>
      )
    }

    return (
      <div className="flex h-full">
        {/* Left: Section navigation sidebar */}
        <div className="hidden md:flex flex-col shrink-0 overflow-hidden w-[210px] bg-ivory border-r border-hairline">
          {/* Sidebar header */}
          <div className="shrink-0 px-3.5 pt-3.5 pb-2 border-b border-hairline">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-ui-xs font-bold uppercase tracking-wider text-carbon">Konten</h3>
              <button
                onClick={() => setReorderMode(!reorderMode)}
                aria-pressed={reorderMode}
                className={`flex items-center gap-1 text-ui-2xs font-semibold px-2 py-1 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 ${
                  reorderMode ? 'bg-forest text-chalk' : 'text-ash hover:bg-mist'
                }`}
                title={reorderMode ? 'Selesai menyusun' : 'Susun ulang section'}
              >
                <ArrowUpDown size={11} />
                {reorderMode ? 'Selesai' : 'Susun'}
              </button>
            </div>
            {/* Progress bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-hairline">
                <motion.div
                  className={`h-full rounded-full ${completeness.percentage === 100 ? 'bg-forest' : 'bg-gold-dark'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${completeness.percentage}%` }}
                  transition={{ duration: 0.5, ease: EASE }}
                />
              </div>
              <span className="text-ui-2xs font-bold tabular-nums text-concrete">{completeness.percentage}%</span>
            </div>
            {completeness.missingRequired.length > 0 && (
              <p className="text-ui-2xs text-amber-600 mt-1.5 leading-tight">
                Belum lengkap: {completeness.missingRequired.join(', ')}
              </p>
            )}
          </div>

          {/* Section list */}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            <div className="p-2">
              <AnimatePresence mode="wait">
                {reorderMode ? (
                  <motion.div
                    key="reorder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Reorder.Group
                      axis="y"
                      values={sectionOrder}
                      onReorder={setSectionOrder}
                      className="space-y-0.5"
                    >
                      {orderedSections.map(section => (
                        <DraggableSectionItem
                          key={section.id}
                          section={section}
                          active={activeSection === section.id}
                          onClick={() => setActiveSection(section.id)}
                        />
                      ))}
                    </Reorder.Group>
                  </motion.div>
                ) : (
                  <motion.div
                    key="static"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-3"
                  >
                    {NAV_GROUPS.map((group) => (
                      <div key={group.label}>
                        <div className="h-px bg-hairline mb-1" />
                        <p className="text-ui-eyebrow text-ash select-none px-3.5 pt-2.5 pb-1">
                          {group.label}
                        </p>
                        <div className="space-y-0.5">
                          {group.items.map(section => (
                            <StaticSectionItem
                              key={section.id}
                              section={section}
                              active={activeSection === section.id}
                              onClick={() => setActiveSection(section.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile: horizontal section nav */}
        <div className="md:hidden fixed bottom-[52px] left-0 right-0 z-30 backdrop-blur-xl bg-ivory/95 border-t border-hairline">
          <div className="flex overflow-x-auto px-2 py-1.5 gap-0.5 scrollbar-hide">
            {SECTIONS.map(s => {
              const active = activeSection === s.id
              const SIcon = s.icon
              return (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`shrink-0 flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 ${
                    active ? 'bg-forest text-chalk' : s.locked ? 'text-smoke' : 'text-ash'
                  }`}
                >
                  <SIcon size={14} strokeWidth={active ? 2 : 1.5} className={active ? 'text-gold' : ''} />
                  <span className="text-ui-2xs font-medium">{s.label}</span>
                  {s.locked && !active && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 flex items-center justify-center">
                      <Lock size={6} className="text-white" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Center: form content */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          {/* Section header bar */}
          <div className="shrink-0 backdrop-blur-xl px-4 sm:px-5 py-2.5 flex items-center gap-3 bg-ivory/92 border-b border-hairline">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeItem?.locked ? 'bg-amber-50' : 'bg-forest-50'}`}>
              <ActiveIcon size={15} strokeWidth={2} className={activeItem?.locked ? 'text-amber-600' : 'text-forest'} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-ui-base font-bold text-graphite">{activeItem?.label ?? 'Editor'}</h2>
                <AnimatePresence mode="wait">
                  {saveStatus === 'saving' && (
                    <motion.span
                      key="saving"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="inline-flex items-center gap-1 text-ui-2xs text-concrete bg-mist px-2 py-0.5 rounded-full"
                    >
                      <Loader2 size={9} className="animate-spin" /> Menyimpan…
                    </motion.span>
                  )}
                  {saveStatus === 'saved' && (
                    <motion.span
                      key="saved"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="inline-flex items-center gap-1 text-ui-2xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full"
                    >
                      <Check size={9} /> Tersimpan
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              {activeItem?.locked && activeItem.requiredTier && (
                <p className="text-ui-2xs text-amber-600 font-medium mt-0.5">
                  Tersedia mulai paket {activeItem.requiredTier}
                </p>
              )}
            </div>

            <button
              onClick={() => setShowPreview(true)}
              className="xl:hidden flex items-center gap-1.5 text-ui-xs font-semibold px-3 py-2 rounded-button transition-colors bg-forest text-chalk hover:bg-forest-deep shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2"
            >
              <Eye size={13} /> Preview
            </button>
          </div>

          {/* Active form */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-ivory" style={{ scrollbarWidth: 'thin' }}>
            <div className="px-4 sm:px-5 py-4 max-w-xl mx-auto">
              {/* Completeness indicator (mobile, sidebar shows it on desktop) */}
              <div className="md:hidden mb-4 px-3.5 py-3 bg-chalk border border-hairline rounded-card shadow-card">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-ui-sm font-medium text-concrete">Kelengkapan Undangan</span>
                  <span className="text-ui-sm font-bold text-graphite">{completeness.percentage}%</span>
                </div>
                <div className="h-1.5 bg-hairline rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${completeness.percentage === 100 ? 'bg-forest' : 'bg-gold-dark'}`} style={{ width: `${completeness.percentage}%` }} />
                </div>
                {completeness.missingRequired.length > 0 && (
                  <p className="text-ui-2xs text-amber-600 mt-1.5">Belum lengkap: {completeness.missingRequired.join(', ')}</p>
                )}
              </div>
              <div className="relative">
                {renderActiveForm()}
                {appearanceSection && (
                  <div className="mt-3.5">
                    <SectionAppearanceControls
                      section={appearanceSection}
                      data={data}
                      onUpdate={updateData}
                      primaryColor={data.primary_color ?? '#2c4a34'}
                    />
                  </div>
                )}
                {activeItem?.locked && activeItem.requiredTier && (
                  <LockedOverlay requiredTier={activeItem.requiredTier} />
                )}
              </div>
              <div className="h-16 md:h-4" />
            </div>
          </div>
        </div>

        {/* Right: phone preview panel (desktop xl+) */}
        <div className="hidden xl:flex flex-col shrink-0 border-l border-hairline bg-ivory" style={{ width: 360 }}>
          <div className="flex items-center justify-between px-3 pt-2.5 pb-2 shrink-0">
            <p className="text-ui-eyebrow text-concrete">Live Preview</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPreviewKey(k => k + 1)} aria-label="Muat ulang preview" className="w-7 h-7 flex items-center justify-center rounded-lg text-concrete hover:text-forest-deep hover:bg-mist transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40" title="Refresh">
                <RefreshCw size={12} />
              </button>
              <button onClick={() => setShowFullscreen(true)} aria-label="Preview layar penuh" className="w-7 h-7 flex items-center justify-center rounded-lg text-concrete hover:text-forest-deep hover:bg-mist transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40" title="Fullscreen">
                <Maximize2 size={12} />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0 px-2 pb-2">
            {renderPhone(310)}
          </div>
        </div>

        {/* Mobile preview overlay */}
        {showPreview && !showFullscreen && (
          <div className="fixed inset-0 z-50 bg-forest-deep/90 backdrop-blur-sm flex flex-col">
            <div className="flex items-center justify-end px-4 py-3 shrink-0 gap-2">
              <button onClick={() => setPreviewKey(k => k + 1)} aria-label="Muat ulang preview" className="w-8 h-8 flex items-center justify-center text-chalk/50 hover:text-chalk hover:bg-chalk/10 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chalk/40" title="Refresh">
                <RefreshCw size={14} />
              </button>
              <a href={`/invitation/${invitation.slug}`} target="_blank" rel="noopener noreferrer"
                aria-label="Buka undangan di tab baru"
                className="w-8 h-8 flex items-center justify-center text-chalk/50 hover:text-chalk hover:bg-chalk/10 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chalk/40" title="Buka di tab baru">
                <ExternalLink size={14} />
              </a>
              <button onClick={() => setShowPreview(false)} aria-label="Tutup preview" className="w-8 h-8 flex items-center justify-center text-chalk/50 hover:text-chalk hover:bg-chalk/10 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chalk/40">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
              {renderPhone(Math.min(380, typeof window !== 'undefined' ? window.innerWidth - 48 : 380))}
            </div>
          </div>
        )}

        {/* Fullscreen preview */}
        {showFullscreen && (
          <div className="fixed inset-0 z-[100] bg-forest-deep flex items-center justify-center">
            <button
              onClick={() => setShowFullscreen(false)}
              aria-label="Tutup preview layar penuh"
              className="absolute top-4 right-4 z-[110] bg-chalk/15 hover:bg-chalk/25 text-chalk rounded-full p-2.5 transition-colors backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chalk/40"
            >
              <X className="w-5 h-5" />
            </button>
            <div style={{
              width: '100%',
              maxWidth: 430,
              height: '100dvh',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 0 80px rgba(0,0,0,0.5)',
            }}>
              <InvitationRenderer
                key={`fs-${previewKey}`}
                invitationId={`fullscreen-${invitation.id}`}
                invitationData={debouncedData}
                template={previewTemplate}
                contained
                previewGuestName="Bapak & Ibu"
              />
            </div>
          </div>
        )}
      </div>
    )
}
