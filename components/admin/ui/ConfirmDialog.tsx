'use client'

import { useEffect } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

export type ConfirmTone = 'danger' | 'warning' | 'neutral'

interface Props {
  open: boolean
  title: string
  message: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
  busy?: boolean
  icon?: React.ElementType
  onConfirm: () => void
  onCancel: () => void
}

const TONE: Record<ConfirmTone, { ring: string; iconBg: string; iconFg: string; btn: string }> = {
  danger:  { ring: 'bg-red-50',    iconBg: 'bg-red-100',    iconFg: 'text-red-600',    btn: 'bg-red-600 hover:bg-red-700' },
  warning: { ring: 'bg-amber-50',  iconBg: 'bg-amber-100',  iconFg: 'text-amber-600',  btn: 'bg-amber-500 hover:bg-amber-600' },
  neutral: { ring: 'bg-gray-50',   iconBg: 'bg-gray-100',   iconFg: 'text-gray-600',   btn: 'bg-gray-900 hover:bg-gray-800' },
}

/**
 * Dialog konfirmasi bersama.
 *
 * Menggantikan campuran `window.confirm()` (dipakai perpustakaan musik) dan
 * modal buatan sendiri per tab. `confirm()` bukan sekadar soal rasa: dialognya
 * memblokir seluruh thread, tidak bisa menampilkan konsekuensi yang perlu
 * dibaca ("3 lagu akan dipindahkan ke Lainnya"), dan di beberapa browser
 * bisa disembunyikan pengguna sehingga aksi berikutnya diam-diam gagal.
 */
export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Ya, lanjutkan', cancelLabel = 'Batal',
  tone = 'danger', busy = false, icon: Icon = AlertTriangle, onConfirm, onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null
  const t = TONE[tone]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm px-4">
      <div role="dialog" aria-modal="true" aria-label={title} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-6 pb-4 text-center">
          <div className={`w-12 h-12 rounded-2xl ${t.iconBg} flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-5 h-5 ${t.iconFg}`} />
          </div>
          <h3 className="font-bold text-gray-900 text-base mb-1.5">{title}</h3>
          <div className="text-sm text-gray-500 leading-relaxed">{message}</div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl ${t.btn} disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2`}
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
