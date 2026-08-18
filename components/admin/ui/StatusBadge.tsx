'use client'

export type TemplateStatus = 'draft' | 'active' | 'archived'

const MAP: Record<TemplateStatus, { label: string; dot: string; chip: string; hint: string }> = {
  active:   { label: 'Terbit', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-100', hint: 'Tampil di galeri publik dan bisa dipilih user' },
  draft:    { label: 'Draft',  dot: 'bg-amber-400',   chip: 'bg-amber-50 text-amber-700 border-amber-100',       hint: 'Hanya terlihat di panel admin' },
  archived: { label: 'Arsip',  dot: 'bg-gray-300',    chip: 'bg-gray-50 text-gray-400 border-gray-100',           hint: 'Disembunyikan, tapi undangan lama tetap hidup' },
}

export function statusMeta(status: string) {
  return MAP[(status as TemplateStatus)] ?? MAP.draft
}

/** Label status template. "Aktif" diganti "Terbit" karena yang dimaksud admin
 *  selalu "sudah terlihat pelanggan", bukan "record ini enabled". */
export default function StatusBadge({ status, size = 'md' }: { status: string; size?: 'sm' | 'md' }) {
  const m = statusMeta(status)
  const pad = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1'
  return (
    <span title={m.hint} className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${m.chip} ${pad}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}
