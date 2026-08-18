'use client'

import { ImageIcon } from 'lucide-react'
import type { SectionConfig, NewInvitationData, BackgroundConfig, TransitionType } from '@/lib/types'
import SectionCard from './ui/SectionCard'
import { StudioDivider } from './ui/StudioInput'
import SectionBackgroundControl from '@/components/controls/SectionBackgroundControl'
import SectionTransitionControl from '@/components/controls/SectionTransitionControl'

const STUDIO_ACCENT = '#1a3320'

interface Props {
  /** Section template (sumber default + id untuk key override) */
  section: SectionConfig
  data: NewInvitationData
  onUpdate: (patch: Partial<NewInvitationData>) => void
  /** Warna default color picker */
  primaryColor?: string
}

/**
 * Kontrol tampilan per-section untuk end-user di Studio: Latar Belakang + Animasi
 * Transisi. Menyimpan ke override level-undangan (section_*_overrides) keyed by
 * section.id, TIDAK menimpa template global. Kalau user tidak menyentuh apa pun,
 * section tetap pakai default dari template.
 */
export default function SectionAppearanceControls({ section, data, onUpdate, primaryColor = '#2c4a34' }: Props) {
  const bgOverride = data.section_background_overrides?.[section.id]
  const effectiveBg: BackgroundConfig = bgOverride ?? section.background

  const trOverride = data.section_transition_overrides?.[section.id]
  const effIn: TransitionType = trOverride?.in ?? section.transition_in
  const effOut: TransitionType = trOverride?.out ?? section.transition_out

  const setBg = (bg: BackgroundConfig) => {
    onUpdate({ section_background_overrides: { ...(data.section_background_overrides ?? {}), [section.id]: bg } })
  }

  const setTr = (patch: { in?: TransitionType; out?: TransitionType }) => {
    onUpdate({
      section_transition_overrides: {
        ...(data.section_transition_overrides ?? {}),
        [section.id]: { in: effIn, out: effOut, ...patch },
      },
    })
  }

  return (
    <SectionCard
      title="Tampilan Section"
      icon={ImageIcon}
      description="Latar belakang & animasi khusus section ini (opsional)"
    >
      <div className="space-y-2">
        <StudioDivider label="Latar Belakang" />
        <SectionBackgroundControl
          value={effectiveBg}
          onChange={setBg}
          defaultColor={primaryColor}
          accent={STUDIO_ACCENT}
          context="studio"
        />
      </div>

      <div className="space-y-2">
        <StudioDivider label="Animasi Transisi" />
        <SectionTransitionControl
          valueIn={effIn}
          valueOut={effOut}
          onChangeIn={t => setTr({ in: t })}
          onChangeOut={t => setTr({ out: t })}
          accent={STUDIO_ACCENT}
        />
      </div>
    </SectionCard>
  )
}
