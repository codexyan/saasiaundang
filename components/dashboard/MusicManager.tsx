'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { Music, Play, Pause, Loader2, Search, Trash2, Upload } from 'lucide-react'
import type { Invitation, MusicTrack } from '@/lib/types'

interface Props {
  invitation: Invitation
  onSaved?: (inv: Invitation) => void
}

export default function MusicManager({ invitation, onSaved }: Props) {
  const [musicUrl, setMusicUrl] = useState(invitation.data.musicUrl || '')
  const [musicTitle, setMusicTitle] = useState(invitation.data.musicTitle || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [library, setLibrary] = useState<MusicTrack[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loadingLib, setLoadingLib] = useState(true)
  const [filterCat, setFilterCat] = useState('all')
  const [search, setSearch] = useState('')

  const [previewId, setPreviewId] = useState<string | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const [playingCurrent, setPlayingCurrent] = useState(false)

  useEffect(() => {
    fetch('/api/music')
      .then(r => r.json())
      .then(data => {
        setLibrary(data.tracks || [])
        setCategories(data.categories || [])
      })
      .catch(() => {})
      .finally(() => setLoadingLib(false))
  }, [])

  useEffect(() => {
    // Capture refs at cleanup time so we pause whichever audio is actually
    // playing when the component unmounts (values are intentionally read late).
    const previewAudio = previewAudioRef
    const currentAudio = currentAudioRef
    return () => {
      previewAudio.current?.pause()
      currentAudio.current?.pause()
    }
  }, [])

  const saveMusic = useCallback(async (url: string, title: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/invitations/${invitation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { ...invitation.data, musicUrl: url, musicTitle: title },
        }),
      })
      if (!res.ok) throw new Error()
      const { invitation: updated } = await res.json()
      onSaved?.(updated)
    } catch {
      toast.error('Musiknya gagal disimpan. Coba lagi ya.')
    } finally {
      setSaving(false)
    }
  }, [invitation.id, invitation.data, onSaved])

  function togglePreview(track: MusicTrack) {
    if (previewId === track.id) {
      previewAudioRef.current?.pause()
      setPreviewId(null)
      return
    }
    previewAudioRef.current?.pause()
    const audio = new Audio(track.url)
    audio.onended = () => setPreviewId(null)
    audio.onerror = () => { toast.error('Musiknya belum bisa diputar. Coba lagi ya.'); setPreviewId(null) }
    previewAudioRef.current = audio
    audio.play().then(() => setPreviewId(track.id)).catch(() => {
      toast.error('Musiknya belum bisa diputar. Coba lagi ya.')
      setPreviewId(null)
    })
  }

  function togglePlayCurrent() {
    if (!currentAudioRef.current) return
    if (playingCurrent) {
      currentAudioRef.current.pause()
      setPlayingCurrent(false)
    } else {
      currentAudioRef.current.play()
      setPlayingCurrent(true)
    }
  }

  async function handleChoosePreset(track: MusicTrack) {
    previewAudioRef.current?.pause()
    setPreviewId(null)
    setMusicUrl(track.url)
    const title = track.artist ? `${track.title} - ${track.artist}` : track.title
    setMusicTitle(title)
    setPlayingCurrent(false)
    await saveMusic(track.url, title)
    toast.success(`Musik dipilih: ${track.title}`)
    fetch(`/api/music/${track.id}/usage`, { method: 'POST' }).catch(() => {})
  }

  async function removeMusic() {
    currentAudioRef.current?.pause()
    setPlayingCurrent(false)
    setMusicUrl('')
    setMusicTitle('')
    await saveMusic('', '')
    toast.success('Musiknya sudah dihapus.')
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'audio/mpeg': ['.mp3'], 'audio/ogg': ['.ogg'] },
    maxSize: 20 * 1024 * 1024,
    maxFiles: 1,
    disabled: uploading,
    onDropAccepted: handleUpload,
    onDropRejected: () => toast.error('Musiknya harus MP3 atau OGG, maksimal 20MB ya.'),
  })

  async function handleUpload(files: File[]) {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', files[0])
    formData.append('invitationId', invitation.id)

    try {
      const res = await fetch('/api/galleries/music', { method: 'POST', body: formData })
      if (!res.ok) throw new Error()
      const { musicUrl: url, musicTitle: title } = await res.json()
      setMusicUrl(url)
      setMusicTitle(title || files[0].name)
      setPreviewId(null)
      previewAudioRef.current?.pause()
      onSaved?.({ ...invitation, data: { ...invitation.data, musicUrl: url, musicTitle: title || files[0].name } })
      toast.success('Musiknya sudah masuk!')
    } catch {
      toast.error('Musiknya gagal dikirim. Coba lagi ya.')
    } finally {
      setUploading(false)
    }
  }

  const filtered = library.filter(t => {
    if (filterCat !== 'all' && t.category !== filterCat) return false
    if (search) {
      const q = search.toLowerCase()
      return t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="space-y-5">
      {/* Current music */}
      {musicUrl && (
        <div className="rounded-2xl border-2 border-gold-300 bg-gold-50 p-4">
          <audio
            ref={currentAudioRef}
            src={musicUrl}
            onEnded={() => setPlayingCurrent(false)}
          />
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayCurrent}
              className="w-11 h-11 rounded-xl bg-gold-500 text-white hover:bg-gold-600 flex items-center justify-center transition-colors shrink-0"
            >
              {playingCurrent ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-stone-900 truncate">{musicTitle || 'Musik Terpasang'}</p>
              <p className="text-[11px] text-stone-500 truncate">{musicUrl}</p>
            </div>
            <button
              onClick={removeMusic}
              disabled={saving}
              className="w-9 h-9 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center transition-colors shrink-0"
              title="Hapus musik"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Library section */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center gap-2 mb-3">
          <Music size={16} className="text-stone-500" />
          <h3 className="text-sm font-bold text-stone-900">Perpustakaan Musik</h3>
          {saving && <Loader2 size={14} className="animate-spin text-stone-400" />}
        </div>

        {/* Search & filter */}
        {library.length > 4 && (
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Cari lagu..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-stone-200 rounded-xl focus:ring-1 focus:ring-gold-500 focus:border-gold-500 outline-none"
              />
            </div>
            {categories.length > 1 && (
              <select
                value={filterCat}
                onChange={e => setFilterCat(e.target.value)}
                className="px-3 py-2 text-sm border border-stone-200 rounded-xl focus:ring-1 focus:ring-gold-500 outline-none bg-white"
              >
                <option value="all">Semua</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
        )}

        {loadingLib ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-stone-400" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-6">
            {library.length === 0 ? 'Belum ada musik tersedia' : 'Tidak ditemukan'}
          </p>
        ) : (
          <div className="space-y-1.5 max-h-80 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {filtered.map(track => {
              const isSelected = musicUrl === track.url
              const isPreviewing = previewId === track.id
              return (
                <div
                  key={track.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isSelected
                      ? 'border-2 border-gold-400 bg-gold-50'
                      : 'border border-stone-100 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => togglePreview(track)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isPreviewing
                        ? 'bg-gold-500 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-gold-100'
                    }`}
                    title={isPreviewing ? 'Stop preview' : 'Preview'}
                  >
                    {isPreviewing ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{track.title}</p>
                    <p className="text-xs text-stone-500 truncate">
                      {track.artist || track.category}
                      {track.usage_count > 0 && (
                        <span className="text-stone-400"> · {track.usage_count}x dipilih</span>
                      )}
                    </p>
                  </div>
                  {track.category && (
                    <span className="hidden sm:inline text-[10px] font-medium text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md shrink-0">
                      {track.category}
                    </span>
                  )}
                  {isSelected ? (
                    <span className="text-[10px] font-bold text-gold-600 bg-gold-100 px-2.5 py-1 rounded-lg shrink-0">
                      Dipilih
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleChoosePreset(track)}
                      disabled={saving}
                      className="px-3 py-1.5 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors shrink-0 disabled:opacity-50"
                    >
                      Pilih
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Upload custom */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
          <Upload size={14} className="text-stone-500" />
          Upload Musik Sendiri
        </h3>
        <div
          {...getRootProps()}
          className={`rounded-xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
            isDragActive
              ? 'border-gold-400 bg-gold-50'
              : 'border-stone-200 hover:border-gold-300 hover:bg-stone-50'
          } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <Loader2 size={24} className="mx-auto mb-2 animate-spin text-gold-500" />
          ) : (
            <Music size={24} className="mx-auto mb-2 text-stone-300" />
          )}
          <p className="text-sm font-medium text-stone-600">
            {uploading ? 'Mengupload...' : 'Klik atau seret file musik ke sini'}
          </p>
          <p className="text-xs text-stone-400 mt-1">MP3 / OGG, max 20MB</p>
        </div>
      </div>
    </div>
  )
}
