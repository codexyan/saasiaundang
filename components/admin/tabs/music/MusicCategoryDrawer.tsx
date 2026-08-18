'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Check, X, Loader2, Lock } from 'lucide-react'
import type { MusicCategory, MusicTrack } from '@/lib/types'
import Drawer from '@/components/admin/ui/Drawer'
import ConfirmDialog from '@/components/admin/ui/ConfirmDialog'

/** Harus sama dengan MUSIC_FALLBACK_CATEGORY di lib/db/music.ts. */
const FALLBACK = 'Lainnya'

interface Props {
  open: boolean
  categories: MusicCategory[]
  tracks: MusicTrack[]
  onClose: () => void
  /** Kategori berubah — pemanggil memuat ulang trek juga, karena rename dan
   *  hapus ikut memindahkan trek di server. */
  onChanged: (categories: MusicCategory[], tracksAffected: boolean) => void
}

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400'

export default function MusicCategoryDrawer({ open, categories, tracks, onClose, onChanged }: Props) {
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<MusicCategory | null>(null)

  const usage = tracks.reduce<Record<string, number>>((m, t) => {
    m[t.category] = (m[t.category] ?? 0) + 1
    return m
  }, {})

  async function add() {
    const name = newName.trim()
    if (!name) return
    setBusy('new')
    try {
      const res = await fetch('/api/admin/music/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { toast.error(data?.error || 'Kategori gagal ditambahkan'); return }
      onChanged([...categories, data.category], false)
      setNewName('')
      toast.success(`Kategori "${name}" ditambahkan`)
    } finally { setBusy(null) }
  }

  async function saveEdit(cat: MusicCategory) {
    const name = editName.trim()
    if (!name || name === cat.name) { setEditId(null); return }
    setBusy(cat.id)
    try {
      const res = await fetch(`/api/admin/music/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { toast.error(data?.error || 'Perubahan gagal disimpan'); return }
      // Server sekaligus memindahkan trek yang menempel pada nama lama, jadi
      // daftar trek di layar wajib dimuat ulang.
      onChanged(categories.map(c => (c.id === cat.id ? data.category : c)), true)
      setEditId(null)
      const moved = usage[cat.name] ?? 0
      toast.success(moved > 0 ? `Kategori diubah — ${moved} lagu ikut dipindahkan` : 'Kategori diperbarui')
    } finally { setBusy(null) }
  }

  async function remove(cat: MusicCategory) {
    setBusy(cat.id)
    try {
      const res = await fetch(`/api/admin/music/categories/${cat.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) { toast.error(data?.error || 'Kategori gagal dihapus'); return }
      onChanged(categories.filter(c => c.id !== cat.id), (data?.moved ?? 0) > 0)
      setPendingDelete(null)
      toast.success(
        data?.moved > 0
          ? `Kategori dihapus — ${data.moved} lagu dipindahkan ke "${data.moved_to}"`
          : 'Kategori dihapus',
      )
    } finally { setBusy(null) }
  }

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title="Kategori musik"
        subtitle="Dipakai sebagai filter saat user memilih lagu"
        width="max-w-md"
      >
        <div className="px-6 py-5">
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') add() }}
              placeholder="Nama kategori baru..."
              className={inputCls}
            />
            <button
              onClick={add}
              disabled={!newName.trim() || busy === 'new'}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              {busy === 'new' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Tambah
            </button>
          </div>

          <div className="mt-5 space-y-1.5">
            {categories.map(cat => {
              const used = usage[cat.name] ?? 0
              const isEditing = editId === cat.id
              const isBusy = busy === cat.id
              const isFallback = cat.name === FALLBACK

              return (
                <div key={cat.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200/70 bg-white">
                  {isEditing ? (
                    <>
                      <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit(cat)
                          if (e.key === 'Escape') setEditId(null)
                        }}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                      />
                      <button onClick={() => saveEdit(cat)} disabled={isBusy} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                        {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setEditId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{cat.name}</p>
                        <p className="text-[10px] text-gray-400">{used} lagu</p>
                      </div>
                      {isFallback && (
                        <span title="Kategori penampung — tidak bisa dihapus" className="shrink-0 text-gray-300">
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                      <button
                        onClick={() => { setEditId(cat.id); setEditName(cat.name) }}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label={`Ubah nama ${cat.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPendingDelete(cat)}
                        disabled={isFallback}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
                        aria-label={`Hapus ${cat.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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

      <ConfirmDialog
        open={!!pendingDelete}
        busy={!!pendingDelete && busy === pendingDelete.id}
        tone="danger"
        icon={Trash2}
        title="Hapus kategori?"
        message={pendingDelete ? (() => {
          const n = usage[pendingDelete.name] ?? 0
          return n > 0
            ? <>Kategori <strong>{pendingDelete.name}</strong> akan dihapus dan <strong>{n} lagu</strong> di dalamnya dipindahkan ke &ldquo;{FALLBACK}&rdquo;. Lagunya tidak ikut terhapus.</>
            : <>Kategori <strong>{pendingDelete.name}</strong> akan dihapus.</>
        })() : ''}
        confirmLabel="Ya, hapus"
        onConfirm={() => pendingDelete && remove(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
