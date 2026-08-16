'use client'

/**
 * Panel pengaturan Loading Screen (bagian dari tab Opening).
 *
 * Dipindah verbatim dari TemplateLab.tsx. Permukaan state-nya paling sempit di
 * seluruh file: hanya 4 prop. Seluruh 45 rujukan `config` di dalam blok ini
 * ternyata `prev.config` di dalam `setConfig(prev => ...)` — bentuk fungsional,
 * jadi tidak ada stale closure yang bisa terbawa saat dipindah (diverifikasi:
 * nol pemanggilan setConfig non-fungsional).
 *
 * WAJIB file terpisah, bukan didefinisikan inline di dalam TemplateLab: kalau
 * inline, identitas komponennya berubah tiap render dan semua <input> terkendali
 * di sini kehilangan fokus tiap ketikan — kegagalan runtime yang tidak terlihat
 * oleh tsc.
 */
import type { Dispatch, SetStateAction } from 'react'
import { Play, Upload, Check, X } from 'lucide-react'
import type { TemplateRecord } from '@/lib/types'
import ImageUploadField from '@/components/admin/ImageUploadField'
import { inputCls } from './fields'

export default function LoadingScreenPanel({
  cfg, setConfig, setPreviewMode, setPreviewKey,
}: {
  cfg: TemplateRecord['config']
  setConfig: Dispatch<SetStateAction<TemplateRecord>>
  setPreviewMode: Dispatch<SetStateAction<'invitation' | 'opening' | 'loading'>>
  setPreviewKey: Dispatch<SetStateAction<number>>
}) {
  return (
            <>
              {/*  Loading Screen (bagian dari Opening)  */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-[10px] font-semibold text-gray-500 mb-1">
                  Loading Screen
                </p>
                <p className="text-[9px] text-gray-400 mb-3">
                  Animasi loading yang tampil sebelum undangan terbuka
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    { id: 'dual-ring',       icon: '💫', label: 'Dual Ring' },
                    { id: 'heartbeat',       icon: '💗', label: 'Heartbeat' },
                    { id: 'elegant-spinner', icon: '🌀', label: 'Spinner' },
                    { id: 'petal-cascade',   icon: '🌸', label: 'Kelopak' },
                    { id: 'wave-dots',       icon: '🔵', label: 'Wave Dots' },
                    { id: 'letter-reveal',   icon: '✍️', label: 'Letter' },
                    { id: 'arch-gate',       icon: '🕌', label: 'Arch Gate' },
                    { id: 'candle-glow',     icon: '🕯️', label: 'Lilin' },
                    { id: 'infinity-ribbon', icon: '♾️', label: 'Infinity' },
                    { id: 'shimmer-bar',     icon: '▬', label: 'Shimmer' },
                    { id: 'orbit-rings',     icon: '🪐', label: 'Orbit' },
                    { id: 'ripple-pulse',    icon: '🔘', label: 'Ripple' },
                    { id: 'diamond-spin',    icon: '💎', label: 'Diamond' },
                    { id: 'hourglass',       icon: '⏳', label: 'Hourglass' },
                    { id: 'crescent-moon',   icon: '🌙', label: 'Bulan Sabit' },
                    { id: 'spiral-gold',     icon: '🌀', label: 'Spiral Gold' },
                  ] as const).map(lv => {
                    const active = (cfg.loading.variant ?? 'dual-ring') === lv.id
                    return (
                      <button key={lv.id} type="button"
                        onClick={() => { setConfig(prev => ({
                          ...prev,
                          config: { ...prev.config, loading: { ...prev.config.loading, variant: lv.id as any } },
                        })); setPreviewMode('loading'); setPreviewKey(k => k + 1) }}
                        className={`relative p-2.5 rounded-xl text-center transition-all ${
                          active
                            ? 'bg-indigo-50 border-2 border-indigo-500 ring-1 ring-indigo-500/20'
                            : 'bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-lg block mb-0.5">{lv.icon}</span>
                        <p className={`text-[10px] font-semibold leading-tight ${active ? 'text-indigo-700' : 'text-gray-600'}`}>
                          {lv.label}
                        </p>
                        {active && (
                          <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-indigo-500 flex items-center justify-center">
                            <Check className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/*  Loading Settings  */}
              <div className="space-y-4">
                {/* Teks Loading */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Teks Loading
                  </label>
                  <input
                    value={cfg.loading.text}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      config: { ...prev.config, loading: { ...prev.config.loading, text: e.target.value } },
                    }))}
                    className={inputCls}
                    placeholder="MEMBUKA UNDANGAN..."
                  />
                </div>

                {/* Tipe Background */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Background Loading
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    {([
                      { id: 'solid',    label: 'Solid' },
                      { id: 'gradient', label: 'Gradient' },
                      { id: 'image',    label: 'Foto' },
                    ] as const).map(bt => {
                      const active = (cfg.loading.bg_type ?? 'solid') === bt.id
                      return (
                        <button key={bt.id} type="button"
                          onClick={() => setConfig(prev => ({
                            ...prev,
                            config: { ...prev.config, loading: { ...prev.config.loading, bg_type: bt.id as any } },
                          }))}
                          className={`py-2 rounded-lg text-[10px] font-semibold transition-all ${
                            active
                              ? 'bg-indigo-50 border-2 border-indigo-500 text-indigo-700'
                              : 'bg-gray-50 border border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {bt.label}
                        </button>
                      )
                    })}
                  </div>

                  {/* Solid / Gradient color */}
                  {(cfg.loading.bg_type ?? 'solid') !== 'image' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">
                          {(cfg.loading.bg_type ?? 'solid') === 'gradient' ? 'Warna Awal' : 'Warna Background'}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={cfg.loading.background_color}
                            onChange={e => setConfig(prev => ({
                              ...prev,
                              config: { ...prev.config, loading: { ...prev.config.loading, background_color: e.target.value } },
                            }))}
                            className="w-10 h-9 rounded-lg cursor-pointer border border-gray-200"
                          />
                          <input
                            value={cfg.loading.background_color}
                            onChange={e => setConfig(prev => ({
                              ...prev,
                              config: { ...prev.config, loading: { ...prev.config.loading, background_color: e.target.value } },
                            }))}
                            className={inputCls + ' font-mono flex-1'}
                            placeholder="#2c4a34"
                          />
                        </div>
                      </div>
                      {cfg.loading.bg_type === 'gradient' && (
                        <>
                          <div>
                            <label className="block text-[10px] text-gray-400 mb-1">Warna Akhir</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={cfg.loading.bg_gradient_to ?? '#000000'}
                                onChange={e => setConfig(prev => ({
                                  ...prev,
                                  config: { ...prev.config, loading: { ...prev.config.loading, bg_gradient_to: e.target.value } },
                                }))}
                                className="w-10 h-9 rounded-lg cursor-pointer border border-gray-200"
                              />
                              <input
                                value={cfg.loading.bg_gradient_to ?? '#000000'}
                                onChange={e => setConfig(prev => ({
                                  ...prev,
                                  config: { ...prev.config, loading: { ...prev.config.loading, bg_gradient_to: e.target.value } },
                                }))}
                                className={inputCls + ' font-mono flex-1'}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-400 mb-1">Sudut Gradient</label>
                            <div className="flex items-center gap-2">
                              <input type="range" min={0} max={360} step={15}
                                value={cfg.loading.bg_gradient_angle ?? 135}
                                onChange={e => setConfig(prev => ({
                                  ...prev,
                                  config: { ...prev.config, loading: { ...prev.config.loading, bg_gradient_angle: Number(e.target.value) } },
                                }))}
                                className="flex-1 accent-indigo-500 h-1.5"
                              />
                              <div className="flex items-center gap-0.5 shrink-0">
                                <input type="number" min={0} max={360} step={15}
                                  value={cfg.loading.bg_gradient_angle ?? 135}
                                  onChange={e => { const v = Number(e.target.value); if (v >= 0 && v <= 360) setConfig(prev => ({ ...prev, config: { ...prev.config, loading: { ...prev.config.loading, bg_gradient_angle: v } } })) }}
                                  className="w-14 px-1 py-0.5 text-[10px] text-center border border-gray-200 rounded-md focus:border-indigo-400 focus:outline-none font-mono" />
                                <span className="text-[8px] text-gray-400">°</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Image background */}
                  {cfg.loading.bg_type === 'image' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Foto Latar Belakang</label>
                        {cfg.loading.bg_image_url ? (
                          <div className="relative rounded-xl overflow-hidden border border-gray-200" style={{ height: 120 }}>
                            <img src={cfg.loading.bg_image_url} alt="Loading bg" className="w-full h-full object-cover" />
                            <button
                              onClick={() => setConfig(prev => ({
                                ...prev,
                                config: { ...prev.config, loading: { ...prev.config.loading, bg_image_url: undefined } },
                              }))}
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ) : (
                          <ImageUploadField
                            value=""
                            onChange={(url) => setConfig(prev => ({
                              ...prev,
                              config: { ...prev.config, loading: { ...prev.config.loading, bg_image_url: url } },
                            }))}
                            label="Upload foto loading"
                          />
                        )}
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">
                          Warna Overlay
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={cfg.loading.background_color}
                            onChange={e => setConfig(prev => ({
                              ...prev,
                              config: { ...prev.config, loading: { ...prev.config.loading, background_color: e.target.value } },
                            }))}
                            className="w-10 h-9 rounded-lg cursor-pointer border border-gray-200"
                          />
                          <input
                            value={cfg.loading.background_color}
                            onChange={e => setConfig(prev => ({
                              ...prev,
                              config: { ...prev.config, loading: { ...prev.config.loading, background_color: e.target.value } },
                            }))}
                            className={inputCls + ' font-mono flex-1'}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Opacity Overlay</label>
                        <div className="flex items-center gap-2">
                          <input type="range" min={0} max={1} step={0.05}
                            value={cfg.loading.overlay_opacity ?? 0.85}
                            onChange={e => setConfig(prev => ({
                              ...prev,
                              config: { ...prev.config, loading: { ...prev.config.loading, overlay_opacity: Number(e.target.value) } },
                            }))}
                            className="flex-1 accent-indigo-500 h-1.5"
                          />
                          <div className="flex items-center gap-0.5 shrink-0">
                            <input type="number" min={0} max={100} step={5}
                              value={Math.round((cfg.loading.overlay_opacity ?? 0.85) * 100)}
                              onChange={e => { const v = Number(e.target.value) / 100; if (v >= 0 && v <= 1) setConfig(prev => ({ ...prev, config: { ...prev.config, loading: { ...prev.config.loading, overlay_opacity: v } } })) }}
                              className="w-14 px-1 py-0.5 text-[10px] text-center border border-gray-200 rounded-md focus:border-indigo-400 focus:outline-none font-mono" />
                            <span className="text-[8px] text-gray-400">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview Button */}
                <button
                  onClick={() => setPreviewMode('loading')}
                  className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl px-4 py-2.5 transition-colors"
                >
                  <Play className="w-4 h-4 fill-current" /> Preview Loading
                </button>
              </div>
            </>
  )
}
