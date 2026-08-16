'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, Loader2, ArrowUp, ArrowDown, Check, X, Pencil, FolderTree, AlertTriangle } from 'lucide-react'
import { slugify } from '@/lib/article-markdown'
import { useApiMutation } from '@/hooks/useApi'

export interface CategoryRow {
  id: string
  name: string
  slug: string
  sortOrder: number
  createdAt: string
}

export default function ArticleCategoriesManager({ onChanged }: { onChanged?: () => void }) {
  const [rows, setRows] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newSlugTouched, setNewSlugTouched] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // `loading` dari hook sengaja TIDAK dipakai: state `creating` di atas sudah
  // menggerakkan spinner tombol Tambah, dan satu instance hook untuk beberapa
  // aksi akan membuat tombol itu ikut berputar saat baris lain dihapus/diedit.
  const api = useApiMutation<{ categories?: CategoryRow[] }>()

  const fetchRows = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/article-categories')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setRows((data.categories as CategoryRow[]).sort((a, b) => a.sortOrder - b.sortOrder))
    } catch { toast.error('Gagal memuat kategori') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchRows() }, [fetchRows])

  async function handleCreate() {
    const name = newName.trim()
    if (!name) return
    setCreating(true)
    try {
      const ok = await api.mutate('/api/admin/article-categories', {
        method: 'POST',
        body: { name, slug: newSlug.trim() || slugify(name), sortOrder: rows.length },
        errorMessage: 'Gagal membuat kategori',
      })
      if (!ok) return
      setNewName(''); setNewSlug(''); setNewSlugTouched(false)
      await fetchRows(); onChanged?.()
      toast.success('Kategori ditambahkan')
    } finally { setCreating(false) }
  }

  function startEdit(row: CategoryRow) {
    setEditingId(row.id); setEditName(row.name); setEditSlug(row.slug)
  }

  async function saveEdit(id: string) {
    const name = editName.trim()
    if (!name) return
    const ok = await api.mutate(`/api/admin/article-categories/${id}`, {
      method: 'PATCH',
      body: { name, slug: editSlug.trim() || slugify(name) },
      errorMessage: 'Perubahannya gagal disimpan. Coba lagi ya.',
    })
    if (!ok) return
    setEditingId(null)
    await fetchRows(); onChanged?.()
    toast.success('Kategori diperbarui')
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= rows.length) return
    const a = rows[index], b = rows[target]
    // Swap sortOrder of the two neighbours, persist both.
    setRows(prev => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    await Promise.all([
      fetch(`/api/admin/article-categories/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: b.sortOrder }) }),
      fetch(`/api/admin/article-categories/${b.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: a.sortOrder }) }),
    ])
    await fetchRows()
  }

  async function confirmDelete() {
    if (!deleteId) return
    const ok = await api.mutate(`/api/admin/article-categories/${deleteId}`, {
      method: 'DELETE',
      errorMessage: 'Gagal dihapus. Coba lagi ya.',
    })
    // setDeleteId(null) tetap dijalankan lebih dulu seperti sebelumnya: dialog
    // konfirmasi harus tertutup baik penghapusannya berhasil maupun gagal.
    setDeleteId(null)
    if (!ok) return
    await fetchRows(); onChanged?.()
    toast.success('Kategori dihapus')
  }

  return (
    <div className="max-w-2xl">
      {/* Add form */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <p className="text-xs font-semibold text-gray-600 mb-2">Tambah Kategori</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text" value={newName}
            onChange={e => { setNewName(e.target.value); if (!newSlugTouched) setNewSlug(slugify(e.target.value)) }}
            placeholder="Nama kategori (mis. Tips Pernikahan)"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-forest-400"
          />
          <input
            type="text" value={newSlug}
            onChange={e => { setNewSlug(slugify(e.target.value)); setNewSlugTouched(true) }}
            placeholder="slug-otomatis"
            className="sm:w-48 px-3 py-2 text-sm font-mono text-gray-600 border border-gray-200 rounded-lg outline-none focus:border-forest-400"
          />
          <button onClick={handleCreate} disabled={creating || !newName.trim()}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-forest-500 text-white hover:bg-forest-600 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 shrink-0">
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}Tambah
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-white rounded-xl border border-gray-100 animate-pulse" />)}</div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-14 text-center">
          <FolderTree className="w-9 h-9 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">Belum ada kategori</p>
          <p className="text-xs text-gray-400 mt-1">Kategori membantu mengelompokkan artikel di blog.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={row.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} disabled={i === 0}
                  className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"><ArrowUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => move(i, 1)} disabled={i === rows.length - 1}
                  className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"><ArrowDown className="w-3.5 h-3.5" /></button>
              </div>

              {editingId === row.id ? (
                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-forest-400" />
                  <input value={editSlug} onChange={e => setEditSlug(slugify(e.target.value))}
                    className="sm:w-44 px-2.5 py-1.5 text-sm font-mono text-gray-600 border border-gray-200 rounded-lg outline-none focus:border-forest-400" />
                  <div className="flex gap-1">
                    <button onClick={() => saveEdit(row.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{row.name}</p>
                    <p className="text-[11px] font-mono text-gray-400 truncate">/blog?kategori={row.slug}</p>
                  </div>
                  <button onClick={() => startEdit(row)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(row.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-500" /></div>
              <div><h3 className="text-sm font-bold text-gray-900">Hapus Kategori?</h3></div>
            </div>
            <p className="text-xs text-gray-500 mb-4">Artikel di kategori ini <strong>tidak akan terhapus</strong>, hanya menjadi tanpa kategori.</p>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Batal</button>
              <button onClick={confirmDelete} className="px-4 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
