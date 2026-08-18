'use client'

import { useEffect } from 'react'
import type { TemplateRecord, NewInvitationData, Wish, SectionConfig } from '@/lib/types'
import { mergeDecorationAssets } from '@/lib/decoration-utils'
import SectionRenderer from './SectionRenderer'
import { PreviewContext } from './PreviewContext'
import { ComponentStyleProvider } from './ComponentStyleContext'

interface Props {
  template: TemplateRecord
  data: NewInvitationData
  invitationId?: string
  initialWishes?: Wish[]
  /** Aktifkan preview mode: section beranimasi berulang saat scroll */
  isPreview?: boolean
  /** Section ID yang akan di-replay */
  replaySectionId?: string
  /** Increment untuk trigger ulang animasi section */
  replaySectionKey?: number
}

export default function InvitationPreview({
  template, data, invitationId = 'preview', initialWishes = [],
  isPreview, replaySectionId, replaySectionKey,
}: Props) {
  const { config } = template
  const { meta } = config

  useEffect(() => {
    const heading = meta.font.heading.replace(/ /g, '+')
    const body    = meta.font.body.replace(/ /g, '+')
    const id = `gf-preview-${heading}`
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id; link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${heading}:wght@400;700&family=${body}:ital,wght@0,300;0,400;0,600;1,400&display=swap`
    document.head.appendChild(link)
  }, [meta.font.heading, meta.font.body])

  const activeSections = [...config.sections]
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order)

  return (
    <PreviewContext.Provider value={{
      isPreview: !!isPreview,
      replaySectionId,
      replaySectionKey,
    }}>
      <ComponentStyleProvider value={meta.component_style}>
      <div style={{
        fontFamily: `'${meta.font.body}', serif`,
        backgroundColor: meta.color_scheme.primary,
        minHeight: '100%', width: '100%',
      }}>
        {activeSections.map(section => {
          const userAssets = data.section_decoration_overrides?.[section.id]
          const bgOverride = data.section_background_overrides?.[section.id]
          const trOverride = data.section_transition_overrides?.[section.id]
          const merged: SectionConfig = {
            ...section,
            ...(userAssets?.length ? { decoration_assets: mergeDecorationAssets(section.decoration_assets, userAssets) } : {}),
            ...(bgOverride ? { background: bgOverride } : {}),
            ...(trOverride?.in ? { transition_in: trOverride.in } : {}),
            ...(trOverride?.out ? { transition_out: trOverride.out } : {}),
          }
          return (
            <SectionRenderer
              key={`${section.id}-${section.style_variant ?? 'default'}`}
              sectionConfig={merged}
              invitationData={data}
              templateMeta={meta}
              invitationId={invitationId}
              // Komponen ini memang khusus pratinjau — tidak ada jalur live-nya.
              mode="preview"
              initialWishes={section.type === 'wishes' ? initialWishes : undefined}
            />
          )
        })}
      </div>
      </ComponentStyleProvider>
    </PreviewContext.Provider>
  )
}
