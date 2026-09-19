'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  /** Kelas lebar Tailwind, mis. "max-w-md". */
  width?: string
  /** Baris tombol yang menempel di dasar panel. */
  footer?: React.ReactNode
  children: React.ReactNode
}

/**
 * Panel geser dari kanan.
 *
 * Sebelumnya dideklarasikan ulang di dalam TemplatesTab dan beberapa tab lain
 * dengan perilaku yang sedikit-sedikit berbeda. Versi bersama ini menambahkan
 * dua hal yang tidak dimiliki semuanya: fokus dipindahkan ke dalam panel saat
 * dibuka, dan dikembalikan ke elemen pemicu saat ditutup — tanpa itu pengguna
 * keyboard "terlempar" ke awal halaman setiap kali menutup drawer.
 */
export default function Drawer({ open, onClose, title, subtitle, width = 'max-w-md', footer, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    returnFocusRef.current = document.activeElement as HTMLElement | null
    // Tunggu transisi masuk mulai supaya elemen sudah bisa difokus.
    const raf = requestAnimationFrame(() => panelRef.current?.focus())

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
      returnFocusRef.current?.focus?.()
    }
  }, [open, onClose])

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${open ? 'visible' : 'invisible pointer-events-none'}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-gray-900/25 backdrop-blur-[3px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute inset-y-0 right-0 w-full ${width} bg-white shadow-2xl outline-none transform transition-transform duration-300 ease-out flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-gray-200/70 shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900 truncate">{title}</h2>
            {subtitle && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-11 h-11 -mr-3 -my-1.5 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-gray-200/70 bg-gray-50/60 shrink-0">{footer}</div>
        )}
      </div>
    </div>
  )
}
