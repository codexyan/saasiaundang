'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Check, X, Loader2, Lock } from 'lucide-react'
import type { TemplateCategory, TemplateRecord } from '@/lib/types'
import { slugify } from '@/lib/schemas/template-record'
import Drawer from '@/components/admin/ui/Drawer'

interface Props {
  open: boolean
  categories: TemplateCategory[]
  records: TemplateRecord[]
  onClose: () => void
  onChanged: (categories: TemplateCategory[]) => void
}

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400'

/**
 * Kategori template — SATU tempat, satu backend.
 *
 * Sebelum ini kategori bisa diubah dari dua modul sekaligus lewat dua jalur
 * berbeda: Studio Desain memakai REST /api/admin/categories, sementara modul
 * Manajemen menimpa seluruh blob pengaturan lewat PATCH /api/admin/settings.
 * Keduanya juga memakai konvensi slug berbeda ("modern-elegan" vs
 * "modern_elegan"), jadi kategori yang sama bisa lahir dua kali dengan slug
 * berbeda, dan kategori baru dari satu modul lenyap begitu modul lain menyimpan.
 */
export default function CategoryManager({ open, categories, records, onClose, onChanged }: Props) {
  const [newLabel, setNewLabel] = useState('')
  const [editSlug, setEditSlug] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const usage = records.reduce<Record<string, number>>((m, r) => {
    if (r.category) m[r.category] = (m[r.category] ?? 0) + 1
    return m
  }, {})

  async function add() {
    const label = newLabel.trim()
    if (!label) return
    const slug = slugify(label)
    if (categories.some(c => c.slug === slug)) { toast.error('Kategori dengan nama itu sudah ada'); return }

    setBusy('new')
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, slug }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { toast.error(data?.error || 'Kategori gagal ditambahkan'); return }
      onChanged([...categories, data.category])
      setNewLabel('')
      toast.success(`Kategori "${label}" ditambahkan`)
    } finally { setBusy(null) }
  }

  async function saveEdit(slug: string) {
    const label = editLabel.trim()
    if (!label) return
    setBusy(slug)
    try {
      const res = await fetch(`/api/admin/categories/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { toast.error(data?.error || 'Perubahan gagal disimpan'); return }
      onChanged(categories.map(c => (c.slug === slug ? { ...c, label } : c)))
      setEditSlug(null)
      toast.success('Kategori diperbarui')
    } finally { setBusy(null) }
  }

  async function remove(cat: TemplateCategory) {
    setBusy(cat.slug)
    try {
      const res = await fetch(`/api/admin/categories/${cat.slug}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      // Server yang memutuskan boleh/tidaknya (dia yang tahu seluruh template,
      // bukan hanya yang kebetulan ada di state panel ini).
      if (!res.ok) { toast.error(data?.error || 'Kategori gagal dihapus'); return }
      onChanged(categories.filter(c => c.slug !== cat.slug))
      toast.success(`Kategori "${cat.label}" dihapus`)
    } finally { setBusy(null) }
  }

  return (
    <Drawer open={open} onClose={onClose} title="Kategori template" subtitle="Dipakai sebagai filter di galeri publik" width="max-w-md">
      <div className="px-6 py-5">
        <div className="flex gap-2">
          <input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add() }}
            placeholder="Nama kategori baru..."
            className={inputCls}
          />
          <button
            onClick={add}
            disabled={!newLabel.trim() || busy === 'new'}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-40 transition-colors"
          >
            {busy === 'new' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Tambah
          </button>
        </div>
        {newLabel.trim() && (
          <p className="mt-1.5 text-[10px] text-gray-400">
            Slug: <span className="font-mono font-semibold text-gray-600">{slugify(newLabel)}</span>
          </p>
        )}

        <div className="mt-5 space-y-1.5">
          {categories.map(cat => {
            const used = usage[cat.slug] ?? 0
            const isEditing = editSlug === cat.slug
            const isBusy = busy === cat.slug

            return (
              <div key={cat.slug} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200/70 bg-white">
                {isEditing ? (
                  <>
                    <input
                      autoFocus
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(cat.slug)
                        if (e.key === 'Escape') setEditSlug(null)
                      }}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    />
                    <button onClick={() => saveEdit(cat.slug)} disabled={isBusy} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => setEditSlug(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{cat.label}</p>
                      <p className="text-[10px] text-gray-400 font-mono truncate">
                        {cat.slug}
                        <span className="font-sans"> · dipakai {used} template</span>
                      </p>
                    </div>
                    {cat.is_built_in && (
                      <span title="Kategori bawaan" className="shrink-0 text-gray-300"><Lock className="w-3 h-3" /></span>
                    )}
                    <button
                      onClick={() => { setEditSlug(cat.slug); setEditLabel(cat.label) }}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label={`Ubah nama ${cat.label}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => remove(cat)}
                      disabled={isBusy || used > 0}
                      title={used > 0 ? `Masih dipakai ${used} template — pindahkan dulu kategorinya` : 'Hapus kategori'}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
                      aria-label={`Hapus ${cat.label}`}
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {categories.length === 0 && (
          <p className="mt-6 text-center text-sm text-gray-400">Belum ada kategori.</p>
        )}
      </div>
    </Drawer>
  )
}
