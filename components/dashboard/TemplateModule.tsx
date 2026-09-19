'use client'

import { useState, useEffect } from 'react'
import { Palette, Loader2 } from 'lucide-react'
import type { Invitation, PriceTier } from '@/lib/types'
import { LEGACY_TEMPLATE_IDS } from '@/lib/types'
import InvitationStudio from '../studio/InvitationStudio'
import InvitationWizard from './InvitationWizard'

export interface TemplateInfo {
  id: string
  name: string
  category: string
  thumbnailUrl: string
  demoUrl: string
  isNew: boolean
}

interface Props {
  invitation: Invitation
  allTemplates: TemplateInfo[]
  onInvitationUpdate: (inv: Invitation) => void
  isAdmin?: boolean
  priceTiers?: PriceTier[]
}

export default function TemplateModule({ invitation, allTemplates, onInvitationUpdate, isAdmin, priceTiers }: Props) {
  const isLegacy = (LEGACY_TEMPLATE_IDS as string[]).includes(invitation.template_id)

  const [templateRecord, setTemplateRecord] = useState<import('@/lib/types').TemplateRecord | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(!isLegacy)

  useEffect(() => {
    if (isLegacy) return
    const loaders: Record<string, () => Promise<{ default: import('@/lib/types').TemplateRecord }>> = {
      'javanese-gold': () => import('@/lib/template-configs/javanese-gold'),
      'rose-garden': () => import('@/lib/template-configs/rose-garden'),
      'midnight-luxe': () => import('@/lib/template-configs/midnight-luxe'),
    }
    const loader = loaders[invitation.template_id]
    if (!loader) { setLoadingTemplate(false); return }
    loader()
      .then(m => { setTemplateRecord(m.default); setLoadingTemplate(false) })
      .catch(() => setLoadingTemplate(false))
  }, [invitation.template_id, isLegacy])

  if (isLegacy) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8">
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Palette size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-800">Edit Undangan</p>
                  <p className="text-[11px] text-stone-400">Template klasik, semua pengaturan di satu tempat</p>
                </div>
                <span className="ml-auto text-[10px] bg-stone-100 text-stone-500 px-2.5 py-1 rounded-full font-medium">
                  Template Lama
                </span>
              </div>
            </div>
            <div className="p-5">
              <InvitationWizard invitation={invitation} userId="" onSaved={onInvitationUpdate} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loadingTemplate) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="inline-flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
            <Loader2 size={18} className="text-amber-500 animate-spin" />
          </div>
          <p className="text-sm text-stone-400">Memuat editor undangan...</p>
        </div>
      </div>
    )
  }

  if (!templateRecord) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center max-w-sm">
          <p className="text-sm text-amber-700 font-medium">Template config tidak ditemukan.</p>
          <p className="text-xs text-amber-600 mt-1">Silakan hubungi admin untuk bantuan.</p>
        </div>
      </div>
    )
  }

  return (
    <InvitationStudio
      invitation={invitation}
      template={templateRecord}
      onSaved={onInvitationUpdate}
      isAdmin={isAdmin}
      priceTiers={priceTiers}
    />
  )
}
