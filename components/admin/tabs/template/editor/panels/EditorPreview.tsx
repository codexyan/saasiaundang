'use client'

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
  } = useEditor()

  return (
    <>
    {/*  Right: Preview  */}
    <div className="flex-1 bg-slate-100 flex flex-col overflow-hidden">

      {/* Preview toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 lg:px-5 py-2 lg:py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">Live Preview</span>
          </div>
          {/* Undo / Redo. Di layar sempit keduanya sudah ada di lembar
              kontrol, jadi di sini disembunyikan agar tinggi bar tidak
              memakan ruang pratinjau. */}
          <div className="hidden lg:flex items-center bg-gray-100 rounded-lg p-0.5">
            <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"
              className="p-1.5 rounded-md text-gray-500 hover:text-indigo-600 hover:bg-white disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors">
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)"
              className="p-1.5 rounded-md text-gray-500 hover:text-indigo-600 hover:bg-white disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors">
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
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
            className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-3 py-1.5 transition-colors"
            title="Preview animasi opening"
          >
            <Play className="w-3 h-3 fill-current" /> Play
          </button>
          <button
            onClick={() => setPreviewKey(k => k + 1)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          <button
            onClick={() => setShowFullscreen(true)}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            <Maximize2 className="w-3 h-3" /> Full Screen
          </button>
        </div>
      </div>

      {/*
        Phone preview   shell 360px, screen 340×736, zoom 340/390 ≈ 0.872
        Cover height: 736 / (340/390) = 845px
        Menggunakan visibility (bukan display:none) + position:absolute agar
        kedua preview selalu punya dimensi, tidak collapse saat tidak aktif.
      */}
      <div className="flex-1 overflow-y-auto scrollbar-hide flex items-start justify-center py-8 px-4">
        <div className="relative">
          <div className="relative bg-gray-950 rounded-[52px] shadow-2xl shadow-black/40 ring-1 ring-white/10"
            style={{ width: 360, padding: 10 }}>
            {/* Dynamic island */}
            <div className="absolute left-1/2 -translate-x-1/2 bg-gray-950 rounded-full z-20"
              style={{ top: 14, width: 82, height: 24 }} />

            {/* Screen */}
            <div className="rounded-[44px] overflow-hidden bg-gray-900"
              style={{ width: 340, height: 736, position: 'relative' }}>

              {/*  Fullscreen + Music overlay   always on top  */}
              <div style={{ position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'none' }}>
                {/* Fullscreen icon   top right corner */}
                <button
                  onClick={() => setShowFullscreen(true)}
                  style={{ position: 'absolute', top: 12, right: 12, pointerEvents: 'auto' }}
                  className="bg-black/40 hover:bg-black/60 text-white/80 hover:text-white rounded-full p-1.5 transition-colors backdrop-blur-sm"
                  title="Full Screen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
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
                visibility: previewMode === 'opening' && !previewPlaying && !previewLoading ? 'visible' : 'hidden',
                pointerEvents: previewMode === 'opening' && !previewPlaying && !previewLoading ? 'auto' : 'none',
              }}>
                <div style={{ width: 390, zoom: 340 / 390, height: 845, position: 'relative' }}>
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
                   sama persis dengan kanvas (390x845), jadi koordinat persen
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
                  <div style={{ position: 'absolute', inset: 0, zIndex: 30, background: cfg.meta.color_scheme.background }}>
                    <div style={{ width: 390, zoom: 340 / 390, height: 845, position: 'relative', overflow: 'hidden' }}>
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
                        height={845}
                      />
                    </div>
                  </div>
                )
              })()}

              {/*  Invitation preview   scroll-snap, satu section = satu layar  */}
              <div key={previewKey} style={{
                position: 'absolute', inset: 0,
                overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none',
                scrollSnapType: 'y proximity',
                WebkitOverflowScrolling: 'touch',
                visibility: previewMode === 'invitation' ? 'visible' : 'hidden',
                pointerEvents: previewMode === 'invitation' ? 'auto' : 'none',
              }}>
                <div style={{ width: 390, zoom: 340 / 390 }}>
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
                visibility: previewMode === 'loading' && !previewPlaying && !previewLoading ? 'visible' : 'hidden',
                pointerEvents: previewMode === 'loading' && !previewPlaying && !previewLoading ? 'auto' : 'none',
                overflow: 'hidden',
              }}>
                <div style={{ width: 390, zoom: 340 / 390, height: 845, position: 'relative' }}>
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
                  zIndex: 50,
                  overflow: 'hidden',
                  borderRadius: '2rem'
                }}>
                  <div style={{ width: 390, zoom: 340 / 390, height: 845, position: 'relative' }}>
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
                <div style={{ position: 'absolute', inset: 0, zIndex: 30, overflow: 'hidden', borderRadius: '2rem' }}>
                  <div style={{ width: 390, zoom: 340 / 390, height: 845, position: 'relative' }}>
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
                    className="absolute top-3 right-3 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Preview Mode Tabs */}
          <div className="mt-3 flex items-center gap-1 bg-white rounded-xl p-1.5 shadow-sm border border-gray-200">
            <button
              onClick={() => setPreviewMode('opening')}
              className={`flex-1 px-2 py-2 rounded-lg text-[10px] font-semibold transition-all ${
                previewMode === 'opening'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Opening
            </button>
            <button
              onClick={() => setPreviewMode('loading')}
              className={`flex-1 px-2 py-2 rounded-lg text-[10px] font-semibold transition-all ${
                previewMode === 'loading'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Loading
            </button>
            <button
              onClick={() => setPreviewMode('invitation')}
              className={`flex-1 px-2 py-2 rounded-lg text-[10px] font-semibold transition-all ${
                previewMode === 'invitation'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Undangan
            </button>
          </div>

          <p className="text-center text-xs text-slate-400 mt-2 font-medium">
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
          className="absolute top-4 right-4 z-[110] bg-black/60 hover:bg-black/80 text-white rounded-full p-2.5 transition-colors backdrop-blur-sm"
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
