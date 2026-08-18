'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, Sparkles, Loader2, Check } from 'lucide-react'
import type { TemplateRecord, TemplateCategory } from '@/lib/types'
import { slugify } from '@/lib/schemas/template-record'
import TemplateThumb from './TemplateThumb'

interface Props {
  open: boolean
  categories: TemplateCategory[]
  /** Template yang bisa dipakai sebagai titik awal. */
  bases: TemplateRecord[]
  creating: boolean
  onCancel: () => void
  onCreate: (input: { name: string; description: string; category: string; baseId: string }) => void
}

const inputCls = 'w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 bg-white'

/**
 * Dialog pembuatan template.
 *
 * Menanyakan titik awal sejak langkah pertama. Sebelumnya setiap template baru
 * selalu lahir dari salinan Javanese Gold secara diam-diam — admin yang ingin
 * membuat varian tema lain harus menyetel ulang puluhan field satu per satu
 * dan tidak pernah diberi tahu dari mana desain awalnya berasal.
 */
export default function NewTemplateDialog({ open, categories, bases, creating, onCancel, onCreate }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [baseId, setBaseId] = useState('')

  useEffect(() => {
    if (!open) return
    setName('')
    setDescription('')
    setCategory(categories[0]?.slug ?? 'modern')
    setBaseId(bases[0]?.id ?? '')
  }, [open, categories, bases])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !creating) onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, creating, onCancel])

  const slug = useMemo(() => slugify(name), [name])
  const canSubmit = name.trim().length >= 3 && !!baseId && !creating

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm px-4" onClick={() => !creating && onCancel()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buat template baru"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Buat template baru</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Template lahir sebagai draft — belum terlihat pelanggan.</p>
          </div>
          <button onClick={onCancel} disabled={creating} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">
                Nama template <span className="text-red-400">*</span>
              </label>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && canSubmit) onCreate({ name: name.trim(), description, category, baseId }) }}
                placeholder="Modern Sage, Javanese Royal..."
                className={inputCls}
              />
              {name.trim() && (
                <p className="text-[10px] text-gray-400 mt-1">
                  Slug: <span className="font-mono font-semibold text-gray-600">{slug || '—'}</span>
                  {name.trim().length < 3 && <span className="text-red-500"> · minimal 3 karakter</span>}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">Kategori</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                {categories.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">Deskripsi singkat</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Ditampilkan ke calon pembeli di galeri template..."
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <p className="text-[11px] font-semibold text-gray-600 mb-2">Mulai dari desain</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {bases.map(base => {
                const sel = baseId === base.id
                return (
                  <button
                    key={base.id}
                    onClick={() => setBaseId(base.id)}
                    className={`group relative rounded-xl overflow-hidden border-2 transition-all ${
                      sel ? 'border-gray-900 ring-2 ring-gray-900/10' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <div className="aspect-[9/16] bg-gray-100">
                      <TemplateThumb record={base} config={base.config} />
                    </div>
                    {sel && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                    <span className="block px-1.5 py-1.5 text-[10px] font-semibold text-gray-600 truncate bg-white">
                      {base.name}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              Seluruh warna, font, seksi, dan animasi disalin dari template ini — tinggal diubah sesukanya.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 shrink-0">
          <button
            onClick={() => onCreate({ name: name.trim(), description, category, baseId })}
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 transition-colors"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Mulai mendesain
          </button>
        </div>
      </div>
    </div>
  )
}
