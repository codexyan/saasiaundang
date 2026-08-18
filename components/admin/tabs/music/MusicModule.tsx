'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Music, Upload, Loader2, Search, Plus, Tag, X, Link2, Trash2,
  ListMusic, CheckCircle2, Users, Clock,
} from 'lucide-react'
import type { MusicTrack, MusicCategory } from '@/lib/types'
import ConfirmDialog from '@/components/admin/ui/ConfirmDialog'
import TrackRow from './TrackRow'
import MusicCategoryDrawer from './MusicCategoryDrawer'
import { readAudioDuration, formatDuration } from './audio-meta'

type SortKey = 'manual' | 'usage' | 'newest' | 'title'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'manual', label: 'Urutan manual' },
  { key: 'usage',  label: 'Paling banyak dipakai' },
  { key: 'newest', label: 'Terbaru' },
  { key: 'title',  label: 'Judul A–Z' },
]

const MAX_UPLOAD = 15 * 1024 * 1024

function Stat({ icon: Icon, label, value, tone }: {
  icon: React.ElementType; label: string; value: string | number; tone: string
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-200/70">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-gray-900 leading-none tabular-nums">{value}</p>
        <p className="text-[11px] text-gray-400 mt-1 truncate">{label}</p>
      </div>
    </div>
  )
}

/**
 * Perpustakaan musik.
 *
 * Dulu tiga sub-tab terpisah (Trek / Kategori / Statistik) padahal semuanya
 * bicara tentang daftar yang sama. "Statistik" bahkan permanen nol karena
 * penghitung pemakaiannya tidak pernah dinaikkan siapa pun.
 *
 * Sekarang satu layar kerja: ringkasan di atas, daftar yang bisa dicari,
 * difilter, diurutkan, dan disusun ulang lewat seret — dengan kategori sebagai
 * panel samping, sama seperti modul Template.
 */
export default function MusicModule() {
  const [tracks, setTracks] = useState<MusicTrack[]>([])
  const [categories, setCategories] = useState<MusicCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [sort, setSort] = useState<SortKey>('manual')
  const [showInactive, setShowInactive] = useState(true)

  const [playingId, setPlayingId] = useState<string | null>(null)
  const [showCategories, setShowCategories] = useState(false)
  const [showAddUrl, setShowAddUrl] = useState(false)
  const [addForm, setAddForm] = useState({ title: '', artist: '', category: '', url: '' })
  const [addingUrl, setAddingUrl] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<MusicTrack | null>(null)

  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/music')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTracks(data.tracks ?? [])
      setCategories(data.categories ?? [])
    } catch {
      toast.error('Data musik gagal dimuat. Coba muat ulang halaman ya.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Pemutar preview hidup sepanjang modul terbuka; dihentikan saat ditutup
  // supaya musik tidak terus berbunyi setelah admin pindah tab.
  useEffect(() => {
    const audio = new Audio()
    audio.volume = 0.5
    audio.onended = () => setPlayingId(null)
    audio.onerror = () => { setPlayingId(null); toast.error('Lagunya gagal diputar — berkasnya mungkin sudah tidak ada.') }
    audioRef.current = audio
    return () => { audio.pause(); audioRef.current = null }
  }, [])

  const catNames = useMemo(() => categories.map(c => c.name), [categories])

  const stats = useMemo(() => ({
    total: tracks.length,
    active: tracks.filter(t => t.is_active).length,
    usage: tracks.reduce((s, t) => s + t.usage_count, 0),
    duration: tracks.reduce((s, t) => s + t.duration, 0),
  }), [tracks])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = tracks.filter(t => {
      if (!showInactive && !t.is_active) return false
      if (filterCat !== 'all' && t.category !== filterCat) return false
      if (q && !`${t.title} ${t.artist} ${t.category}`.toLowerCase().includes(q)) return false
      return true
    })
    const sorted = [...filtered]
    switch (sort) {
      case 'usage':  sorted.sort((a, b) => b.usage_count - a.usage_count); break
      case 'newest': sorted.sort((a, b) => b.created_at.localeCompare(a.created_at)); break
      case 'title':  sorted.sort((a, b) => a.title.localeCompare(b.title, 'id')); break
      default:       sorted.sort((a, b) => a.sort_order - b.sort_order)
    }
    return sorted
  }, [tracks, search, filterCat, sort, showInactive])

  // Menyeret baris hanya bermakna kalau yang terlihat = seluruh daftar dalam
  // urutan manual. Kalau sedang difilter, posisi baru tidak punya arti.
  const reorderable = sort === 'manual' && filterCat === 'all' && !search.trim() && showInactive

  //  Aksi

  function togglePlay(track: MusicTrack) {
    const audio = audioRef.current
    if (!audio) return
    if (playingId === track.id) { audio.pause(); setPlayingId(null); return }
    audio.src = track.url
    audio.play().then(() => setPlayingId(track.id)).catch(() => {
      toast.error('Lagunya belum bisa diputar. Coba lagi ya.')
      setPlayingId(null)
    })
  }

  async function handleUpload(files: FileList | File[]) {
    const list = Array.from(files)
    if (list.length === 0) return

    setUploading(true)
    let ok = 0
    try {
      for (const file of list) {
        if (file.size > MAX_UPLOAD) {
          toast.error(`"${file.name}" lebih dari 15MB — dilewati`)
          continue
        }

        // Durasi dibaca SEBELUM unggah, dari berkas di memori. Sebelumnya
        // tidak pernah dibaca sama sekali sehingga semua lagu tampil 0:00.
        const duration = await readAudioDuration(file)

        const form = new FormData()
        form.append('file', file)
        form.append('folder', 'music')
        const upRes = await fetch('/api/admin/upload', { method: 'POST', body: form })
        const upData = await upRes.json().catch(() => null)
        if (!upRes.ok) { toast.error(`"${file.name}": ${upData?.error || 'gagal diunggah'}`); continue }

        const res = await fetch('/api/admin/music', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: file.name.replace(/\.[^/.]+$/, ''),
            url: upData.url,
            duration,
            file_size: file.size,
            category: filterCat !== 'all' ? filterCat : undefined,
          }),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) { toast.error(`"${file.name}": ${data?.error || 'gagal disimpan'}`); continue }
        setTracks(prev => [...prev, data.track])
        ok++
      }
      if (ok > 0) toast.success(ok === 1 ? 'Lagu ditambahkan' : `${ok} lagu ditambahkan`)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function addFromUrl() {
    if (!addForm.title.trim() || !addForm.url.trim()) { toast.error('Judul dan URL wajib diisi'); return }
    setAddingUrl(true)
    try {
      const res = await fetch('/api/admin/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: addForm.title.trim(),
          artist: addForm.artist.trim(),
          category: addForm.category || catNames[0] || 'Lainnya',
          url: addForm.url.trim(),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { toast.error(data?.error || 'Lagu gagal ditambahkan'); return }
      setTracks(prev => [...prev, data.track])
      setAddForm({ title: '', artist: '', category: '', url: '' })
      setShowAddUrl(false)
      toast.success(`"${data.track.title}" ditambahkan`)
    } finally { setAddingUrl(false) }
  }

  async function patchTrack(id: string, patch: Record<string, unknown>): Promise<boolean> {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/music/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { toast.error(data?.error || 'Perubahannya gagal disimpan. Coba lagi ya.'); return false }
      // usage_count dari respons PATCH adalah kolom DB yang tidak dipakai lagi
      // (selalu 0). Angka yang benar dihitung saat memuat daftar, jadi nilai
      // yang sudah ada di layar dipertahankan.
      setTracks(prev => prev.map(t => (t.id === id ? { ...t, ...data.track, usage_count: t.usage_count } : t)))
      return true
    } finally { setBusyId(null) }
  }

  async function deleteTrack(track: MusicTrack) {
    setBusyId(track.id)
    try {
      const res = await fetch(`/api/admin/music/${track.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) { toast.error(data?.error || 'Lagunya gagal dihapus.'); return }
      setTracks(prev => prev.filter(t => t.id !== track.id))
      if (playingId === track.id) { audioRef.current?.pause(); setPlayingId(null) }
      setPendingDelete(null)
      toast.success('Lagunya sudah dihapus.')
    } finally { setBusyId(null) }
  }

  async function commitReorder(targetId: string) {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return }

    const ordered = [...tracks].sort((a, b) => a.sort_order - b.sort_order)
    const from = ordered.findIndex(t => t.id === dragId)
    const to = ordered.findIndex(t => t.id === targetId)
    if (from === -1 || to === -1) { setDragId(null); setDragOverId(null); return }

    const next = [...ordered]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    const renumbered = next.map((t, i) => ({ ...t, sort_order: i + 1 }))

    const previous = tracks
    setTracks(renumbered)          // optimistis — seretnya harus terasa instan
    setDragId(null)
    setDragOverId(null)

    const res = await fetch('/api/admin/music', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: renumbered.map(t => t.id) }),
    })
    if (!res.ok) {
      setTracks(previous)          // kembalikan kalau server menolak
      toast.error('Urutannya gagal disimpan. Coba lagi ya.')
    }
  }

  const totalDurationLabel = stats.duration > 0
    ? `${Math.floor(stats.duration / 60)} menit`
    : '—'

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/60">
      <input
        ref={fileRef}
        type="file"
        accept="audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/wav,audio/ogg,audio/aac,.mp3,.m4a,.wav,.ogg,.aac"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files?.length) handleUpload(e.target.files) }}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200/70 shrink-0">
        <div className="px-8 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900">Musik</h1>
              <p className="text-[11px] text-gray-400 truncate">
                Lagu yang bisa dipilih user untuk musik latar undangannya
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowCategories(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Tag className="w-4 h-4" /> Kategori
            </button>
            <button
              onClick={() => setShowAddUrl(v => !v)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Link2 className="w-4 h-4" /> Dari URL
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Mengunggah...' : 'Unggah Lagu'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-8 py-6 space-y-5">
          {/* Ringkasan — menggantikan tab "Statistik" tersendiri */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat icon={ListMusic}    label="Total lagu"            value={stats.total}         tone="bg-gray-100 text-gray-500" />
            <Stat icon={CheckCircle2} label="Aktif & bisa dipilih"  value={stats.active}        tone="bg-emerald-50 text-emerald-600" />
            <Stat icon={Users}        label="Undangan memakai lagu" value={stats.usage}         tone="bg-indigo-50 text-indigo-600" />
            <Stat icon={Clock}        label="Total durasi"          value={totalDurationLabel}  tone="bg-amber-50 text-amber-600" />
          </div>

          {/* Form tambah via URL */}
          {showAddUrl && (
            <div className="p-4 rounded-2xl bg-white border border-gray-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900">Tambah lagu dari URL</p>
                <button onClick={() => setShowAddUrl(false)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-2.5">
                <input
                  value={addForm.title}
                  onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Judul lagu *"
                  className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
                <input
                  value={addForm.artist}
                  onChange={e => setAddForm(f => ({ ...f, artist: e.target.value }))}
                  placeholder="Penyanyi"
                  className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
                <input
                  value={addForm.url}
                  onChange={e => setAddForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://... (berkas audio langsung) *"
                  className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 font-mono text-[12px]"
                />
                <select
                  value={addForm.category}
                  onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}
                  className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
                >
                  <option value="">Pilih kategori...</option>
                  {catNames.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={addFromUrl}
                  disabled={addingUrl || !addForm.title.trim() || !addForm.url.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  {addingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Tambahkan
                </button>
                <p className="text-[11px] text-gray-400">
                  URL harus menunjuk berkas audio langsung (bukan halaman YouTube/Spotify).
                </p>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari judul atau penyanyi..."
                className="w-full pl-9 pr-8 py-2.5 text-sm bg-white border border-gray-200/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
              />
              {search && (
                <button onClick={() => setSearch('')} aria-label="Hapus pencarian" className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-300 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className="px-3 py-2.5 text-sm bg-white border border-gray-200/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            >
              <option value="all">Semua kategori</option>
              {catNames.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="px-3 py-2.5 text-sm bg-white border border-gray-200/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            >
              {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>

            <label className="inline-flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200/70 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={e => setShowInactive(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-gray-900"
              />
              <span className="text-[12px] font-medium text-gray-600">Tampilkan nonaktif</span>
            </label>
          </div>

          {reorderable && tracks.length > 1 && (
            <p className="text-[11px] text-gray-400">
              Seret baris untuk mengubah urutan tampil di daftar pilihan user.
            </p>
          )}
          {!reorderable && sort === 'manual' && tracks.length > 1 && (
            <p className="text-[11px] text-gray-400">
              Urutan hanya bisa diubah saat daftar tidak difilter.
            </p>
          )}

          {/* Daftar */}
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
            </div>
          ) : tracks.length === 0 ? (
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files) }}
              className="py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
                <Music className="w-7 h-7 text-gray-300" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Perpustakaan masih kosong</h2>
              <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
                Seret berkas MP3 ke sini, atau unggah lewat tombol di atas.
              </p>
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                <Upload className="w-4 h-4" /> Unggah Lagu Pertama
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-semibold text-gray-700">Tidak ada lagu yang cocok</p>
              <button
                onClick={() => { setSearch(''); setFilterCat('all'); setShowInactive(true) }}
                className="mt-4 px-4 py-2 text-[12px] font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Reset filter
              </button>
            </div>
          ) : (
            <div
              className="space-y-1.5 pb-4"
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                // Berkas dari luar browser: unggah. Baris internal ditangani TrackRow.
                if (e.dataTransfer.files.length) { e.preventDefault(); handleUpload(e.dataTransfer.files) }
              }}
            >
              {visible.map(track => (
                <TrackRow
                  key={track.id}
                  track={track}
                  categories={catNames}
                  playing={playingId === track.id}
                  busy={busyId === track.id}
                  reorderable={reorderable}
                  dragging={dragId === track.id}
                  dragOver={dragOverId === track.id}
                  onTogglePlay={() => togglePlay(track)}
                  onToggleActive={() => patchTrack(track.id, { is_active: !track.is_active })}
                  onSave={patch => patchTrack(track.id, patch)}
                  onDelete={() => setPendingDelete(track)}
                  onDragStart={() => setDragId(track.id)}
                  onDragOver={() => setDragOverId(track.id)}
                  onDrop={() => commitReorder(track.id)}
                  onDragEnd={() => { setDragId(null); setDragOverId(null) }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <MusicCategoryDrawer
        open={showCategories}
        categories={categories}
        tracks={tracks}
        onClose={() => setShowCategories(false)}
        onChanged={(cats, tracksAffected) => {
          setCategories(cats)
          // Rename/hapus kategori memindahkan trek di server; salinan di layar
          // harus ikut disegarkan agar kategorinya tidak tampil basi.
          if (tracksAffected) load()
        }}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        busy={!!pendingDelete && busyId === pendingDelete.id}
        tone="danger"
        icon={Trash2}
        title="Hapus lagu?"
        message={pendingDelete
          ? <>
              <strong>{pendingDelete.title}</strong> ({formatDuration(pendingDelete.duration)}) akan dihapus dari perpustakaan.
              {pendingDelete.usage_count > 0 && (
                <span className="block mt-2 text-amber-600">
                  Sedang dipakai {pendingDelete.usage_count} undangan — pertimbangkan menonaktifkannya saja.
                </span>
              )}
            </>
          : ''}
        confirmLabel="Ya, hapus"
        onConfirm={() => pendingDelete && deleteTrack(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
