'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import {
  Palette, Type, Layers, Sparkles, Play,
  Rocket, X, Undo2, Redo2, ArrowLeft,
  Settings2, Loader2, CloudUpload, CircleAlert, RotateCcw,
} from 'lucide-react'
import type { TemplateMeta, ColorScheme, OpeningConfig, MusicConfig, TemplateCategory, ColorPalette } from '@/lib/types'
import type { TemplateRecord, NewInvitationData, SectionType } from '@/lib/types'
import ConfirmDialog from '@/components/admin/ui/ConfirmDialog'
import StatusBadge from '@/components/admin/ui/StatusBadge'

// Konstanta, subkomponen stateless, dan pembungkus field ada di ./parts/*.
import {
  PREVIEW_DATA_DEFAULT, COLOR_PALETTES,
  HEADING_FONTS, BODY_FONTS, makeId, deepClone, DEFAULT_MUSIC_CFG,
  type ConfigTab,
} from './parts/constants'

// Isi tiap tab hidup di berkas sendiri; berkas ini tinggal kerangkanya —
// state, persistensi, pratinjau, dan bingkai UI.
import { EditorProvider, type EditorContextValue } from './EditorContext'
import AppearancePanel from './panels/AppearancePanel'
import OpeningPanel from './panels/OpeningPanel'
import DecorPanel from './panels/DecorPanel'
import ContentPanel from './panels/ContentPanel'
import MusicPanel from './panels/MusicPanel'
import EditorPreview from './panels/EditorPreview'

/** Jeda autosave. Cukup lama supaya satu tarikan slider warna tidak jadi
 *  belasan request, cukup pendek supaya tidak ada yang hilang saat tab
 *  ditutup mendadak. */
const AUTOSAVE_DELAY_MS = 1200

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

interface TemplateEditorProps {
  /** Template yang sedang digarap. Selalu ada — editor tidak lagi bisa
   *  dibuka tanpa record, karena setiap template kini punya baris DB sejak
   *  detik pertama dibuat. */
  record: TemplateRecord
  categories: TemplateCategory[]
  palettes: ColorPalette[]
  onExit: () => void
  /** Dipanggil setiap kali server mengonfirmasi perubahan record. */
  onRecordChange: (rec: TemplateRecord) => void
  onOpenSettings: () => void
}

/**
 * Editor desain template.
 *
 * Perubahan besar dibanding "Template Lab" yang digantikannya:
 *
 * 1. Draf disimpan ke DATABASE, bukan localStorage browser. Dulu seluruh
 *    eksperimen admin hidup di localStorage: hilang begitu ganti perangkat,
 *    ganti browser, atau membersihkan data — dan tidak pernah terlihat admin
 *    lain.
 * 2. Autosave menulis ke kolom `draft_config`, terpisah dari `config` yang
 *    dilihat pengunjung. Jadi mengedit template yang SUDAH TERBIT tidak lagi
 *    langsung mengubah undangan pelanggan di tengah admin bereksperimen.
 * 3. Tidak ada lagi tombol "Simpan Draf" yang diam-diam tidak melakukan apa
 *    pun saat mode edit lalu menampilkan toast "Draf tersimpan" (bug lama:
 *    kerjaan hilang dengan pesan sukses).
 * 4. Identitas dan harga template tidak diketik di sini lagi — tempatnya di
 *    panel Pengaturan, satu tempat untuk satu template.
 */
export default function TemplateEditor({
  record, categories, palettes: palettesProp, onExit, onRecordChange, onOpenSettings,
}: TemplateEditorProps) {
  // Editor selalu menggarap draf. Kalau belum ada draf, mulai dari versi terbit.
  const [config, setConfig] = useState<TemplateRecord>(() => {
    const base = deepClone(record)
    if (record.draft_config) base.config = deepClone(record.draft_config)
    return base
  })
  const [activeTab, _setActiveTab] = useState<ConfigTab>('tampilan')
  const tabContentRef = useRef<HTMLDivElement>(null)
  const setActiveTab = useCallback((tab: ConfigTab) => { _setActiveTab(tab); tabContentRef.current?.scrollTo(0, 0) }, [])
  const withPreservedScroll = useCallback((fn: () => void) => {
    const y = tabContentRef.current?.scrollTop ?? 0
    fn()
    requestAnimationFrame(() => tabContentRef.current?.scrollTo(0, y))
  }, [])
  const [previewMode, setPreviewMode] = useState<'invitation' | 'opening' | 'loading'>('opening')
  const [previewGuestName, setPreviewGuestName] = useState('Bapak Budi dan Keluarga')
  const [previewData, setPreviewData] = useState<NewInvitationData>(PREVIEW_DATA_DEFAULT)
  // Konversi COLOR_PALETTES (hardcoded) ke shape ColorPalette kalau tidak ada prop.
  const paletteList: { name: string; cat: string; p: string; a: string; t: string; bg: string }[] = useMemo(() => {
    if (palettesProp && palettesProp.length > 0) {
      return palettesProp.map(p => ({ name: p.name, cat: p.group, p: p.primary, a: p.accent, t: p.text, bg: p.background }))
    }
    return COLOR_PALETTES
  }, [palettesProp])

  const paletteGroups: string[] = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const p of paletteList) if (!seen.has(p.cat)) { seen.add(p.cat); out.push(p.cat) }
    return out
  }, [paletteList])
  const [expandedSectionId, setExpandedSectionId]   = useState<string | null>(null)
  const [draggingSectionId, setDraggingSectionId]   = useState<string | null>(null)
  const [dragOverSectionId, setDragOverSectionId]   = useState<string | null>(null)
  const [lockedSectionIds, setLockedSectionIds]     = useState<Set<string>>(new Set())
  const [dragModeEnabled, setDragModeEnabled]       = useState(false)
  const [musicLibraryCat, setMusicLibraryCat]       = useState('Semua')
  const [musicPreviewId, setMusicPreviewId]         = useState<string | null>(null)
  const [musicLibrary, setMusicLibrary]             = useState<{ id: string; title: string; artist: string; category: string; url: string }[]>([])
  const [musicLibraryCats, setMusicLibraryCats]     = useState<string[]>([])
  const musicAudioRef = useRef<HTMLAudioElement | null>(null)
  const [previewPlaying, setPreviewPlaying]         = useState(false)
  const [previewLoading, setPreviewLoading]         = useState(false)
  const [decorPreviewKey, setDecorPreviewKey]       = useState(0)
  const [decorEditMode, setDecorEditMode]          = useState(false)
  const [selectedAssetId, setSelectedAssetId]      = useState<string | null>(null)
  const [decorScope, setDecorScope]                = useState<'opening' | string>('opening')
  const [sectionReplay, setSectionReplay]           = useState<{ id: string; key: number } | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [showPublish, setShowPublish] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [hasPendingDraft, setHasPendingDraft] = useState(!!record.draft_config)
  const [previewKey, setPreviewKey] = useState(0)
  const [showFullscreen, setShowFullscreen] = useState(false)

  useEffect(() => {
    const allFonts = Array.from(new Set([...HEADING_FONTS, ...BODY_FONTS]))
    const families = allFonts.map(f => `family=${f.replace(/ /g, '+')}:wght@300;400;600;700`).join('&')
    const href = `https://fonts.googleapis.com/css2?${families}&display=swap`
    if (document.querySelector('link[data-gf-lab]')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.setAttribute('data-gf-lab', '1')
    document.head.appendChild(link)
  }, [])

  useEffect(() => {
    const customs = config.config.meta.font.custom_fonts ?? []
    customs.forEach(cf => {
      const id = `cf-${cf.name.replace(/\s+/g, '-')}`
      if (document.querySelector(`[data-cf="${id}"]`)) return
      if (cf.url.includes('googleapis')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = cf.url
        link.setAttribute('data-cf', id)
        document.head.appendChild(link)
      } else {
        const ext = cf.url.split('.').pop()?.toLowerCase()
        const format = ext === 'woff2' ? 'woff2' : ext === 'woff' ? 'woff' : ext === 'ttf' ? 'truetype' : 'opentype'
        const style = document.createElement('style')
        style.textContent = `@font-face { font-family: '${cf.name}'; src: url('${cf.url}') format('${format}'); font-display: swap; }`
        style.setAttribute('data-cf', id)
        document.head.appendChild(style)
      }
    })
  }, [config.config.meta.font.custom_fonts])


  useEffect(() => {
    if (activeTab !== 'opening' && activeTab !== 'decor') { setDecorEditMode(false); setSelectedAssetId(null) }
    if (activeTab === 'decor') {
      if (decorScope === 'opening') { setPreviewMode('opening'); setDecorEditMode(true) }
      else { setPreviewMode('invitation'); setDecorEditMode(false) }
    }
    else if (activeTab === 'tampilan' || activeTab === 'opening') setPreviewMode('opening')
    else if (activeTab === 'konten' || activeTab === 'music') setPreviewMode('invitation')
    if (activeTab !== 'music') {
      musicAudioRef.current?.pause()
      setMusicPreviewId(null)
    }
  }, [activeTab, decorScope])

  const toggleMusicPreview = useCallback((songId: string, songUrl: string) => {
    if (musicPreviewId === songId) {
      musicAudioRef.current?.pause()
      setMusicPreviewId(null)
      return
    }
    if (musicAudioRef.current) { musicAudioRef.current.pause(); musicAudioRef.current.src = '' }
    const audio = new Audio(songUrl)
    audio.volume = 0.4
    audio.onended = () => setMusicPreviewId(null)
    audio.onerror = () => { toast.error('Gagal memutar preview. File belum tersedia'); setMusicPreviewId(null) }
    musicAudioRef.current = audio
    audio.play().then(() => setMusicPreviewId(songId)).catch(() => { toast.error('Musiknya belum bisa diputar. Coba lagi ya.'); setMusicPreviewId(null) })
  }, [musicPreviewId])

  useEffect(() => {
    return () => { musicAudioRef.current?.pause() }
  }, [])

  useEffect(() => {
    fetch('/api/admin/music')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.tracks) setMusicLibrary(data.tracks)
        // /api/admin/music returns categories as MusicCategory objects; extract
        // the name so musicLibraryCats stays string[] (rendered as filter labels).
        if (data?.categories?.length) setMusicLibraryCats(data.categories.map((c: { name: string }) => c.name))
      })
      .catch(() => {})
  }, [])

  // Derived
  const cfg = config.config
  const sections = useMemo(
    () => [...cfg.sections].sort((a, b) => a.order - b.order),
    [cfg.sections]
  )

  //  Change tracking + Undo/Redo 
  const historyRef = useRef<string[]>([JSON.stringify(config.config)])
  const historyIndexRef = useRef(0)
  const isUndoRedoRef = useRef(false)
  const MAX_HISTORY = 80

  // Riwayat undo/redo. Penghitung "N perubahan belum tersimpan" yang dulu
  // ikut dihitung di sini sudah dibuang: statusnya kini datang dari autosave
  // (tersimpan / menunggu / gagal), dan perhitungan lamanya menjalankan
  // belasan JSON.stringify pada seluruh config setiap kali admin menggeser
  // satu slider warna.
  useEffect(() => {
    const current = JSON.stringify(config.config)

    if (!isUndoRedoRef.current) {
      const stack = historyRef.current
      const idx = historyIndexRef.current
      if (stack[idx] !== current) {
        historyRef.current = [...stack.slice(0, idx + 1), current].slice(-MAX_HISTORY)
        historyIndexRef.current = historyRef.current.length - 1
      }
    }
    isUndoRedoRef.current = false
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.config])

  const canUndo = historyIndexRef.current > 0
  const canRedo = historyIndexRef.current < historyRef.current.length - 1

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current -= 1
    isUndoRedoRef.current = true
    const restored = JSON.parse(historyRef.current[historyIndexRef.current])
    setConfig(prev => ({ ...prev, config: restored }))
  }, [])

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return
    historyIndexRef.current += 1
    isUndoRedoRef.current = true
    const restored = JSON.parse(historyRef.current[historyIndexRef.current])
    setConfig(prev => ({ ...prev, config: restored }))
  }, [])

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  //  Updaters 
  const updateMeta = useCallback((patch: Partial<TemplateMeta>) => {
    setConfig(prev => ({
      ...prev,
      config: { ...prev.config, meta: { ...prev.config.meta, ...patch } },
    }))
  }, [])

  const updateColors = useCallback((key: keyof ColorScheme, val: string) => {
    setConfig(prev => ({
      ...prev,
      config: {
        ...prev.config,
        meta: {
          ...prev.config.meta,
          color_scheme: { ...prev.config.meta.color_scheme, [key]: val },
        },
      },
    }))
  }, [])

  const updateFont = useCallback((key: 'heading' | 'body', val: string) => {
    setConfig(prev => ({
      ...prev,
      config: {
        ...prev.config,
        meta: { ...prev.config.meta, font: { ...prev.config.meta.font, [key]: val } },
      },
    }))
  }, [])

  const updateOpening = useCallback((patch: Partial<OpeningConfig>) => {
    setConfig(prev => ({
      ...prev,
      config: { ...prev.config, opening: { ...prev.config.opening, ...patch } },
    }))
  }, [])

  const musicCfg: MusicConfig = { ...DEFAULT_MUSIC_CFG, ...cfg.music }

  const updateMusic = useCallback((patch: Partial<MusicConfig>) => {
    setConfig(prev => ({
      ...prev,
      config: {
        ...prev.config,
        music: { ...DEFAULT_MUSIC_CFG, ...(prev.config.music ?? {}), ...patch },
      },
    }))
  }, [])

  const updateSection = useCallback((sectionId: string, patch: Record<string, unknown>) => {
    setConfig(prev => ({
      ...prev,
      config: {
        ...prev.config,
        sections: prev.config.sections.map(s => s.id === sectionId ? { ...s, ...patch } : s),
      },
    }))
  }, [])

  const moveSection = useCallback((sectionId: string, dir: 'up' | 'down') => {
    setConfig(prev => {
      const sorted = [...prev.config.sections].sort((a, b) => a.order - b.order)
      const idx = sorted.findIndex(s => s.id === sectionId)
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev
      if (lockedSectionIds.has(sorted[swapIdx].id)) return prev
      const newSections = sorted.map((s, i) => ({ ...s, order: i + 1 }))
      const tmp = newSections[idx].order
      newSections[idx] = { ...newSections[idx], order: newSections[swapIdx].order }
      newSections[swapIdx] = { ...newSections[swapIdx], order: tmp }
      return { ...prev, config: { ...prev.config, sections: newSections } }
    })
  }, [lockedSectionIds])

  const addSection = useCallback((type: string) => {
    const maxOrder = Math.max(0, ...cfg.sections.map(s => s.order))
    const newSection = {
      id: type + '-' + makeId(),
      type: type as SectionType,
      order: maxOrder + 1,
      enabled: true,
      background: { type: 'color' as const, value: cfg.meta.color_scheme.primary },
      decoration_images: [] as string[],
      transition_in: 'fade' as const,
      transition_out: 'fade' as const,
      user_fields: [] as string[],
    }
    setConfig(prev => ({
      ...prev,
      config: { ...prev.config, sections: [...prev.config.sections, newSection] },
    }))
  }, [cfg])

  const removeSection = useCallback((sectionId: string) => {
    setConfig(prev => ({
      ...prev,
      config: { ...prev.config, sections: prev.config.sections.filter(s => s.id !== sectionId) },
    }))
  }, [])

  const handleSectionDrop = useCallback((targetId: string) => {
    if (!draggingSectionId || draggingSectionId === targetId) return
    if (lockedSectionIds.has(draggingSectionId) || lockedSectionIds.has(targetId)) return
    setConfig(prev => {
      const sorted = [...prev.config.sections].sort((a, b) => a.order - b.order)
      const fromIdx = sorted.findIndex(s => s.id === draggingSectionId)
      const toIdx   = sorted.findIndex(s => s.id === targetId)
      if (fromIdx === -1 || toIdx === -1) return prev
      const reordered = [...sorted]
      const [moved] = reordered.splice(fromIdx, 1)
      reordered.splice(toIdx, 0, moved)
      return {
        ...prev,
        config: { ...prev.config, sections: reordered.map((s, i) => ({ ...s, order: i + 1 })) },
      }
    })
    setDraggingSectionId(null)
    setDragOverSectionId(null)
  }, [draggingSectionId, lockedSectionIds])

  //  Persistensi: autosave draf, terbitkan, buang draf

  /** Snapshot terakhir yang SUDAH tersimpan di server. Pembanding untuk
   *  memutuskan perlu-tidaknya autosave berikutnya. */
  const savedSnapshotRef = useRef(JSON.stringify(record.draft_config ?? record.config))
  /** Simpan yang sedang berjalan. Dipegang sebagai PROMISE, bukan boolean:
   *  pemanggil yang datang di tengah simpan (mis. menekan Terbitkan tepat saat
   *  autosave jalan) harus MENUNGGU hasilnya, bukan langsung menyerah dan
   *  menerbitkan config yang belum sampai server. */
  const inFlightRef = useRef<Promise<boolean> | null>(null)
  const configRef = useRef(config.config)

  // Ditulis di efek, bukan saat render: menyentuh ref selama render membuat
  // hasilnya bergantung pada berapa kali React memutuskan merender ulang.
  useEffect(() => { configRef.current = config.config }, [config.config])

  const saveDraft = useCallback(async (): Promise<boolean> => {
    if (inFlightRef.current) await inFlightRef.current

    const snapshot = JSON.stringify(configRef.current)
    if (snapshot === savedSnapshotRef.current) return true

    setSaveState('saving')
    const attempt = (async (): Promise<boolean> => {
      try {
        const res = await fetch(`/api/admin/template-records/${record.id}/draft`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config: JSON.parse(snapshot) }),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          setSaveState('error')
          toast.error(data?.error || 'Draf gagal disimpan. Perubahan masih ada di layar ini.')
          return false
        }
        savedSnapshotRef.current = snapshot
        setHasPendingDraft(true)
        setSaveState('saved')
        setLastSavedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))
        if (data?.record) onRecordChange(data.record)
        return true
      } catch {
        setSaveState('error')
        toast.error('Draf gagal disimpan — periksa koneksi.')
        return false
      }
    })()

    inFlightRef.current = attempt
    try { return await attempt }
    finally { if (inFlightRef.current === attempt) inFlightRef.current = null }
  }, [record.id, onRecordChange])

  // Autosave: setiap perubahan config menjadwalkan satu simpan.
  useEffect(() => {
    if (JSON.stringify(config.config) === savedSnapshotRef.current) return
    setSaveState('dirty')
    const timer = setTimeout(() => { saveDraft() }, AUTOSAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [config.config, saveDraft])

  // Jaring pengaman terakhir: kalau tab ditutup sementara autosave belum
  // sempat jalan, browser menampilkan konfirmasi bawaan. Tanpa ini perubahan
  // dalam jeda 1,2 detik terakhir hilang tanpa jejak.
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (JSON.stringify(configRef.current) !== savedSnapshotRef.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  /**
   * Simpan terakhir saat editor dilepas.
   *
   * Panel admin me-render tab secara bersyarat, jadi berpindah dari tab
   * Template MELEPAS editor ini — dan cleanup autosave membatalkan timer yang
   * sedang menunggu. Tanpa ini, perubahan dalam 1,2 detik terakhir hilang
   * diam-diam: persis kelas bug yang dibuang bersama tombol "Simpan Draf &
   * Pergi" yang lama.
   *
   * Sengaja tanpa await — komponen sudah dilepas dan tidak ada lagi yang bisa
   * menunggu. fetch() yang sudah berangkat tetap diselesaikan browser selama
   * halamannya tidak ikut ditutup, dan untuk kasus halaman ditutup sudah ada
   * penjaga beforeunload di atas.
   */
  const saveDraftRef = useRef(saveDraft)
  useEffect(() => { saveDraftRef.current = saveDraft }, [saveDraft])
  useEffect(() => () => { void saveDraftRef.current() }, [])

  /** Keluar dari editor. Simpan dulu apa pun yang belum tersimpan — tidak ada
   *  lagi dialog "tinggalkan tanpa menyimpan", karena draf memang selalu aman
   *  disimpan (yang dilihat pengunjung tetap versi terbit).
   *
   *  Kalau simpannya GAGAL, editor tidak ditutup: menutupnya berarti membuang
   *  pekerjaan yang belum sampai server — persis kegagalan diam-diam yang dulu
   *  terjadi lewat tombol "Simpan Draf & Pergi". */
  const exitEditor = useCallback(async () => {
    const ok = await saveDraft()
    if (!ok) {
      toast.error('Draf belum tersimpan, jadi editor tidak ditutup. Coba simpan lagi.')
      return
    }
    onExit()
  }, [saveDraft, onExit])

  async function publish(status: 'draft' | 'active') {
    setPublishing(true)
    try {
      // Pastikan draf terbaru sudah di server sebelum dinaikkan jadi versi
      // terbit. Kalau gagal, HENTIKAN — menerbitkan tanpa ini akan menaikkan
      // config lama dan diam-diam membuang perubahan terakhir admin.
      if (!(await saveDraft())) {
        toast.error('Perubahan terakhir belum tersimpan, jadi belum bisa diterbitkan.')
        return
      }

      const res = await fetch(`/api/admin/template-records/${record.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { toast.error(data?.error || 'Template gagal diterbitkan'); return }

      savedSnapshotRef.current = JSON.stringify(data.record.config)
      setHasPendingDraft(false)
      setSaveState('saved')
      setConfig(prev => ({ ...prev, ...data.record, config: data.record.config }))
      onRecordChange(data.record)
      setShowPublish(false)
      toast.success(
        status === 'active'
          ? `"${data.record.name}" terbit — pengunjung sudah melihat versi ini`
          : 'Perubahan tersimpan sebagai versi terbit (masih draft)',
      )
    } finally {
      setPublishing(false)
    }
  }

  async function discardDraft() {
    setPublishing(true)
    try {
      const res = await fetch(`/api/admin/template-records/${record.id}/draft`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) { toast.error(data?.error || 'Draf gagal dibuang'); return }

      const restored = data.record as TemplateRecord
      savedSnapshotRef.current = JSON.stringify(restored.config)
      setHasPendingDraft(false)
      setSaveState('idle')
      setConfig({ ...restored, config: deepClone(restored.config) })
      setPreviewKey(k => k + 1)
      setDecorPreviewKey(k => k + 1)
      onRecordChange(restored)
      setConfirmDiscard(false)
      toast.success('Kembali ke versi terbit')
    } finally {
      setPublishing(false)
    }
  }

  const categoryLabel = useMemo(
    () => categories.find(c => c.slug === record.category)?.label ?? record.category,
    [categories, record.category],
  )

  // Dirakit tiap render dengan sengaja: hanya satu panel yang ter-mount pada
  // satu waktu, jadi memoisasi di sini tidak mencegah render apa pun — hanya
  // menambah daftar dependensi sepanjang 50 baris yang mudah tertinggal.
  const editorValue: EditorContextValue = {
    record, config, setConfig, cfg, sections, musicCfg,
    categories, palettes: paletteList, paletteGroups,

    updateMeta, updateColors, updateFont, updateOpening, updateMusic,
    updateSection, moveSection, addSection, removeSection, handleSectionDrop,

    previewMode, setPreviewMode, previewData, setPreviewData,
    previewGuestName, setPreviewGuestName,
    previewKey, setPreviewKey, decorPreviewKey, setDecorPreviewKey,
    previewPlaying, setPreviewPlaying, previewLoading, setPreviewLoading,
    showFullscreen, setShowFullscreen, sectionReplay, setSectionReplay,

    undo, redo, canUndo, canRedo,

    expandedSectionId, setExpandedSectionId,
    draggingSectionId, setDraggingSectionId,
    dragOverSectionId, setDragOverSectionId,
    lockedSectionIds, setLockedSectionIds,
    dragModeEnabled, setDragModeEnabled,

    decorScope, setDecorScope, decorEditMode, setDecorEditMode,
    selectedAssetId, setSelectedAssetId,

    musicLibrary, musicLibraryCats, musicLibraryCat, setMusicLibraryCat,
    musicPreviewId, setMusicPreviewId, musicAudioRef, toggleMusicPreview,

    withPreservedScroll,
  }

  return (
    <EditorProvider value={editorValue}>
    <div className="flex flex-1 min-h-0 h-full overflow-hidden">

      {/*  Left: Config Editor  */}
      <div className="w-[420px] shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden min-h-0">

        {/* Header — identitas template hanya DITAMPILKAN di sini.
            Mengubahnya lewat panel Pengaturan, supaya nama/slug/harga punya
            satu tempat saja alih-alih dua form yang bisa berbeda isi. */}
        <div className="px-5 py-4 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={exitEditor}
              className="p-1.5 -ml-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Simpan draf & kembali ke koleksi"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-gray-900 truncate">{record.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <StatusBadge status={record.status} size="sm" />
                {categoryLabel && (
                  <span className="text-[10px] text-gray-400 capitalize truncate">{categoryLabel}</span>
                )}
              </div>
            </div>
            <button
              onClick={onOpenSettings}
              title="Nama, slug, kategori, harga, publikasi"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50 shrink-0">
          {([
            ['tampilan', Palette,   'Tampilan'],
            ['opening',  Sparkles,  'Opening'],
            ['decor',    Layers,    'Dekorasi'],
            ['konten',   Type,      'Konten'],
            ['music',    Play,      'Musik'],
          ] as [ConfigTab, React.ElementType, string][]).map(([id, Icon, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
                activeTab === id
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div ref={tabContentRef} className="flex-1 overflow-y-auto scrollbar-hide p-5 space-y-5">


          {activeTab === 'tampilan' && <AppearancePanel />}
          {activeTab === 'opening'  && <OpeningPanel />}
          {activeTab === 'decor'    && <DecorPanel />}
          {activeTab === 'konten'   && <ContentPanel />}
          {activeTab === 'music'    && <MusicPanel />}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 space-y-2.5 shrink-0">

          {/* Status penyimpanan — menggantikan penghitung "N perubahan belum
              tersimpan" yang dulu menuntut admin menekan Simpan. Sekarang
              draf tersimpan sendiri; yang perlu diketahui admin hanyalah
              apakah sudah sampai ke server. */}
          <div className="flex items-center justify-between gap-2 px-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              {saveState === 'saving' ? (
                <>
                  <Loader2 className="w-3 h-3 text-gray-400 animate-spin shrink-0" />
                  <span className="text-[10px] text-gray-500 font-medium">Menyimpan draf...</span>
                </>
              ) : saveState === 'dirty' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <span className="text-[10px] text-amber-600 font-medium">Menunggu simpan otomatis</span>
                </>
              ) : saveState === 'error' ? (
                <>
                  <CircleAlert className="w-3 h-3 text-red-500 shrink-0" />
                  <button onClick={() => saveDraft()} className="text-[10px] text-red-600 font-semibold hover:underline">
                    Gagal menyimpan — coba lagi
                  </button>
                </>
              ) : lastSavedAt ? (
                <>
                  <CloudUpload className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="text-[10px] text-emerald-600 font-medium">Draf tersimpan {lastSavedAt}</span>
                </>
              ) : (
                <span className="text-[10px] text-gray-400">Perubahan tersimpan otomatis</span>
              )}
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"
                className="p-1 text-gray-400 hover:text-gray-800 disabled:opacity-20 transition-colors"><Undo2 className="w-3.5 h-3.5" /></button>
              <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)"
                className="p-1 text-gray-400 hover:text-gray-800 disabled:opacity-20 transition-colors"><Redo2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {hasPendingDraft && (
            <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-indigo-50 border border-indigo-100">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-indigo-700 leading-tight">
                  Perubahan belum terbit
                </p>
                <p className="text-[9px] text-indigo-500 mt-0.5 leading-snug">
                  {record.status === 'active'
                    ? 'Pengunjung masih melihat versi sebelumnya.'
                    : 'Template ini belum tampil di galeri.'}
                </p>
              </div>
              <button
                onClick={() => setConfirmDiscard(true)}
                title="Buang draf, kembali ke versi terbit"
                className="p-1 text-indigo-400 hover:text-indigo-700 transition-colors shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => setShowPublish(true)}
            disabled={publishing}
            className="w-full flex items-center justify-center gap-1.5 bg-gray-900 text-white text-xs font-semibold py-2.5 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            <Rocket className="w-3.5 h-3.5" />
            {record.status === 'active' ? 'Terbitkan perubahan' : 'Terbitkan template'}
          </button>
        </div>
      </div>

      <EditorPreview />



      {/*  Modal Terbitkan  */}
      {showPublish && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/45 backdrop-blur-sm" onClick={() => !publishing && setShowPublish(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-gray-900" />
                <h3 className="font-bold text-gray-900 text-sm">Terbitkan template</h3>
              </div>
              <button onClick={() => setShowPublish(false)} disabled={publishing} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Desain yang sedang kamu garap akan menjadi versi yang dilihat pengunjung
                undangan yang memakai <strong className="text-gray-900">{record.name}</strong>.
              </p>

              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3.5 space-y-2 text-[12px]">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Seksi aktif</span>
                  <span className="font-semibold text-gray-800">{sections.filter(s => s.enabled).length}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Undangan memakai tema ini</span>
                  <span className="font-semibold text-gray-800">{record.usage_count}</span>
                </div>
              </div>

              {record.usage_count > 0 && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
                  {record.usage_count} undangan yang sudah terbit akan langsung memakai desain baru ini.
                </p>
              )}
            </div>

            <div className="px-6 pb-5 space-y-2">
              <button
                onClick={() => publish('active')}
                disabled={publishing}
                className="w-full py-2.5 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
                Terbitkan &amp; tampilkan di galeri
              </button>
              <button
                onClick={() => publish('draft')}
                disabled={publishing}
                className="w-full py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Simpan sebagai versi terbit, tetap draft
              </button>
              <button
                onClick={() => setShowPublish(false)}
                disabled={publishing}
                className="w-full py-2 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDiscard}
        busy={publishing}
        tone="warning"
        icon={RotateCcw}
        title="Buang draf?"
        message={<>Seluruh perubahan yang belum diterbitkan akan hilang dan desain kembali ke versi terbit terakhir.</>}
        confirmLabel="Ya, buang draf"
        onConfirm={discardDraft}
        onCancel={() => setConfirmDiscard(false)}
      />
    </div>
    </EditorProvider>
  )
}
