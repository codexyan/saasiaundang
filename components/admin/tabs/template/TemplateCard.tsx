'use client'

import { useEffect, useRef, useState } from 'react'
import {
  MoreVertical, Pencil, Settings2, Copy, ExternalLink, Trash2,
  Archive, Rocket, EyeOff, Layers, Users, CircleDot,
} from 'lucide-react'
import type { TemplateRecord } from '@/lib/types'
import { BUILT_IN_TEMPLATE_IDS } from '@/lib/built-in-data'
import StatusBadge from '@/components/admin/ui/StatusBadge'
import TemplateThumb from './TemplateThumb'
import { drafValid } from '@/lib/template-draft'

export interface TemplateCardActions {
  onEditDesign: (rec: TemplateRecord) => void
  onOpenSettings: (rec: TemplateRecord) => void
  onDuplicate: (rec: TemplateRecord) => void
  onPublish: (rec: TemplateRecord) => void
  onUnpublish: (rec: TemplateRecord) => void
  onArchive: (rec: TemplateRecord) => void
  onDelete: (rec: TemplateRecord) => void
}

interface Props extends TemplateCardActions {
  record: TemplateRecord
  categoryLabel?: string
  tierLabel?: string | null
  busy?: boolean
}

function MenuItem({ icon: Icon, label, onClick, tone = 'default' }: {
  icon: React.ElementType; label: string; onClick: () => void; tone?: 'default' | 'danger'
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-left transition-colors ${
        tone === 'danger'
          ? 'text-red-600 hover:bg-red-50'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {label}
    </button>
  )
}

export default function TemplateCard({
  record, categoryLabel, tierLabel, busy,
  onEditDesign, onOpenSettings, onDuplicate, onPublish, onUnpublish, onArchive, onDelete,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const working = drafValid(record.draft_config) ? record.draft_config : record.config
  const sectionCount = (working?.sections ?? []).filter(s => s.enabled).length
  // Lencana "Belum terbit" ikut bentuk draf, bukan sekadar kolomnya terisi.
  // Draf kosong peninggalan versi lama dulu membuat lencana ini berbohong.
  const hasPendingDraft = drafValid(record.draft_config)
  const isBuiltIn = (BUILT_IN_TEMPLATE_IDS as readonly string[]).includes(record.id)
  const inUse = record.usage_count > 0

  function run(fn: () => void) { setMenuOpen(false); fn() }

  return (
    <div
      ref={wrapRef}
      // TANPA overflow-hidden di akar: itulah yang memotong menu aksi.
      // Pembulatan sudut dipindah ke elemen sampul di dalamnya. z-30 saat menu
      // terbuka supaya menunya tidak tertimpa kartu berikutnya dalam grid.
      className={`group relative bg-white rounded-2xl border border-gray-200/70 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ${menuOpen ? 'z-30' : ''} ${busy ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {/* Sampul — klik di mana pun membuka editor desain, aksi paling sering */}
      <button
        onClick={() => onEditDesign(record)}
        className="block w-full aspect-[9/16] relative text-left overflow-hidden rounded-t-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-inset"
        aria-label={`Edit desain ${record.name}`}
      >
        <TemplateThumb record={record} />
        <div className="absolute inset-0 bg-gray-900/0 group-hover:bg-gray-900/25 transition-colors flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 text-white text-[11px] font-semibold bg-gray-900/70 px-3.5 py-2 rounded-xl backdrop-blur-sm opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all">
            <Pencil className="w-3.5 h-3.5" /> Edit Desain
          </span>
        </div>
      </button>

      <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5 pointer-events-none">
        <StatusBadge status={record.status} size="sm" />
        {hasPendingDraft && (
          <span
            title="Ada perubahan desain yang belum diterbitkan — pengunjung masih melihat versi lama"
            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100"
          >
            <CircleDot className="w-2.5 h-2.5" /> Belum terbit
          </span>
        )}
      </div>

      {/* Menu aksi */}
      <div className="absolute top-2 right-2">
        <button
          onClick={() => setMenuOpen(o => !o)}
          aria-label={`Aksi untuk ${record.name}`}
          aria-expanded={menuOpen}
          className="p-1.5 rounded-lg bg-white/85 text-gray-500 hover:text-gray-900 hover:bg-white backdrop-blur-sm shadow-sm transition-colors"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-1 w-52 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-200/70 py-1 z-50 overflow-hidden">
            <MenuItem icon={Pencil} label="Edit desain" onClick={() => run(() => onEditDesign(record))} />
            <MenuItem icon={Settings2} label="Pengaturan & harga" onClick={() => run(() => onOpenSettings(record))} />
            <MenuItem icon={Copy} label="Duplikat" onClick={() => run(() => onDuplicate(record))} />
            <a
              href={`/demo/renderer?id=${record.id}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" /> Pratinjau seperti tamu
            </a>

            <div className="my-1 border-t border-gray-100" />

            {record.status === 'active' ? (
              <MenuItem icon={EyeOff} label="Tarik jadi draft" onClick={() => run(() => onUnpublish(record))} />
            ) : (
              <MenuItem icon={Rocket} label="Terbitkan" onClick={() => run(() => onPublish(record))} />
            )}
            {record.status !== 'archived' && (
              <MenuItem icon={Archive} label="Arsipkan" onClick={() => run(() => onArchive(record))} />
            )}

            {!isBuiltIn && (
              <>
                <div className="my-1 border-t border-gray-100" />
                <MenuItem
                  icon={Trash2}
                  tone="danger"
                  label={inUse ? `Hapus (dipakai ${record.usage_count})` : 'Hapus'}
                  onClick={() => run(() => onDelete(record))}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Keterangan */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="text-xs font-bold text-gray-900 truncate flex-1">{record.name}</h3>
          {tierLabel && (
            <span className="text-[9px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
              {tierLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
          {categoryLabel && <span className="capitalize truncate">{categoryLabel}</span>}
          {categoryLabel && <span className="w-0.5 h-0.5 rounded-full bg-gray-300 shrink-0" />}
          <span className="inline-flex items-center gap-1 shrink-0" title="Seksi aktif">
            <Layers className="w-3 h-3" />{sectionCount}
          </span>
          <span className="w-0.5 h-0.5 rounded-full bg-gray-300 shrink-0" />
          <span className="inline-flex items-center gap-1 shrink-0" title="Undangan yang memakai template ini">
            <Users className="w-3 h-3" />{record.usage_count}
          </span>
        </div>
      </div>
    </div>
  )
}
