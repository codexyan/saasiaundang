'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, Tag, Check, X, Pencil } from 'lucide-react'
import type { TemplateCategory } from '@/lib/types'

interface Props {
  categories: TemplateCategory[]
  onUpdate: (categories: TemplateCategory[]) => void
}

export default function CategoriesManager({ categories, onUpdate }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState('')
  const [busy, setBusy] = useState(false)

  function previewSlug(label: string) {
    return label.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '')
  }

  async function addCategory() {
    if (!newLabel.trim()) return
    setBusy(true)
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newLabel.trim() }),
    })
    setBusy(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || 'Gagal menambah')
      return
    }
    const { category } = await res.json()
    onUpdate([...categories, category])
    setNewLabel('')
    setShowAdd(false)
    toast.success('Kategori ditambahkan')
  }

  async function saveEdit(slug: string) {
    if (!editingLabel.trim()) return
    setBusy(true)
    const res = await fetch(`/api/admin/categories/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: editingLabel.trim() }),
    })
    setBusy(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || 'Perubahannya gagal disimpan. Coba lagi ya.')
      return
    }
    onUpdate(categories.map((c) => c.slug === slug ? { ...c, label: editingLabel.trim() } : c))
    setEditingSlug(null)
    toast.success('Kategori diperbarui')
  }

  async function deleteCategory(slug: string) {
    if (!confirm('Hapus kategori ini? Template yang sudah pakai kategori ini akan tetap berfungsi.')) return
    const res = await fetch(`/api/admin/categories/${slug}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || 'Gagal dihapus. Coba lagi ya.')
      return
    }
    onUpdate(categories.filter((c) => c.slug !== slug))
    toast.success('Kategori dihapus')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-500" />
            Kategori Template
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Dipakai di Studio Desain &amp; filter katalog user. Bawaan tidak bisa dihapus.
          </p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {showAdd ? 'Tutup' : 'Tambah'}
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 p-3 rounded-xl border border-indigo-100 bg-indigo-50/50">
          <label className="block text-[10px] font-semibold text-indigo-700 mb-1.5">NAMA KATEGORI BARU</label>
          <div className="flex gap-2">
            <input
              autoFocus
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              placeholder="contoh: Vintage"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={addCategory}
              disabled={busy || !newLabel.trim()}
              className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Simpan
            </button>
          </div>
          {newLabel && (
            <p className="text-[10px] text-gray-400 mt-2">
              Slug otomatis: <span className="font-mono text-gray-600">{previewSlug(newLabel) || '(invalid)'}</span>
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          editingSlug === cat.slug ? (
            <div key={cat.slug} className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 rounded-lg px-2 py-1">
              <input
                autoFocus
                value={editingLabel}
                onChange={(e) => setEditingLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit(cat.slug)
                  if (e.key === 'Escape') setEditingSlug(null)
                }}
                className="text-xs px-1.5 py-0.5 bg-white border border-gray-200 rounded outline-none focus:ring-1 focus:ring-indigo-400 w-32"
              />
              <button onClick={() => saveEdit(cat.slug)} disabled={busy} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                <Check className="w-3 h-3" />
              </button>
              <button onClick={() => setEditingSlug(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div
              key={cat.slug}
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                cat.is_built_in
                  ? 'bg-gray-50 text-gray-600 border-gray-200'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              <span>{cat.label}</span>
              <span className="text-[9px] font-mono text-gray-400">/{cat.slug}</span>
              {cat.is_built_in && <span className="text-[9px] text-blue-500 bg-blue-50 px-1 rounded">bawaan</span>}
              {!cat.is_built_in && (
                <>
                  <button
                    onClick={() => { setEditingSlug(cat.slug); setEditingLabel(cat.label) }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-indigo-600"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.slug)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          )
        ))}
      </div>
    </div>
  )
}
