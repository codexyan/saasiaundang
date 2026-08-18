'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Play, Pause, Pencil, Trash2, Check, X, GripVertical, Users, Loader2,
} from 'lucide-react'
import type { MusicTrack } from '@/lib/types'
import { formatDuration, formatFileSize } from './audio-meta'

export interface TrackRowProps {
  track: MusicTrack
  categories: string[]
  playing: boolean
  busy: boolean
  /** Reorder hanya masuk akal saat daftar tidak sedang difilter/disortir. */
  reorderable: boolean
  dragging: boolean
  dragOver: boolean
  onTogglePlay: () => void
  onToggleActive: () => void
  onSave: (patch: { title: string; artist: string; category: string }) => Promise<boolean>
  onDelete: () => void
  onDragStart: () => void
  onDragOver: () => void
  onDrop: () => void
  onDragEnd: () => void
}

const inputCls = 'px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400'

export default function TrackRow({
  track, categories, playing, busy, reorderable, dragging, dragOver,
  onTogglePlay, onToggleActive, onSave, onDelete,
  onDragStart, onDragOver, onDrop, onDragEnd,
}: TrackRowProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: track.title, artist: track.artist, category: track.category })
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setForm({ title: track.title, artist: track.artist, category: track.category })
      requestAnimationFrame(() => titleRef.current?.focus())
    }
  }, [editing, track.title, track.artist, track.category])

  async function commit() {
    if (!form.title.trim()) return
    setSaving(true)
    const ok = await onSave({ title: form.title.trim(), artist: form.artist.trim(), category: form.category })
    setSaving(false)
    if (ok) setEditing(false)
  }

  return (
    <div
      draggable={reorderable && !editing}
      onDragStart={onDragStart}
      onDragOver={e => { e.preventDefault(); onDragOver() }}
      onDrop={e => { e.preventDefault(); onDrop() }}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-white transition-all ${
        dragOver ? 'border-gray-900 ring-2 ring-gray-900/10' : 'border-gray-200/70'
      } ${dragging ? 'opacity-40' : ''} ${busy ? 'opacity-50 pointer-events-none' : ''} ${
        track.is_active ? '' : 'bg-gray-50/70'
      }`}
    >
      {reorderable && (
        <span
          className="shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500"
          title="Seret untuk mengubah urutan"
        >
          <GripVertical className="w-4 h-4" />
        </span>
      )}

      <button
        onClick={onTogglePlay}
        aria-label={playing ? `Hentikan ${track.title}` : `Putar ${track.title}`}
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
          playing ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
      </button>

      {editing ? (
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            ref={titleRef}
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
            placeholder="Judul lagu"
            className={inputCls}
          />
          <input
            value={form.artist}
            onChange={e => setForm(f => ({ ...f, artist: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
            placeholder="Penyanyi"
            className={inputCls}
          />
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className={`${inputCls} bg-white`}
          >
            {/* Kategori lama yang sudah tidak ada di daftar tetap ditawarkan,
                supaya membuka form edit tidak diam-diam memindahkan trek. */}
            {!categories.includes(form.category) && <option value={form.category}>{form.category}</option>}
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      ) : (
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-semibold truncate ${track.is_active ? 'text-gray-900' : 'text-gray-400'}`}>
              {track.title}
            </p>
            {!track.is_active && (
              <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                NONAKTIF
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
            <span className="truncate">{track.artist || 'Tanpa penyanyi'}</span>
            <span className="w-0.5 h-0.5 rounded-full bg-gray-300 shrink-0" />
            <span className="shrink-0">{track.category}</span>
            <span className="w-0.5 h-0.5 rounded-full bg-gray-300 shrink-0" />
            <span className="shrink-0 tabular-nums">{formatDuration(track.duration)}</span>
            <span className="w-0.5 h-0.5 rounded-full bg-gray-300 shrink-0 hidden sm:inline-block" />
            <span className="shrink-0 hidden sm:inline">{formatFileSize(track.file_size)}</span>
          </div>
        </div>
      )}

      <span
        title={`Dipakai ${track.usage_count} undangan`}
        className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg ${
          track.usage_count > 0 ? 'bg-indigo-50 text-indigo-600' : 'text-gray-300'
        }`}
      >
        <Users className="w-3 h-3" />{track.usage_count}
      </span>

      {editing ? (
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={commit} disabled={saving || !form.title.trim()} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-40 transition-colors" aria-label="Simpan">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button onClick={() => setEditing(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Batal">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleActive}
            title={track.is_active ? 'Sembunyikan dari pilihan user' : 'Tampilkan ke user'}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${track.is_active ? 'bg-emerald-500' : 'bg-gray-200'}`}
            aria-label={track.is_active ? 'Nonaktifkan' : 'Aktifkan'}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${track.is_active ? 'translate-x-[19px]' : 'translate-x-[3px]'}`} />
          </button>
          <button onClick={() => setEditing(true)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" aria-label={`Ubah ${track.title}`}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" aria-label={`Hapus ${track.title}`}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
