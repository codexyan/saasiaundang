'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Move, Layers, Plus, Loader2 } from 'lucide-react'
import type { DecorationAsset } from '@/lib/types'
import DecorationLayerList from '../parts/DecorationLayerList'
import { SECTION_LABELS } from '../parts/constants'
import { useEditor } from '../EditorContext'

/**
 * Tab "Dekorasi" — aset gambar yang ditempel di atas opening atau satu seksi
 * tertentu, lengkap dengan animasi masuk/keluar dan urutan lapisannya.
 */
export default function DecorPanel() {
  const {
    cfg, sections, setPreviewMode, setPreviewPlaying, setSectionReplay,
    decorScope, setDecorScope, decorEditMode, setDecorEditMode,
    selectedAssetId, setSelectedAssetId, setDecorPreviewKey, updateOpening, updateSection,
  } = useEditor()

  const [uploading, setUploading] = useState(false)

  const isOpening = decorScope === 'opening'
  const scopeSection = !isOpening ? cfg.sections.find(s => s.id === decorScope) : null

  /**
   * Scope yang menggantung dikembalikan ke Opening.
   *
   * `decorScope` menyimpan id seksi, tapi seksi bisa dihapus atau dinonaktifkan
   * dari tab Konten tanpa ada yang memberi tahu tab ini. Akibatnya dulu:
   * `scopeSection` jadi null, label berubah jadi spasi kosong, dan unggahan
   * berikutnya HILANG DIAM-DIAM — berkasnya terkirim ke storage, asetnya
   * dibuat, lalu updateScopeAssets tidak melakukan apa pun karena tidak ada
   * cabang untuk scope null.
   */
  useEffect(() => {
    if (isOpening) return
    const stillThere = cfg.sections.some(s => s.id === decorScope && s.enabled)
    if (!stillThere) {
      setDecorScope('opening')
      setSelectedAssetId(null)
    }
  }, [isOpening, decorScope, cfg.sections, setDecorScope, setSelectedAssetId])

  const scopeAssets: DecorationAsset[] = isOpening
    ? (cfg.opening.decoration_assets ?? [])
    : (scopeSection?.decoration_assets ?? [])
  const scopeLabel = isOpening ? 'Opening' : (SECTION_LABELS[scopeSection?.type ?? ''] || scopeSection?.type || 'Opening')

  /** Mengembalikan false kalau tidak ada tujuan yang sah — pemanggil WAJIB
   *  memeriksanya, jangan sampai ada perubahan yang menguap tanpa jejak. */
  const updateScopeAssets = (newAssets: DecorationAsset[]): boolean => {
    if (isOpening) { updateOpening({ decoration_assets: newAssets }); return true }
    if (scopeSection) { updateSection(scopeSection.id, { decoration_assets: newAssets }); return true }
    return false
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    // Diperiksa SEBELUM mengunggah: percuma mengirim berkas ke storage kalau
    // hasilnya tidak punya tempat untuk disimpan.
    if (!isOpening && !scopeSection) {
      toast.error('Seksi tujuan sudah tidak ada. Pilih tujuan dekorasi lagi ya.')
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'decorations')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json().catch(() => null)
      // Dulu `alert()` — memblokir seluruh tab dan tidak sewarna dengan
      // notifikasi lain di panel admin.
      if (!res.ok) { toast.error(data?.error || 'Dekorasinya gagal diunggah'); return }

      // z_layer dari nilai TERTINGGI yang ada, bukan dari panjang array:
      // setelah ada aset yang dihapus, panjang array bisa menabrak layer
      // yang masih dipakai sehingga urutan tumpukannya jadi tidak tentu.
      const topLayer = scopeAssets.reduce((m, a) => Math.max(m, a.z_layer ?? 0), -1)
      const newAsset: DecorationAsset = {
        id: 'deco-' + Date.now().toString(36),
        url: data.url, label: file.name.replace(/\.[^.]+$/, ''),
        position: 'top-left', width: 80, scale: 1, opacity: 100,
        offset_x: 155, offset_y: 380,
        animation: 'fade-in', animation_delay: 200,
        exit_animation: 'none', exit_delay: 0,
        idle_animation: 'none', z_layer: topLayer + 1,
      }
      if (!updateScopeAssets([...scopeAssets, newAsset])) {
        toast.error('Dekorasinya tidak bisa dipasang — tujuannya sudah tidak ada.')
        return
      }
      setSelectedAssetId(newAsset.id)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* Scope selector */}
      <div>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Dekorasi untuk</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => { setDecorScope('opening'); setSelectedAssetId(null); setPreviewMode('opening'); setDecorEditMode(true) }}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
              isOpening ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Opening
          </button>
          {sections.filter(s => s.enabled).map(s => (
            <button
              key={s.id}
              onClick={() => {
                setDecorScope(s.id); setSelectedAssetId(null); setDecorEditMode(false)
                setPreviewMode('invitation')
                setSectionReplay({ id: s.id, key: Date.now() })
              }}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                decorScope === s.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {SECTION_LABELS[s.type] || s.type}
              {(s.decoration_assets?.length ?? 0) > 0 && (
                <span className="ml-1 text-[8px] opacity-70">({s.decoration_assets!.length})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Upload + Moodboard controls */}
      <div className="flex items-center gap-2">
        <label className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-xl py-3 transition-colors ${uploading ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:bg-indigo-100'}`}>
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          {uploading ? 'Mengunggah...' : `Upload ke ${scopeLabel}`}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={handleUpload} />
        </label>
        {isOpening && (
          <button
            onClick={() => { setDecorEditMode(!decorEditMode); setPreviewMode('opening') }}
            className={`flex items-center gap-1.5 text-[10px] font-bold px-4 py-3 rounded-xl transition-all ${
              decorEditMode
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            {decorEditMode ? 'Moodboard ON' : 'Moodboard'}
          </button>
        )}
      </div>

      {isOpening && decorEditMode && (
        <div className="px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-2">
          <Move className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <p className="text-[9px] text-indigo-700 leading-relaxed">
            Drag aset langsung di mockup. Klik untuk memilih, lalu atur di panel bawah.
          </p>
        </div>
      )}

      {/* Asset grid */}
      {scopeAssets.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Layers className="w-6 h-6 text-indigo-400" />
          </div>
          <p className="text-xs font-semibold text-gray-500">Belum ada aset dekorasi</p>
          <p className="text-[10px] text-gray-400 mt-1">Upload ornamen, bunga, kipas, frame untuk {scopeLabel}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            {scopeAssets.map(asset => (
              <button
                key={asset.id}
                onClick={() => setSelectedAssetId(asset.id === selectedAssetId ? null : asset.id)}
                className={`relative w-14 h-14 rounded-xl border-2 overflow-hidden transition-all shrink-0 ${
                  selectedAssetId === asset.id
                    ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-lg scale-110'
                    : 'border-gray-200 hover:border-indigo-300 bg-gray-50'
                }`}
                title={asset.label || 'Aset'}
              >
                <img src={asset.url} alt="" className="w-full h-full object-contain p-1" />
                <span className="absolute bottom-0 right-0 bg-gray-900/70 text-white text-[6px] font-bold px-1 rounded-tl-lg">
                  L{asset.z_layer ?? 0}
                </span>
              </button>
            ))}
          </div>

          {selectedAssetId && (
            <DecorationLayerList
              assets={scopeAssets}
              onUpdate={updateScopeAssets}
              // Animasi MASUK diputar ulang dengan me-mount ulang scene.
              onPreview={() => {
                if (isOpening) { setDecorEditMode(false); setPreviewMode('opening'); setDecorPreviewKey(k => k + 1) }
                else if (scopeSection) { setPreviewMode('invitation'); setSectionReplay({ id: scopeSection.id, key: Date.now() }) }
              }}
              // Animasi KELUAR hanya berjalan saat undangan benar-benar
              // dibuka, jadi tombolnya menyalakan alur interaktif —
              // bukan sekadar menyetel state yang, sebelum ini, tidak
              // pernah dibaca siapa pun sehingga tombolnya tak berefek.
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

          {/* Global preview */}
          {isOpening && (
            <div className="flex gap-2">
              {/* Dua tombol ini dulu memanggil setCoverPreviewMode dengan
                  nilai berbeda ('entry' vs 'full-flow') lalu melakukan hal
                  yang PERSIS SAMA — nilainya tidak pernah dibaca. Sekarang
                  keduanya benar-benar berbeda perilaku. */}
              <button
                onClick={() => { setDecorEditMode(false); setPreviewMode('opening'); setDecorPreviewKey(k => k + 1) }}
                className="flex-1 py-2.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
                title="Putar ulang animasi masuk dekorasi"
              >
                ▶ Ulangi Animasi
              </button>
              <button
                onClick={() => { setDecorEditMode(false); setPreviewMode('opening'); setPreviewPlaying(true) }}
                className="flex-1 py-2.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors"
                title="Opening -> loading -> isi undangan, seperti yang dilihat tamu"
              >
                ▶▶ Alur Lengkap
              </button>
            </div>
          )}
          {!isOpening && scopeSection && (
            <button
              onClick={() => { setPreviewMode('invitation'); setSectionReplay({ id: scopeSection.id, key: Date.now() }) }}
              className="w-full py-2.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              ▶ Preview {scopeLabel}
            </button>
          )}
        </>
      )}

    </div>
  )
}
