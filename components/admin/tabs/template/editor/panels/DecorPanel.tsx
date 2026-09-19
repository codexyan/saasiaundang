'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Layers, Plus, Loader2, Eye, EyeOff, Lock, Unlock, Trash2, Copy } from 'lucide-react'
import type { DecorationAsset } from '@/lib/types'
import {
  BUILT_IN_ORNAMENTS, ORNAMENT_GROUPS, ORNAMENT_BUNDLES,
  builtInUrl, resolveAssetUrl,
  type BuiltInOrnament, type OrnamentBundle, type OrnamentGroup,
} from '@/lib/built-in-assets'
import { asetTerpakaiDiTema } from '@/lib/decoration-reuse'
import DecorationLayerList from '../parts/DecorationLayerList'
import { SECTION_LABELS } from '../parts/constants'
import { useEditor } from '../EditorContext'

/** Ukuran awal aset baru, dalam persen lebar kanvas. */
const DEFAULT_W_PCT = 22

/**
 * Tab "Dekorasi".
 *
 * Kanvasnya SELALU aktif selama tab ini terbuka — tidak ada lagi tombol mode
 * "Moodboard" yang harus dinyalakan dulu dan hanya bekerja untuk opening.
 * Panel ini tinggal mengurus: memilih tujuan, menambah aset, mengatur daftar
 * lapisan, dan properti aset terpilih.
 */
export default function DecorPanel() {
  const {
    cfg, sections, decorScope, setDecorScope, setDecorEditMode,
    selectedAssetId, setSelectedAssetId, setDecorPreviewKey,
    setPreviewMode, setPreviewPlaying,
    hiddenAssetIds, setHiddenAssetIds, lockedAssetIds, setLockedAssetIds,
    updateOpening, updateSection,
  } = useEditor()

  const [uploading, setUploading] = useState(false)
  const [grupOrnamen, setGrupOrnamen] = useState<OrnamentGroup>('Sudut')
  const [tujuanSalin, setTujuanSalin] = useState<string>('semua')

  // Warna ornamen mengikuti warna aksen tema, tapi bisa diganti: satu bentuk
  // yang sama sering dipakai emas di sampul dan putih tipis di seksi gelap.
  const warnaAksen = cfg.meta.color_scheme.accent
  const [warnaOrnamen, setWarnaOrnamen] = useState(warnaAksen)
  useEffect(() => { setWarnaOrnamen(warnaAksen) }, [warnaAksen])

  const isOpening = decorScope === 'opening'
  const scopeSection = !isOpening ? cfg.sections.find(s => s.id === decorScope) : null

  /**
   * Scope yang menggantung dikembalikan ke Opening.
   *
   * `decorScope` menyimpan id seksi, tapi seksi bisa dihapus atau dinonaktifkan
   * dari tab Konten tanpa ada yang memberi tahu tab ini. Dulu akibatnya:
   * unggahan berikutnya hilang diam-diam karena tidak ada tujuan yang sah.
   */
  useEffect(() => {
    if (isOpening) return
    if (!cfg.sections.some(s => s.id === decorScope && s.enabled)) {
      setDecorScope('opening')
      setSelectedAssetId(null)
    }
  }, [isOpening, decorScope, cfg.sections, setDecorScope, setSelectedAssetId])

  /** Kanvas hidup selama tab ini terbuka, dan dimatikan saat ditinggalkan. */
  useEffect(() => {
    setDecorEditMode(true)
    return () => setDecorEditMode(false)
  }, [setDecorEditMode])

  const assets: DecorationAsset[] = isOpening
    ? (cfg.opening.decoration_assets ?? [])
    : (scopeSection?.decoration_assets ?? [])

  /**
   * Aset yang sudah dipakai di mana pun dalam tema ini.
   *
   * Sebelumnya satu berkas yang sudah diunggah hanya hidup di satu tujuan.
   * Memakainya lagi di seksi lain berarti mengunggah berkas yang sama sekali
   * lagi, dan menumpuk salinan di storage untuk gambar yang identik.
   *
   * Tidak perlu tabel baru: daftarnya diturunkan dari konfigurasi tema itu
   * sendiri, jadi selalu cocok dengan kenyataan dan ikut hilang begitu aset
   * terakhir yang memakainya dihapus.
   */
  const asetTerpakai = useMemo(
    () => asetTerpakaiDiTema(cfg.opening.decoration_assets, cfg.sections),
    [cfg.opening.decoration_assets, cfg.sections],
  )

  const scopeLabel = isOpening
    ? 'Opening'
    : (SECTION_LABELS[scopeSection?.type ?? ''] || scopeSection?.type || 'Opening')

  /** false = tidak ada tujuan sah; pemanggil WAJIB memeriksa. */
  function writeAssets(next: DecorationAsset[]): boolean {
    if (isOpening) { updateOpening({ decoration_assets: next }); return true }
    if (scopeSection) { updateSection(scopeSection.id, { decoration_assets: next }); return true }
    return false
  }

  function toggleIn(set: Set<string>, id: string) {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    // Diperiksa SEBELUM mengunggah: percuma mengirim berkas ke storage kalau
    // hasilnya tidak punya tempat untuk disimpan.
    if (!isOpening && !scopeSection) {
      toast.error('Seksi tujuan sudah tidak ada. Pilih tujuan dekorasi lagi ya.')
      return
    }

    setUploading(true)
    try {
      let added = assets
      let lastId: string | null = null

      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('folder', 'decorations')
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        const data = await res.json().catch(() => null)
        if (!res.ok) { toast.error(`"${file.name}": ${data?.error || 'gagal diunggah'}`); continue }

        // z_layer dari nilai TERTINGGI, bukan panjang array: setelah ada aset
        // yang dihapus, panjang array bisa menabrak layer yang masih dipakai.
        const topLayer = added.reduce((m, a) => Math.max(m, a.z_layer ?? 0), -1)
        const asset: DecorationAsset = {
          id: 'deco-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
          url: data.url,
          label: file.name.replace(/\.[^.]+$/, ''),
          // Lahir di tengah kanvas — terlihat langsung tanpa perlu dicari.
          x: 50, y: 50, w: DEFAULT_W_PCT,
          opacity: 100,
          animation: 'fade-in', animation_delay: 200,
          exit_animation: 'none', exit_delay: 0,
          idle_animation: 'none',
          z_layer: topLayer + 1,
        }
        added = [...added, asset]
        lastId = asset.id
      }

      if (!lastId) return
      if (writeAssets(added)) setSelectedAssetId(lastId)
      else toast.error('Dekorasinya tidak bisa dipasang — tujuannya sudah tidak ada.')
    } finally {
      setUploading(false)
    }
  }

  function idBaru(imbuhan = '') {
    return 'deco-' + Date.now().toString(36) + imbuhan + Math.random().toString(36).slice(2, 5)
  }

  /** Aset bawaan berbentuk SVG, jadi tidak ada yang perlu diunggah. */
  function asetDariBentuk(
    bentuk: string, label: string,
    posisi: { x: number; y: number; w: number; rotation?: number; flip_h?: boolean; flip_v?: boolean },
    zAwal: number, jeda: number, imbuhan = '',
  ): DecorationAsset {
    return {
      id: idBaru(imbuhan),
      url: builtInUrl(bentuk, warnaOrnamen),
      label,
      x: posisi.x, y: posisi.y, w: posisi.w,
      rotation: posisi.rotation ?? 0,
      flip_h: posisi.flip_h ?? false,
      flip_v: posisi.flip_v ?? false,
      opacity: 100,
      animation: 'fade-in', animation_delay: jeda,
      exit_animation: 'none', exit_delay: 0,
      idle_animation: 'none',
      z_layer: zAwal,
    }
  }

  function tujuanSah(): boolean {
    if (isOpening || scopeSection) return true
    toast.error('Seksi tujuan sudah tidak ada. Pilih tujuan dekorasi lagi ya.')
    return false
  }

  function tambahOrnamen(o: BuiltInOrnament) {
    if (!tujuanSah()) return
    const atas = assets.reduce((m, a) => Math.max(m, a.z_layer ?? 0), -1)
    const aset = asetDariBentuk(o.id, o.label, o, atas + 1, 200)
    if (writeAssets([...assets, aset])) {
      setSelectedAssetId(aset.id)
      setDecorPreviewKey(k => k + 1)
    }
  }

  function pasangUlang(contoh: DecorationAsset) {
    if (!tujuanSah()) return
    const atas = assets.reduce((m, a) => Math.max(m, a.z_layer ?? 0), -1)
    const aset: DecorationAsset = {
      ...contoh,
      id: idBaru(),
      label: contoh.label ?? 'Aset',
      z_layer: atas + 1,
    }
    if (writeAssets([...assets, aset])) {
      setSelectedAssetId(aset.id)
      setDecorPreviewKey(k => k + 1)
    }
  }

  function tambahPaket(b: OrnamentBundle) {
    if (!tujuanSah()) return
    const atas = assets.reduce((m, a) => Math.max(m, a.z_layer ?? 0), -1)
    // Jeda animasi dinaikkan bertingkat supaya paket empat sudut masuk
    // berurutan, bukan berkedip serentak.
    const baru = b.items.map((it, i) =>
      asetDariBentuk(it.shape, b.label, it, atas + 1 + i, 200 + i * 120, String(i)),
    )
    if (writeAssets([...assets, ...baru])) {
      setSelectedAssetId(baru[baru.length - 1].id)
      setDecorPreviewKey(k => k + 1)
      toast.success(`${b.label} dipasang di ${scopeLabel}`)
    }
  }

  /**
   * Menyalin seluruh dekorasi tujuan yang sedang dibuka ke tujuan lain.
   *
   * Tanpa ini, memasang satu ornamen sudut yang sama di enam belas seksi
   * berarti enam belas kali kerja yang persis sama, dan hasilnya hampir pasti
   * tidak seragam karena posisinya diatur ulang tiap kali.
   *
   * Salinan selalu mendapat id baru: id yang sama di dua seksi akan membuat
   * penggabungan aset pembeli di lib/decoration-utils.ts salah menebak mana
   * yang ditimpa.
   */
  function asetTujuan(id: string): DecorationAsset[] {
    if (id === 'opening') return cfg.opening.decoration_assets ?? []
    return cfg.sections.find(x => x.id === id)?.decoration_assets ?? []
  }

  function tulisTujuan(id: string, next: DecorationAsset[]) {
    if (id === 'opening') updateOpening({ decoration_assets: next })
    else updateSection(id, { decoration_assets: next })
  }

  function salinKe() {
    if (assets.length === 0) return
    const semuaTujuan = [
      ...(isOpening ? [] : ['opening']),
      ...sections.filter(x => x.enabled && x.id !== decorScope).map(x => x.id),
    ]
    const tujuan = tujuanSalin === 'semua' ? semuaTujuan : [tujuanSalin]
    if (tujuan.length === 0) return

    for (const id of tujuan) {
      const ada = asetTujuan(id)
      const atas = ada.reduce((m, x) => Math.max(m, x.z_layer ?? 0), -1)
      const salinan = assets.map((x, i) => ({
        ...x,
        id: idBaru(String(i)),
        z_layer: atas + 1 + i,
      }))
      tulisTujuan(id, [...ada, ...salinan])
    }

    setDecorPreviewKey(k => k + 1)
    toast.success(
      tujuan.length === 1
        ? `${assets.length} dekorasi disalin ke 1 tujuan`
        : `${assets.length} dekorasi disalin ke ${tujuan.length} tujuan`,
    )
  }

  function duplicate(a: DecorationAsset) {
    const topLayer = assets.reduce((m, x) => Math.max(m, x.z_layer ?? 0), -1)
    const clone: DecorationAsset = {
      ...a,
      id: 'deco-' + Date.now().toString(36),
      label: (a.label ?? 'Aset') + ' salinan',
      x: a.x + 4, y: a.y + 4,
      z_layer: topLayer + 1,
    }
    if (writeAssets([...assets, clone])) setSelectedAssetId(clone.id)
  }

  function remove(id: string) {
    if (writeAssets(assets.filter(a => a.id !== id)) && selectedAssetId === id) {
      setSelectedAssetId(null)
    }
  }

  // Paling depan di atas — sama seperti panel lapisan di aplikasi desain.
  const ordered = [...assets].sort((a, b) => (b.z_layer ?? 0) - (a.z_layer ?? 0))

  return (
    <div className="space-y-4">

      {/* Tujuan dekorasi */}
      <div>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Dekorasi untuk</p>
        <div className="flex flex-wrap gap-1.5">
          <ScopeChip
            active={isOpening}
            label="Opening"
            count={cfg.opening.decoration_assets?.length ?? 0}
            onClick={() => {
              setDecorScope('opening'); setSelectedAssetId(null)
              setPreviewMode('opening'); setPreviewPlaying(false)
              setDecorPreviewKey(k => k + 1)
            }}
          />
          {sections.filter(s => s.enabled).map(s => (
            <ScopeChip
              key={s.id}
              active={decorScope === s.id}
              label={SECTION_LABELS[s.type] || s.type}
              count={s.decoration_assets?.length ?? 0}
              onClick={() => {
                setDecorScope(s.id); setSelectedAssetId(null)
                setPreviewPlaying(false)
                // Mode pratinjau ikut pindah. Chip Opening selalu melakukannya,
                // chip seksi dulu tidak, jadi memilih seksi meninggalkan
                // pratinjau di mode Opening dan yang tampil tetap sampul.
                setPreviewMode('invitation')
                setDecorPreviewKey(k => k + 1)
              }}
            />
          ))}
        </div>
      </div>

      {/* Pustaka ornamen bawaan.
          Sebelum ini satu satunya cara menambah dekorasi adalah mengunggah
          gambar sendiri, jadi tab ini praktis kosong buat admin yang tidak
          menyiapkan berkas PNG dulu. Bentuk bentuk di sini SVG, warnanya
          dijahit saat dipasang, dan ukurannya nol byte di storage. */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Pustaka ornamen</p>
          <label className="flex items-center gap-1.5 text-[9px] text-gray-500 cursor-pointer">
            Warna
            <input
              type="color"
              value={warnaOrnamen}
              onChange={e => setWarnaOrnamen(e.target.value)}
              aria-label="Warna ornamen yang akan dipasang"
              className="w-7 h-7 rounded-md border border-gray-200 bg-white p-0.5 cursor-pointer"
            />
          </label>
        </div>

        <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1 mb-2">
          {ORNAMENT_GROUPS.map(g => (
            <button
              key={g}
              onClick={() => setGrupOrnamen(g)}
              className={`shrink-0 px-2.5 py-1.5 sentuh:min-h-[44px] rounded-lg text-[10px] font-semibold whitespace-nowrap transition-colors ${
                grupOrnamen === g
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-50 text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {BUILT_IN_ORNAMENTS.filter(o => o.group === grupOrnamen).map(o => (
            <button
              key={o.id}
              onClick={() => tambahOrnamen(o)}
              title={`Pasang ${o.label}`}
              aria-label={`Pasang ${o.label} ke ${scopeLabel}`}
              className="group aspect-square rounded-lg border border-gray-200 hover:border-indigo-400 overflow-hidden flex items-center justify-center p-1.5 transition-colors"
              style={{ backgroundColor: cfg.meta.color_scheme.primary }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveAssetUrl(builtInUrl(o.id, warnaOrnamen))}
                alt=""
                className="max-w-full max-h-full object-contain transition-transform group-hover:scale-110"
              />
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[9px] text-gray-400 leading-relaxed">
          Klik untuk memasang ke {scopeLabel}. Posisinya sudah diatur per bentuk,
          tinggal digeser kalau perlu.
        </p>
      </div>

      {/* Paket siap pakai */}
      <div>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Paket siap pakai</p>
        <div className="grid grid-cols-2 gap-1.5">
          {ORNAMENT_BUNDLES.map(b => (
            <button
              key={b.id}
              onClick={() => tambahPaket(b)}
              aria-label={`Pasang paket ${b.label} ke ${scopeLabel}`}
              className="flex flex-col items-start gap-0.5 px-2.5 py-2 sentuh:min-h-[44px] rounded-lg border border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-colors"
            >
              <span className="text-[10px] font-semibold text-gray-700 leading-tight">{b.label}</span>
              <span className="text-[8px] text-gray-400">{b.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sudah dipakai di tema ini */}
      {asetTerpakai.length > 0 && (
        <div>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Sudah dipakai di tema ini
          </p>
          <div className="grid grid-cols-6 gap-1.5">
            {asetTerpakai.map(a => (
              <button
                key={a.url}
                onClick={() => pasangUlang(a)}
                aria-label={`Pakai lagi ${a.label || 'aset'} di ${scopeLabel}`}
                title={`Pakai lagi ${a.label || 'aset'}`}
                className="aspect-square rounded-lg border border-gray-200 hover:border-indigo-400 overflow-hidden flex items-center justify-center p-1 transition-colors"
                style={{ backgroundColor: cfg.meta.color_scheme.primary }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveAssetUrl(a.url)} alt="" className="max-w-full max-h-full object-contain" />
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[9px] text-gray-400 leading-relaxed">
            Berkas yang sudah diunggah untuk tema ini. Memakainya lagi tidak mengunggah ulang.
          </p>
        </div>
      )}

      {/* Tambah aset */}
      <label className={`flex items-center justify-center gap-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-xl py-3 transition-colors ${uploading ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:bg-indigo-100'}`}>
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
        {uploading ? 'Mengunggah...' : `Tambah dekorasi ke ${scopeLabel}`}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          disabled={uploading}
          onChange={handleUpload}
        />
      </label>

      {assets.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Layers className="w-6 h-6 text-indigo-400" />
          </div>
          <p className="text-xs font-semibold text-gray-500">Belum ada dekorasi</p>
          <p className="text-[10px] text-gray-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
            Ambil satu dari pustaka ornamen di atas, atau unggah gambarmu sendiri.
            Aset yang baru dipasang langsung bisa diseret di pratinjau.
          </p>
        </div>
      ) : (
        <>
          {/* Daftar lapisan */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                Lapisan ({assets.length})
              </p>
              <span className="text-[8px] text-gray-300">paling depan di atas</span>
            </div>
            <div className="space-y-1">
              {ordered.map(a => {
                const sel = a.id === selectedAssetId
                const hidden = hiddenAssetIds.has(a.id)
                const locked = lockedAssetIds.has(a.id)
                return (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAssetId(sel ? null : a.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                      sel ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200/70 hover:border-gray-300'
                    } ${hidden ? 'opacity-50' : ''}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {/* resolveAssetUrl, bukan url mentah: ornamen bawaan disimpan sebagai
                        BUILT_IN:<bentuk>@<warna> dan tidak bisa dimuat langsung oleh
                        tag img, jadi gambar kecilnya tampil rusak. */}
                    <img src={resolveAssetUrl(a.url)} alt="" className="w-7 h-7 object-contain rounded bg-gray-50 border border-gray-100 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-semibold truncate ${sel ? 'text-indigo-800' : 'text-gray-700'}`}>
                        {a.label || 'Aset'}
                      </p>
                      <p className="text-[8px] text-gray-400 font-mono tabular-nums">
                        {Math.round(a.x)},{Math.round(a.y)} · {Math.round(a.w)}%
                      </p>
                    </div>
                    <IconToggle
                      on={!hidden} onIcon={Eye} offIcon={EyeOff}
                      title={hidden ? 'Tampilkan lagi' : 'Sembunyikan sementara (tidak ikut tersimpan)'}
                      onClick={e => { e.stopPropagation(); setHiddenAssetIds(s => toggleIn(s, a.id)) }}
                    />
                    <IconToggle
                      on={!locked} onIcon={Unlock} offIcon={Lock}
                      title={locked ? 'Buka kunci' : 'Kunci dari kanvas'}
                      onClick={e => { e.stopPropagation(); setLockedAssetIds(s => toggleIn(s, a.id)) }}
                    />
                    <button
                      onClick={e => { e.stopPropagation(); duplicate(a) }}
                      title="Gandakan"
                      aria-label={`Gandakan ${a.label || 'aset'}`}
                      className="p-1 text-gray-500 hover:text-emerald-700 rounded transition-colors inline-flex items-center justify-center sentuh:w-11 sentuh:h-11"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); remove(a.id) }}
                      title="Hapus"
                      aria-label={`Hapus ${a.label || 'aset'}`}
                      className="p-1 text-gray-500 hover:text-red-600 rounded transition-colors inline-flex items-center justify-center sentuh:w-11 sentuh:h-11"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>
            {hiddenAssetIds.size > 0 && (
              <p className="mt-1.5 text-[9px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5 leading-relaxed">
                {hiddenAssetIds.size} aset disembunyikan sementara. Ini hanya untuk
                memudahkan mengedit — semuanya tetap tampil di undangan.
              </p>
            )}

            {/* Pakai ulang ke tujuan lain */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Pakai ulang
              </p>
              <div className="flex gap-1.5">
                <select
                  value={tujuanSalin}
                  onChange={e => setTujuanSalin(e.target.value)}
                  aria-label="Tujuan salinan dekorasi"
                  className="flex-1 min-w-0 px-2 py-2 sentuh:min-h-[44px] text-[10px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="semua">Semua tujuan lain</option>
                  {!isOpening && <option value="opening">Opening</option>}
                  {sections.filter(x => x.enabled && x.id !== decorScope).map(x => (
                    <option key={x.id} value={x.id}>{SECTION_LABELS[x.type] || x.type}</option>
                  ))}
                </select>
                <button
                  onClick={salinKe}
                  aria-label={`Salin ${assets.length} dekorasi dari ${scopeLabel} ke tujuan yang dipilih`}
                  className="shrink-0 px-3 py-2 sentuh:min-h-[44px] bg-gray-900 text-white text-[10px] font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Salin
                </button>
              </div>
              <p className="mt-1.5 text-[9px] text-gray-400 leading-relaxed">
                Menyalin {assets.length} dekorasi di {scopeLabel} apa adanya, termasuk posisi,
                ukuran, dan animasinya. Yang sudah ada di tujuan tidak dihapus.
              </p>
            </div>
          </div>

          {/* Properti aset terpilih */}
          {selectedAssetId && (
            <DecorationLayerList
              assets={assets}
              onUpdate={next => { writeAssets(next) }}
              onPreview={() => {
                setPreviewPlaying(false)
                setDecorPreviewKey(k => k + 1)
              }}
              onPreviewExit={isOpening ? () => {
                setDecorEditMode(false)
                setPreviewMode('opening')
                setPreviewPlaying(true)
                toast('Ketuk "Buka Undangan" di pratinjau untuk melihat animasi keluar', { icon: '👆' })
              } : undefined}
              focusedId={selectedAssetId}
              onFocusChange={setSelectedAssetId}
            />
          )}

          <button
            onClick={() => { setPreviewPlaying(false); setDecorPreviewKey(k => k + 1) }}
            className="w-full py-2.5 sentuh:min-h-[44px] text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
            title="Putar ulang animasi masuk semua dekorasi"
          >
            ▶ Ulangi Animasi
          </button>
        </>
      )}
    </div>
  )
}

function ScopeChip({ active, label, count, onClick }: {
  active: boolean; label: string; count: number; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      /* Nama yang disebutkan pembaca layar dibedakan dari tab editor: tab
         "Opening" dan chip tujuan "Opening" hidup di layar yang sama, dan
         dua kontrol bernama sama persis membuat keduanya tertukar. Pengujian
         otomatis sendiri sempat tertukar. */
      aria-label={`Dekorasi untuk ${label}${count > 0 ? `, ${count} terpasang` : ''}`}
      className={`px-3 py-1.5 sentuh:min-h-[44px] text-[10px] font-bold rounded-lg transition-all ${
        active ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`ml-1 text-[8px] ${active ? 'text-white/60' : 'text-gray-400'}`}>({count})</span>
      )}
    </button>
  )
}

function IconToggle({ on, onIcon: OnIcon, offIcon: OffIcon, title, onClick }: {
  on: boolean
  onIcon: React.ElementType
  offIcon: React.ElementType
  title: string
  onClick: (e: React.MouseEvent) => void
}) {
  const Icon = on ? OnIcon : OffIcon
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`p-1 rounded transition-colors inline-flex items-center justify-center sentuh:w-11 sentuh:h-11 ${on ? 'text-gray-500 hover:text-gray-800' : 'text-amber-600 hover:text-amber-700'}`}
    >
      <Icon className="w-3 h-3" />
    </button>
  )
}
