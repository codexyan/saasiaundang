'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  Music, Upload, Loader2, Play, Pause, Trash2, Search, Plus,
  ToggleLeft, ToggleRight, Filter, X, Edit3, Check,
  FolderOpen, FileAudio, TrendingUp, Tag, BarChart3,
} from 'lucide-react'
import type { MusicTrack, MusicCategory } from '@/lib/types'

function formatDuration(sec: number) {
  if (!sec) return '0:00'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatFileSize(bytes: number) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type TabView = 'tracks' | 'categories' | 'stats'

export default function MusicLibraryTab() {
  const [tab, setTab] = useState<TabView>('tracks')
  const [tracks, setTracks] = useState<MusicTrack[]>([])
  const [categories, setCategories] = useState<MusicCategory[]>([])
  const [topTracks, setTopTracks] = useState<MusicTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<string>('all')
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', artist: '', category: '' })
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ title: '', artist: '', category: 'Lainnya', url: '' })
  const [newCatName, setNewCatName] = useState('')
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editCatName, setEditCatName] = useState('')

  const audioRef = useRef<HTMLAudioElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/music')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTracks(data.tracks || [])
      setCategories(data.categories || [])
      setTopTracks(data.topTracks || [])
    } catch {
      toast.error('Gagal memuat data musik')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const catNames = categories.map(c => c.name)

  //  Track operations 

  async function handleUpload(file: File) {
    if (!file.type.startsWith('audio/')) {
      toast.error('File harus berupa audio (MP3, M4A, WAV)')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 15MB')
      return
    }

    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'music')

      const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: form })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const { url } = await uploadRes.json()

      const title = file.name.replace(/\.[^/.]+$/, '')
      const res = await fetch('/api/admin/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url, file_size: file.size }),
      })
      if (!res.ok) throw new Error()
      const { track } = await res.json()
      setTracks(prev => [track, ...prev])
      toast.success(`"${title}" berhasil diupload`)
    } catch {
      toast.error('Musiknya gagal dikirim. Coba lagi ya.')
    } finally {
      setUploading(false)
    }
  }

  async function handleAddUrl() {
    if (!addForm.title.trim() || !addForm.url.trim()) {
      toast.error('Judul dan URL wajib diisi')
      return
    }
    try {
      const res = await fetch('/api/admin/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      if (!res.ok) throw new Error()
      const { track } = await res.json()
      setTracks(prev => [track, ...prev])
      setAddForm({ title: '', artist: '', category: 'Lainnya', url: '' })
      setShowAdd(false)
      toast.success(`"${track.title}" ditambahkan`)
    } catch {
      toast.error('Gagal menambahkan musik')
    }
  }

  async function handleToggleActive(track: MusicTrack) {
    try {
      const res = await fetch(`/api/admin/music/${track.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !track.is_active }),
      })
      if (!res.ok) throw new Error()
      const { track: updated } = await res.json()
      setTracks(prev => prev.map(t => t.id === track.id ? updated : t))
    } catch {
      toast.error('Statusnya gagal diubah. Coba lagi ya.')
    }
  }

  async function handleSaveEdit(id: string) {
    try {
      const res = await fetch(`/api/admin/music/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error()
      const { track: updated } = await res.json()
      setTracks(prev => prev.map(t => t.id === id ? updated : t))
      setEditingId(null)
      toast.success('Berhasil disimpan')
    } catch {
      toast.error('Perubahannya gagal disimpan. Coba lagi ya.')
    }
  }

  async function handleDelete(track: MusicTrack) {
    if (!confirm(`Hapus "${track.title}"?`)) return
    try {
      const res = await fetch(`/api/admin/music/${track.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setTracks(prev => prev.filter(t => t.id !== track.id))
      if (playingId === track.id) {
        audioRef.current?.pause()
        setPlayingId(null)
      }
      toast.success('Musiknya sudah dihapus.')
    } catch {
      toast.error('Gagal dihapus. Coba lagi ya.')
    }
  }

  function togglePlay(track: MusicTrack) {
    if (playingId === track.id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }
    if (audioRef.current) {
      audioRef.current.src = track.url
      audioRef.current.play()
      setPlayingId(track.id)
    }
  }

  function startEdit(track: MusicTrack) {
    setEditingId(track.id)
    setEditForm({ title: track.title, artist: track.artist, category: track.category })
  }

  //  Category operations 

  async function handleAddCategory() {
    const name = newCatName.trim()
    if (!name) return
    try {
      const res = await fetch('/api/admin/music/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.status === 409) { toast.error('Kategori sudah ada'); return }
      if (!res.ok) throw new Error()
      const { category } = await res.json()
      setCategories(prev => [...prev, category])
      setNewCatName('')
      toast.success(`Kategori "${name}" ditambahkan`)
    } catch {
      toast.error('Gagal menambahkan kategori')
    }
  }

  async function handleSaveCat(id: string) {
    const name = editCatName.trim()
    if (!name) return
    try {
      const res = await fetch(`/api/admin/music/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error()
      const { category } = await res.json()
      setCategories(prev => prev.map(c => c.id === id ? category : c))
      setEditingCatId(null)
      toast.success('Kategori diperbarui')
    } catch {
      toast.error('Perubahannya gagal disimpan. Coba lagi ya.')
    }
  }

  async function handleDeleteCat(cat: MusicCategory) {
    const trackCount = tracks.filter(t => t.category === cat.name).length
    const msg = trackCount > 0
      ? `Hapus kategori "${cat.name}"? ${trackCount} trek masih menggunakan kategori ini.`
      : `Hapus kategori "${cat.name}"?`
    if (!confirm(msg)) return
    try {
      const res = await fetch(`/api/admin/music/categories/${cat.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setCategories(prev => prev.filter(c => c.id !== cat.id))
      toast.success('Kategori dihapus')
    } catch {
      toast.error('Gagal dihapus. Coba lagi ya.')
    }
  }

  //  Filtered tracks 

  const filtered = tracks.filter(t => {
    if (filterCat !== 'all' && t.category !== filterCat) return false
    if (search) {
      const q = search.toLowerCase()
      return t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    }
    return true
  })

  const activeCount = tracks.filter(t => t.is_active).length
  const totalUsage = tracks.reduce((sum, t) => sum + t.usage_count, 0)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Perpustakaan Musik</h2>
          <p className="text-sm text-stone-500 mt-1">
            {loading ? 'Memuat data...' : `${tracks.length} trek, ${activeCount} aktif${totalUsage > 0 ? `, ${totalUsage} total dipilih user` : ''}`}
          </p>
        </div>
        {tab === 'tracks' && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(v => !v)}
              className="px-4 py-2 text-sm font-medium border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Tambah URL
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Upload File
            </button>
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-lg w-fit">
        {([
          { id: 'tracks' as TabView, label: 'Trek Musik', icon: Music },
          { id: 'categories' as TabView, label: 'Kategori', icon: Tag },
          { id: 'stats' as TabView, label: 'Statistik', icon: BarChart3 },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${
              tab === t.id
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/*  TRACKS TAB  */}
      {tab === 'tracks' && (
        <>
          {/* Add URL Form */}
          {showAdd && (
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-stone-800 text-sm">Tambah Musik dari URL</p>
                <button onClick={() => setShowAdd(false)} className="text-stone-400 hover:text-stone-600">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Judul lagu *"
                  value={addForm.title}
                  onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                  className="px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Artis"
                  value={addForm.artist}
                  onChange={e => setAddForm(f => ({ ...f, artist: e.target.value }))}
                  className="px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
                />
                <input
                  type="url"
                  placeholder="URL audio (https://...) *"
                  value={addForm.url}
                  onChange={e => setAddForm(f => ({ ...f, url: e.target.value }))}
                  className="px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
                />
                <select
                  value={addForm.category}
                  onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}
                  className="px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none bg-white"
                >
                  {catNames.length > 0
                    ? catNames.map(c => <option key={c} value={c}>{c}</option>)
                    : <option value="Lainnya">Lainnya</option>
                  }
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleAddUrl}
                  className="px-4 py-2 text-sm font-medium bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
                >
                  Tambahkan
                </button>
              </div>
            </div>
          )}

          {/* Search & Filter */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Cari judul atau artis..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-stone-400" />
              <select
                value={filterCat}
                onChange={e => setFilterCat(e.target.value)}
                className="px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none bg-white"
              >
                <option value="all">Semua Kategori</option>
                {catNames.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Track List */}
          {loading ? (
            <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                  <div className="w-10 h-10 rounded-lg bg-stone-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-stone-200 rounded w-1/3" />
                    <div className="h-3 bg-stone-100 rounded w-1/4" />
                  </div>
                  <div className="h-6 w-16 bg-stone-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto">
                <FolderOpen size={28} className="text-stone-400" />
              </div>
              <p className="text-stone-600 font-medium">
                {tracks.length === 0 ? 'Belum ada musik' : 'Tidak ada hasil'}
              </p>
              <p className="text-sm text-stone-400">
                {tracks.length === 0
                  ? 'Upload file musik atau tambahkan dari URL untuk memulai'
                  : 'Coba kata kunci atau kategori lain'}
              </p>
            </div>
          ) : (
            <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
              {filtered.map(track => (
                <div
                  key={track.id}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors ${
                    !track.is_active ? 'opacity-50' : ''
                  }`}
                >
                  <button
                    onClick={() => togglePlay(track)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      playingId === track.id
                        ? 'bg-gold-500 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-gold-100 hover:text-gold-700'
                    }`}
                  >
                    {playingId === track.id ? <Pause size={16} /> : <Play size={16} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    {editingId === track.id ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                          className="px-2 py-1 text-sm border border-stone-300 rounded focus:ring-1 focus:ring-gold-500 outline-none flex-1"
                        />
                        <input
                          type="text"
                          value={editForm.artist}
                          onChange={e => setEditForm(f => ({ ...f, artist: e.target.value }))}
                          placeholder="Artis"
                          className="px-2 py-1 text-sm border border-stone-300 rounded focus:ring-1 focus:ring-gold-500 outline-none w-32"
                        />
                        <select
                          value={editForm.category}
                          onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                          className="px-2 py-1 text-sm border border-stone-300 rounded focus:ring-1 focus:ring-gold-500 outline-none bg-white"
                        >
                          {catNames.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button
                          onClick={() => handleSaveEdit(track.id)}
                          className="w-8 h-8 rounded bg-green-500 text-white hover:bg-green-600 flex items-center justify-center"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="w-8 h-8 rounded bg-stone-200 text-stone-600 hover:bg-stone-300 flex items-center justify-center"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-stone-900 truncate">{track.title}</p>
                        <p className="text-xs text-stone-500 truncate">
                          {track.artist || 'Tanpa artis'}
                          <span className="mx-1.5 text-stone-300">·</span>
                          {track.category}
                          {track.duration > 0 && (
                            <>
                              <span className="mx-1.5 text-stone-300">·</span>
                              {formatDuration(track.duration)}
                            </>
                          )}
                          {track.file_size > 0 && (
                            <>
                              <span className="mx-1.5 text-stone-300">·</span>
                              {formatFileSize(track.file_size)}
                            </>
                          )}
                          {track.usage_count > 0 && (
                            <>
                              <span className="mx-1.5 text-stone-300">·</span>
                              <span className="text-gold-600">{track.usage_count}x dipilih</span>
                            </>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {editingId !== track.id && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleToggleActive(track)}
                        className="p-1.5 rounded hover:bg-stone-100 transition-colors"
                        title={track.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {track.is_active
                          ? <ToggleRight size={20} className="text-green-500" />
                          : <ToggleLeft size={20} className="text-stone-400" />
                        }
                      </button>
                      <button
                        onClick={() => startEdit(track)}
                        className="p-1.5 rounded hover:bg-stone-100 transition-colors"
                        title="Edit"
                      >
                        <Edit3 size={16} className="text-stone-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(track)}
                        className="p-1.5 rounded hover:bg-red-50 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={16} className="text-red-400 hover:text-red-600" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload Drop Zone */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-stone-300 rounded-xl p-8 text-center hover:border-gold-400 hover:bg-gold-50/50 transition-all cursor-pointer"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={28} className="animate-spin text-gold-500" />
                <p className="text-sm font-medium text-stone-600">Mengupload...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FileAudio size={28} className="text-stone-400" />
                <p className="text-sm font-semibold text-stone-700">Klik atau seret file musik ke sini</p>
                <p className="text-xs text-stone-400">MP3, M4A, WAV, OGG, AAC (maks. 15MB)</p>
              </div>
            )}
          </div>
        </>
      )}

      {/*  CATEGORIES TAB  */}
      {tab === 'categories' && (
        <div className="space-y-4">
          {/* Add category */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nama kategori baru..."
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              className="flex-1 px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
            <button
              onClick={handleAddCategory}
              disabled={!newCatName.trim()}
              className="px-4 py-2 text-sm font-medium bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Plus size={16} />
              Tambah
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto">
                <Tag size={28} className="text-stone-400" />
              </div>
              <p className="text-stone-600 font-medium">Belum ada kategori</p>
              <p className="text-sm text-stone-400">Tambahkan kategori untuk mengelompokkan musik</p>
            </div>
          ) : (
            <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
              {categories.map(cat => {
                const trackCount = tracks.filter(t => t.category === cat.name).length
                return (
                  <div key={cat.id} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <Tag size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingCatId === cat.id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={editCatName}
                            onChange={e => setEditCatName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSaveCat(cat.id)}
                            className="px-2 py-1 text-sm border border-stone-300 rounded focus:ring-1 focus:ring-gold-500 outline-none flex-1"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveCat(cat.id)}
                            className="w-8 h-8 rounded bg-green-500 text-white hover:bg-green-600 flex items-center justify-center"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditingCatId(null)}
                            className="w-8 h-8 rounded bg-stone-200 text-stone-600 hover:bg-stone-300 flex items-center justify-center"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-semibold text-stone-900">{cat.name}</p>
                          <p className="text-xs text-stone-500">{trackCount} trek</p>
                        </div>
                      )}
                    </div>
                    {editingCatId !== cat.id && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name) }}
                          className="p-1.5 rounded hover:bg-stone-100 transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={16} className="text-stone-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteCat(cat)}
                          className="p-1.5 rounded hover:bg-red-50 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} className="text-red-400 hover:text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/*  STATS TAB  */}
      {tab === 'stats' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-stone-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Music size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">{tracks.length}</p>
                  <p className="text-xs text-stone-500">Total Trek</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white border border-stone-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                  <ToggleRight size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">{activeCount}</p>
                  <p className="text-xs text-stone-500">Trek Aktif</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white border border-stone-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold-100 text-gold-600 flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">{totalUsage}</p>
                  <p className="text-xs text-stone-500">Total Dipilih User</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Tracks */}
          <div>
            <h3 className="text-lg font-bold text-stone-900 mb-3 flex items-center gap-2">
              <TrendingUp size={20} className="text-gold-500" />
              Musik Terpopuler
            </h3>
            {topTracks.filter(t => t.usage_count > 0).length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto">
                  <BarChart3 size={28} className="text-stone-400" />
                </div>
                <p className="text-stone-600 font-medium">Belum ada data</p>
                <p className="text-sm text-stone-400">Statistik akan muncul setelah user mulai memilih musik</p>
              </div>
            ) : (
              <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                {topTracks.filter(t => t.usage_count > 0).map((track, idx) => (
                  <div key={track.id} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold ${
                      idx === 0 ? 'bg-gold-500 text-white' :
                      idx === 1 ? 'bg-stone-400 text-white' :
                      idx === 2 ? 'bg-amber-600 text-white' :
                      'bg-stone-100 text-stone-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <button
                      onClick={() => togglePlay(track)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        playingId === track.id
                          ? 'bg-gold-500 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-gold-100'
                      }`}
                    >
                      {playingId === track.id ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate">{track.title}</p>
                      <p className="text-xs text-stone-500 truncate">
                        {track.artist || 'Tanpa artis'} · {track.category}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gold-600">{track.usage_count}x</p>
                      <p className="text-[10px] text-stone-400">dipilih</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Per-Category Breakdown */}
          {catNames.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-stone-900 mb-3 flex items-center gap-2">
                <Tag size={20} className="text-purple-500" />
                Per Kategori
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {catNames.map(cat => {
                  const catTracks = tracks.filter(t => t.category === cat)
                  const catUsage = catTracks.reduce((s, t) => s + t.usage_count, 0)
                  return (
                    <div key={cat} className="p-4 bg-white border border-stone-200 rounded-xl">
                      <p className="text-sm font-semibold text-stone-900">{cat}</p>
                      <div className="flex gap-4 mt-2">
                        <div>
                          <p className="text-lg font-bold text-stone-700">{catTracks.length}</p>
                          <p className="text-[10px] text-stone-400">trek</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gold-600">{catUsage}</p>
                          <p className="text-[10px] text-stone-400">dipilih</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
