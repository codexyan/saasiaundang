'use client'

/**
 * Panel pengaturan layer dekorasi (transform, animasi masuk/loop/keluar,
 * editor keyframe) beserta subkomponennya.
 *
 * Dipindah verbatim dari TemplateLab.tsx. Seluruh isi berkas ini hanya
 * dipakai lewat <DecorationLayerList/> — QBtn/DSlider/KfPanel/KfBrief/
 * KfFields/updateAssetInList dan semua label map di bawah TIDAK pernah
 * dirujuk komponen utama (diverifikasi), jadi tetap privat di sini.
 */
import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { resolveAssetUrl } from '@/lib/built-in-assets'

//  Decoration Layer List 

const IDLE_LABELS: Record<string, string> = {
  none: 'Tidak Ada', float: 'Melayang', pulse: 'Berdenyut', shimmer: 'Kilap',
  sway: 'Berayun', 'spin-slow': 'Berputar Lambat', heartbeat: 'Detak Jantung', 'drift-right': 'Geser Kanan-Kiri',
}
const ENTRY_LABELS: Record<string, string> = {
  none: 'Langsung', 'fade-in': 'Fade In', 'slide-left': 'Geser Kiri', 'slide-right': 'Geser Kanan',
  'slide-up': 'Naik', 'slide-down': 'Turun', 'zoom-in': 'Zoom In', 'rotate-in': 'Putar Masuk',
  custom: 'Custom Keyframe',
}
const EXIT_LABELS: Record<string, string> = {
  none: 'Tidak Ada', 'fade-out': 'Fade Out', 'slide-out-left': 'Keluar Kiri', 'slide-out-right': 'Keluar Kanan',
  'slide-out-up': 'Keluar Atas', 'slide-out-down': 'Keluar Bawah', 'zoom-out': 'Zoom Out', 'rotate-out': 'Putar Keluar',
  shrink: 'Mengecil', 'blur-out': 'Blur Keluar', custom: 'Custom Keyframe',
}
const EASING_LABELS: Record<string, string> = {
  ease: 'Ease', 'ease-in': 'Ease In', 'ease-out': 'Ease Out',
  'ease-in-out': 'Ease In-Out', spring: 'Spring', linear: 'Linear',
}

function updateAssetInList(
  assets: import('@/lib/types').DecorationAsset[],
  id: string,
  patch: Partial<import('@/lib/types').DecorationAsset>
) {
  return assets.map(a => a.id === id ? { ...a, ...patch } : a)
}

export default function DecorationLayerList({
  assets, onUpdate, onPreview, onPreviewExit, focusedId, onFocusChange,
}: {
  assets: import('@/lib/types').DecorationAsset[]
  onUpdate: (a: import('@/lib/types').DecorationAsset[]) => void
  onPreview: () => void
  onPreviewExit?: () => void
  focusedId?: string | null
  onFocusChange?: (id: string | null) => void
}) {
  const [showKfEntry, setShowKfEntry] = useState(false)
  const [showKfExit, setShowKfExit] = useState(false)

  const up = (id: string, patch: Partial<import('@/lib/types').DecorationAsset>) =>
    onUpdate(updateAssetInList(assets, id, patch))

  const asset = focusedId ? assets.find(a => a.id === focusedId) : null
  if (!asset) return null

  const maxZ = Math.max(0, ...assets.map(a => a.z_layer ?? 0))
  const minZ = Math.min(0, ...assets.map(a => a.z_layer ?? 0))

  const triggerPreview = () => { onPreview() }
  const triggerExitPreview = () => { onPreviewExit?.() }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">

      {/*  Header  */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-gray-100">
        <img src={resolveAssetUrl(asset.url)} alt="" className="w-9 h-9 object-contain rounded-lg border border-indigo-200 bg-white p-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <input
            type="text" value={asset.label ?? ''} placeholder="Nama aset..."
            onChange={e => up(asset.id, { label: e.target.value })}
            className="w-full text-xs font-bold text-gray-800 bg-transparent focus:outline-none placeholder:text-gray-400"
          />
          <div className="flex items-center gap-2 text-[8px] text-gray-400 font-mono mt-0.5 tabular-nums">
            <span>{Math.round(asset.x)},{Math.round(asset.y)}</span>
            <span>{Math.round(asset.w)}%{asset.h != null ? `×${Math.round(asset.h)}%` : ''}</span>
            <span>{asset.rotation ?? 0}°</span>
            <span className="text-indigo-500 font-bold">L{asset.z_layer ?? 0}</span>
          </div>
        </div>
        <button onClick={() => onFocusChange?.(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/*  Quick Actions  */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50/80 border-b border-gray-100">
        <QBtn label="Depan" onClick={() => up(asset.id, { z_layer: maxZ + 1 })} icon="⤒" />
        <QBtn label="Maju" onClick={() => up(asset.id, { z_layer: (asset.z_layer ?? 0) + 1 })} icon="↑" />
        <QBtn label="Mundur" onClick={() => up(asset.id, { z_layer: (asset.z_layer ?? 0) - 1 })} icon="↓" />
        <QBtn label="Belakang" onClick={() => up(asset.id, { z_layer: minZ - 1 })} icon="⤓" />
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        <QBtn label="Flip H" onClick={() => up(asset.id, { flip_h: !asset.flip_h })} icon="↔" active={asset.flip_h} />
        <QBtn label="Flip V" onClick={() => up(asset.id, { flip_v: !asset.flip_v })} icon="↕" active={asset.flip_v} />
        <div className="flex-1" />
        <button onClick={() => { onUpdate(assets.filter(a => a.id !== asset.id)); onFocusChange?.(null) }}
          className="p-1 text-gray-500 hover:text-red-600 rounded transition-colors inline-flex items-center justify-center sentuh:w-11 sentuh:h-11" title="Hapus" aria-label="Hapus dekorasi ini">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="px-3 py-3 space-y-4">

        {/*  POSISI & UKURAN
             Semua dalam persen kanvas. Angka boleh di luar 0-100 supaya aset
             bisa sengaja menggantung keluar bingkai — itu justru penempatan
             yang paling sering dipakai untuk ornamen sudut.  */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Posisi &amp; Ukuran</p>
            <span className="text-[8px] text-gray-300">% kanvas</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <NumField label="X" value={asset.x} onChange={v => up(asset.id, { x: v })} />
            <NumField label="Y" value={asset.y} onChange={v => up(asset.id, { y: v })} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <NumField label="Lebar" value={asset.w} min={1} onChange={v => up(asset.id, { w: Math.max(1, v) })} />
            <NumField
              label="Tinggi"
              value={asset.h}
              min={1}
              placeholder="auto"
              onChange={v => up(asset.id, { h: v > 0 ? v : undefined })}
            />
          </div>
          {asset.h != null && (
            <button
              onClick={() => up(asset.id, { h: undefined })}
              className="text-[9px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Kembalikan tinggi ke rasio asli gambar
            </button>
          )}

          <DSlider label="Opacity" value={asset.opacity ?? 100} min={5} max={100} step={5} unit="%"
            onChange={v => up(asset.id, { opacity: v })} />
          <DSlider label="Rotasi" value={asset.rotation ?? 0} min={-180} max={180} step={5} unit="°"
            onChange={v => up(asset.id, { rotation: v })} />
        </div>

        <div className="h-px bg-gray-100" />

        {/*  ANIMASI MASUK  */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest flex-1">Masuk</p>
            <button onClick={triggerPreview}
              className="text-[8px] font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-full transition-colors">
              ▶ Preview
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <select value={asset.animation ?? 'fade-in'}
              onChange={e => { up(asset.id, { animation: e.target.value as import('@/lib/types').AssetAnimation }); setTimeout(triggerPreview, 100) }}
              className="col-span-2 text-[11px] border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white">
              {Object.entries(ENTRY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <div className="flex items-center gap-0.5">
              <input type="number" min={0} max={4000} step={100}
                value={asset.animation_delay ?? 0}
                onChange={e => up(asset.id, { animation_delay: Number(e.target.value) })}
                className="flex-1 w-full text-[11px] border border-gray-200 rounded-lg px-1.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white text-center font-mono"
              />
              <span className="text-[7px] text-gray-400 shrink-0">ms</span>
            </div>
          </div>
          {asset.animation === 'custom' && (
            <KfPanel
              color="emerald"
              keyframes={asset.entry_keyframes ?? { from: { opacity: 0 }, to: { opacity: 1 } }}
              onChange={kf => { up(asset.id, { entry_keyframes: kf }); setTimeout(triggerPreview, 100) }}
              presets={ENTRY_PRESETS}
              expanded={showKfEntry}
              onToggle={() => setShowKfEntry(!showKfEntry)}
            />
          )}
        </div>

        {/*  ANIMASI LOOP  */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <p className="text-[9px] font-bold text-indigo-700 uppercase tracking-widest">Loop</p>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <select value={asset.idle_animation ?? 'none'}
              onChange={e => up(asset.id, { idle_animation: e.target.value as import('@/lib/types').AssetIdleAnimation })}
              className="text-[11px] border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white">
              {Object.entries(IDLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {(asset.idle_animation ?? 'none') !== 'none' && (
              <select value={asset.idle_speed ?? 'normal'}
                onChange={e => up(asset.id, { idle_speed: e.target.value as 'slow' | 'normal' | 'fast' })}
                className="text-[11px] border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white">
                <option value="slow">Lambat</option>
                <option value="normal">Normal</option>
                <option value="fast">Cepat</option>
              </select>
            )}
          </div>
        </div>

        {/*  ANIMASI KELUAR  */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <p className="text-[9px] font-bold text-rose-700 uppercase tracking-widest flex-1">Keluar</p>
            {onPreviewExit && (
              <button onClick={triggerExitPreview}
                className="text-[8px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-full transition-colors">
                ◀ Preview
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <select value={asset.exit_animation ?? 'none'}
              onChange={e => { up(asset.id, { exit_animation: e.target.value as import('@/lib/types').AssetExitAnimation }); if (e.target.value !== 'none') setTimeout(triggerExitPreview, 100) }}
              className="col-span-2 text-[11px] border border-rose-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white">
              {Object.entries(EXIT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <div className="flex items-center gap-0.5">
              <input type="number" min={0} max={4000} step={100}
                value={asset.exit_delay ?? 0}
                onChange={e => up(asset.id, { exit_delay: Number(e.target.value) })}
                className="flex-1 w-full text-[11px] border border-gray-200 rounded-lg px-1.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white text-center font-mono"
              />
              <span className="text-[7px] text-gray-400 shrink-0">ms</span>
            </div>
          </div>
          {asset.exit_animation === 'custom' && (
            <KfPanel
              color="rose"
              keyframes={asset.exit_keyframes ?? { from: { opacity: 1 }, to: { opacity: 0 } }}
              onChange={kf => { up(asset.id, { exit_keyframes: kf }); setTimeout(triggerExitPreview, 100) }}
              presets={EXIT_PRESETS}
              expanded={showKfExit}
              onToggle={() => setShowKfExit(!showKfExit)}
            />
          )}
        </div>

      </div>
    </div>
  )
}

//  Decoration sub-components 

/** Angka bebas dalam persen. Sengaja tanpa clamp atas/bawah — menggantung di
 *  luar bingkai adalah penempatan yang sah, bukan kesalahan input. */
function NumField({ label, value, onChange, min, placeholder }: {
  label: string
  value: number | undefined
  onChange: (v: number) => void
  min?: number
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="block text-[9px] font-semibold text-gray-400 mb-0.5">{label}</span>
      <input
        type="number"
        step={0.5}
        min={min}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={e => {
          const raw = e.target.value
          onChange(raw === '' ? 0 : Number(raw))
        }}
        className="w-full px-2 py-1 text-[11px] font-mono tabular-nums border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
    </label>
  )
}

function QBtn({ label, onClick, icon, active }: { label: string; onClick: () => void; icon: string; active?: boolean }) {
  return (
    <button onClick={onClick} title={label}
      aria-label={label}
      className={`w-6 h-6 sentuh:w-11 sentuh:h-11 text-xs font-bold rounded-md border transition-colors flex items-center justify-center ${
        active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-300 hover:border-indigo-300 hover:text-indigo-600'
      }`}>
      {icon}
    </button>
  )
}

function DSlider({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-semibold text-gray-500 w-[42px] shrink-0">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 accent-indigo-600 h-1.5" />
      <input type="number" min={min} max={max} step={step} value={value}
        onChange={e => { const v = Number(e.target.value); if (v >= min && v <= max) onChange(v) }}
        className="w-12 px-1 py-0.5 text-[10px] text-center border border-gray-200 rounded-md focus:border-indigo-400 focus:outline-none font-mono" />
      <span className="text-[8px] text-gray-400 w-[10px]">{unit}</span>
    </div>
  )
}

//  Keyframe Presets & Panel 

type KfConfig = import('@/lib/types').AssetKeyframeConfig

const ENTRY_PRESETS: { label: string; icon: string; kf: KfConfig }[] = [
  { label: 'Fade Naik', icon: '↑', kf: { from: { opacity: 0, y: 40 }, to: { opacity: 1, y: 0 }, duration: 800, easing: 'ease-out' } },
  { label: 'Fade Turun', icon: '↓', kf: { from: { opacity: 0, y: -40 }, to: { opacity: 1, y: 0 }, duration: 800, easing: 'ease-out' } },
  { label: 'Fade Kiri', icon: '←', kf: { from: { opacity: 0, x: -60 }, to: { opacity: 1, x: 0 }, duration: 800, easing: 'ease-out' } },
  { label: 'Fade Kanan', icon: '→', kf: { from: { opacity: 0, x: 60 }, to: { opacity: 1, x: 0 }, duration: 800, easing: 'ease-out' } },
  { label: 'Zoom Blur', icon: '◎', kf: { from: { opacity: 0, scale: 0.3, blur: 10 }, to: { opacity: 1, scale: 1, blur: 0 }, duration: 1000, easing: 'ease' } },
  { label: 'Putar Masuk', icon: '↻', kf: { from: { opacity: 0, rotate: -90, scale: 0.5 }, to: { opacity: 1, rotate: 0, scale: 1 }, duration: 900, easing: 'spring' } },
  { label: 'Pop Elastis', icon: '◉', kf: { from: { opacity: 0, scale: 0 }, to: { opacity: 1, scale: 1 }, duration: 600, easing: 'spring' } },
  { label: 'Muncul Halus', icon: '○', kf: { from: { opacity: 0 }, to: { opacity: 1 }, duration: 1200, easing: 'ease-in-out' } },
]

const EXIT_PRESETS: { label: string; icon: string; kf: KfConfig }[] = [
  { label: 'Fade Naik', icon: '↑', kf: { from: { opacity: 1, y: 0 }, to: { opacity: 0, y: -50 }, duration: 600, easing: 'ease-in' } },
  { label: 'Fade Turun', icon: '↓', kf: { from: { opacity: 1, y: 0 }, to: { opacity: 0, y: 50 }, duration: 600, easing: 'ease-in' } },
  { label: 'Zoom Blur', icon: '◎', kf: { from: { opacity: 1, scale: 1, blur: 0 }, to: { opacity: 0, scale: 1.5, blur: 12 }, duration: 700, easing: 'ease-in' } },
  { label: 'Putar Keluar', icon: '↺', kf: { from: { opacity: 1, rotate: 0, scale: 1 }, to: { opacity: 0, rotate: 90, scale: 0.3 }, duration: 700, easing: 'ease-in' } },
  { label: 'Mengecil', icon: '·', kf: { from: { opacity: 1, scale: 1 }, to: { opacity: 0, scale: 0 }, duration: 500, easing: 'ease-in' } },
  { label: 'Blur Hilang', icon: '◌', kf: { from: { opacity: 1, blur: 0 }, to: { opacity: 0, blur: 20 }, duration: 800, easing: 'ease' } },
]

function KfPanel({ color, keyframes, onChange, presets, expanded, onToggle }: {
  color: 'emerald' | 'rose'
  keyframes: KfConfig
  onChange: (kf: KfConfig) => void
  presets: typeof ENTRY_PRESETS
  expanded: boolean
  onToggle: () => void
}) {
  const accent = color === 'emerald' ? 'emerald' : 'rose'
  const bg = color === 'emerald' ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
  const activeBtn = color === 'emerald' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-rose-500 text-white shadow-sm'

  const updateState = (side: 'from' | 'to', patch: Partial<import('@/lib/types').AssetKeyframeState>) =>
    onChange({ ...keyframes, [side]: { ...keyframes[side], ...patch } })
  const clearProp = (side: 'from' | 'to', prop: keyof import('@/lib/types').AssetKeyframeState) => {
    const copy = { ...keyframes[side] }
    delete copy[prop]
    onChange({ ...keyframes, [side]: copy })
  }

  return (
    <div className={`${bg} border rounded-xl p-2.5 space-y-2`}>
      {/* Preset grid */}
      <div className="grid grid-cols-4 gap-1">
        {presets.map(p => {
          const isActive = JSON.stringify(keyframes.from) === JSON.stringify(p.kf.from) &&
            JSON.stringify(keyframes.to) === JSON.stringify(p.kf.to)
          return (
            <button key={p.label} type="button"
              onClick={() => onChange(p.kf)}
              className={`py-1.5 px-1 rounded-lg text-center transition-all ${
                isActive ? activeBtn : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-sm block leading-none">{p.icon}</span>
              <span className="text-[7px] font-bold block mt-0.5 leading-tight">{p.label}</span>
            </button>
          )
        })}
      </div>

      {/* Duration & Easing */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[8px] font-semibold text-gray-500 mb-0.5">Durasi</p>
          <div className="flex items-center gap-1">
            <input type="range" min={100} max={3000} step={50}
              value={keyframes.duration ?? 900}
              onChange={e => onChange({ ...keyframes, duration: Number(e.target.value) })}
              className={`flex-1 h-1.5 accent-${accent}-500`}
            />
            <span className="text-[9px] text-gray-500 font-mono w-[30px] text-right">{keyframes.duration ?? 900}</span>
            <span className="text-[7px] text-gray-400">ms</span>
          </div>
        </div>
        <div>
          <p className="text-[8px] font-semibold text-gray-500 mb-0.5">Easing</p>
          <select value={keyframes.easing ?? 'ease'}
            onChange={e => onChange({ ...keyframes, easing: e.target.value as import('@/lib/types').AssetKeyframeEasing })}
            className="w-full text-[10px] border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white">
            {Object.entries(EASING_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Summary / expand toggle */}
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-2 py-1.5 bg-white/60 rounded-lg text-[8px] text-gray-400 font-mono hover:bg-white/80 transition-colors">
        <span>
          <span className="text-gray-500 font-bold">From:</span>{' '}
          <KfBrief state={keyframes.from} />
          <span className="text-gray-300 mx-1">→</span>
          <span className="text-gray-500 font-bold">To:</span>{' '}
          <KfBrief state={keyframes.to} />
        </span>
        <span className="text-[9px] ml-2">{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Manual detail editor */}
      {expanded && (
        <div className="space-y-2 pt-1 border-t border-gray-200/60">
          <KfFields label="DARI (From)" state={keyframes.from} color={color}
            onUpdate={p => updateState('from', p)} onClear={p => clearProp('from', p)} />
          <div className="flex items-center gap-1 px-2">
            <div className="flex-1 h-px bg-gray-300/50" />
            <span className="text-[10px] text-gray-400">▼</span>
            <div className="flex-1 h-px bg-gray-300/50" />
          </div>
          <KfFields label="KE (To)" state={keyframes.to} color={color}
            onUpdate={p => updateState('to', p)} onClear={p => clearProp('to', p)} />
        </div>
      )}
    </div>
  )
}

function KfBrief({ state }: { state: import('@/lib/types').AssetKeyframeState }) {
  const p: string[] = []
  if (state.opacity !== undefined) p.push(`op:${state.opacity}`)
  if (state.x !== undefined) p.push(`x:${state.x}`)
  if (state.y !== undefined) p.push(`y:${state.y}`)
  if (state.scale !== undefined) p.push(`s:${state.scale}`)
  if (state.rotate !== undefined) p.push(`r:${state.rotate}°`)
  if (state.blur !== undefined) p.push(`b:${state.blur}`)
  return <span className="truncate">{p.length ? p.join(' ') : ' '}</span>
}

const KF_FIELDS: { key: keyof import('@/lib/types').AssetKeyframeState; label: string; min: number; max: number; step: number; unit: string }[] = [
  { key: 'opacity', label: 'Opacity', min: 0, max: 1, step: 0.05, unit: '' },
  { key: 'x', label: 'X', min: -300, max: 300, step: 5, unit: 'px' },
  { key: 'y', label: 'Y', min: -300, max: 300, step: 5, unit: 'px' },
  { key: 'scale', label: 'Scale', min: 0, max: 3, step: 0.1, unit: 'x' },
  { key: 'rotate', label: 'Rotate', min: -360, max: 360, step: 15, unit: '°' },
  { key: 'blur', label: 'Blur', min: 0, max: 30, step: 1, unit: 'px' },
]

function KfFields({ label, state, color, onUpdate, onClear }: {
  label: string; state: import('@/lib/types').AssetKeyframeState; color: 'emerald' | 'rose'
  onUpdate: (p: Partial<import('@/lib/types').AssetKeyframeState>) => void
  onClear: (p: keyof import('@/lib/types').AssetKeyframeState) => void
}) {
  const titleColor = color === 'emerald' ? 'text-emerald-700' : 'text-rose-700'
  return (
    <div>
      <p className={`text-[8px] font-bold ${titleColor} uppercase tracking-wider mb-1`}>{label}</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {KF_FIELDS.map(f => {
          const val = state[f.key]
          const hasValue = val !== undefined
          return (
            <div key={f.key} className="flex items-center gap-1">
              <span className={`text-[8px] w-[36px] shrink-0 ${hasValue ? 'font-bold text-gray-600' : 'text-gray-300'}`}>{f.label}</span>
              {hasValue ? (
                <>
                  <input type="range" min={f.min} max={f.max} step={f.step}
                    value={val} onChange={e => onUpdate({ [f.key]: Number(e.target.value) })}
                    className="flex-1 h-1 accent-indigo-500" />
                  <span className="text-[8px] text-gray-500 font-mono w-[28px] text-right">{val}{f.unit}</span>
                  <button onClick={() => onClear(f.key)} className="text-[9px] text-gray-300 hover:text-red-400 leading-none">×</button>
                </>
              ) : (
                <button onClick={() => onUpdate({ [f.key]: f.key === 'opacity' ? 1 : 0 })}
                  className="text-[8px] text-indigo-400 hover:text-indigo-600 font-semibold">+ Tambah</button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
