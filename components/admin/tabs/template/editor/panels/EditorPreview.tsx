'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence } from 'framer-motion'
import { RefreshCw, Maximize2, Play, X, Undo2, Redo2 } from 'lucide-react'
import SectionRenderer from '@/components/renderer/SectionRenderer'
import DecorationCanvas from '../DecorationCanvas'
import { PREVIEW_WISHES } from '../parts/constants'
import { useEditor } from '../EditorContext'

// Dynamic import — hindari SSR issue
const InvitationPreview   = dynamic(() => import('@/components/renderer/InvitationPreview'),   { ssr: false })
const OpeningScene        = dynamic(() => import('@/components/renderer/OpeningScene'),        { ssr: false })
const LoadingScreen       = dynamic(() => import('@/components/renderer/LoadingScreen'),       { ssr: false })
const FloatingMusicPlayer = dynamic(() => import('@/components/renderer/FloatingMusicPlayer'), { ssr: false })
const InvitationRenderer  = dynamic(() => import('@/components/renderer/InvitationRenderer'),  { ssr: false })

/**
 * Kolom pratinjau editor: mockup ponsel, tombol undo/redo, dan mode layar penuh.
 *
 * Dipisah dari kerangka editor karena isinya utuh sendiri — tiga renderer yang
 * saling bertumpuk (opening, loading, undangan) plus papan dekorasi, semuanya
 * digerakkan state yang sama dan tidak menyentuh persistensi sama sekali.
 */
export default function EditorPreview() {
  const {
    config, cfg, sections, musicCfg, previewData, previewGuestName,
    previewMode, setPreviewMode, previewKey, setPreviewKey,
    previewPlaying, setPreviewPlaying, previewLoading, setPreviewLoading,
    decorPreviewKey, setDecorPreviewKey, decorEditMode,
    decorScope, selectedAssetId, setSelectedAssetId, sectionReplay,
    hiddenAssetIds, lockedAssetIds, updateSection,
    showFullscreen, setShowFullscreen,
    undo, redo, canUndo, canRedo, updateOpening,
    expandedSectionId,
  } = useEditor()

  /**
   * Ukuran layar yang disimulasikan.
   *
   * Di layar lebar tetap bingkai ponsel 340x736: ruangnya berlebih, dan
   * bingkainya membantu membayangkan hasil akhirnya.
   *
   * Di HP bingkainya dilepas. Ruang tegak di sana tinggal sekitar 250 piksel
   * begitu lembar kontrol terbuka, dan bingkai memakan 20 piksel padding plus
   * sudut membulat hanya untuk menggambar ponsel DI DALAM ponsel. Layarnya
   * dibuat selebar ruang yang ada, jadi isinya tampil seukuran aslinya alih
   * alih diperkecil 0,87 kali.
   */
  const areaRef = useRef<HTMLDivElement>(null)
  const [layar, setLayar] = useState({ w: 340, h: 736, bingkai: true })

  useLayoutEffect(() => {
    const el = areaRef.current
    if (!el) return
    const hitung = () => {
      if (window.innerWidth >= 1024) {
        setLayar(l => (l.bingkai ? l : { w: 340, h: 736, bingkai: true }))
        return
      }
      const r = el.getBoundingClientRect()
      const w = Math.max(240, Math.min(430, Math.round(r.width - 16)))
      // Saat dekorasi sedang digeser, bentuk panggung harus sama dengan
      // undangan sungguhan (390 x 845). Kalau tingginya dipaksa muat ke ruang
      // yang tersisa, kanvasnya jadi gepeng dan mata salah menilai jarak,
      // walaupun koordinat persennya tetap benar. Lebih baik lebih tinggi dari
      // layar dan digulir.
      const h = decorEditMode
        ? Math.round((w * 845) / 390)
        : Math.max(180, Math.round(r.height - 12))
      setLayar(l => (l.w === w && l.h === h && !l.bingkai ? l : { w, h, bingkai: false }))
    }
    hitung()
    // Tinggi area ini berubah setiap lembar kontrol dibuka atau diringkas,
    // dan itu bukan resize jendela, jadi ResizeObserver yang mengejarnya.
    const ro = new ResizeObserver(hitung)
    ro.observe(el)
    window.addEventListener('resize', hitung)
    return () => { ro.disconnect(); window.removeEventListener('resize', hitung) }
  }, [decorEditMode])

  /**
   * Pratinjau mengikuti seksi yang sedang dibuka di tab Konten.
   *
   * Dulu membuka "Detail Acara" tidak memindahkan apa pun: pratinjau tetap di
   * sampul, dan admin harus menggulir sendiri mencari hasil kerjanya. Studio
   * pelanggan sudah melakukan ini sejak awal lewat `scrollToSection` milik
   * InvitationRenderer; editor admin memakai InvitationPreview yang tidak
   * menandai seksinya, jadi seksi dicari lewat urutan elemen <section>.
   *
   * Posisi dihitung dari getBoundingClientRect, bukan offsetTop, karena isi
   * pratinjau hidup di dalam pembungkus ber-zoom dan offsetTop di sana masih
   * memakai satuan sebelum zoom.
   */
  const undanganRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!expandedSectionId) return
    if (previewMode !== 'invitation') setPreviewMode('invitation')

    // Jeda pendek: lapisan undangan baru terlihat sesudah mode berpindah.
    const jam = setTimeout(() => {
      const wadah = undanganRef.current
      const el = wadah?.querySelector(`[data-section-id="${expandedSectionId}"]`) as HTMLElement | null
      if (!wadah || !el) return
      const selisih = el.getBoundingClientRect().top - wadah.getBoundingClientRect().top
      wadah.scrollTo({ top: wadah.scrollTop + selisih, behavior: 'smooth' })
    }, 260)
    return () => clearTimeout(jam)
  }, [expandedSectionId, previewMode, sections, setPreviewMode])

  const MODE = [
    { id: 'opening' as const,    label: 'Opening' },
    { id: 'loading' as const,    label: 'Loading' },
    { id: 'invitation' as const, label: 'Undangan' },
  ]

  // Renderer digambar pada kanvas 390 piksel, lebar HP yang jadi patokan
  // seluruh template. Sisanya tinggal skala.
  const zoom = layar.w / 390
  const tinggiKonten = Math.round(layar.h / zoom)

  return (
    <>
    {/*  Right: Preview  */}
    <div className="flex-1 bg-slate-100 flex flex-col overflow-hidden">

      {/* Preview toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 lg:px-5 py-1.5 lg:py-2 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">Live Preview</span>
          </div>
          {/* Undo / Redo. Di layar sempit keduanya sudah ada di lembar
              kontrol, jadi di sini disembunyikan agar tinggi bar tidak
              memakan ruang pratinjau. */}
          <div className="hidden lg:flex items-center bg-gray-100 rounded-lg p-0.5">
            <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Urungkan perubahan terakhir"
              className="w-11 h-11 -my-1 flex items-center justify-center rounded-md text-gray-500 hover:text-indigo-600 hover:bg-white disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors">
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)" aria-label="Ulangi perubahan yang diurungkan"
              className="w-11 h-11 -my-1 flex items-center justify-center rounded-md text-gray-500 hover:text-indigo-600 hover:bg-white disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors">
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {/* Pemilih mode. Di layar sempit naik ke bar atas: versi di bawah
            layar ikut memakan tinggi yang justru paling dibutuhkan pratinjau. */}
        <div className="flex lg:hidden items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          {MODE.map(m => (
            <button
              key={m.id}
              onClick={() => setPreviewMode(m.id)}
              className={`px-2.5 min-h-[44px] rounded-md text-[11px] font-semibold transition-colors ${
                previewMode === m.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {previewMode === 'invitation' && (
            <span className="hidden lg:inline text-xs text-gray-400">
              {sections.filter(s => s.enabled).length} sections
            </span>
          )}
          {/* Tombol Play   preview animasi opening di dalam mockup */}
          <button
            onClick={() => { setPreviewMode('opening'); setPreviewPlaying(true) }}
            className="flex items-center justify-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-3 min-w-[44px] min-h-[44px] transition-colors"
            title="Preview animasi opening"
            aria-label="Putar animasi pembuka"
          >
            <Play className="w-3 h-3 fill-current" /> <span className="hidden sm:inline">Play</span>
          </button>
          <button
            onClick={() => setPreviewKey(k => k + 1)}
            aria-label="Muat ulang pratinjau"
            title="Muat ulang pratinjau"
            className="hidden sm:flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 min-h-[44px] transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          <button
            onClick={() => setShowFullscreen(true)}
            aria-label="Buka pratinjau layar penuh"
            title="Layar penuh"
            className="flex items-center justify-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-3 min-w-[44px] min-h-[44px] transition-colors"
          >
            <Maximize2 className="w-3 h-3" /> <span className="hidden sm:inline">Full Screen</span>
          </button>
        </div>
      </div>

      {/*
        Layar simulasi. Di desktop dibungkus bingkai ponsel; di HP ditampilkan
        polos selebar ruang yang ada. Memakai visibility (bukan display:none)
        plus position:absolute supaya tiap pratinjau selalu punya dimensi dan
        tidak runtuh saat tidak aktif.
      */}
      <div
        ref={areaRef}
        className={`flex-1 min-h-0 overflow-y-auto scrollbar-hide flex justify-center ${
          layar.bingkai ? 'items-start py-8 px-4' : 'items-start py-1.5 px-2'
        }`}
      >
        <div className="relative">
          <div
            className={layar.bingkai
              ? 'relative bg-gray-950 rounded-[52px] shadow-2xl shadow-black/40 ring-1 ring-white/10'
              : 'relative'}
            style={layar.bingkai ? { width: 360, padding: 10 } : undefined}
          >
            {/* Poni ponsel, hanya masuk akal kalau bingkainya ada */}
            {layar.bingkai && (
              <div className="absolute left-1/2 -translate-x-1/2 bg-gray-950 rounded-full z-20"
                style={{ top: 14, width: 82, height: 24 }} />
            )}

            {/* Layar */}
            <div
              data-layar-pratinjau
              className={layar.bingkai
                ? 'rounded-[44px] overflow-hidden bg-gray-900'
                : 'rounded-xl overflow-hidden bg-gray-900 ring-1 ring-black/10'}
              style={{ width: layar.w, height: layar.h, position: 'relative' }}>

              {/*  Fullscreen + Music overlay   always on top  */}
              <div style={{ position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'none' }}>
                {/* Fullscreen icon   top right corner */}
                {/* Area sentuh 44px, lingkaran yang terlihat tetap kecil
                    supaya tidak menutupi pratinjau undangannya. */}
                <button
                  onClick={() => setShowFullscreen(true)}
                  style={{ position: 'absolute', top: 3, right: 3, pointerEvents: 'auto' }}
                  className="group w-11 h-11 flex items-center justify-center"
                  data-editor-chrome
                  title="Full Screen"
                  aria-label="Buka pratinjau layar penuh"
                >
                  <span className="inline-flex bg-black/40 group-hover:bg-black/60 text-white/80 group-hover:text-white rounded-full p-1.5 transition-colors backdrop-blur-sm">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </span>
                </button>

                {/* Music player */}
                {musicCfg.enabled && (
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <FloatingMusicPlayer
                      key={`music-${musicCfg.player_style}-${musicCfg.player_position}-${musicCfg.player_size}-${musicCfg.player_animation}-${musicCfg.show_title}`}
                      config={musicCfg}
                      colors={cfg.meta.color_scheme}
                      static
                    />
                  </div>
                )}
              </div>

              {/*  Opening preview (live OpeningScene)  */}
              <div style={{
                position: 'absolute', inset: 0, overflow: 'hidden',
                // isolation memaksa lapisan ini punya stacking context sendiri.
                // Tanpa itu, z-40 di dalam komponen opening bocor keluar dan
                // menimpa panggung dekorasi yang duduk di z-30 — persis yang
                // membuat kanvas dekorasi tidak pernah bisa disentuh.
                zIndex: 10, isolation: 'isolate',
                visibility: previewMode === 'opening' && !previewPlaying && !previewLoading ? 'visible' : 'hidden',
                pointerEvents: previewMode === 'opening' && !previewPlaying && !previewLoading ? 'auto' : 'none',
              }}>
                <div style={{ width: 390, zoom, height: tinggiKonten, position: 'relative' }}>
                  <OpeningScene
                    key={`static-opening-${decorPreviewKey}-${cfg.opening.type}`}
                    config={cfg.opening}
                    data={previewData}
                    meta={cfg.meta}
                    positionMode="absolute"
                    onOpen={() => setDecorPreviewKey(k => k + 1)}
                    previewGuestName={previewGuestName}
                  />
                </div>
              </div>

              {/*  Panggung dekorasi.
                   Menggantikan overlay "moodboard" lama yang HANYA bekerja
                   untuk opening — aset milik seksi cuma bisa digeser lewat
                   input angka. Sekarang seksi punya panggungnya sendiri:
                   seksi yang sedang digarap dirender tunggal pada kotak yang
                   sama persis dengan kanvas simulasi, jadi koordinat persen
                   kanvas memetakan 1:1 ke hasil render sungguhan. Merender
                   satu seksi (bukan menumpang pratinjau yang bisa di-scroll)
                   membuat penempatannya tidak pernah meleset saat digulir.  */}
              {decorEditMode && !previewPlaying && (() => {
                const onOpening = decorScope === 'opening'
                const target = onOpening ? null : sections.find(sec => sec.id === decorScope)
                if (!onOpening && !target) return null

                const stageAssets = onOpening
                  ? (cfg.opening.decoration_assets ?? [])
                  : (target!.decoration_assets ?? [])

                return (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 30, isolation: 'isolate', background: cfg.meta.color_scheme.background }}>
                    <div style={{ width: 390, zoom, height: tinggiKonten, position: 'relative', overflow: 'hidden' }}>
                      {onOpening ? (
                        <OpeningScene
                          key={`stage-opening-${decorPreviewKey}-${cfg.opening.type}`}
                          config={cfg.opening}
                          data={previewData}
                          meta={cfg.meta}
                          positionMode="absolute"
                          onOpen={() => setDecorPreviewKey(k => k + 1)}
                          previewGuestName={previewGuestName}
                        />
                      ) : (
                        <div key={`stage-section-${target!.id}-${decorPreviewKey}`} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                          <SectionRenderer
                            sectionConfig={target!}
                            invitationData={previewData}
                            templateMeta={cfg.meta}
                            invitationId="decor-stage"
                            mode="preview"
                          />
                        </div>
                      )}

                      <DecorationCanvas
                        assets={stageAssets}
                        onUpdate={next => onOpening
                          ? updateOpening({ decoration_assets: next })
                          : updateSection(target!.id, { decoration_assets: next })}
                        selectedId={selectedAssetId}
                        onSelect={setSelectedAssetId}
                        hiddenIds={hiddenAssetIds}
                        lockedIds={lockedAssetIds}
                        width={390}
                        height={tinggiKonten}
                      />
                    </div>
                  </div>
                )
              })()}

              {/*  Invitation preview   scroll-snap, satu section = satu layar  */}
              <div key={previewKey} ref={undanganRef} style={{
                position: 'absolute', inset: 0,
                zIndex: 10, isolation: 'isolate',
                overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none',
                scrollSnapType: 'y proximity',
                WebkitOverflowScrolling: 'touch',
                visibility: previewMode === 'invitation' ? 'visible' : 'hidden',
                pointerEvents: previewMode === 'invitation' ? 'auto' : 'none',
              }}>
                <div style={{ width: 390, zoom }}>
                  <InvitationPreview
                    template={config}
                    data={previewData}
                    invitationId="lab-preview"
                    initialWishes={PREVIEW_WISHES}
                    isPreview
                    replaySectionId={sectionReplay?.id}
                    replaySectionKey={sectionReplay?.key}
                  />
                </div>
              </div>

              {/*  Loading screen preview (static mode)  */}
              <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 10, isolation: 'isolate',
                visibility: previewMode === 'loading' && !previewPlaying && !previewLoading ? 'visible' : 'hidden',
                pointerEvents: previewMode === 'loading' && !previewPlaying && !previewLoading ? 'auto' : 'none',
                overflow: 'hidden',
              }}>
                <div style={{ width: 390, zoom, height: tinggiKonten, position: 'relative' }}>
                  <LoadingScreen
                    config={cfg.loading}
                    onDone={() => {}}
                    isPreview={true}
                  />
                </div>
              </div>

              {/*  Loading screen (flow preview - when triggered)  */}
              {previewLoading && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 45, isolation: 'isolate',
                  overflow: 'hidden',
                  borderRadius: '2rem'
                }}>
                  <div style={{ width: 390, zoom, height: tinggiKonten, position: 'relative' }}>
                    <LoadingScreen
                      config={cfg.loading}
                      onDone={() => {
                        setPreviewLoading(false)
                        setPreviewPlaying(false)
                        setPreviewMode('invitation')
                      }}
                      isPreview={true}
                    />
                  </div>
                </div>
              )}

              {/*  Cover/Opening preview   click MASUK SEKARANG triggers loading  */}
              {previewPlaying && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 45, isolation: 'isolate', overflow: 'hidden', borderRadius: '2rem' }}>
                  <div style={{ width: 390, zoom, height: tinggiKonten, position: 'relative' }}>
                    <AnimatePresence>
                      <OpeningScene
                        config={cfg.opening}
                        data={previewData}
                        meta={cfg.meta}
                        positionMode="absolute"
                        previewGuestName={previewGuestName}
                        onOpen={() => {
                          setPreviewPlaying(false)
                          setPreviewLoading(true)
                        }}
                      />
                    </AnimatePresence>
                  </div>
                  {/* Tombol tutup */}
                  <button
                    onClick={() => setPreviewPlaying(false)}
                    className="group absolute top-1 right-1 z-50 w-11 h-11 flex items-center justify-center"
                    data-editor-chrome
                    aria-label="Hentikan pratinjau animasi opening"
                    title="Hentikan pratinjau"
                  >
                    <span className="inline-flex bg-black/50 group-hover:bg-black/70 text-white rounded-full p-1.5 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tab mode, hanya layar lebar. Di HP sudah ada di bar atas. */}
          <div className="mt-3 hidden lg:flex items-center gap-1 bg-white rounded-xl p-1.5 shadow-sm border border-gray-200">
            {MODE.map(m => (
              <button
                key={m.id}
                onClick={() => setPreviewMode(m.id)}
                className={`flex-1 px-2 min-h-[44px] rounded-lg text-[10px] font-semibold transition-all ${
                  previewMode === m.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <p className="hidden lg:block text-center text-xs text-slate-400 mt-2 font-medium">
            {config.name}
          </p>
        </div>
      </div>
    </div>

    {/*  Fullscreen Live Preview  */}
    {showFullscreen && (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
        {/* Close button */}
        <button
          onClick={() => setShowFullscreen(false)}
          aria-label="Tutup pratinjau layar penuh"
          title="Tutup"
          className="absolute top-4 right-4 z-[110] bg-black/60 hover:bg-black/80 text-white rounded-full p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors backdrop-blur-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Phone-width container   simulates real device */}
        <div style={{
          width: '100%',
          maxWidth: 430,
          height: '100dvh',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 0 80px rgba(0,0,0,0.5)',
        }}>
          <InvitationRenderer
            key={`fs-renderer-${showFullscreen}`}
            invitationId="lab-fullscreen"
            mode="preview"
            invitationData={previewData}
            template={config}
            initialWishes={PREVIEW_WISHES}
            musicUrl={musicCfg.enabled ? musicCfg.url : undefined}
            contained
          />
        </div>
      </div>
    )}
    </>
  )
}
